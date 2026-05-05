export type ApiEnvelope<T> = {
  status: number;
  message: string;
  data?: T;
};

export type ApiUser = {
  id: string;
  email: string;
  full_name: string | null;
  avatar_url: string | null;
  auth_provider?: 'email' | 'google' | 'github';
  current_session_id?: string | null;
  plan: {
    plan_name: string;
    credits_used: number;
    credits_total: number;
  } | null;
};

export type UserPlanDetail = {
  plan_name: string;
  status: string;
  credits_total: number;
  credits_used: number;
  current_period_start: string | null;
  current_period_end: string | null;
  stripe_customer_id: string | null;
};

export type UserProfile = {
  id: string;
  email: string;
  full_name: string | null;
  avatar_url: string | null;
  auth_provider: 'email' | 'google' | 'github';
  email_verified: boolean;
  timezone: string;
  locale: string;
  status: string;
  last_login_at: string | null;
  created_at: string;
  pending_email: string | null;
  plan: UserPlanDetail | null;
};

export type SessionRow = {
  id: string;
  device_info: string | null;
  ip_address: string | null;
  created_at: string;
  expires_at: string;
};

export function unwrapEnvelope<T>(body: ApiEnvelope<T>): T {
  if (body.status >= 400) {
    throw new Error(typeof body.message === 'string' ? body.message : 'Request failed');
  }
  if (body.data === undefined) {
    throw new Error(typeof body.message === 'string' ? body.message : 'Request failed');
  }
  return body.data;
}
