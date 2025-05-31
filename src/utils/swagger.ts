import swaggerJsdoc from 'swagger-jsdoc';
import { Express } from 'express';
import swaggerUi from 'swagger-ui-express';

const options: swaggerJsdoc.Options = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'DigiWallet API Documentation',
      version: '1.0.0',
      description: 'API documentation for the DigiWallet digital wallet system',
      contact: {
        name: 'API Support',
        email: 'support@digiwallet.com',
      },
    },
    servers: [
      {
        url: 'http://localhost:5000',
        description: 'Development server',
      },
    ],
    components: {
      securitySchemes: {
        bearerAuth: {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT',
        },
      },
      schemas: {
        User: {
          type: 'object',
          required: ['username', 'email', 'password'],
          properties: {
            id: {
              type: 'string',
              description: 'User ID',
            },
            username: {
              type: 'string',
              description: 'User username',
            },
            email: {
              type: 'string',
              description: 'User email',
            },
            balance: {
              type: 'object',
              additionalProperties: {
                type: 'number',
              },
              description: 'User balance by currency',
            },
            isAdmin: {
              type: 'boolean',
              description: 'Whether the user is an admin',
            },
            createdAt: {
              type: 'string',
              format: 'date-time',
              description: 'User creation date',
            },
          },
        },
        Transaction: {
          type: 'object',
          properties: {
            id: {
              type: 'string',
              description: 'Transaction ID',
            },
            userId: {
              type: 'string',
              description: 'User ID',
            },
            type: {
              type: 'string',
              enum: ['deposit', 'withdrawal', 'transfer'],
              description: 'Transaction type',
            },
            amount: {
              type: 'number',
              description: 'Transaction amount',
            },
            currency: {
              type: 'string',
              description: 'Transaction currency',
            },
            status: {
              type: 'string',
              enum: ['pending', 'completed', 'failed'],
              description: 'Transaction status',
            },
            recipientId: {
              type: 'string',
              description: 'Recipient user ID (for transfers)',
            },
            description: {
              type: 'string',
              description: 'Transaction description',
            },
            isFlagged: {
              type: 'boolean',
              description: 'Whether the transaction is flagged for fraud',
            },
            flagReason: {
              type: 'string',
              description: 'Reason for flagging the transaction',
            },
            createdAt: {
              type: 'string',
              format: 'date-time',
              description: 'Transaction creation date',
            },
          },
        },
        Error: {
          type: 'object',
          properties: {
            message: {
              type: 'string',
              description: 'Error message',
            },
          },
        },
      },
    },
    tags: [
      {
        name: 'Auth',
        description: 'Authentication endpoints',
      },
      {
        name: 'Wallet',
        description: 'Wallet operation endpoints',
      },
      {
        name: 'Admin',
        description: 'Admin endpoints',
      },
    ],
    paths: {
      '/api/auth/register': {
        post: {
          tags: ['Auth'],
          summary: 'Register a new user',
          requestBody: {
            required: true,
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  required: ['username', 'email', 'password'],
                  properties: {
                    username: {
                      type: 'string',
                    },
                    email: {
                      type: 'string',
                    },
                    password: {
                      type: 'string',
                    },
                  },
                },
              },
            },
          },
          responses: {
            201: {
              description: 'User registered successfully',
              content: {
                'application/json': {
                  schema: {
                    type: 'object',
                    properties: {
                      message: {
                        type: 'string',
                      },
                      token: {
                        type: 'string',
                      },
                      user: {
                        $ref: '#/components/schemas/User',
                      },
                    },
                  },
                },
              },
            },
            400: {
              description: 'Bad request',
              content: {
                'application/json': {
                  schema: {
                    $ref: '#/components/schemas/Error',
                  },
                },
              },
            },
          },
        },
      },
      '/api/auth/login': {
        post: {
          tags: ['Auth'],
          summary: 'Login a user',
          requestBody: {
            required: true,
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  required: ['email', 'password'],
                  properties: {
                    email: {
                      type: 'string',
                    },
                    password: {
                      type: 'string',
                    },
                  },
                },
              },
            },
          },
          responses: {
            200: {
              description: 'Login successful',
              content: {
                'application/json': {
                  schema: {
                    type: 'object',
                    properties: {
                      message: {
                        type: 'string',
                      },
                      token: {
                        type: 'string',
                      },
                      user: {
                        $ref: '#/components/schemas/User',
                      },
                    },
                  },
                },
              },
            },
            401: {
              description: 'Invalid credentials',
              content: {
                'application/json': {
                  schema: {
                    $ref: '#/components/schemas/Error',
                  },
                },
              },
            },
          },
        },
      },
      '/api/auth/profile': {
        get: {
          tags: ['Auth'],
          summary: 'Get user profile',
          security: [
            {
              bearerAuth: [],
            },
          ],
          responses: {
            200: {
              description: 'User profile',
              content: {
                'application/json': {
                  schema: {
                    type: 'object',
                    properties: {
                      user: {
                        $ref: '#/components/schemas/User',
                      },
                    },
                  },
                },
              },
            },
            401: {
              description: 'Unauthorized',
              content: {
                'application/json': {
                  schema: {
                    $ref: '#/components/schemas/Error',
                  },
                },
              },
            },
          },
        },
      },
      '/api/wallet/deposit': {
        post: {
          tags: ['Wallet'],
          summary: 'Deposit funds',
          security: [
            {
              bearerAuth: [],
            },
          ],
          requestBody: {
            required: true,
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  required: ['amount'],
                  properties: {
                    amount: {
                      type: 'number',
                    },
                    currency: {
                      type: 'string',
                      default: 'USD',
                    },
                  },
                },
              },
            },
          },
          responses: {
            200: {
              description: 'Deposit successful',
              content: {
                'application/json': {
                  schema: {
                    type: 'object',
                    properties: {
                      message: {
                        type: 'string',
                      },
                      transaction: {
                        $ref: '#/components/schemas/Transaction',
                      },
                      newBalance: {
                        type: 'number',
                      },
                    },
                  },
                },
              },
            },
            400: {
              description: 'Bad request',
              content: {
                'application/json': {
                  schema: {
                    $ref: '#/components/schemas/Error',
                  },
                },
              },
            },
            401: {
              description: 'Unauthorized',
              content: {
                'application/json': {
                  schema: {
                    $ref: '#/components/schemas/Error',
                  },
                },
              },
            },
          },
        },
      },
      '/api/wallet/withdraw': {
        post: {
          tags: ['Wallet'],
          summary: 'Withdraw funds',
          security: [
            {
              bearerAuth: [],
            },
          ],
          requestBody: {
            required: true,
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  required: ['amount'],
                  properties: {
                    amount: {
                      type: 'number',
                    },
                    currency: {
                      type: 'string',
                      default: 'USD',
                    },
                  },
                },
              },
            },
          },
          responses: {
            200: {
              description: 'Withdrawal successful',
              content: {
                'application/json': {
                  schema: {
                    type: 'object',
                    properties: {
                      message: {
                        type: 'string',
                      },
                      transaction: {
                        $ref: '#/components/schemas/Transaction',
                      },
                      newBalance: {
                        type: 'number',
                      },
                    },
                  },
                },
              },
            },
            400: {
              description: 'Bad request or insufficient balance',
              content: {
                'application/json': {
                  schema: {
                    $ref: '#/components/schemas/Error',
                  },
                },
              },
            },
            401: {
              description: 'Unauthorized',
              content: {
                'application/json': {
                  schema: {
                    $ref: '#/components/schemas/Error',
                  },
                },
              },
            },
          },
        },
      },
      '/api/wallet/transfer': {
        post: {
          tags: ['Wallet'],
          summary: 'Transfer funds to another user',
          security: [
            {
              bearerAuth: [],
            },
          ],
          requestBody: {
            required: true,
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  required: ['recipientId', 'amount'],
                  properties: {
                    recipientId: {
                      type: 'string',
                    },
                    amount: {
                      type: 'number',
                    },
                    currency: {
                      type: 'string',
                      default: 'USD',
                    },
                    description: {
                      type: 'string',
                    },
                  },
                },
              },
            },
          },
          responses: {
            200: {
              description: 'Transfer successful',
              content: {
                'application/json': {
                  schema: {
                    type: 'object',
                    properties: {
                      message: {
                        type: 'string',
                      },
                      transaction: {
                        $ref: '#/components/schemas/Transaction',
                      },
                      newBalance: {
                        type: 'number',
                      },
                    },
                  },
                },
              },
            },
            400: {
              description: 'Bad request or insufficient balance',
              content: {
                'application/json': {
                  schema: {
                    $ref: '#/components/schemas/Error',
                  },
                },
              },
            },
            401: {
              description: 'Unauthorized',
              content: {
                'application/json': {
                  schema: {
                    $ref: '#/components/schemas/Error',
                  },
                },
              },
            },
            404: {
              description: 'Recipient not found',
              content: {
                'application/json': {
                  schema: {
                    $ref: '#/components/schemas/Error',
                  },
                },
              },
            },
          },
        },
      },
      '/api/wallet/transactions': {
        get: {
          tags: ['Wallet'],
          summary: 'Get transaction history',
          security: [
            {
              bearerAuth: [],
            },
          ],
          parameters: [
            {
              in: 'query',
              name: 'page',
              schema: {
                type: 'integer',
                default: 1,
              },
              description: 'Page number',
            },
            {
              in: 'query',
              name: 'limit',
              schema: {
                type: 'integer',
                default: 10,
              },
              description: 'Items per page',
            },
            {
              in: 'query',
              name: 'type',
              schema: {
                type: 'string',
                enum: ['deposit', 'withdrawal', 'transfer'],
              },
              description: 'Transaction type filter',
            },
          ],
          responses: {
            200: {
              description: 'Transaction history',
              content: {
                'application/json': {
                  schema: {
                    type: 'object',
                    properties: {
                      transactions: {
                        type: 'array',
                        items: {
                          $ref: '#/components/schemas/Transaction',
                        },
                      },
                      pagination: {
                        type: 'object',
                        properties: {
                          total: {
                            type: 'integer',
                          },
                          page: {
                            type: 'integer',
                          },
                          limit: {
                            type: 'integer',
                          },
                          totalPages: {
                            type: 'integer',
                          },
                        },
                      },
                    },
                  },
                },
              },
            },
            401: {
              description: 'Unauthorized',
              content: {
                'application/json': {
                  schema: {
                    $ref: '#/components/schemas/Error',
                  },
                },
              },
            },
          },
        },
      },
      '/api/wallet/balance': {
        get: {
          tags: ['Wallet'],
          summary: 'Get user balance',
          security: [
            {
              bearerAuth: [],
            },
          ],
          parameters: [
            {
              in: 'query',
              name: 'currency',
              schema: {
                type: 'string',
              },
              description: 'Currency code',
            },
          ],
          responses: {
            200: {
              description: 'User balance',
              content: {
                'application/json': {
                  schema: {
                    type: 'object',
                    properties: {
                      balance: {
                        type: 'object',
                        additionalProperties: {
                          type: 'number',
                        },
                      },
                    },
                  },
                },
              },
            },
            401: {
              description: 'Unauthorized',
              content: {
                'application/json': {
                  schema: {
                    $ref: '#/components/schemas/Error',
                  },
                },
              },
            },
          },
        },
      },
      '/api/admin/users': {
        get: {
          tags: ['Admin'],
          summary: 'Get all users',
          security: [
            {
              bearerAuth: [],
            },
          ],
          parameters: [
            {
              in: 'query',
              name: 'page',
              schema: {
                type: 'integer',
                default: 1,
              },
              description: 'Page number',
            },
            {
              in: 'query',
              name: 'limit',
              schema: {
                type: 'integer',
                default: 10,
              },
              description: 'Items per page',
            },
          ],
          responses: {
            200: {
              description: 'List of users',
              content: {
                'application/json': {
                  schema: {
                    type: 'object',
                    properties: {
                      users: {
                        type: 'array',
                        items: {
                          $ref: '#/components/schemas/User',
                        },
                      },
                      pagination: {
                        type: 'object',
                        properties: {
                          total: {
                            type: 'integer',
                          },
                          page: {
                            type: 'integer',
                          },
                          limit: {
                            type: 'integer',
                          },
                          totalPages: {
                            type: 'integer',
                          },
                        },
                      },
                    },
                  },
                },
              },
            },
            401: {
              description: 'Unauthorized',
              content: {
                'application/json': {
                  schema: {
                    $ref: '#/components/schemas/Error',
                  },
                },
              },
            },
            403: {
              description: 'Forbidden - Admin access required',
              content: {
                'application/json': {
                  schema: {
                    $ref: '#/components/schemas/Error',
                  },
                },
              },
            },
          },
        },
      },
    },
  },
  apis: ['./src/routes/*.ts'],
};

const specs = swaggerJsdoc(options);

export const setupSwagger = (app: Express) => {
  app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(specs));
  app.get('/api-docs.json', (req, res) => {
    res.setHeader('Content-Type', 'application/json');
    res.send(specs);
  });
};
