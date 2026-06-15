import { displayName } from "@/lib/user/displayName";
import type { User } from "@/types/auth";

const JUST_REGISTERED_KEY = "medihub_just_registered_user_id";

export const DASHBOARD_WELCOME_QUOTE =
  "Every care journey is easier when information is clear, timely, and in the right hands.";

export function markJustRegistered(userId: string): void {
  sessionStorage.setItem(JUST_REGISTERED_KEY, userId);
}

export function dashboardGreeting(user: Pick<User, "_id" | "firstName" | "lastName" | "username" | "email">): string {
  const name = displayName(user);
  const justRegistered = sessionStorage.getItem(JUST_REGISTERED_KEY) === user._id;
  if (justRegistered) {
    sessionStorage.removeItem(JUST_REGISTERED_KEY);
    return `Welcome, ${name}`;
  }
  return `Welcome back, ${name}`;
}
