const { ApiError } = require("../utils");
const { AppError } = require("../utils/app-errors");
const logger = require("../config/logger");

const handleGlobalError = (err, req, res, next) => {
    // Log the error
    logger.error(`${err.name}: ${err.message}`, {
        url: req.originalUrl,
        method: req.method,
        ip: req.ip,
        stack: process.env.NODE_ENV === 'development' ? err.stack : undefined,
    });

    // Handle custom AppError
    if (err instanceof AppError) {
        return res.status(err.statusCode).json({
            success: false,
            error: {
                code: err.code,
                message: err.message,
                details: err.details,
                ...(process.env.NODE_ENV === 'development' && { stack: err.stack }),
            },
        });
    }

    // Handle legacy ApiError
    if (err instanceof ApiError) {
        return res.status(err.statusCode).json({
            success: false,
            error: {
                message: err.message,
            },
        });
    }

    // Handle validation errors
    if (err.name === 'ValidationError') {
        return res.status(422).json({
            success: false,
            error: {
                code: 'VALIDATION_ERROR',
                message: err.message,
                details: err.details,
            },
        });
    }

    // Handle JWT errors
    if (err.name === 'JsonWebTokenError') {
        return res.status(401).json({
            success: false,
            error: {
                code: 'INVALID_TOKEN',
                message: 'Invalid token',
            },
        });
    }

    if (err.name === 'TokenExpiredError') {
        return res.status(401).json({
            success: false,
            error: {
                code: 'TOKEN_EXPIRED',
                message: 'Token expired',
            },
        });
    }

    // Default error response
    return res.status(500).json({
        success: false,
        error: {
            code: 'INTERNAL_ERROR',
            message: process.env.NODE_ENV === 'development' 
                ? err.message 
                : 'Internal server error',
            ...(process.env.NODE_ENV === 'development' && { stack: err.stack }),
        },
    });
}

module.exports = { handleGlobalError };
