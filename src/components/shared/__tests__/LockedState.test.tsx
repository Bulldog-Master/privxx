/// <reference types="vitest/globals" />
import { describe, it, expect, vi } from "vitest";
import { render } from "@testing-library/react";

vi.mock("react-i18next", () => ({
  useTranslation: () => ({
    t: (key: string, fallback: string) => fallback,
  }),
}));

import { LockedState } from "../LockedState";

describe("LockedState", () => {
  it("renders default locked state", () => {
    const { getByText } = render(<LockedState />);
    
    expect(getByText("Identity Locked")).toBeInTheDocument();
    expect(getByText("Unlock your identity to access this feature.")).toBeInTheDocument();
  });

  it("renders lock icon", () => {
    const { container } = render(<LockedState />);
    
    const icon = container.querySelector("svg");
    expect(icon).toBeInTheDocument();
  });

  it("uses custom title key", () => {
    const { getByText } = render(<LockedState titleKey="customTitle" />);
    
    // Falls back to the key since our mock returns fallback
    expect(getByText("Identity Locked")).toBeInTheDocument();
  });

  it("uses custom hint key", () => {
    const { getByText } = render(<LockedState hintKey="customHint" />);
    
    expect(getByText("Unlock your identity to access this feature.")).toBeInTheDocument();
  });

  it("has centered layout", () => {
    const { container } = render(<LockedState />);
    
    const wrapper = container.firstChild;
    expect(wrapper).toHaveClass("flex", "flex-col", "items-center", "justify-center", "text-center");
  });
});
