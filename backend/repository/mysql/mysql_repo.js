/**
 * MySQL Repository Implementation.
 *
 * Uses normalized relational tables with foreign keys.
 * Migration pattern inspired by golang-migrate's versioned SQL approach.
 */

const mysql = require('mysql2/promise');
const { BaseRepository } = require('../interfaces');

class MySQLRepository extends BaseRepository {
  constructor(config) {
    super('MySQL');
    this.config = config;
    this.pool = null;
  }

  // ──────────── Lifecycle ────────────

  async connect() {
    this.pool = mysql.createPool({
      host: this.config.host,
      port: this.config.port,
      user: this.config.user,
      password: this.config.password,
      database: this.config.database,
      waitForConnections: true,
      connectionLimit: 10,
      queueLimit: 0,
    });
    // Test connectivity
    const conn = await this.pool.getConnection();
    conn.release();
    console.log('[MySQL] Connected successfully');
  }

  async disconnect() {
    if (this.pool) {
      await this.pool.end();
      console.log('[MySQL] Disconnected');
    }
  }

  /**
   * Run schema migrations.
   * Inspired by golang-migrate: tracks version in schema_migrations table,
   * applies .up.sql files in order.
   */
  async setup() {
    const conn = await this.pool.getConnection();
    try {
      // Create migration tracking table (like golang-migrate's SetVersion/Version)
      await conn.execute(`
        CREATE TABLE IF NOT EXISTS schema_migrations (
          version INT NOT NULL PRIMARY KEY,
          dirty BOOLEAN NOT NULL DEFAULT FALSE,
          applied_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
      `);

      // Check current version
      const [rows] = await conn.execute('SELECT MAX(version) as ver FROM schema_migrations WHERE dirty = FALSE');
      const currentVersion = rows[0].ver || 0;

      // Migration 1: Create core tables
      if (currentVersion < 1) {
        console.log('[MySQL] Applying migration 001_create_tables.up.sql ...');
        await conn.execute(`SET FOREIGN_KEY_CHECKS = 0`);

        await conn.execute(`
          CREATE TABLE IF NOT EXISTS users (
            id VARCHAR(36) PRIMARY KEY,
            name VARCHAR(255) NOT NULL,
            email VARCHAR(255) NOT NULL UNIQUE
          )
        `);

        await conn.execute(`
          CREATE TABLE IF NOT EXISTS cars (
            id VARCHAR(36) PRIMARY KEY,
            brand VARCHAR(255) NOT NULL,
            model VARCHAR(255) NOT NULL,
            available BOOLEAN DEFAULT TRUE
          )
        `);

        await conn.execute(`
          CREATE TABLE IF NOT EXISTS rentals (
            id VARCHAR(36) PRIMARY KEY,
            user_id VARCHAR(36) NOT NULL,
            car_id VARCHAR(36) NOT NULL,
            start_date DATE NOT NULL,
            end_date DATE NOT NULL,
            FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
            FOREIGN KEY (car_id) REFERENCES cars(id) ON DELETE CASCADE
          )
        `);

        await conn.execute(`SET FOREIGN_KEY_CHECKS = 1`);

        // Record migration version (like golang-migrate's SetVersion)
        await conn.execute(
          'INSERT INTO schema_migrations (version, dirty) VALUES (1, FALSE) ON DUPLICATE KEY UPDATE dirty = FALSE'
        );
        console.log('[MySQL] Migration 001 applied successfully');
      }

      console.log('[MySQL] Schema is up to date');
    } finally {
      conn.release();
    }
  }

  // ──────────── Users ────────────

  async createUser(user) {
    await this.pool.execute(
      'INSERT INTO users (id, name, email) VALUES (?, ?, ?)',
      [user.id, user.name, user.email]
    );
    return user;
  }

  async getUsers() {
    const [rows] = await this.pool.execute('SELECT * FROM users ORDER BY name');
    return rows;
  }

  async getUser(id) {
    const [rows] = await this.pool.execute('SELECT * FROM users WHERE id = ?', [id]);
    return rows[0] || null;
  }

  async deleteUser(id) {
    await this.pool.execute('DELETE FROM users WHERE id = ?', [id]);
  }

  // ──────────── Cars ────────────

  async createCar(car) {
    await this.pool.execute(
      'INSERT INTO cars (id, brand, model, available) VALUES (?, ?, ?, ?)',
      [car.id, car.brand, car.model, car.available]
    );
    return car;
  }

  async getCars() {
    const [rows] = await this.pool.execute('SELECT * FROM cars ORDER BY brand, model');
    return rows.map(r => ({ ...r, available: !!r.available }));
  }

  async getCar(id) {
    const [rows] = await this.pool.execute('SELECT * FROM cars WHERE id = ?', [id]);
    if (!rows[0]) return null;
    return { ...rows[0], available: !!rows[0].available };
  }

  async updateCarAvailability(id, available) {
    await this.pool.execute('UPDATE cars SET available = ? WHERE id = ?', [available, id]);
  }

  async deleteCar(id) {
    await this.pool.execute('DELETE FROM cars WHERE id = ?', [id]);
  }

  // ──────────── Rentals ────────────

  async createRental(rental) {
    await this.pool.execute(
      'INSERT INTO rentals (id, user_id, car_id, start_date, end_date) VALUES (?, ?, ?, ?, ?)',
      [rental.id, rental.user_id, rental.car_id, rental.start_date, rental.end_date]
    );
    return rental;
  }

  async getRentals() {
    const [rows] = await this.pool.execute(`
      SELECT r.*, u.name as user_name, c.brand as car_brand, c.model as car_model
      FROM rentals r
      JOIN users u ON r.user_id = u.id
      JOIN cars c ON r.car_id = c.id
      ORDER BY r.start_date DESC
    `);
    return rows;
  }

  async getRentalsByUser(userId) {
    const [rows] = await this.pool.execute(
      `SELECT r.*, c.brand as car_brand, c.model as car_model
       FROM rentals r JOIN cars c ON r.car_id = c.id
       WHERE r.user_id = ? ORDER BY r.start_date DESC`,
      [userId]
    );
    return rows;
  }

  async getRentalsByCar(carId) {
    const [rows] = await this.pool.execute(
      `SELECT r.*, u.name as user_name
       FROM rentals r JOIN users u ON r.user_id = u.id
       WHERE r.car_id = ? ORDER BY r.start_date DESC`,
      [carId]
    );
    return rows;
  }
}

module.exports = { MySQLRepository };
