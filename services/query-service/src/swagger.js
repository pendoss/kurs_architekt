const swaggerJsdoc = require('swagger-jsdoc');
const swaggerUi = require('swagger-ui-express');

const options = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'Query Service API',
      version: '1.0.0',
      description: 'CQRS Query Service with Redis Caching',
    },
    servers: [
      {
        url: 'http://localhost:3002',
        description: 'Development server',
      },
    ],
    components: {
      schemas: {
        Task: {
          type: 'object',
          properties: {
            id: {
              type: 'string',
              format: 'uuid',
              description: 'Unique identifier for the task'
            },
            name: {
              type: 'string',
              description: 'Task name'
            },
            description: {
              type: 'string',
              description: 'Task description'
            },
            status: {
              type: 'string',
              enum: ['pending', 'in-progress', 'completed'],
              description: 'Task status'
            },
            created_at: {
              type: 'string',
              format: 'date-time',
              description: 'Creation timestamp'
            },
            updated_at: {
              type: 'string',
              format: 'date-time',
              description: 'Last update timestamp'
            }
          }
        },
        TasksResponse: {
          type: 'object',
          properties: {
            data: {
              type: 'array',
              items: {
                $ref: '#/components/schemas/Task'
              },
              description: 'Array of tasks'
            },
            cached: {
              type: 'boolean',
              description: 'Whether the data was served from cache'
            }
          }
        },
        CacheStats: {
          type: 'object',
          properties: {
            message: {
              type: 'string',
              description: 'Cache statistics message'
            },
            endpoints: {
              type: 'object',
              properties: {
                metrics: {
                  type: 'string',
                  description: 'Metrics endpoint'
                },
                health: {
                  type: 'string',
                  description: 'Health endpoint'
                }
              }
            }
          }
        }
      }
    }
  },
  apis: ['./src/routes/*.js'],
};

const specs = swaggerJsdoc(options);

module.exports = {
  swaggerUi,
  specs
};
