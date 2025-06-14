const swaggerJsdoc = require('swagger-jsdoc');
const swaggerUi = require('swagger-ui-express');

const options = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'Task Service API',
      version: '1.0.0',
      description: 'CQRS Task Service with Event Sourcing',
    },
    servers: [
      {
        url: 'http://localhost:3001',
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
        CreateTaskRequest: {
          type: 'object',
          required: ['name'],
          properties: {
            name: {
              type: 'string',
              description: 'Task name'
            },
            description: {
              type: 'string',
              description: 'Task description'
            }
          }
        },
        UpdateTaskRequest: {
          type: 'object',
          properties: {
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
            }
          }
        },
        Event: {
          type: 'object',
          properties: {
            id: {
              type: 'integer',
              description: 'Event ID'
            },
            aggregate_id: {
              type: 'string',
              format: 'uuid',
              description: 'Task ID'
            },
            event_type: {
              type: 'string',
              description: 'Event type'
            },
            event_data: {
              type: 'object',
              description: 'Event data'
            },
            event_version: {
              type: 'integer',
              description: 'Event version'
            },
            occurred_at: {
              type: 'string',
              format: 'date-time',
              description: 'Event timestamp'
            }
          }
        }
      }
    }
  },
  apis: ['./src/routes/*.js'], // paths to files containing OpenAPI definitions
};

const specs = swaggerJsdoc(options);

module.exports = {
  swaggerUi,
  specs
};
