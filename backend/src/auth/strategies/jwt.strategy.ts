import passport from "passport";
import { Strategy as JwtStrategy, ExtractJwt } from "passport-jwt";
import type { Request } from "express";
import { UserStatus } from "@prisma/client";
import { getPrisma } from "../../lib/prisma.js";
import { redisGet } from "../../lib/redis.js";

function requireEnv(name: string): string {
  const v = process.env[name]?.trim();
  if (!v) throw new Error(`${name} is not set`);
  return v;
}

type AccessJwtPayload = {
  sub: string;
  email: string;
  jti: string;
  sessionId?: string;
  typ?: string;
};

export function registerJwtStrategy(): void {
  passport.use(
    new JwtStrategy(
      {
        jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
        secretOrKey: requireEnv("JWT_ACCESS_SECRET"),
        passReqToCallback: true,
      },
      async (_req: Request, payload: AccessJwtPayload, done) => {
        try {
          if (payload.typ !== "access") {
            return done(null, false);
          }
          const blocked = await redisGet(`bl:jti:${payload.jti}`);
          if (blocked) {
            return done(null, false);
          }
          const prisma = getPrisma();
          const user = await prisma.user.findUnique({
            where: { id: payload.sub },
            select: {
              id: true,
              email: true,
              full_name: true,
              avatar_url: true,
              auth_provider: true,
              status: true,
              email_verified: true,
              plan: {
                select: {
                  plan_name: true,
                  credits_used: true,
                  credits_total: true,
                  status: true,
                },
              },
            },
          });
          if (!user || user.status !== UserStatus.active || !user.email_verified) {
            return done(null, false);
          }
          let sessionId = payload.sessionId;
          if (!sessionId) {
            const s = await prisma.userSession.findFirst({
              where: {
                user_id: payload.sub,
                access_token_jti: payload.jti,
                is_active: true,
              },
              select: { id: true },
            });
            sessionId = s?.id;
          }
          if (!sessionId) {
            return done(null, false);
          }
          return done(null, { ...user, sessionId });
        } catch (e) {
          return done(e, false);
        }
      }
    )
  );
}
