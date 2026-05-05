import "dotenv/config";
import express from "express";
import cors from "cors";
import helmet from "helmet";
import passport from "passport";
import swaggerUi from "swagger-ui-express";
import { postgresEnvSummary, syncDatabaseUrlFromEnv } from "./config/database.js";
import { configurePassport } from "./auth/strategies/passport.config.js";
import { authRouter } from "./auth/auth.routes.js";
import { usersRouter } from "./users/users.routes.js";
import { openApiSpec } from "./docs/openapi.js";
import { auditLogInterceptor } from "./common/interceptors/audit-log.interceptor.js";
import { serializeResponseMiddleware } from "./common/interceptors/serialize.interceptor.js";
import { globalErrorHandler, notFoundHandler } from "./utils/errorHandler.js";
import { successResponse, SUCCESS_MESSAGES } from "./utils/response.js";
import { logger } from "./lib/logger.js";

syncDatabaseUrlFromEnv();
configurePassport();

const app = express();
app.set("trust proxy", 1);
const PORT = Number(process.env.PORT) || 5000;

function publicBaseUrl(): string {
  return process.env.API_PUBLIC_URL?.trim().replace(/\/$/, "") || `http://localhost:${PORT}`;
}

/** Lets you confirm in DevTools / curl that this process handled the request (not another app on the same port). */
app.use((_req, res, next) => {
  res.setHeader("X-SaaS-Tool-Api", "1");
  next();
});

function parseFrontendOrigins(): string[] {
  const raw = process.env.FRONTEND_URLS ?? process.env.FRONTEND_URL ?? "http://localhost:4200";
  return raw
    .split(",")
    .map((s) => s.trim().replace(/\/$/, ""))
    .filter(Boolean);
}

const allowedFrontendOrigins = parseFrontendOrigins();

app.use(helmet());
app.use(
  cors({
    origin: (origin, cb) => {
      if (!origin) return cb(null, true);
      if (allowedFrontendOrigins.includes(origin)) return cb(null, true);
      return cb(null, false);
    },
    credentials: true,
  })
);
app.use(express.json({ limit: "1mb" }));
app.use(passport.initialize());
app.use(serializeResponseMiddleware);
app.use(auditLogInterceptor);

/** Unique path: if this 404s but GET / responds, traffic is not reaching this app (wrong port or another process). */
app.get("/__saas_tool__/ping", (_req, res) => {
  res.json({ ok: true, service: "saas-tool-backend" });
});

app.get("/health", (_req, res) => {
  res.json(
    successResponse(SUCCESS_MESSAGES.OPERATION_SUCCESS, {
      status: "healthy",
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      postgres: postgresEnvSummary(),
    })
  );
});

app.use("/docs", swaggerUi.serve, swaggerUi.setup(openApiSpec as Record<string, unknown>));
app.get("/docs.json", (_req, res) => res.json(openApiSpec));

app.use("/auth", authRouter);
app.use("/users", usersRouter);

app.use(notFoundHandler);
app.use(globalErrorHandler);

const server = app.listen(PORT, () => {
  const env = process.env.NODE_ENV ?? "dev";
  const baseUrl =
    process.env.API_PUBLIC_URL?.trim().replace(/\/$/, "") || `http://localhost:${PORT}`;

  logger.log(`Server on port ${PORT} (${env})`);
  logger.log(`API (root)     ${baseUrl}/`);
  logger.log(`Health         ${baseUrl}/health`);
  logger.log(`Swagger UI     ${baseUrl}/docs`);
  logger.log(`OpenAPI JSON   ${baseUrl}/docs.json`);
  logger.log(
    "Sanity check: GET / must return JSON (not plain text). Response should include header X-SaaS-Tool-Api: 1."
  );

  const m = postgresEnvSummary();
  logger.log(
    m.ok
      ? `PostgreSQL: ${m.host}:${m.port}/${m.database}`
      : "PostgreSQL: set DB_* or DATABASE_URL in .env"
  );
});

server.on("error", (err: NodeJS.ErrnoException) => {
  if (err.code === "EADDRINUSE") {
    logger.error(
      `Port ${PORT} is already in use. Another process is bound there (often a different Node app). ` +
        `Stop it or set PORT in .env. Windows: netstat -ano | findstr :${PORT}`
    );
    process.exit(1);
  }
  throw err;
});

// Avoid immediate process exit when stdin is closed (some Windows / IDE + nodemon setups show "clean exit").
try {
  process.stdin.resume();
} catch {
  /* ignore */
}

process.on("SIGINT", async () => {
  const { disconnectPrisma } = await import("./lib/prisma.js");
  await disconnectPrisma();
  server.close(() => process.exit(0));
});
