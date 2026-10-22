export type Role = "admin" | "teacher" | "student";

export interface IUser {
  id: number;
  email: string;
  full_name: string | null;
  role: Role;
  created_at: string;
}

/** `/api/auth/login`, `/register` және `/api/users/me/password` жауабы. */
export interface ITokenResponse {
  access_token: string;
}
