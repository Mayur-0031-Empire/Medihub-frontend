import type { PortalRole } from "@/types/auth";

export function registerSectionTitles(role: PortalRole): {
  personal: string;
  account: string;
  security: string;
  photo: string;
} {
  switch (role) {
    case "patient":
      return {
        personal: "About you",
        account: "Account & contact",
        security: "Password",
        photo: "Profile photo",
      };
    case "doctor":
      return {
        personal: "Legal name",
        account: "Username & contact",
        security: "Password",
        photo: "Directory photo",
      };
    case "admin":
      return {
        personal: "Personal details",
        account: "Work account",
        security: "Password",
        photo: "Profile photo",
      };
    default: {
      const _exhaustive: never = role;
      return _exhaustive;
    }
  }
}

export function registerHeadline(role: PortalRole): string {
  switch (role) {
    case "patient":
      return "Create your patient account";
    case "doctor":
      return "Create your doctor account";
    case "admin":
      return "Create your administrator account";
    default: {
      const _exhaustive: never = role;
      return _exhaustive;
    }
  }
}

export function registerPhotoHint(role: PortalRole): string {
  const tech = "JPEG, PNG, or WebP. Max 5 MB.";
  switch (role) {
    case "doctor":
      return `Clear professional headshot — a photo is required at signup. ${tech}`;
    case "admin":
      return `A clear photo for your admin profile. ${tech}`;
    case "patient":
      return tech;
    default: {
      const _exhaustive: never = role;
      return _exhaustive;
    }
  }
}

export function registerSubmitLabel(role: PortalRole): string {
  switch (role) {
    case "patient":
      return "Create patient account";
    case "doctor":
      return "Create doctor account";
    case "admin":
      return "Create admin account";
    default: {
      const _exhaustive: never = role;
      return _exhaustive;
    }
  }
}
