import passport from "passport";

/** Same role as Nest `JwtAuthGuard` — use on routes that require a valid access JWT. */
export const jwtAuthGuard = passport.authenticate("jwt", { session: false });
