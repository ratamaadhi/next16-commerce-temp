import { describe, it, expect } from "vitest";
import { getDimensionsByWeight } from "../shipping";

describe("getDimensionsByWeight", () => {
  it("returns small box for <= 1kg", () => {
    expect(getDimensionsByWeight(500)).toEqual({ length: 20, width: 15, height: 10 });
    expect(getDimensionsByWeight(1000)).toEqual({ length: 20, width: 15, height: 10 });
  });

  it("returns medium box for <= 2kg", () => {
    expect(getDimensionsByWeight(1500)).toEqual({ length: 27, width: 13, height: 7 });
    expect(getDimensionsByWeight(2000)).toEqual({ length: 27, width: 13, height: 7 });
  });

  it("returns large box for <= 5kg", () => {
    expect(getDimensionsByWeight(3500)).toEqual({ length: 30, width: 20, height: 15 });
  });

  it("returns xl box for > 5kg", () => {
    expect(getDimensionsByWeight(6000)).toEqual({ length: 40, width: 30, height: 20 });
  });
});
