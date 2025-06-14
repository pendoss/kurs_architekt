const RabbitMQConnection = require('../models/RabbitMQConnection');

class NotificationHandler {
  constructor() {
    this.processedCount = {
      'task.created': 0,
      'task.updated': 0,
      'task.deleted': 0
    };
  }

  async startListening(metrics) {
    try {
      await RabbitMQConnection.consume('task_notifications', async (message) => {
        if (message) {
          try {
            const content = JSON.parse(message.content.toString());
            await this.handleNotification(content, metrics);
            RabbitMQConnection.ack(message);
          } catch (error) {
            console.error('Error processing notification:', error);
            RabbitMQConnection.nack(message, false); // Don't requeue on error
          }
        }
      });

      console.log('Notification Service is listening for task events...');
    } catch (error) {
      console.error('Error starting notification listener:', error);
      throw error;
    }
  }

  async handleNotification(event, metrics) {
    const { eventType, data, timestamp } = event;
    
    console.log(`Processing notification: ${eventType}`, {
      data,
      timestamp: new Date(timestamp).toISOString()
    });

    // Update metrics
    if (metrics && metrics.notificationsProcessed) {
      metrics.notificationsProcessed.labels(eventType).inc();
    }

    // Update local counter
    if (this.processedCount[eventType] !== undefined) {
      this.processedCount[eventType]++;
    }

    // Handle different event types
    switch (eventType) {
      case 'task.created':
        await this.handleTaskCreated(data);
        break;
      case 'task.updated':
        await this.handleTaskUpdated(data);
        break;
      case 'task.deleted':
        await this.handleTaskDeleted(data);
        break;
      default:
        console.log(`Unknown event type: ${eventType}`);
    }
  }

  async handleTaskCreated(data) {
    console.log(`📝 Task Created Notification:`, {
      taskId: data.taskId,
      name: data.name,
      description: data.description
    });

    // Here you could:
    // - Send email notifications
    // - Send push notifications
    // - Log to external systems
    // - Update dashboards
    // - Trigger webhooks
    
    // Simulate notification processing
    await this.simulateNotificationDelay();
  }

  async handleTaskUpdated(data) {
    console.log(`✏️ Task Updated Notification:`, {
      taskId: data.taskId,
      name: data.name,
      description: data.description
    });

    // Simulate notification processing
    await this.simulateNotificationDelay();
  }

  async handleTaskDeleted(data) {
    console.log(`🗑️ Task Deleted Notification:`, {
      taskId: data.taskId
    });

    // Simulate notification processing
    await this.simulateNotificationDelay();
  }

  async simulateNotificationDelay() {
    // Simulate some processing time (e.g., sending emails, push notifications)
    return new Promise(resolve => setTimeout(resolve, Math.random() * 100));
  }

  getProcessedCount() {
    return {
      ...this.processedCount,
      total: Object.values(this.processedCount).reduce((sum, count) => sum + count, 0)
    };
  }
}

module.exports = new NotificationHandler();
