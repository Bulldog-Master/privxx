# cMixx Integration Plan (Phase D)

## Goal
Prove real cMixx integration using a private control channel.

## MVP Scope
- Use cMixx for connection coordination
- Browsing traffic remains standard (demo mode)

## Architecture
- UI calls local companion service
- Companion service uses xxDK
- Messages sent to server over cMixx

## Local API Endpoints
- GET /health
- POST /connect
- GET /status

## Message Schema
{
  "type": "connect",
  "targetUrl": "https://example.com",
  "timestamp": 123456789
}

## Success Criteria
- Server receives message over cMixx
- Server replies successfully
- UI transitions to Secure state
