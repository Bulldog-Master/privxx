/// <reference types="vitest/globals" />
import { describe, it, expect } from "vitest";
import { render } from "@testing-library/react";
import StatusCard from "../StatusCard";
import { CheckCircle2 } from "lucide-react";

describe("StatusCard", () => {
  const defaultProps = {
    icon: CheckCircle2,
    iconColor: "text-emerald-500",
    bgColor: "bg-emerald-500/10",
    title: "Backend",
    subtitle: "Connection status",
    label: "Online",
    labelColor: "text-emerald-500",
  };

  it("renders title and subtitle", () => {
    const { getByText } = render(<StatusCard {...defaultProps} />);
    
    expect(getByText("Backend")).toBeInTheDocument();
    expect(getByText("Connection status")).toBeInTheDocument();
  });

  it("renders label", () => {
    const { getByText } = render(<StatusCard {...defaultProps} />);
    
    expect(getByText("Online")).toBeInTheDocument();
  });

  it("applies pulse animation when pulse prop is true", () => {
    const { container } = render(<StatusCard {...defaultProps} pulse={true} />);
    
    const icon = container.querySelector("svg");
    expect(icon).toHaveClass("animate-pulse");
  });

  it("does not apply pulse animation when pulse prop is false", () => {
    const { container } = render(<StatusCard {...defaultProps} pulse={false} />);
    
    const icon = container.querySelector("svg");
    expect(icon).not.toHaveClass("animate-pulse");
  });

  it("applies scale-in animation when showSuccess is true", () => {
    const { container } = render(<StatusCard {...defaultProps} showSuccess={true} />);
    
    const icon = container.querySelector("svg");
    expect(icon).toHaveClass("animate-scale-in");
  });

  it("renders actions when provided", () => {
    const { getByTestId } = render(
      <StatusCard 
        {...defaultProps} 
        actions={<button data-testid="action-button">Retry</button>} 
      />
    );
    
    expect(getByTestId("action-button")).toBeInTheDocument();
  });

  it("has correct accessibility attributes", () => {
    const { getByRole } = render(<StatusCard {...defaultProps} />);
    
    const statusElement = getByRole("status");
    expect(statusElement).toHaveAttribute("aria-live", "polite");
  });

  it("applies background color class", () => {
    const { container } = render(<StatusCard {...defaultProps} />);
    
    const card = container.firstChild;
    expect(card).toHaveClass("bg-emerald-500/10");
  });
});
