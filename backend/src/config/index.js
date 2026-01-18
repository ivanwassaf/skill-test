const { corsPolicy } = require("./cors");
const { db } = require("./db");
const { env } = require("./env");
const logger = require("./logger");
const { validateEnv, getConfig } = require("./env-validator");
const redis = require("./redis");
const dbPool = require("./db-pool");

module.exports = {
  cors: corsPolicy,
  db,
  env,
  logger,
  validateEnv,
  getConfig,
  redis,
  dbPool,
};
