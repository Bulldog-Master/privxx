/// <reference types="vitest/globals" />
import { describe, it, expect } from "vitest";
import { render } from "@testing-library/react";
import StatusCardSkeleton from "../StatusCardSkeleton";

describe("StatusCardSkeleton", () => {
  it("renders skeleton elements", () => {
    const { container } = render(<StatusCardSkeleton />);
    
    // Should have skeleton elements
    const skeletons = container.querySelectorAll('[class*="animate"]');
    expect(skeletons.length).toBeGreaterThan(0);
  });

  it("applies default width classes", () => {
    const { container } = render(<StatusCardSkeleton />);
    
    // Check for default title width
    expect(container.querySelector(".w-16")).toBeInTheDocument();
    // Check for default subtitle width
    expect(container.querySelector(".w-24")).toBeInTheDocument();
    // Check for default label width
    expect(container.querySelector(".w-14")).toBeInTheDocument();
  });

  it("applies custom width classes", () => {
    const { container } = render(
      <StatusCardSkeleton 
        titleWidth="w-20" 
        subtitleWidth="w-32" 
        labelWidth="w-12" 
      />
    );
    
    expect(container.querySelector(".w-20")).toBeInTheDocument();
    expect(container.querySelector(".w-32")).toBeInTheDocument();
    expect(container.querySelector(".w-12")).toBeInTheDocument();
  });

  it("has fade-in animation", () => {
    const { container } = render(<StatusCardSkeleton />);
    
    const card = container.firstChild;
    expect(card).toHaveClass("animate-fade-in");
  });

  it("has muted background", () => {
    const { container } = render(<StatusCardSkeleton />);
    
    const card = container.firstChild;
    expect(card).toHaveClass("bg-muted");
  });
});
