/**
 * Nest uses `@Public()` with a metadata reflection guard.
 * Express: public routes omit `passport.authenticate('jwt')` on the router.
 */
export const PUBLIC_ROUTE = Symbol("public");
