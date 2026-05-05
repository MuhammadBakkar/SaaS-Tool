export type ApiUser = {
  id: string;
  email: string;
  full_name: string | null;
  avatar_url: string | null;
  /** Present when returned from `/auth/me` after backend update. */
  auth_provider?: "email" | "google" | "github";
  /** Active session row id for this access token (for “this device” in settings). */
  current_session_id?: string | null;
  plan: {
    plan_name: string;
    credits_used: number;
    credits_total: number;
  } | null;
};
