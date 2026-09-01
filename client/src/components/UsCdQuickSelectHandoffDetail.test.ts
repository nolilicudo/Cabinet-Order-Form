import { describe, expect, it } from "vitest";
import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { UsCdQuickSelectHandoffDetail } from "./UsCdQuickSelectHandoffDetail";

describe("UsCdQuickSelectHandoffDetail", () => {
  it("renders the exact source SKU, finish, and direct source price for a Quick Select line", () => {
    const markup = renderToStaticMarkup(createElement(UsCdQuickSelectHandoffDetail, {
      line: { baseSku: "SW-3DB12", finishName: "Shaker White", unitPriceCents: 19104 },
    }));

    expect(markup).toContain("Quick Select handoff");
    expect(markup).toContain("SW-3DB12 · Shaker White · $191.04 direct source price");
  });

  it("renders nothing when source finish details are unavailable", () => {
    const markup = renderToStaticMarkup(createElement(UsCdQuickSelectHandoffDetail, {
      line: { baseSku: "SW-3DB12" },
    }));

    expect(markup).toBe("");
  });
});
