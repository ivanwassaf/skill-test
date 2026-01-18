const { corsPolicy } = require("./cors");
const { db } = require("./db");
const { env } = require("./env");
const logger = require("./logger");
const { validateEnv, getConfig } = require("./env-validator");

module.exports = {
  cors: corsPolicy,
  db,
  env,
  logger,
  validateEnv,
  getConfig,
};
