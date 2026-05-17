import type { User } from "@/types/auth";

/** Display name for dashboard greetings and avatar alt text. */
export function displayName(user: Pick<User, "firstName" | "lastName" | "username" | "email">): string {
  const n = [user.firstName, user.lastName].filter(Boolean).join(" ").trim();
  return n || user.username || user.email || "Member";
}
