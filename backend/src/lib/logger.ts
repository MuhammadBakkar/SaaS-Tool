const isProd = process.env.NODE_ENV === "production";

export const logger = {
  log(...args: unknown[]) {
    if (!isProd) console.log(...args);
  },
  warn(...args: unknown[]) {
    console.warn(...args);
  },
  error(...args: unknown[]) {
    console.error(...args);
  },
};
