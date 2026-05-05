import type { AuthProvider, PlanName, PlanStatus, UserStatus } from "@prisma/client";

export type AuthedRequestUser = {
  id: string;
  email: string;
  full_name: string | null;
  avatar_url: string | null;
  auth_provider: AuthProvider;
  status: UserStatus;
  email_verified: boolean;
  sessionId: string;
  plan: {
    plan_name: PlanName;
    credits_used: number;
    credits_total: number;
    status: PlanStatus;
  } | null;
};

declare global {
  namespace Express {
    // eslint-disable-next-line @typescript-eslint/no-empty-object-type
    interface User extends AuthedRequestUser {}
  }
}

export {};
