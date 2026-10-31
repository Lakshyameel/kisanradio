import { rateLimit } from "express-rate-limit";

/**
 * Strict rate limiter for authentication routes:
 * 30 requests per 15 minutes per IP to prevent brute-force attacks.
 */
export const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: process.env.NODE_ENV === "test" ? 2000 : 30,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    error: "Too many authentication attempts from this IP. Please try again after 15 minutes.",
  },
});

/**
 * General rate limiter for all other API endpoints:
 * 1000 requests per 15 minutes per IP to prevent scraping and abuse.
 * Skips static assets, audio files, and health endpoints.
 */
export const generalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: process.env.NODE_ENV === "test" ? 5000 : 1000,
  standardHeaders: true,
  legacyHeaders: false,
  skip: (req) => {
    return (
      req.path.startsWith("/audio") ||
      req.path.startsWith("/assets") ||
      req.path === "/api/v1/health" ||
      req.path === "/api/v1/health/db"
    );
  },
  message: {
    error: "Too many requests. Please slow down and try again shortly.",
  },
});

/**
 * Dedicated rate limiter for search endpoints:
 * 120 searches per minute per IP to support responsive live typing without 429s.
 */
export const searchLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: process.env.NODE_ENV === "test" ? 2000 : 120,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    error: "Too many searches, please wait a moment.",
  },
});
