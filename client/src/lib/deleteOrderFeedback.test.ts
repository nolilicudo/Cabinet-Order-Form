import { describe, expect, it } from "vitest";
import { formatDeletionError } from "./deleteOrderFeedback";

describe("formatDeletionError", () => {
  it("preserves the server's actionable deletion error", () => {
    expect(formatDeletionError({ message: "Order not found or unavailable." })).toBe("Order not found or unavailable.");
  });

  it("provides a safe fallback message when a deletion fails without detail", () => {
    expect(formatDeletionError({})).toBe("Unable to delete this order. Please try again.");
  });
});
