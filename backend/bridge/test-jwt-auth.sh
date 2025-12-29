#!/bin/bash
# JWT Authentication Test Script for Privxx Bridge
# Tests all JWT validation scenarios against the Go bridge
#
# Prerequisites:
# - Go bridge running on localhost:8090
# - SUPABASE_JWT_SECRET environment variable set
# - jq installed for JSON parsing
#
# Usage: ./test-jwt-auth.sh [bridge_url]

set -e

BRIDGE_URL="${1:-http://localhost:8090}"
PASS_COUNT=0
FAIL_COUNT=0

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo "=========================================="
echo "Privxx Bridge JWT Authentication Tests"
echo "=========================================="
echo "Bridge URL: $BRIDGE_URL"
echo ""

# Check if bridge is running
echo -n "Checking bridge health... "
HEALTH=$(curl -s "$BRIDGE_URL/health" 2>/dev/null || echo '{"status":"error"}')
if echo "$HEALTH" | grep -q '"status":"ok"'; then
    echo -e "${GREEN}OK${NC}"
else
    echo -e "${RED}FAILED${NC}"
    echo "Bridge not running at $BRIDGE_URL"
    echo "Start with: cd backend/bridge && go run main.go"
    exit 1
fi
echo ""

# Helper function to create a JWT token
# Args: $1=payload_json, $2=secret (optional, uses env var if not provided)
create_jwt() {
    local payload="$1"
    local secret="${2:-$SUPABASE_JWT_SECRET}"
    
    # Header (alg: HS256, typ: JWT)
    local header='{"alg":"HS256","typ":"JWT"}'
    local header_b64=$(echo -n "$header" | base64 | tr -d '=' | tr '/+' '_-' | tr -d '\n')
    local payload_b64=$(echo -n "$payload" | base64 | tr -d '=' | tr '/+' '_-' | tr -d '\n')
    
    # Create signature
    local signing_input="${header_b64}.${payload_b64}"
    local signature=$(echo -n "$signing_input" | openssl dgst -sha256 -hmac "$secret" -binary | base64 | tr -d '=' | tr '/+' '_-' | tr -d '\n')
    
    echo "${signing_input}.${signature}"
}

# Test helper function
# Args: $1=test_name, $2=expected_result (pass/fail), $3=endpoint, $4=method, $5=auth_header, $6=expected_code (optional)
run_test() {
    local test_name="$1"
    local expected="$2"
    local endpoint="$3"
    local method="$4"
    local auth_header="$5"
    local expected_code="${6:-}"
    
    echo -n "Test: $test_name... "
    
    local curl_args=("-s" "-w" "\n%{http_code}" "-X" "$method" "$BRIDGE_URL$endpoint")
    
    if [ -n "$auth_header" ]; then
        curl_args+=("-H" "Authorization: $auth_header")
    fi
    
    if [ "$method" = "POST" ]; then
        curl_args+=("-H" "Content-Type: application/json")
        curl_args+=("-d" '{"targetUrl":"https://example.com"}')
    fi
    
    local response=$(curl "${curl_args[@]}" 2>/dev/null)
    local http_code=$(echo "$response" | tail -n1)
    local body=$(echo "$response" | sed '$d')
    
    local result="fail"
    
    if [ "$expected" = "pass" ]; then
        if [ "$http_code" = "200" ]; then
            result="pass"
        fi
    else
        if [ "$http_code" = "401" ] || [ "$http_code" = "500" ]; then
            result="pass"
            # Check for specific error code if provided
            if [ -n "$expected_code" ]; then
                if echo "$body" | grep -q "\"code\":\"$expected_code\""; then
                    result="pass"
                else
                    result="fail"
                fi
            fi
        fi
    fi
    
    if [ "$result" = "pass" ]; then
        echo -e "${GREEN}PASSED${NC} (HTTP $http_code)"
        ((PASS_COUNT++))
    else
        echo -e "${RED}FAILED${NC} (HTTP $http_code, expected $expected)"
        echo "  Response: $body"
        ((FAIL_COUNT++))
    fi
}

echo "=========================================="
echo "1. Public Endpoint Tests (no auth)"
echo "=========================================="

run_test "Health endpoint (public)" "pass" "/health" "GET" ""

echo ""
echo "=========================================="
echo "2. Missing/Invalid Token Tests"
echo "=========================================="

run_test "No Authorization header" "fail" "/status" "GET" "" "missing_token"
run_test "Empty Bearer token" "fail" "/status" "GET" "Bearer " "empty_token"
run_test "Invalid format (no Bearer)" "fail" "/status" "GET" "Token abc123" "invalid_format"
run_test "Malformed JWT (not 3 parts)" "fail" "/status" "GET" "Bearer abc.def" "invalid_token"
run_test "Invalid base64 in payload" "fail" "/status" "GET" "Bearer eyJhbGciOiJIUzI1NiJ9.!!!invalid!!!.sig" "invalid_token"

echo ""
echo "=========================================="
echo "3. Signature Verification Tests"
echo "=========================================="

if [ -z "$SUPABASE_JWT_SECRET" ]; then
    echo -e "${YELLOW}WARNING: SUPABASE_JWT_SECRET not set, skipping signature tests${NC}"
    echo "Set it with: export SUPABASE_JWT_SECRET='your-secret'"
else
    # Valid token
    NOW=$(date +%s)
    EXP=$((NOW + 3600))
    VALID_PAYLOAD="{\"sub\":\"test-user-123\",\"aud\":\"authenticated\",\"iss\":\"https://qgzoqsgfqmtcpgfgtfms.supabase.co/auth/v1\",\"iat\":$NOW,\"exp\":$EXP}"
    VALID_TOKEN=$(create_jwt "$VALID_PAYLOAD")
    run_test "Valid signature" "pass" "/status" "GET" "Bearer $VALID_TOKEN"
    
    # Wrong secret
    WRONG_SECRET_TOKEN=$(create_jwt "$VALID_PAYLOAD" "wrong-secret-key")
    run_test "Invalid signature (wrong secret)" "fail" "/status" "GET" "Bearer $WRONG_SECRET_TOKEN" "invalid_signature"
    
    # Tampered payload
    TAMPERED_TOKEN="${VALID_TOKEN%.*}.$(echo -n '{"sub":"hacker"}' | base64 | tr -d '=' | tr '/+' '_-').${VALID_TOKEN##*.}"
    run_test "Tampered token" "fail" "/status" "GET" "Bearer $TAMPERED_TOKEN" "invalid_signature"
fi

echo ""
echo "=========================================="
echo "4. Claims Validation Tests"
echo "=========================================="

if [ -z "$SUPABASE_JWT_SECRET" ]; then
    echo -e "${YELLOW}Skipping (SUPABASE_JWT_SECRET not set)${NC}"
else
    NOW=$(date +%s)
    
    # Expired token
    EXPIRED_PAYLOAD="{\"sub\":\"test-user\",\"aud\":\"authenticated\",\"iss\":\"https://qgzoqsgfqmtcpgfgtfms.supabase.co/auth/v1\",\"iat\":$((NOW - 7200)),\"exp\":$((NOW - 3600))}"
    EXPIRED_TOKEN=$(create_jwt "$EXPIRED_PAYLOAD")
    run_test "Expired token" "fail" "/status" "GET" "Bearer $EXPIRED_TOKEN" "token_expired"
    
    # Future issued token (iat in future)
    FUTURE_PAYLOAD="{\"sub\":\"test-user\",\"aud\":\"authenticated\",\"iss\":\"https://qgzoqsgfqmtcpgfgtfms.supabase.co/auth/v1\",\"iat\":$((NOW + 120)),\"exp\":$((NOW + 7200))}"
    FUTURE_TOKEN=$(create_jwt "$FUTURE_PAYLOAD")
    run_test "Token issued in future" "fail" "/status" "GET" "Bearer $FUTURE_TOKEN" "invalid_iat"
    
    # Missing subject
    NO_SUB_PAYLOAD="{\"aud\":\"authenticated\",\"iss\":\"https://qgzoqsgfqmtcpgfgtfms.supabase.co/auth/v1\",\"iat\":$NOW,\"exp\":$((NOW + 3600))}"
    NO_SUB_TOKEN=$(create_jwt "$NO_SUB_PAYLOAD")
    run_test "Missing subject claim" "fail" "/status" "GET" "Bearer $NO_SUB_TOKEN" "missing_sub"
    
    # Wrong issuer
    WRONG_ISS_PAYLOAD="{\"sub\":\"test-user\",\"aud\":\"authenticated\",\"iss\":\"https://evil.com/auth\",\"iat\":$NOW,\"exp\":$((NOW + 3600))}"
    WRONG_ISS_TOKEN=$(create_jwt "$WRONG_ISS_PAYLOAD")
    run_test "Invalid issuer" "fail" "/status" "GET" "Bearer $WRONG_ISS_TOKEN" "invalid_issuer"
    
    # Wrong audience
    WRONG_AUD_PAYLOAD="{\"sub\":\"test-user\",\"aud\":\"anon\",\"iss\":\"https://qgzoqsgfqmtcpgfgtfms.supabase.co/auth/v1\",\"iat\":$NOW,\"exp\":$((NOW + 3600))}"
    WRONG_AUD_TOKEN=$(create_jwt "$WRONG_AUD_PAYLOAD")
    run_test "Invalid audience" "fail" "/status" "GET" "Bearer $WRONG_AUD_TOKEN" "invalid_audience"
fi

echo ""
echo "=========================================="
echo "5. Protected Endpoint Tests"
echo "=========================================="

if [ -z "$SUPABASE_JWT_SECRET" ]; then
    echo -e "${YELLOW}Skipping (SUPABASE_JWT_SECRET not set)${NC}"
else
    NOW=$(date +%s)
    EXP=$((NOW + 3600))
    VALID_PAYLOAD="{\"sub\":\"test-user-e2e\",\"aud\":\"authenticated\",\"iss\":\"https://qgzoqsgfqmtcpgfgtfms.supabase.co/auth/v1\",\"iat\":$NOW,\"exp\":$EXP}"
    VALID_TOKEN=$(create_jwt "$VALID_PAYLOAD")
    
    run_test "GET /status with valid token" "pass" "/status" "GET" "Bearer $VALID_TOKEN"
    run_test "POST /connect with valid token" "pass" "/connect" "POST" "Bearer $VALID_TOKEN"
    run_test "POST /disconnect with valid token" "pass" "/disconnect" "POST" "Bearer $VALID_TOKEN"
fi

echo ""
echo "=========================================="
echo "Summary"
echo "=========================================="
echo -e "Passed: ${GREEN}$PASS_COUNT${NC}"
echo -e "Failed: ${RED}$FAIL_COUNT${NC}"
echo ""

if [ $FAIL_COUNT -eq 0 ]; then
    echo -e "${GREEN}All tests passed!${NC}"
    exit 0
else
    echo -e "${RED}Some tests failed.${NC}"
    exit 1
fi
