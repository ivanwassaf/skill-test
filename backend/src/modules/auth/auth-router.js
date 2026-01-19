const express = require("express");
const router = express.Router();
const { authenticateToken, csrfProtection, handleEmailVerificationToken, handlePasswordSetupToken, checkApiAccess } = require("../../middlewares");
const { strictRateLimiter } = require("../../middlewares/user-rate-limiter");
const authController = require("./auth-controller");
const { validateRequest } = require("../../utils");
const { LoginSchema } = require("./auth-schema");

// Apply strict rate limiting to sensitive auth endpoints
router.post("/login", strictRateLimiter, validateRequest(LoginSchema), authController.handleLogin);
router.get("/refresh", authController.handleTokenRefresh);
router.post("/logout", authenticateToken, csrfProtection, authController.handleLogout);
router.get("/verify-email/:token", handleEmailVerificationToken, authController.handleAccountEmailVerify);
router.post("/setup-password", strictRateLimiter, handlePasswordSetupToken, authController.handleAccountPasswordSetup);
router.post("/resend-email-verification", authenticateToken, csrfProtection, checkApiAccess, authController.handleResendEmailVerification);
router.post("/resend-pwd-setup-link", authenticateToken, csrfProtection, checkApiAccess, authController.handleResendPwdSetupLink);
router.post("/reset-pwd", strictRateLimiter, authenticateToken, csrfProtection, checkApiAccess, authController.handlePwdReset);

module.exports = { authRoutes: router };
