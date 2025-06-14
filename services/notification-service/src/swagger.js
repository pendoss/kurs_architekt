const swaggerJsdoc = require('swagger-jsdoc');
const swaggerUi = require('swagger-ui-express');

const options = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'Notification Service API',
      version: '1.0.0',
      description: 'Event processing and notification microservice for CQRS architecture',
      contact: {
        name: 'API Support',
        email: 'support@taskmanager.com'
      }
    },
    servers: [
      {
        url: 'http://localhost:3003',
        description: 'Development server'
      }
    ],
    components: {
      schemas: {
        Event: {
          type: 'object',
          required: ['id', 'type', 'aggregateId', 'data', 'timestamp'],
          properties: {
            id: {
              type: 'string',
              format: 'uuid',
              description: 'Unique identifier for the event',
              example: '550e8400-e29b-41d4-a716-446655440000'
            },
            type: {
              type: 'string',
              description: 'Type of the event',
              enum: ['TaskCreated', 'TaskUpdated', 'TaskDeleted'],
              example: 'TaskCreated'
            },
            aggregateId: {
              type: 'string',
              format: 'uuid',
              description: 'ID of the aggregate that generated this event',
              example: '550e8400-e29b-41d4-a716-446655440001'
            },
            data: {
              type: 'object',
              description: 'Event payload data',
              additionalProperties: true,
              example: {
                name: 'Complete project documentation',
                description: 'Write comprehensive documentation for the project',
                status: 'pending'
              }
            },
            timestamp: {
              type: 'string',
              format: 'date-time',
              description: 'When the event occurred',
              example: '2024-01-01T10:00:00Z'
            },
            version: {
              type: 'integer',
              description: 'Event schema version',
              example: 1
            }
          }
        },
        NotificationStats: {
          type: 'object',
          properties: {
            totalProcessed: {
              type: 'integer',
              description: 'Total number of events processed',
              example: 150
            },
            processingRate: {
              type: 'number',
              description: 'Events processed per minute',
              example: 12.5
            },
            lastProcessedAt: {
              type: 'string',
              format: 'date-time',
              description: 'Timestamp of last processed event',
              example: '2024-01-01T10:30:00Z'
            },
            queueLength: {
              type: 'integer',
              description: 'Current queue length',
              example: 5
            }
          }
        }
      }
    },
    tags: [
      {
        name: 'Notification Service',
        description: 'Event processing and notification operations'
      },
      {
        name: 'Health & Monitoring',
        description: 'Service health and monitoring endpoints'
      }
    ]
  },
  apis: ['./src/routes/*.js', './src/app.js']
};

const specs = swaggerJsdoc(options);

module.exports = {
  swaggerUi,
  specs
};
