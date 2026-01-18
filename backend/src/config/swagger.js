const swaggerJsdoc = require('swagger-jsdoc');

const options = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'School Management System API',
      version: '1.0.0',
      description: 'A comprehensive API for managing school operations including students, staff, classes, notices, leave management, and blockchain-based certificates.',
      contact: {
        name: 'API Support',
        email: 'support@schoolmanagement.com',
      },
      license: {
        name: 'MIT',
        url: 'https://opensource.org/licenses/MIT',
      },
    },
    servers: [
      {
        url: process.env.API_URL || 'http://localhost:5007',
        description: 'Development server',
      },
      {
        url: 'https://api.schoolmanagement.com',
        description: 'Production server',
      },
    ],
    components: {
      securitySchemes: {
        bearerAuth: {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT',
          description: 'JWT Authorization header using the Bearer scheme',
        },
        cookieAuth: {
          type: 'apiKey',
          in: 'cookie',
          name: 'accessToken',
          description: 'Access token stored in cookie',
        },
      },
      schemas: {
        Error: {
          type: 'object',
          properties: {
            success: {
              type: 'boolean',
              example: false,
            },
            error: {
              type: 'object',
              properties: {
                code: {
                  type: 'string',
                  example: 'VALIDATION_ERROR',
                },
                message: {
                  type: 'string',
                  example: 'Validation failed',
                },
                details: {
                  type: 'object',
                  nullable: true,
                },
              },
            },
          },
        },
        SuccessResponse: {
          type: 'object',
          properties: {
            success: {
              type: 'boolean',
              example: true,
            },
            message: {
              type: 'string',
            },
            data: {
              type: 'object',
            },
          },
        },
        Student: {
          type: 'object',
          properties: {
            id: {
              type: 'integer',
              example: 1,
            },
            name: {
              type: 'string',
              example: 'John Doe',
            },
            email: {
              type: 'string',
              format: 'email',
              example: 'john.doe@school.com',
            },
            class_id: {
              type: 'integer',
              example: 5,
            },
            section_id: {
              type: 'integer',
              example: 2,
            },
            wallet_address: {
              type: 'string',
              nullable: true,
              example: '0x1234567890abcdef...',
            },
          },
        },
        Certificate: {
          type: 'object',
          properties: {
            id: {
              type: 'integer',
              example: 1,
            },
            studentName: {
              type: 'string',
              example: 'John Doe',
            },
            certificateType: {
              type: 'string',
              example: 'Academic Excellence',
            },
            ipfsHash: {
              type: 'string',
              example: 'QmX7...abc123',
            },
            issuedDate: {
              type: 'string',
              format: 'date-time',
            },
            issuer: {
              type: 'string',
              example: '0xabc...def',
            },
            revoked: {
              type: 'boolean',
              example: false,
            },
          },
        },
      },
      responses: {
        UnauthorizedError: {
          description: 'Access token is missing or invalid',
          content: {
            'application/json': {
              schema: {
                $ref: '#/components/schemas/Error',
              },
              example: {
                success: false,
                error: {
                  code: 'UNAUTHORIZED',
                  message: 'Unauthorized access',
                },
              },
            },
          },
        },
        NotFoundError: {
          description: 'Resource not found',
          content: {
            'application/json': {
              schema: {
                $ref: '#/components/schemas/Error',
              },
              example: {
                success: false,
                error: {
                  code: 'NOT_FOUND',
                  message: 'Resource not found',
                },
              },
            },
          },
        },
        ValidationError: {
          description: 'Validation error',
          content: {
            'application/json': {
              schema: {
                $ref: '#/components/schemas/Error',
              },
              example: {
                success: false,
                error: {
                  code: 'VALIDATION_ERROR',
                  message: 'Validation failed',
                  details: {
                    field: 'email',
                    message: 'Invalid email format',
                  },
                },
              },
            },
          },
        },
        ServerError: {
          description: 'Internal server error',
          content: {
            'application/json': {
              schema: {
                $ref: '#/components/schemas/Error',
              },
              example: {
                success: false,
                error: {
                  code: 'INTERNAL_ERROR',
                  message: 'Internal server error',
                },
              },
            },
          },
        },
      },
    },
    security: [
      {
        bearerAuth: [],
      },
      {
        cookieAuth: [],
      },
    ],
  },
  apis: [
    './src/routes/**/*.js',
    './src/modules/**/*-controller.js',
    './src/config/swagger-docs.js',
  ],
};

const specs = swaggerJsdoc(options);

module.exports = specs;
