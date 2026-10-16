import { describe, it, expect } from "vitest";
import { priceOf } from "@/lib/store";
describe("priceOf", () => {
  it("adds 80% margin over dropshipping and ends in ,90", () => {
    expect(priceOf(109.89)).toBeCloseTo(197.9, 2);
  });
});
