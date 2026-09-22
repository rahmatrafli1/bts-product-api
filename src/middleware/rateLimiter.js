import rateLimit, { ipKeyGenerator } from "express-rate-limit";

const createKeyGenerator = (req) =>
  `${ipKeyGenerator(req.ip)}-${req.originalUrl}`;

// POST/PUT/DELETE products: maksimal 1 request per 5 detik per IP dan endpoint
export const productMutationLimiter = rateLimit({
  windowMs: 5 * 1000,
  max: 1,
  message: {
    error: "Too Many Requests",
    message: "This endpoint can only be hit once every 5 seconds",
  },
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator: createKeyGenerator,
});

// Register/login: maksimal 3 request per 60 detik per IP dan endpoint
export const authLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 3,
  message: {
    error: "Too Many Requests",
    message: "Maximum 3 requests per 60 seconds allowed",
  },
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator: createKeyGenerator,
});
