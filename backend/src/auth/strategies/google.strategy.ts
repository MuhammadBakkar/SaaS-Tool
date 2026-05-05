import passport from "passport";
import {
  Strategy as GoogleStrategy,
  type Profile,
  type VerifyCallback,
} from "passport-google-oauth20";
import type { Request } from "express";
import type { GoogleUser } from "../auth.types.js";
import { logger } from "../../lib/logger.js";

let googleOAuthEnabled = false;

export function isGoogleOAuthEnabled(): boolean {
  return googleOAuthEnabled;
}

export function registerGoogleStrategy(): void {
  const clientID = process.env.GOOGLE_CLIENT_ID?.trim();
  const clientSecret = process.env.GOOGLE_CLIENT_SECRET?.trim();
  const callbackURL = process.env.GOOGLE_CALLBACK_URL?.trim();
  if (!clientID || !clientSecret || !callbackURL) {
    googleOAuthEnabled = false;
    logger.warn(
      "[auth] Google OAuth disabled — set GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET, GOOGLE_CALLBACK_URL to enable."
    );
    return;
  }

  googleOAuthEnabled = true;
  passport.use(
    "google",
    new GoogleStrategy(
      {
        clientID,
        clientSecret,
        callbackURL,
        passReqToCallback: true as const,
      },
      (
        _req: Request,
        accessToken: string,
        refreshToken: string,
        profile: Profile,
        done: VerifyCallback
      ) => {
        const googleUser: GoogleUser = {
          googleId: profile.id,
          accessToken,
          refreshToken: refreshToken ?? "",
        };
        const email = profile.emails?.[0]?.value;
        if (email) {
          googleUser.email = email;
        }
        if (profile.name?.givenName) {
          googleUser.firstName = profile.name.givenName;
        }
        if (profile.name?.familyName) {
          googleUser.lastName = profile.name.familyName;
        }
        if (profile.photos?.[0]?.value) {
          googleUser.picture = profile.photos[0].value;
        }
        done(null, googleUser as never);
      }
    )
  );
  logger.log("[auth] Google OAuth enabled");
}
