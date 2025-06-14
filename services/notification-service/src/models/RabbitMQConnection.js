const amqp = require('amqplib');

class RabbitMQConnection {
  constructor() {
    this.connection = null;
    this.channel = null;
  }

  async connect() {
    try {
      const rabbitmqUrl = process.env.RABBITMQ_URL || 'amqp://admin:password@localhost:5672';
      this.connection = await amqp.connect(rabbitmqUrl);
      this.channel = await this.connection.createChannel();

      // Declare exchanges and queues
      await this.channel.assertExchange('task_events', 'topic', { durable: true });
      await this.channel.assertQueue('task_notifications', { durable: true });

      // Bind queue to exchange with routing keys
      await this.channel.bindQueue('task_notifications', 'task_events', 'task.created');
      await this.channel.bindQueue('task_notifications', 'task_events', 'task.updated');
      await this.channel.bindQueue('task_notifications', 'task_events', 'task.deleted');

      console.log('Notification Service connected to RabbitMQ');
      return this.channel;
    } catch (error) {
      console.error('RabbitMQ connection failed:', error);
      throw error;
    }
  }

  async consume(queueName, callback) {
    if (!this.channel) {
      throw new Error('RabbitMQ channel not initialized');
    }

    await this.channel.consume(queueName, callback, { noAck: false });
  }

  async ack(message) {
    if (!this.channel) {
      throw new Error('RabbitMQ channel not initialized');
    }

    this.channel.ack(message);
  }

  async nack(message, requeue = false) {
    if (!this.channel) {
      throw new Error('RabbitMQ channel not initialized');
    }

    this.channel.nack(message, false, requeue);
  }

  async close() {
    if (this.channel) {
      await this.channel.close();
    }
    if (this.connection) {
      await this.connection.close();
    }
  }
}

module.exports = new RabbitMQConnection();
