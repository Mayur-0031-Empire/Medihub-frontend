import type { User } from "@/types/auth";

export type DashboardOutletContext = {
  user: User;
  setUser: (user: User) => void;
  refreshUser: () => Promise<void>;
};
