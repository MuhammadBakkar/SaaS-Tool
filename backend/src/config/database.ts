/**
 * Build `DATABASE_URL` for PostgreSQL from `DB_*` when `DATABASE_URL` is empty.
 * Prisma CLI and the app read `DATABASE_URL` after {@link syncDatabaseUrlFromEnv}.
 */
export function syncDatabaseUrlFromEnv() {
    if (process.env.DATABASE_URL?.trim()) {
        return;
    }
    const host = process.env.DB_HOST?.trim();
    const user = process.env.DB_USER?.trim();
    const database = process.env.DB_NAME?.trim();
    if (!host || !user || !database)
        return;
    const port = process.env.DB_PORT?.trim() || "5432";
    const password = process.env.DB_PASSWORD ?? "";
    process.env.DATABASE_URL = `postgresql://${encodeURIComponent(user)}:${encodeURIComponent(password)}@${host}:${port}/${encodeURIComponent(database)}`;
}
export function getResolvedDatabaseUrl() {
    syncDatabaseUrlFromEnv();
    const url = process.env.DATABASE_URL?.trim();
    return url ? url : null;
}
export function requireDatabaseUrl() {
    const url = getResolvedDatabaseUrl();
    if (url)
        return url;
    throw new Error("DATABASE_URL is not set. Add it to .env or set DB_HOST, DB_USER, and DB_NAME (optional: DB_PORT, DB_PASSWORD).");
}
/** Safe bits for /health (no password). */
export function postgresEnvSummary() {
    const host = process.env.DB_HOST?.trim();
    const database = process.env.DB_NAME?.trim();
    const port = process.env.DB_PORT?.trim() || "5432";
    if (host && database) {
        return { ok: true, host, port, database };
    }
    if (process.env.DATABASE_URL?.trim()) {
        return { ok: true, host: "(DATABASE_URL)", port: "", database: "" };
    }
    return { ok: false };
}