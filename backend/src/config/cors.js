const cors = require("cors");
const { env } = require("./env");

const corsPolicy = cors({
  origin: env.UI_URL,
  methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Accept", "Origin", "X-CSRF-TOKEN"],
  exposedHeaders: ["Content-Type", "Content-Length"],
  credentials: true,
  maxAge: 86400, // 24 hours
});

module.exports = { corsPolicy };
