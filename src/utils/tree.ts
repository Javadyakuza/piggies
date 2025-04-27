// src/utils/tree.ts
import { supabase } from "@/utils/supebase";
import { cookies } from "next/headers";
/**
 * Finds the ID of the first node in the subtree of `rootId` that has fewer than 3 children.
 * If `rootId` itself has < 3 children, it returns `rootId`.
 * Returns null if no slot is found (in practice, there should always be a slot unless tree is saturated).
 */
export async function findOpenSlotInSubtree(
  rootId: string | number
): Promise<string | number | null> {
  // We will perform a BFS using a queue of node IDs
  const queue: Array<string | number> = [rootId];

  while (queue.length > 0) {
    const currentId = queue.shift()!;

    // Count children of currentId
    const { data: children, count } = await supabase
      .from("users")
      .select("id", { count: "exact" })
      .eq("parent_id", currentId);
    const childCount = count ?? (children ? children.length : 0);

    if (childCount < 3) {
      // Found a node with an open slot
      return currentId;
    }
    // If this node has 3 children, add all its children to the queue to check their children next
    if (children) {
      for (const child of children) {
        queue.push(child.id);
      }
    }
  }

  // If we exit the loop without finding a slot (very unlikely in normal operation)
  return null;
}

/**
 * Recursively builds the subtree (node and its descendants) for a given user ID.
 * Returns an object representing the node and its children.
 */
export async function getUserSubtree(userId: string | number): Promise<any> {
  // Fetch the user (optional: to include user details in the output)
  const { data: user } = await supabase
    .from("users")
    .select("id, telegram_id, inviter_id, parent_id, referral_id, created_at")
    .eq("id", userId)
    .single();
  if (!user) {
    return null; // user not found
  }
  // Fetch children of this user
  const { data: children } = await supabase
    .from("users")
    .select("id")
    .eq("parent_id", userId);

  // Build the subtree object
  const subtree = {
    id: user.id,
    telegram_id: user.telegram_id,
    inviter_id: user.inviter_id,
    referral_id: user.referral_id,
    parent_id: user.parent_id,
    created_at: user.created_at,
    children: [] as any[],
  };

  if (children && children.length > 0) {
    // Recursively get each child's subtree
    for (const child of children) {
      const childSubtree = await getUserSubtree(child.id);
      if (childSubtree) {
        subtree.children.push(childSubtree);
      }
    }
  }
  return subtree;
}
