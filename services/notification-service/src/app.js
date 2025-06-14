const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const compression = require('compression');
const client = require('prom-client');
const { swaggerUi, specs } = require('./swagger');

const RabbitMQConnection = require('./models/RabbitMQConnection');
const NotificationHandler = require('./handlers/NotificationHandler');

const app = express();
const PORT = process.env.PORT || 3003;

// Prometheus metrics
const collectDefaultMetrics = client.collectDefaultMetrics;
collectDefaultMetrics();

const httpRequestDuration = new client.Histogram({
  name: 'http_request_duration_seconds',
  help: 'Duration of HTTP requests in seconds',
  labelNames: ['method', 'route', 'status_code'],
  buckets: [0.1, 0.5, 1, 2, 5]
});

const httpRequestsTotal = new client.Counter({
  name: 'http_requests_total',
  help: 'Total number of HTTP requests',
  labelNames: ['method', 'route', 'status_code']
});

const notificationsProcessed = new client.Counter({
  name: 'notifications_processed_total',
  help: 'Total number of notifications processed',
  labelNames: ['event_type']
});

// Export metrics for other modules
app.locals.metrics = {
  notificationsProcessed
};

// Middleware
app.use(helmet());
app.use(compression());
app.use(cors());
app.use(express.json());

// Metrics middleware
app.use((req, res, next) => {
  const start = Date.now();
  
  res.on('finish', () => {
    const duration = (Date.now() - start) / 1000;
    const route = req.route ? req.route.path : req.path;
    
    httpRequestDuration
      .labels(req.method, route, res.statusCode)
      .observe(duration);
    
    httpRequestsTotal
      .labels(req.method, route, res.statusCode)
      .inc();
  });
  
  next();
});

// Swagger documentation
app.get('/api-docs.json', (req, res) => {
  res.setHeader('Content-Type', 'application/json');
  res.send(specs);
});

app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(specs));

/**
 * @swagger
 * /health:
 *   get:
 *     summary: Health check endpoint
 *     description: Returns the health status of the notification service
 *     tags: [Health & Monitoring]
 *     responses:
 *       200:
 *         description: Service is healthy
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: string
 *                   example: "healthy"
 *                 service:
 *                   type: string
 *                   example: "notification-service"
 */
// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'healthy', service: 'notification-service' });
});

/**
 * @swagger
 * /metrics:
 *   get:
 *     summary: Prometheus metrics
 *     description: Returns Prometheus metrics for monitoring
 *     tags: [Health & Monitoring]
 *     responses:
 *       200:
 *         description: Prometheus metrics in text format
 *         content:
 *           text/plain:
 *             schema:
 *               type: string
 */
// Metrics endpoint
app.get('/metrics', async (req, res) => {
  res.set('Content-Type', client.register.contentType);
  const metrics = await client.register.metrics();
  res.end(metrics);
});

/**
 * @swagger
 * /api/notifications/stats:
 *   get:
 *     summary: Get notification statistics
 *     description: Returns statistics about processed notifications and events
 *     tags: [Notification Service]
 *     responses:
 *       200:
 *         description: Notification processing statistics
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   description: Information about where to find detailed metrics
 *                 processed:
 *                   type: integer
 *                   description: Number of notifications processed
 *             example:
 *               message: "Notification statistics available at /metrics endpoint"
 *               processed: 42
 */
// Get notification stats
app.get('/api/notifications/stats', (req, res) => {
  res.json({
    message: 'Notification statistics available at /metrics endpoint',
    processed: NotificationHandler.getProcessedCount()
  });
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ error: 'Something went wrong!' });
});

// Initialize connections and start server
async function startServer() {
  try {
    await RabbitMQConnection.connect();
    await NotificationHandler.startListening(app.locals.metrics);
    
    app.listen(PORT, () => {
      console.log(`Notification Service running on port ${PORT}`);
    });
  } catch (error) {
    console.error('Failed to start server:', error);
    process.exit(1);
  }
}

startServer();

module.exports = app;
