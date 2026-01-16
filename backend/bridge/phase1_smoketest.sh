#!/usr/bin/env bash
set -euo pipefail

: "${BASE:?set BASE like http://127.0.0.1:8090}"
: "${JWT:?set JWT}"
: "${CONV:=conv_test_1}"
: "${PEER_FP:=fp_dummy_local}"

echo "== ensure conversation =="
curl -sS -X POST "$BASE/conversation/create" \
  -H "Authorization: Bearer $JWT" \
  -H "Content-Type: application/json" \
  -d "{\"peerFingerprint\":\"$PEER_FP\"}" | jq .

echo
echo "== send 1 message =="
SEND_SESS=$(curl -sS -X POST "$BASE/session/issue" \
  -H "Authorization: Bearer $JWT" \
  -H "Content-Type: application/json" \
  -d "{\"purpose\":\"message_send\",\"conversationId\":\"$CONV\"}" | jq -r '.sessionId')

PLAINTEXT_B64=$(printf 'smoketest %s\n' "$(date -u +%FT%TZ)" | base64 -w0)

curl -sS -X POST "$BASE/message/send" \
  -H "Authorization: Bearer $JWT" \
  -H "Content-Type: application/json" \
  -d "{\"sessionId\":\"$SEND_SESS\",\"conversationId\":\"$CONV\",\"plaintextB64\":\"$PLAINTEXT_B64\"}" | jq .

echo
echo "== inbox fetch (get FP) =="
INBOX_SESS=$(curl -sS -X POST "$BASE/session/issue" \
  -H "Authorization: Bearer $JWT" \
  -H "Content-Type: application/json" \
  -d '{"purpose":"message_receive","conversationId":null}' | jq -r '.sessionId')

FP=$(curl -sS -X POST "$BASE/message/inbox" \
  -H "Authorization: Bearer $JWT" \
  -H "Content-Type: application/json" \
  -d "{\"sessionId\":\"$INBOX_SESS\",\"limit\":1}" | jq -r '.items[0].envelopeFingerprint')

echo "FP=$FP"

echo
echo "== ack FP =="
ACK_SESS=$(curl -sS -X POST "$BASE/session/issue" \
  -H "Authorization: Bearer $JWT" \
  -H "Content-Type: application/json" \
  -d "{\"purpose\":\"message_receive\",\"conversationId\":\"$CONV\"}" | jq -r '.sessionId')

curl -sS -X POST "$BASE/message/ack" \
  -H "Authorization: Bearer $JWT" \
  -H "Content-Type: application/json" \
  -d "{\"sessionId\":\"$ACK_SESS\",\"conversationId\":\"$CONV\",\"envelopeFingerprints\":[\"$FP\"]}" | jq .

echo
echo "== confirm empty inbox + thread =="
INBOX_SESS2=$(curl -sS -X POST "$BASE/session/issue" \
  -H "Authorization: Bearer $JWT" \
  -H "Content-Type: application/json" \
  -d '{"purpose":"message_receive","conversationId":null}' | jq -r '.sessionId')

curl -sS -X POST "$BASE/message/inbox" \
  -H "Authorization: Bearer $JWT" \
  -H "Content-Type: application/json" \
  -d "{\"sessionId\":\"$INBOX_SESS2\",\"limit\":10}" | jq .

THREAD_SESS=$(curl -sS -X POST "$BASE/session/issue" \
  -H "Authorization: Bearer $JWT" \
  -H "Content-Type: application/json" \
  -d "{\"purpose\":\"message_receive\",\"conversationId\":\"$CONV\"}" | jq -r '.sessionId')

curl -sS -X POST "$BASE/message/thread" \
  -H "Authorization: Bearer $JWT" \
  -H "Content-Type: application/json" \
  -d "{\"sessionId\":\"$THREAD_SESS\",\"conversationId\":\"$CONV\",\"limit\":10}" | jq .
