const express = require('express');
const router = express.Router();
const TaskCommandHandler = require('../handlers/TaskCommandHandler');
const { CreateTaskCommand, UpdateTaskCommand, DeleteTaskCommand } = require('../commands/TaskCommands');

/**
 * @swagger
 * /api/tasks:
 *   post:
 *     summary: Create a new task
 *     description: Creates a new task using CQRS pattern
 *     tags: [Tasks]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/CreateTaskRequest'
 *           example:
 *             name: "Изучить CQRS"
 *             description: "Command Query Responsibility Segregation"
 *     responses:
 *       201:
 *         description: Task created successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Task'
 *       400:
 *         description: Bad request - name is required
 *       500:
 *         description: Internal server error
 */
// Create task
router.post('/', async (req, res) => {
  try {
    const { name, description } = req.body;
    
    if (!name) {
      return res.status(400).json({ error: 'Name is required' });
    }

    const command = new CreateTaskCommand(name, description);
    const result = await TaskCommandHandler.handleCreateTask(command);
    
    res.status(201).json(result);
  } catch (error) {
    console.error('Error creating task:', error);
    res.status(500).json({ error: 'Failed to create task' });
  }
});

/**
 * @swagger
 * /api/tasks/{id}:
 *   put:
 *     summary: Update a task
 *     description: Updates an existing task using CQRS pattern
 *     tags: [Tasks]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: Task ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/UpdateTaskRequest'
 *           example:
 *             status: "in-progress"
 *     responses:
 *       200:
 *         description: Task updated successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Task'
 *       400:
 *         description: Bad request
 *       404:
 *         description: Task not found
 *       500:
 *         description: Internal server error
 */
// Update task
router.put('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { name, description, status } = req.body;
    
    // At least one field must be provided
    if (!name && !description && !status) {
      return res.status(400).json({ error: 'At least one field (name, description, or status) is required' });
    }

    const command = new UpdateTaskCommand(id, name, description, status);
    const result = await TaskCommandHandler.handleUpdateTask(command);
    
    res.json(result);
  } catch (error) {
    console.error('Error updating task:', error);
    if (error.message === 'Task not found') {
      res.status(404).json({ error: 'Task not found' });
    } else {
      res.status(500).json({ error: 'Failed to update task' });
    }
  }
});

/**
 * @swagger
 * /api/tasks/{id}:
 *   delete:
 *     summary: Delete a task
 *     description: Deletes a task using CQRS pattern
 *     tags: [Tasks]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: Task ID
 *     responses:
 *       200:
 *         description: Task deleted successfully
 *       404:
 *         description: Task not found
 *       500:
 *         description: Internal server error
 */
// Delete task
router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    
    const command = new DeleteTaskCommand(id);
    const result = await TaskCommandHandler.handleDeleteTask(command);
    
    res.json({ message: 'Task deleted successfully', task: result });
  } catch (error) {
    console.error('Error deleting task:', error);
    if (error.message === 'Task not found') {
      res.status(404).json({ error: 'Task not found' });
    } else {
      res.status(500).json({ error: 'Failed to delete task' });
    }
  }
});

/**
 * @swagger
 * /api/tasks/{id}/events:
 *   get:
 *     summary: Get event history for a task
 *     description: Retrieves all events related to a specific task (Event Sourcing)
 *     tags: [Tasks]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: Task ID
 *     responses:
 *       200:
 *         description: Event history retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/Event'
 *       500:
 *         description: Internal server error
 */
// Get event history for a task (useful for debugging)
router.get('/:id/events', async (req, res) => {
  try {
    const { id } = req.params;
    const events = await TaskCommandHandler.getEventHistory(id);
    res.json(events);
  } catch (error) {
    console.error('Error fetching events:', error);
    res.status(500).json({ error: 'Failed to fetch events' });
  }
});

module.exports = router;
