const DatabaseConnection = require('../models/DatabaseConnection');
const RabbitMQConnection = require('../models/RabbitMQConnection');
const { TaskCreatedEvent, TaskUpdatedEvent, TaskDeletedEvent } = require('../events/TaskEvents');

class TaskCommandHandler {
  async handleCreateTask(command) {
    const event = new TaskCreatedEvent(command.id, command.name, command.description);
    
    return await DatabaseConnection.transaction(async (client) => {
      // Store event in event store
      await client.query(
        'INSERT INTO events (aggregate_id, aggregate_type, event_type, event_data, event_version) VALUES ($1, $2, $3, $4, $5)',
        [command.id, 'Task', event.eventType, JSON.stringify(event), 1]
      );

      // Update read model
      const result = await client.query(
        'INSERT INTO tasks (id, name, description) VALUES ($1, $2, $3) RETURNING *',
        [command.id, command.name, command.description]
      );

      // Publish event to message broker
      await RabbitMQConnection.publishEvent('task.created', {
        taskId: command.id,
        name: command.name,
        description: command.description
      });

      return result.rows[0];
    });
  }

  async handleUpdateTask(command) {
    return await DatabaseConnection.transaction(async (client) => {
      // First, get the current task data
      const currentTaskResult = await client.query(
        'SELECT * FROM tasks WHERE id = $1',
        [command.id]
      );

      if (currentTaskResult.rows.length === 0) {
        throw new Error('Task not found');
      }

      const currentTask = currentTaskResult.rows[0];
      
      // Merge current data with new data from command
      const updatedData = {
        name: command.name || currentTask.name,
        description: command.description || currentTask.description,
        status: command.status || currentTask.status
      };

      const event = new TaskUpdatedEvent(command.id, updatedData.name, updatedData.description, updatedData.status);
      
      // Get current version
      const versionResult = await client.query(
        'SELECT MAX(event_version) as version FROM events WHERE aggregate_id = $1',
        [command.id]
      );
      const nextVersion = (versionResult.rows[0].version || 0) + 1;

      // Store event in event store
      await client.query(
        'INSERT INTO events (aggregate_id, aggregate_type, event_type, event_data, event_version) VALUES ($1, $2, $3, $4, $5)',
        [command.id, 'Task', event.eventType, JSON.stringify(event), nextVersion]
      );

      // Update read model
      const updateFields = [];
      const updateValues = [];
      let paramCount = 1;

      if (command.name) {
        updateFields.push(`name = $${paramCount}`);
        updateValues.push(command.name);
        paramCount++;
      }
      if (command.description) {
        updateFields.push(`description = $${paramCount}`);
        updateValues.push(command.description);
        paramCount++;
      }
      if (command.status) {
        updateFields.push(`status = $${paramCount}`);
        updateValues.push(command.status);
        paramCount++;
      }
      
      updateFields.push(`updated_at = CURRENT_TIMESTAMP`);
      updateValues.push(command.id);

      const result = await client.query(
        `UPDATE tasks SET ${updateFields.join(', ')} WHERE id = $${paramCount} RETURNING *`,
        updateValues
      );

      // Publish event to message broker with complete data
      await RabbitMQConnection.publishEvent('task.updated', {
        taskId: command.id,
        name: updatedData.name,
        description: updatedData.description,
        status: updatedData.status,
        previousData: {
          name: currentTask.name,
          description: currentTask.description,
          status: currentTask.status
        }
      });

      return result.rows[0];
    });
  }

  async handleDeleteTask(command) {
    const event = new TaskDeletedEvent(command.id);
    
    return await DatabaseConnection.transaction(async (client) => {
      // Get current version
      const versionResult = await client.query(
        'SELECT MAX(event_version) as version FROM events WHERE aggregate_id = $1',
        [command.id]
      );
      const nextVersion = (versionResult.rows[0].version || 0) + 1;

      // Store event in event store
      await client.query(
        'INSERT INTO events (aggregate_id, aggregate_type, event_type, event_data, event_version) VALUES ($1, $2, $3, $4, $5)',
        [command.id, 'Task', event.eventType, JSON.stringify(event), nextVersion]
      );

      // Update read model
      const result = await client.query(
        'DELETE FROM tasks WHERE id = $1 RETURNING *',
        [command.id]
      );

      if (result.rows.length === 0) {
        throw new Error('Task not found');
      }

      // Publish event to message broker
      await RabbitMQConnection.publishEvent('task.deleted', {
        taskId: command.id
      });

      return result.rows[0];
    });
  }

  async getEventHistory(aggregateId) {
    const result = await DatabaseConnection.query(
      'SELECT * FROM events WHERE aggregate_id = $1 ORDER BY event_version ASC',
      [aggregateId]
    );
    return result.rows;
  }
}

module.exports = new TaskCommandHandler();
