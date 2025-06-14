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
        console.log('Connected to PostgreSQL database');
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

  async transaction(callback) {
    const client = await this.pool.connect();
    try {
      await client.query('BEGIN');
      const result = await callback(client);
      await client.query('COMMIT');
      return result;
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
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
