/**
 * Connection Types Tests
 * 
 * Tests for Phase D message schema types and utilities
 */

import { describe, it, expect } from "vitest";
import {
  createConnectIntent,
  validateConnectAck,
  SCHEMA_VERSION,
  type ConnectIntent,
  type ConnectAck,
} from "../types";

describe("createConnectIntent", () => {
  it("creates a valid connect_intent message", () => {
    const intent = createConnectIntent("https://example.com");

    expect(intent.v).toBe(SCHEMA_VERSION);
    expect(intent.type).toBe("connect_intent");
    expect(intent.targetUrl).toBe("https://example.com");
    expect(intent.requestId).toMatch(/^req_[a-f0-9]{8}$/);
    expect(intent.sessionId).toMatch(/^sess_[a-f0-9]{8}$/);
    expect(intent.clientTime).toBeDefined();
  });

  it("generates unique IDs for each call", () => {
    const intent1 = createConnectIntent("https://a.com");
    const intent2 = createConnectIntent("https://b.com");

    expect(intent1.requestId).not.toBe(intent2.requestId);
    expect(intent1.sessionId).not.toBe(intent2.sessionId);
  });

  it("includes valid ISO timestamp", () => {
    const intent = createConnectIntent("https://example.com");
    const date = new Date(intent.clientTime);
    
    expect(date.getTime()).not.toBeNaN();
  });
});

describe("validateConnectAck", () => {
  const createValidIntent = (): ConnectIntent => ({
    v: SCHEMA_VERSION,
    type: "connect_intent",
    requestId: "req_abc12345",
    sessionId: "sess_xyz98765",
    targetUrl: "https://example.com",
    clientTime: new Date().toISOString(),
  });

  const createValidAck = (intent: ConnectIntent): ConnectAck => ({
    v: SCHEMA_VERSION,
    type: "connect_ack",
    requestId: intent.requestId,
    sessionId: intent.sessionId,
    ack: true,
    status: "connected",
    serverTime: new Date().toISOString(),
  });

  it("validates a correct ack", () => {
    const intent = createValidIntent();
    const ack = createValidAck(intent);

    const result = validateConnectAck(ack, intent);

    expect(result.valid).toBe(true);
    expect(result.error).toBeUndefined();
  });

  it("rejects wrong message type", () => {
    const intent = createValidIntent();
    const ack = {
      ...createValidAck(intent),
      type: "wrong_type",
    };

    const result = validateConnectAck(ack as ConnectAck, intent);

    expect(result.valid).toBe(false);
    expect(result.error).toBe("Invalid message type");
  });

  it("rejects mismatched requestId", () => {
    const intent = createValidIntent();
    const ack = {
      ...createValidAck(intent),
      requestId: "req_different",
    };

    const result = validateConnectAck(ack, intent);

    expect(result.valid).toBe(false);
    expect(result.error).toBe("Request ID mismatch");
  });

  it("rejects mismatched sessionId", () => {
    const intent = createValidIntent();
    const ack = {
      ...createValidAck(intent),
      sessionId: "sess_different",
    };

    const result = validateConnectAck(ack, intent);

    expect(result.valid).toBe(false);
    expect(result.error).toBe("Session ID mismatch");
  });

  it("rejects ack with ack=false", () => {
    const intent = createValidIntent();
    const ack: ConnectAck = {
      ...createValidAck(intent),
      ack: false,
      status: "error",
      errorCode: "SERVER_BUSY",
    };

    const result = validateConnectAck(ack, intent);

    expect(result.valid).toBe(false);
    expect(result.error).toBe("SERVER_BUSY");
  });

  it("uses fallback error message when errorCode missing", () => {
    const intent = createValidIntent();
    const ack: ConnectAck = {
      ...createValidAck(intent),
      ack: false,
      status: "error",
    };

    const result = validateConnectAck(ack, intent);

    expect(result.valid).toBe(false);
    expect(result.error).toBe("Connection rejected");
  });
});

describe("SCHEMA_VERSION", () => {
  it("is 1 for Phase D", () => {
    expect(SCHEMA_VERSION).toBe(1);
  });
});
