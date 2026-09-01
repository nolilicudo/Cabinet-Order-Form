import { describe, expect, it, vi } from "vitest";
import { executeOrderDeletion } from "./db";

describe("executeOrderDeletion", () => {
  it("removes order items before removing the order header", async () => {
    const calls: string[] = [];
    const result = await executeOrderDeletion(42, {
      deleteItems: async orderId => { calls.push(`items:${orderId}`); },
      deleteOrder: async orderId => { calls.push(`order:${orderId}`); return true; },
    });

    expect(calls).toEqual(["items:42", "order:42"]);
    expect(result).toEqual({ success: true, orderId: 42 });
  });

  it("does not remove the order header when line-item cleanup fails", async () => {
    const deleteOrder = vi.fn(async () => true);
    await expect(executeOrderDeletion(42, {
      deleteItems: async () => { throw new Error("Unable to remove order items."); },
      deleteOrder,
    })).rejects.toThrow("Unable to remove order items.");
    expect(deleteOrder).not.toHaveBeenCalled();
  });

  it("reports a missing order when the header no longer exists", async () => {
    await expect(executeOrderDeletion(42, {
      deleteItems: async () => undefined,
      deleteOrder: async () => false,
    })).rejects.toThrow("Order not found or unavailable.");
  });
});
