const asyncHandler = require("express-async-handler");
const { login, logout, getNewAccessAndCsrfToken, processAccountEmailVerify, processPasswordSetup, processResendEmailVerification, processResendPwdSetupLink, processPwdReset } = require("./auth-service");
const { setAccessTokenCookie, setCsrfTokenCookie, setAllCookies, clearAllCookies } = require("../../cookie");

/**
 * @swagger
 * /api/v1/auth/login:
 *   post:
 *     summary: User login
 *     description: Authenticate user with username and password, returns access token and sets cookies
 *     tags: [Authentication]
 *     security: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - username
 *               - password
 *             properties:
 *               username:
 *                 type: string
 *                 description: User email or username
 *                 example: admin@school.com
 *               password:
 *                 type: string
 *                 format: password
 *                 minLength: 6
 *                 description: User password
 *                 example: SecurePass123!
 *     responses:
 *       200:
 *         description: Login successful
 *         headers:
 *           Set-Cookie:
 *             schema:
 *               type: string
 *               example: accessToken=eyJhbGci...; Path=/; HttpOnly
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 message:
 *                   type: string
 *                   example: Login successful
 *                 data:
 *                   type: object
 *                   properties:
 *                     accessToken:
 *                       type: string
 *                       example: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
 *                     user:
 *                       type: object
 *                       properties:
 *                         id:
 *                           type: integer
 *                           example: 1
 *                         email:
 *                           type: string
 *                           example: admin@school.com
 *                         name:
 *                           type: string
 *                           example: Admin User
 *                         role:
 *                           type: string
 *                           example: admin
 *       400:
 *         $ref: '#/components/responses/ValidationError'
 *       401:
 *         description: Invalid credentials
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *             example:
 *               success: false
 *               error:
 *                 code: UNAUTHORIZED
 *                 message: Invalid username or password
 *       500:
 *         $ref: '#/components/responses/ServerError'
 */
const handleLogin = asyncHandler(async (req, res) => {
    const { username, password } = req.body;
    const { accessToken, refreshToken, csrfToken, accountBasic } = await login(username, password);

    clearAllCookies(res);
    setAllCookies(res, accessToken, refreshToken, csrfToken);

    res.json({
        success: true,
        data: {
            accessToken,
            user: accountBasic
        }
    });
});

/**
 * @swagger
 * /api/v1/auth/logout:
 *   post:
 *     summary: User logout
 *     description: Logout user and invalidate refresh token, clears all cookies
 *     tags: [Authentication]
 *     security:
 *       - bearerAuth: []
 *       - cookieAuth: []
 *     responses:
 *       204:
 *         description: Logout successful
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 *       500:
 *         $ref: '#/components/responses/ServerError'
 */
const handleLogout = asyncHandler(async (req, res) => {
    const { refreshToken } = req.cookies;

    const message = await logout(refreshToken);
    clearAllCookies(res);

    res.status(200).json({
        success: true
    });
});

/**
 * @swagger
 * /api/v1/auth/refresh:
 *   get:
 *     summary: Refresh access token
 *     description: Get a new access token using the refresh token from cookies
 *     tags: [Authentication]
 *     security: []
 *     responses:
 *       200:
 *         description: Token refreshed successfully
 *         headers:
 *           Set-Cookie:
 *             schema:
 *               type: string
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 message:
 *                   type: string
 *                   example: Token refreshed successfully
 *                 data:
 *                   type: object
 *                   properties:
 *                     accessToken:
 *                       type: string
 *                       example: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
 *       401:
 *         description: Invalid or expired refresh token
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       500:
 *         $ref: '#/components/responses/ServerError'
 */
const handleTokenRefresh = asyncHandler(async (req, res) => {
    const { refreshToken } = req.cookies;

    const { accessToken, csrfToken, message } = await getNewAccessAndCsrfToken(refreshToken);
    res.clearCookie("accessToken");
    res.clearCookie("csrfToken");

    setAccessTokenCookie(res, accessToken);
    setCsrfTokenCookie(res, csrfToken);

    res.json({
        success: true,
        data: {
            accessToken
        }
    });
});

const handleAccountEmailVerify = asyncHandler(async (req, res) => {
    const { id } = req.user;
    const message = await processAccountEmailVerify(id);
    res.json(message);
});

const handleAccountPasswordSetup = asyncHandler(async (req, res) => {
    const { id: userId } = req.user;
    const { username: userEmail, password } = req.body;
    const message = await processPasswordSetup({ userId, userEmail, password });
    res.json(message);
});

const handleResendEmailVerification = asyncHandler(async (req, res) => {
    const { userId } = req.body;
    const message = await processResendEmailVerification(userId);
    res.json(message);
});

const handleResendPwdSetupLink = asyncHandler(async (req, res) => {
    const { userId } = req.body;
    const message = await processResendPwdSetupLink(userId);
    res.json(message);
});

const handlePwdReset = asyncHandler(async (req, res) => {
    const { userId } = req.body;
    const message = await processPwdReset(userId);
    res.json(message);
});

module.exports = {
    handleLogin,
    handleLogout,
    handleTokenRefresh,
    handleAccountEmailVerify,
    handleAccountPasswordSetup,
    handleResendEmailVerification,
    handleResendPwdSetupLink,
    handlePwdReset
};
