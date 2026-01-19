const jwt = require("jsonwebtoken");
const { ApiError } = require("../utils");
const { env } = require("../config");

const authenticateToken = (req, res, next) => {
  try {
    const accessToken = req.cookies.accessToken;
    const refreshToken = req.cookies.refreshToken;

    if (!accessToken || !refreshToken) {
      return next(new ApiError(401, "Unauthorized. Please provide valid tokens."));
    }

    try {
      const user = jwt.verify(accessToken, env.JWT_ACCESS_TOKEN_SECRET);
      const refreshTokenData = jwt.verify(refreshToken, env.JWT_REFRESH_TOKEN_SECRET);
      
      req.user = user;
      req.refreshToken = refreshTokenData;
      next();
    } catch (err) {
      return next(new ApiError(401, "Unauthorized. Please provide valid access token."));
    }
  } catch (error) {
    next(error);
  }
};

module.exports = { authenticateToken };
