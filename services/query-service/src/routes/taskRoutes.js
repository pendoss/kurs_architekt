const express = require('express');
const router = express.Router();
const DatabaseConnection = require('../models/DatabaseConnection');
const RedisConnection = require('../models/RedisConnection');

/**
 * @swagger
 * /api/tasks:
 *   get:
 *     summary: Get all tasks
 *     description: Retrieves all tasks from the database with caching support
 *     tags: [Query Service]
 *     responses:
 *       200:
 *         description: List of all tasks
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 data:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/Task'
 *                 cached:
 *                   type: boolean
 *                   description: Whether the result was served from cache
 *             example:
 *               data:
 *                 - id: "550e8400-e29b-41d4-a716-446655440000"
 *                   name: "Complete project documentation"
 *                   description: "Write comprehensive documentation for the project"
 *                   status: "pending"
 *                   created_at: "2024-01-01T10:00:00Z"
 *                   updated_at: "2024-01-01T10:00:00Z"
 *               cached: false
 *       500:
 *         description: Server error
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 error:
 *                   type: string
 *             example:
 *               error: "Failed to fetch tasks"
 */
// Get all tasks with caching
router.get('/', async (req, res) => {
  try {
    const cacheKey = 'tasks:all';
    
    // Try to get from cache first
    let tasks = await RedisConnection.get(cacheKey);
    
    if (tasks) {
      // Cache hit
      if (req.app.locals.metrics) {
        req.app.locals.metrics.cacheHitsTotal.inc();
      }
      return res.json({ data: tasks, cached: true });
    }
    
    // Cache miss - get from database
    if (req.app.locals.metrics) {
      req.app.locals.metrics.cacheMissesTotal.inc();
    }
    
    const result = await DatabaseConnection.query(
      'SELECT * FROM tasks ORDER BY created_at DESC'
    );
    
    tasks = result.rows;
    
    // Store in cache
    await RedisConnection.set(cacheKey, tasks, 300); // 5 minutes TTL
    
    res.json({ data: tasks, cached: false });
  } catch (error) {
    console.error('Error fetching tasks:', error);
    res.status(500).json({ error: 'Failed to fetch tasks' });
  }
});

/**
 * @swagger
 * /api/tasks/{id}:
 *   get:
 *     summary: Get task by ID
 *     description: Retrieves a specific task by its ID with caching support
 *     tags: [Query Service]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         description: UUID of the task to retrieve
 *         schema:
 *           type: string
 *           format: uuid
 *         example: "550e8400-e29b-41d4-a716-446655440000"
 *     responses:
 *       200:
 *         description: Task details
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 data:
 *                   $ref: '#/components/schemas/Task'
 *                 cached:
 *                   type: boolean
 *                   description: Whether the result was served from cache
 *             example:
 *               data:
 *                 id: "550e8400-e29b-41d4-a716-446655440000"
 *                 name: "Complete project documentation"
 *                 description: "Write comprehensive documentation for the project"
 *                 status: "pending"
 *                 created_at: "2024-01-01T10:00:00Z"
 *                 updated_at: "2024-01-01T10:00:00Z"
 *               cached: true
 *       404:
 *         description: Task not found
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 error:
 *                   type: string
 *             example:
 *               error: "Task not found"
 *       500:
 *         description: Server error
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 error:
 *                   type: string
 *             example:
 *               error: "Failed to fetch task"
 */
// Get task by ID with caching
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const cacheKey = `task:${id}`;
    
    // Try to get from cache first
    let task = await RedisConnection.get(cacheKey);
    
    if (task) {
      // Cache hit
      if (req.app.locals.metrics) {
        req.app.locals.metrics.cacheHitsTotal.inc();
      }
      return res.json({ data: task, cached: true });
    }
    
    // Cache miss - get from database
    if (req.app.locals.metrics) {
      req.app.locals.metrics.cacheMissesTotal.inc();
    }
    
    const result = await DatabaseConnection.query(
      'SELECT * FROM tasks WHERE id = $1',
      [id]
    );
    
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Task not found' });
    }
    
    task = result.rows[0];
    
    // Store in cache
    await RedisConnection.set(cacheKey, task, 300); // 5 minutes TTL
    
    res.json({ data: task, cached: false });
  } catch (error) {
    console.error('Error fetching task:', error);
    res.status(500).json({ error: 'Failed to fetch task' });
  }
});

/**
 * @swagger
 * /api/tasks/search/{name}:
 *   get:
 *     summary: Search tasks by name
 *     description: Searches for tasks containing the specified name with caching support
 *     tags: [Query Service]
 *     parameters:
 *       - in: path
 *         name: name
 *         required: true
 *         description: Name or partial name to search for
 *         schema:
 *           type: string
 *         example: "documentation"
 *     responses:
 *       200:
 *         description: List of matching tasks
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 data:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/Task'
 *                 cached:
 *                   type: boolean
 *                   description: Whether the result was served from cache
 *             example:
 *               data:
 *                 - id: "550e8400-e29b-41d4-a716-446655440000"
 *                   name: "Complete project documentation"
 *                   description: "Write comprehensive documentation for the project"
 *                   status: "pending"
 *                   created_at: "2024-01-01T10:00:00Z"
 *                   updated_at: "2024-01-01T10:00:00Z"
 *               cached: false
 *       500:
 *         description: Server error
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 error:
 *                   type: string
 *             example:
 *               error: "Failed to search tasks"
 */
// Search tasks by name with caching
router.get('/search/:name', async (req, res) => {
  try {
    const { name } = req.params;
    const cacheKey = `tasks:search:${name.toLowerCase()}`;
    
    // Try to get from cache first
    let tasks = await RedisConnection.get(cacheKey);
    
    if (tasks) {
      // Cache hit
      if (req.app.locals.metrics) {
        req.app.locals.metrics.cacheHitsTotal.inc();
      }
      return res.json({ data: tasks, cached: true });
    }
    
    // Cache miss - get from database
    if (req.app.locals.metrics) {
      req.app.locals.metrics.cacheMissesTotal.inc();
    }
    
    const result = await DatabaseConnection.query(
      'SELECT * FROM tasks WHERE LOWER(name) LIKE LOWER($1) ORDER BY created_at DESC',
      [`%${name}%`]
    );
    
    tasks = result.rows;
    
    // Store in cache with shorter TTL for search results
    await RedisConnection.set(cacheKey, tasks, 180); // 3 minutes TTL
    
    res.json({ data: tasks, cached: false });
  } catch (error) {
    console.error('Error searching tasks:', error);
    res.status(500).json({ error: 'Failed to search tasks' });
  }
});

/**
 * @swagger
 * /api/tasks/cache/stats:
 *   get:
 *     summary: Get cache statistics
 *     description: Returns information about cache statistics and available metrics endpoints
 *     tags: [Cache Management]
 *     responses:
 *       200:
 *         description: Cache statistics information
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                 endpoints:
 *                   type: object
 *                   properties:
 *                     metrics:
 *                       type: string
 *                     health:
 *                       type: string
 *             example:
 *               message: "Cache statistics available at /metrics endpoint"
 *               endpoints:
 *                 metrics: "/metrics"
 *                 health: "/health"
 *       500:
 *         description: Server error
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 error:
 *                   type: string
 *             example:
 *               error: "Failed to get cache stats"
 */
// Get cache statistics
router.get('/cache/stats', async (req, res) => {
  try {
    res.json({
      message: 'Cache statistics available at /metrics endpoint',
      endpoints: {
        metrics: '/metrics',
        health: '/health'
      }
    });
  } catch (error) {
    console.error('Error getting cache stats:', error);
    res.status(500).json({ error: 'Failed to get cache stats' });
  }
});

/**
 * @swagger
 * /api/tasks/cache:
 *   delete:
 *     summary: Clear cache
 *     description: Clears all cached task data (useful for testing and cache invalidation)
 *     tags: [Cache Management]
 *     responses:
 *       200:
 *         description: Cache cleared successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *             example:
 *               message: "Cache cleared successfully"
 *       500:
 *         description: Server error
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 error:
 *                   type: string
 *             example:
 *               error: "Failed to clear cache"
 */
// Clear cache (useful for testing)
router.delete('/cache', async (req, res) => {
  try {
    await RedisConnection.flushPattern('tasks:*');
    await RedisConnection.flushPattern('task:*');
    
    res.json({ message: 'Cache cleared successfully' });
  } catch (error) {
    console.error('Error clearing cache:', error);
    res.status(500).json({ error: 'Failed to clear cache' });
  }
});

module.exports = router;
