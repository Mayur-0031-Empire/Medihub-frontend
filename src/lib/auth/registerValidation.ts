import type { PortalRole } from "@/types/auth";

export type RegisterField =
  | "firstName"
  | "lastName"
  | "username"
  | "role"
  | "email"
  | "phone"
  | "password"
  | "confirmPassword"
  | "photo";

export type RegisterFieldErrors = Partial<Record<RegisterField, string>>;

/** Order for scrolling to first validation error (matches form: role first). */
export const REGISTER_FIELD_SCROLL_ORDER: RegisterField[] = [
  "role",
  "firstName",
  "lastName",
  "username",
  "email",
  "phone",
  "password",
  "confirmPassword",
  "photo",
];

/** When `role` is fixed by URL (`/register/patient` etc.), omit `role` from scroll targets. */
export const REGISTER_FIELD_SCROLL_ORDER_NO_ROLE = REGISTER_FIELD_SCROLL_ORDER.filter((f) => f !== "role");

export interface RegisterFormValues {
  firstName: string;
  lastName: string;
  username: string;
  role: PortalRole;
  email: string;
  phone: string;
  password: string;
  confirmPassword: string;
  photo: File | null;
}

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const USERNAME_RE = /^[a-zA-Z][a-zA-Z0-9_]{2,31}$/;
const NAME_RE = /^[\p{L}\s'.-]+$/u;

const MAX_NAME = 80;
const MAX_FILE_BYTES = 5 * 1024 * 1024;
const ALLOWED_IMAGE_TYPES = new Set(["image/jpeg", "image/png", "image/webp"]);

/** Count digits in a phone string (for E.164-style validation). */
function digitCount(phone: string): number {
  return (phone.match(/\d/g) ?? []).length;
}

export function validatePasswordRules(password: string): string | null {
  if (password.length < 8) {
    return "Use at least 8 characters.";
  }
  if (!/[a-z]/.test(password)) {
    return "Add at least one lowercase letter.";
  }
  if (!/[A-Z]/.test(password)) {
    return "Add at least one uppercase letter.";
  }
  if (!/\d/.test(password)) {
    return "Add at least one number.";
  }
  return null;
}

export function validateRegisterForm(values: RegisterFormValues): RegisterFieldErrors {
  const errors: RegisterFieldErrors = {};

  const first = values.firstName.trim();
  if (!first) {
    errors.firstName = "First name is required.";
  } else if (first.length > MAX_NAME) {
    errors.firstName = `Use at most ${MAX_NAME} characters.`;
  } else if (!NAME_RE.test(first)) {
    errors.firstName = "Use letters, spaces, hyphens, apostrophes, or periods only.";
  }

  const last = values.lastName.trim();
  if (!last) {
    errors.lastName = "Last name is required.";
  } else if (last.length > MAX_NAME) {
    errors.lastName = `Use at most ${MAX_NAME} characters.`;
  } else if (!NAME_RE.test(last)) {
    errors.lastName = "Use letters, spaces, hyphens, apostrophes, or periods only.";
  }

  const user = values.username.trim();
  if (!user) {
    errors.username = "Username is required.";
  } else if (!USERNAME_RE.test(user)) {
    errors.username =
      "3–32 characters: start with a letter, then letters, numbers, or underscores (e.g. asha_sharma).";
  }

  if (!["patient", "doctor", "admin"].includes(values.role)) {
    errors.role = "Choose an account type.";
  }

  const email = values.email.trim();
  if (!email) {
    errors.email = "Email is required.";
  } else if (!EMAIL_RE.test(email)) {
    errors.email = "Enter a valid email address.";
  }

  const phone = values.phone.trim();
  if (!phone) {
    errors.phone = "Phone number is required.";
  } else {
    const digits = digitCount(phone);
    if (digits < 10 || digits > 15) {
      errors.phone = "Enter a valid phone number (10–15 digits, optional +country).";
    }
  }

  const pwdErr = validatePasswordRules(values.password);
  if (!values.password) {
    errors.password = "Password is required.";
  } else if (pwdErr) {
    errors.password = pwdErr;
  }

  if (!values.confirmPassword) {
    errors.confirmPassword = "Confirm your password.";
  } else if (values.confirmPassword !== values.password) {
    errors.confirmPassword = "Passwords do not match.";
  }

  if (!values.photo) {
    errors.photo = "Profile photo is required.";
  } else {
    if (!ALLOWED_IMAGE_TYPES.has(values.photo.type)) {
      errors.photo = "Use JPEG, PNG, or WebP.";
    } else if (values.photo.size > MAX_FILE_BYTES) {
      errors.photo = "Photo must be 5 MB or smaller.";
    }
  }

  return errors;
}

export function hasValidationErrors(errors: RegisterFieldErrors): boolean {
  return Object.keys(errors).length > 0;
}
