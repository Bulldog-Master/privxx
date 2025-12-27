import { DemoMessage } from "./types";

/**
 * Merge incoming messages into existing list:
 * - De-dupe by messageId
 * - If an optimistic message matches a real message, replace it
 * 
 * Matching rule for optimistic replacement:
 *   - optimistic messageId starts with "optimistic-"
 *   - match by (from, body) within 30s time window
 */
export function mergeMessages(
  existing: DemoMessage[],
  incoming: DemoMessage[]
): DemoMessage[] {
  const byId = new Map<string, DemoMessage>();
  
  // Add existing messages
  for (const m of existing) {
    byId.set(m.messageId, m);
  }

  // Add/replace with incoming real messages
  for (const m of incoming) {
    byId.set(m.messageId, { ...m, optimistic: false });
  }

  // Find optimistic entries that should be replaced
  const optimistic = existing.filter((m) => m.optimistic);
  const real = Array.from(byId.values()).filter((m) => !m.optimistic);
  const replacedOptimisticIds = new Set<string>();

  for (const o of optimistic) {
    const match = real.find((r) => {
      const sameFrom = r.from === o.from || (r.from === "me" && o.from === "self");
      const sameBody = r.body === o.body;
      const closeInTime = Math.abs((r.timestamp ?? 0) - (o.timestamp ?? 0)) < 30_000; // 30s window
      return sameFrom && sameBody && closeInTime;
    });

    if (match) {
      // Mark optimistic for removal since real message exists
      replacedOptimisticIds.add(o.messageId);
    }
  }

  // Filter out replaced optimistic messages
  const merged = Array.from(byId.values()).filter(
    (m) => !replacedOptimisticIds.has(m.messageId)
  );

  // Sort by timestamp (newest first for inbox display)
  merged.sort((a, b) => (b.timestamp ?? 0) - (a.timestamp ?? 0));

  return merged;
}
