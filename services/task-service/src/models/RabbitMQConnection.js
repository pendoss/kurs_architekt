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

      console.log('Connected to RabbitMQ');
      return this.channel;
    } catch (error) {
      console.error('RabbitMQ connection failed:', error);
      throw error;
    }
  }

  async publishEvent(eventType, data) {
    if (!this.channel) {
      throw new Error('RabbitMQ channel not initialized');
    }

    const message = {
      eventType,
      data,
      timestamp: new Date().toISOString()
    };

    await this.channel.publish(
      'task_events',
      eventType,
      Buffer.from(JSON.stringify(message)),
      { persistent: true }
    );

    console.log(`Published event: ${eventType}`);
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
