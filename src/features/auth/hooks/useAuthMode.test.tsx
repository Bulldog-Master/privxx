/// <reference types="vitest/globals" />
import { describe, it, expect } from "vitest";
import { render } from "@testing-library/react";
import { MemoryRouter, Routes, Route, useSearchParams } from "react-router-dom";
import { useAuthMode } from "./useAuthMode";

function HookProbe() {
  const { mode } = useAuthMode();
  return <div data-testid="mode">{mode}</div>;
}

function QueryProbe() {
  const [sp] = useSearchParams();
  return <div data-testid="query-mode">{sp.get("mode") ?? ""}</div>;
}

describe("useAuthMode", () => {
  it("defaults to signin when no reset query param", () => {
    const { getByTestId } = render(
      <MemoryRouter initialEntries={["/auth"]}>
        <Routes>
          <Route path="/auth" element={<HookProbe />} />
        </Routes>
      </MemoryRouter>
    );

    expect(getByTestId("mode")).toHaveTextContent("signin");
  });

  it('starts in reset mode when "?mode=reset" is present', () => {
    const { getByTestId } = render(
      <MemoryRouter initialEntries={["/auth?mode=reset"]}>
        <Routes>
          <Route
            path="/auth"
            element={
              <>
                <QueryProbe />
                <HookProbe />
              </>
            }
          />
        </Routes>
      </MemoryRouter>
    );

    expect(getByTestId("query-mode")).toHaveTextContent("reset");
    expect(getByTestId("mode")).toHaveTextContent("reset");
  });
});
