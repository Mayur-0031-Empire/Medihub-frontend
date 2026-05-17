/** Portal the user is signing into (must match backend `role` on the account). */
export type PortalRole = "patient" | "doctor" | "admin";

export type UserRole = PortalRole;

export interface User {
  _id: string;
  firstName?: string;
  lastName?: string;
  username?: string;
  role: UserRole;
  email?: string;
  phone?: string;
  photo?: string;
  gender?: string;
  address?: string;
  bloodGroup?: string;
  age?: number;
}

export interface ApiSuccess<T> {
  success: true;
  statusCode?: number;
  message?: string;
  data: T;
}

export interface ApiErrorShape {
  success: false;
  message?: string;
  errors?: unknown[];
}

export type ApiEnvelope<T> = ApiSuccess<T> | ApiErrorShape;
