import { Activity, AlertTriangle, Bot, Heart, MapPinned, type LucideIcon } from "lucide-react";

export type PublicFeature = {
  id: string;
  title: string;
  description: string;
  path: string;
  icon: LucideIcon;
  accent: string;
};

export const publicFeatures: PublicFeature[] = [
  {
    id: "ai-assistant",
    title: "AI Care Assistant",
    description: "Ask health questions and get guided, non-diagnostic wellness tips.",
    path: "/features/ai-assistant",
    icon: Bot,
    accent: "from-violet-500/15 to-teal-500/10 ring-violet-200/60",
  },
  {
    id: "bmi-buddy",
    title: "BMI Buddy",
    description: "Calculate your BMI and explore practical lifestyle suggestions.",
    path: "/features/bmi-buddy",
    icon: Activity,
    accent: "from-teal-500/15 to-cyan-500/10 ring-teal-300/70",
  },
  {
    id: "hospital-locator",
    title: "Hospital Locator",
    description: "Find nearby facilities and explore our doctor network on a map.",
    path: "/features/hospital-locator",
    icon: MapPinned,
    accent: "from-sky-500/15 to-teal-500/10 ring-sky-200/60",
  },
  {
    id: "emergency",
    title: "Urgent Care Booking",
    description: "Book the soonest available doctor slot for urgent — not life-threatening — needs.",
    path: "/emergency",
    icon: AlertTriangle,
    accent: "from-rose-500/15 to-amber-500/10 ring-rose-200/60",
  },
  {
    id: "portals",
    title: "Register by Role",
    description: "Create a patient, doctor, or admin account tailored to how you use MediHub.",
    path: "/portals",
    icon: Heart,
    accent: "from-rose-500/15 to-teal-500/10 ring-rose-200/60",
  },
];
