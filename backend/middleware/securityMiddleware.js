const rateLimit = require("express-rate-limit");

function toPositiveInt(value, fallback) {
  const parsed = Number(value);
  if (!Number.isFinite(parsed) || parsed <= 0) {
    return fallback;
  }

  return Math.floor(parsed);
}

const windowMinutes = toPositiveInt(process.env.RATE_LIMIT_WINDOW_MINUTES, 15);
const commonLimiterOptions = {
  windowMs: windowMinutes * 60 * 1000,
  standardHeaders: true,
  legacyHeaders: false,
};

const globalLimiter = rateLimit({
  ...commonLimiterOptions,
  max: toPositiveInt(process.env.RATE_LIMIT_MAX_REQUESTS, 300),
  message: { message: "Too many requests. Please try again shortly." },
});

const authLimiter = rateLimit({
  ...commonLimiterOptions,
  max: toPositiveInt(process.env.AUTH_RATE_LIMIT_MAX_REQUESTS, 20),
  message: { message: "Too many login attempts. Please wait and try again." },
});

module.exports = {
  globalLimiter,
  authLimiter,
};
