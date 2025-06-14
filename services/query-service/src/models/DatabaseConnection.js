const { Pool } = require('pg');

class DatabaseConnection {
  constructor() {
    this.pool = null;
  }

  async connect() {
    if (!this.pool) {
      this.pool = new Pool({
        connectionString: process.env.DATABASE_URL || 'postgres://admin:password@localhost:5432/taskdb',
        max: 20,
        idleTimeoutMillis: 30000,
        connectionTimeoutMillis: 2000,
      });

      // Test connection
      try {
        await this.pool.query('SELECT NOW()');
        console.log('Query Service connected to PostgreSQL database');
      } catch (error) {
        console.error('Database connection failed:', error);
        throw error;
      }
    }
    return this.pool;
  }

  async query(text, params) {
    const client = await this.pool.connect();
    try {
      const result = await client.query(text, params);
      return result;
    } finally {
      client.release();
    }
  }

  async close() {
    if (this.pool) {
      await this.pool.end();
      this.pool = null;
    }
  }
}

module.exports = new DatabaseConnection();
