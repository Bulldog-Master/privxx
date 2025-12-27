/// <reference types="vitest/globals" />
import { describe, it, expect, vi } from "vitest";
import { render } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { SessionTimeoutWarning } from "./SessionTimeoutWarning";

// Mock i18next
vi.mock("react-i18next", () => ({
  useTranslation: () => ({
    t: (key: string, fallback: string) => fallback,
  }),
}));

describe("SessionTimeoutWarning", () => {
  const defaultProps = {
    open: true,
    secondsRemaining: 45,
    onExtend: vi.fn(),
    onLogout: vi.fn(),
  };

  it("renders when open is true", () => {
    const { getByText } = render(<SessionTimeoutWarning {...defaultProps} />);

    expect(getByText("Session Expiring")).toBeInTheDocument();
    expect(getByText("until automatic logout")).toBeInTheDocument();
  });

  it("displays seconds remaining correctly", () => {
    const { getByText } = render(
      <SessionTimeoutWarning {...defaultProps} secondsRemaining={30} />
    );

    expect(getByText("30s")).toBeInTheDocument();
  });

  it("displays minutes and seconds when over 60 seconds", () => {
    const { getByText } = render(
      <SessionTimeoutWarning {...defaultProps} secondsRemaining={90} />
    );

    expect(getByText("1:30")).toBeInTheDocument();
  });

  it("calls onExtend when Stay Logged In is clicked", async () => {
    const onExtend = vi.fn();
    const { getByText } = render(
      <SessionTimeoutWarning {...defaultProps} onExtend={onExtend} />
    );

    await userEvent.click(getByText("Stay Logged In"));

    expect(onExtend).toHaveBeenCalledOnce();
  });

  it("calls onLogout when Logout Now is clicked", async () => {
    const onLogout = vi.fn();
    const { getByText } = render(
      <SessionTimeoutWarning {...defaultProps} onLogout={onLogout} />
    );

    await userEvent.click(getByText("Logout Now"));

    expect(onLogout).toHaveBeenCalledOnce();
  });

  it("does not render content when open is false", () => {
    const { queryByText } = render(
      <SessionTimeoutWarning {...defaultProps} open={false} />
    );

    expect(queryByText("Session Expiring")).not.toBeInTheDocument();
  });
});
