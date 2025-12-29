/// <reference types="vitest/globals" />
import { describe, it, expect, vi, beforeEach } from "vitest";
import { getBackendStatusDisplay, getModeDisplay, type UiState } from "../../utils/getStatusDisplays";
import { CheckCircle2, XCircle, AlertCircle, Info } from "lucide-react";

// Mock translation function
const mockT = vi.fn((key: string) => key);

describe("getBackendStatusDisplay", () => {
  beforeEach(() => {
    mockT.mockClear();
  });

  it("returns checking state when loading", () => {
    const result = getBackendStatusDisplay("ready", true, mockT);
    
    expect(result.label).toBe("diagnosticsChecking");
    expect(result.icon).toBe(AlertCircle);
    expect(result.color).toBe("text-muted-foreground");
    expect(result.bgColor).toBe("bg-muted");
    expect(result.pulse).toBe(true);
  });

  it("returns offline state when error", () => {
    const result = getBackendStatusDisplay("error", false, mockT);
    
    expect(result.label).toBe("diagnosticsOffline");
    expect(result.icon).toBe(XCircle);
    expect(result.color).toBe("text-amber-500");
    expect(result.bgColor).toBe("bg-amber-500/10");
    expect(result.pulse).toBe(false);
  });

  it("returns connecting state when connecting", () => {
    const result = getBackendStatusDisplay("connecting", false, mockT);
    
    expect(result.label).toBe("diagnosticsConnecting");
    expect(result.icon).toBe(AlertCircle);
    expect(result.color).toBe("text-amber-500");
    expect(result.bgColor).toBe("bg-amber-500/10");
    expect(result.pulse).toBe(true);
  });

  it("returns online state when ready", () => {
    const result = getBackendStatusDisplay("ready", false, mockT);
    
    expect(result.label).toBe("diagnosticsOnline");
    expect(result.icon).toBe(CheckCircle2);
    expect(result.color).toBe("text-emerald-500");
    expect(result.bgColor).toBe("bg-emerald-500/10");
    expect(result.pulse).toBe(false);
  });
});

describe("getModeDisplay", () => {
  beforeEach(() => {
    mockT.mockClear();
  });

  it("returns preview/simulated mode when isMock is true", () => {
    const result = getModeDisplay(true, mockT);
    
    expect(result.label).toBe("previewModeLabel");
    expect(result.sublabel).toBe("diagnosticsModeSimulated");
    expect(result.icon).toBe(Info);
    expect(result.color).toBe("text-blue-500");
    expect(result.bgColor).toBe("bg-blue-500/10");
  });

  it("returns live mode when isMock is false", () => {
    const result = getModeDisplay(false, mockT);
    
    expect(result.label).toBe("liveModeLabel");
    expect(result.sublabel).toBe("diagnosticsModeLive");
    expect(result.icon).toBe(CheckCircle2);
    expect(result.color).toBe("text-emerald-500");
    expect(result.bgColor).toBe("bg-emerald-500/10");
  });
});
