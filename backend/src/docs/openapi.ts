/** OpenAPI 3 (PostgreSQL + Express). Nest-style @ApiTags → tags here. */
export const openApiSpec = {
  openapi: "3.0.3",
  info: {
    title: "AI Ads Generator — Auth API",
    version: "1.0.0",
    description: "Authentication for AI Ads Generator (Express + Prisma + PostgreSQL).",
  },
  servers: [{ url: "http://localhost:5000", description: "Local" }],
  tags: [
    { name: "auth", description: "Authentication" },
    { name: "users", description: "Profile, sessions, account" },
  ],
  paths: {
    "/auth/register": {
      post: {
        tags: ["auth"],
        summary: "Register",
        operationId: "register",
        responses: {
          "201": { description: "Created" },
          "409": { description: "Email taken" },
        },
      },
    },
    "/auth/verify-email": {
      post: {
        tags: ["auth"],
        summary: "Verify email",
        operationId: "verifyEmail",
        responses: { "200": { description: "OK" } },
      },
    },
    "/auth/login": {
      post: {
        tags: ["auth"],
        summary: "Login",
        operationId: "login",
        responses: { "200": { description: "OK" }, "401": { description: "Unauthorized" } },
      },
    },
    "/auth/google": {
      get: {
        tags: ["auth"],
        summary: "Google OAuth redirect",
        operationId: "googleAuth",
        responses: { "302": { description: "Redirect to Google" } },
      },
    },
    "/auth/google/callback": {
      get: {
        tags: ["auth"],
        summary: "Google OAuth callback",
        operationId: "googleCallback",
        responses: { "302": { description: "Redirect to frontend with tokens" } },
      },
    },
    "/auth/refresh": {
      post: {
        tags: ["auth"],
        summary: "Refresh tokens",
        operationId: "refreshToken",
        responses: { "200": { description: "OK" }, "401": { description: "Invalid refresh" } },
      },
    },
    "/auth/logout": {
      post: {
        tags: ["auth"],
        summary: "Logout current session",
        operationId: "logout",
        security: [{ bearerAuth: [] }],
        responses: { "200": { description: "OK" } },
      },
    },
    "/auth/logout-all": {
      post: {
        tags: ["auth"],
        summary: "Logout all devices",
        operationId: "logoutAll",
        security: [{ bearerAuth: [] }],
        responses: { "200": { description: "OK" } },
      },
    },
    "/auth/forgot-password": {
      post: {
        tags: ["auth"],
        summary: "Request password reset",
        operationId: "forgotPassword",
        responses: { "200": { description: "OK" } },
      },
    },
    "/auth/reset-password": {
      post: {
        tags: ["auth"],
        summary: "Reset password",
        operationId: "resetPassword",
        responses: { "200": { description: "OK" } },
      },
    },
    "/auth/me": {
      get: {
        tags: ["auth"],
        summary: "Current user",
        operationId: "getCurrentUser",
        security: [{ bearerAuth: [] }],
        responses: { "200": { description: "OK" } },
      },
    },
    "/users/me": {
      get: {
        tags: ["users"],
        summary: "Full profile + plan",
        operationId: "usersMe",
        security: [{ bearerAuth: [] }],
        responses: { "200": { description: "OK" }, "401": { description: "Unauthorized" } },
      },
    },
    "/users/me/profile": {
      patch: {
        tags: ["users"],
        summary: "Update profile",
        operationId: "usersUpdateProfile",
        security: [{ bearerAuth: [] }],
        responses: { "200": { description: "OK" }, "401": { description: "Unauthorized" } },
      },
    },
    "/users/me/avatar": {
      post: {
        tags: ["users"],
        summary: "Upload avatar (multipart field avatar)",
        operationId: "usersUploadAvatar",
        security: [{ bearerAuth: [] }],
        responses: { "200": { description: "OK" }, "401": { description: "Unauthorized" } },
      },
    },
    "/users/me/sessions": {
      get: {
        tags: ["users"],
        summary: "Active sessions",
        operationId: "usersSessions",
        security: [{ bearerAuth: [] }],
        responses: { "200": { description: "OK" } },
      },
    },
  },
  components: {
    securitySchemes: {
      bearerAuth: { type: "http", scheme: "bearer", bearerFormat: "JWT" },
    },
  },
} as const;
