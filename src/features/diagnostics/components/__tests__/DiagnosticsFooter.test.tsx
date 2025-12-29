/// <reference types="vitest/globals" />
import { describe, it, expect, vi, beforeEach } from "vitest";
import { render } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import DiagnosticsFooter from "../DiagnosticsFooter";

// Mock react-i18next
vi.mock("react-i18next", () => ({
  useTranslation: () => ({
    t: (key: string) => key,
    i18n: { language: "en", changeLanguage: vi.fn() },
  }),
}));

describe("DiagnosticsFooter", () => {
  const defaultProps = {
    isLoading: false,
    copied: false,
    onRefresh: vi.fn(),
    onCopy: vi.fn(),
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("renders version text", () => {
    const { getByText } = render(<DiagnosticsFooter {...defaultProps} />);
    
    expect(getByText(/Privxx v/)).toBeInTheDocument();
  });

  it("calls onRefresh when refresh button is clicked", async () => {
    const user = userEvent.setup();
    const onRefresh = vi.fn();
    const { getByRole } = render(<DiagnosticsFooter {...defaultProps} onRefresh={onRefresh} />);
    
    const refreshButton = getByRole("button", { name: "diagnosticsRefresh" });
    await user.click(refreshButton);
    
    expect(onRefresh).toHaveBeenCalledTimes(1);
  });

  it("calls onCopy when copy button is clicked", async () => {
    const user = userEvent.setup();
    const onCopy = vi.fn();
    const { getByRole } = render(<DiagnosticsFooter {...defaultProps} onCopy={onCopy} />);
    
    const copyButton = getByRole("button", { name: "diagnosticsCopy" });
    await user.click(copyButton);
    
    expect(onCopy).toHaveBeenCalledTimes(1);
  });

  it("disables refresh button when loading", () => {
    const { getByRole } = render(<DiagnosticsFooter {...defaultProps} isLoading={true} />);
    
    const refreshButton = getByRole("button", { name: "diagnosticsRefresh" });
    expect(refreshButton).toBeDisabled();
  });

  it("shows spinning animation when loading", () => {
    const { container } = render(<DiagnosticsFooter {...defaultProps} isLoading={true} />);
    
    const refreshIcon = container.querySelector(".animate-spin");
    expect(refreshIcon).toBeInTheDocument();
  });

  it("shows check icon when copied is true", () => {
    const { container } = render(<DiagnosticsFooter {...defaultProps} copied={true} />);
    
    // Check icon should have emerald color
    const checkIcon = container.querySelector(".text-emerald-500");
    expect(checkIcon).toBeInTheDocument();
  });

  it("has accessible button labels", () => {
    const { getByRole } = render(<DiagnosticsFooter {...defaultProps} />);
    
    expect(getByRole("button", { name: "diagnosticsRefresh" })).toBeInTheDocument();
    expect(getByRole("button", { name: "diagnosticsCopy" })).toBeInTheDocument();
  });
});
