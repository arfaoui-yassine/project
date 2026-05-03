/**
 * Cassandra Repository Implementation.
 * Query-driven design with denormalized tables.
 */
const cassandra = require('cassandra-driver');
const { BaseRepository } = require('../interfaces');

class CassandraRepository extends BaseRepository {
  constructor(config) {
    super('Cassandra');
    this.config = config;
    this.client = null;
  }

  async connect() {
    const initClient = new cassandra.Client({
      contactPoints: [this.config.host],
      localDataCenter: 'datacenter1',
      protocolOptions: { port: this.config.port },
    });
    await initClient.connect();
    await initClient.execute(`
      CREATE KEYSPACE IF NOT EXISTS ${this.config.keyspace}
      WITH replication = {'class': 'SimpleStrategy', 'replication_factor': 1}
    `);
    await initClient.shutdown();

    this.client = new cassandra.Client({
      contactPoints: [this.config.host],
      localDataCenter: 'datacenter1',
      keyspace: this.config.keyspace,
      protocolOptions: { port: this.config.port },
    });
    await this.client.connect();
    console.log('[Cassandra] Connected successfully');
  }

  async disconnect() {
    if (this.client) { await this.client.shutdown(); console.log('[Cassandra] Disconnected'); }
  }

  async setup() {
    const tables = [
      `CREATE TABLE IF NOT EXISTS users (id UUID PRIMARY KEY, name TEXT, email TEXT)`,
      `CREATE TABLE IF NOT EXISTS cars (id UUID PRIMARY KEY, brand TEXT, model TEXT, available BOOLEAN)`,
      `CREATE TABLE IF NOT EXISTS rentals (id UUID PRIMARY KEY, user_id UUID, car_id UUID, start_date TEXT, end_date TEXT)`,
      `CREATE TABLE IF NOT EXISTS rentals_by_user (user_id UUID, rental_id UUID, car_id UUID, start_date TEXT, end_date TEXT, PRIMARY KEY (user_id, start_date, rental_id)) WITH CLUSTERING ORDER BY (start_date DESC, rental_id ASC)`,
      `CREATE TABLE IF NOT EXISTS rentals_by_car (car_id UUID, rental_id UUID, user_id UUID, start_date TEXT, end_date TEXT, PRIMARY KEY (car_id, start_date, rental_id)) WITH CLUSTERING ORDER BY (start_date DESC, rental_id ASC)`,
    ];
    for (const t of tables) { await this.client.execute(t); }
    console.log('[Cassandra] Schema is up to date');
  }

  async createUser(user) {
    await this.client.execute('INSERT INTO users (id, name, email) VALUES (?, ?, ?)',
      [cassandra.types.Uuid.fromString(user.id), user.name, user.email], { prepare: true });
    return user;
  }
  async getUsers() {
    const r = await this.client.execute('SELECT * FROM users');
    return r.rows.map(r => ({ id: r.id.toString(), name: r.name, email: r.email }));
  }
  async getUser(id) {
    const r = await this.client.execute('SELECT * FROM users WHERE id = ?',
      [cassandra.types.Uuid.fromString(id)], { prepare: true });
    if (!r.rows.length) return null;
    const row = r.rows[0];
    return { id: row.id.toString(), name: row.name, email: row.email };
  }
  async deleteUser(id) {
    await this.client.execute('DELETE FROM users WHERE id = ?',
      [cassandra.types.Uuid.fromString(id)], { prepare: true });
  }

  async createCar(car) {
    await this.client.execute('INSERT INTO cars (id, brand, model, available) VALUES (?, ?, ?, ?)',
      [cassandra.types.Uuid.fromString(car.id), car.brand, car.model, car.available], { prepare: true });
    return car;
  }
  async getCars() {
    const r = await this.client.execute('SELECT * FROM cars');
    return r.rows.map(r => ({ id: r.id.toString(), brand: r.brand, model: r.model, available: r.available }));
  }
  async getCar(id) {
    const r = await this.client.execute('SELECT * FROM cars WHERE id = ?',
      [cassandra.types.Uuid.fromString(id)], { prepare: true });
    if (!r.rows.length) return null;
    const row = r.rows[0];
    return { id: row.id.toString(), brand: row.brand, model: row.model, available: row.available };
  }
  async updateCarAvailability(id, available) {
    await this.client.execute('UPDATE cars SET available = ? WHERE id = ?',
      [available, cassandra.types.Uuid.fromString(id)], { prepare: true });
  }
  async deleteCar(id) {
    await this.client.execute('DELETE FROM cars WHERE id = ?',
      [cassandra.types.Uuid.fromString(id)], { prepare: true });
  }

  async createRental(rental) {
    const rid = cassandra.types.Uuid.fromString(rental.id);
    const uid = cassandra.types.Uuid.fromString(rental.user_id);
    const cid = cassandra.types.Uuid.fromString(rental.car_id);
    await this.client.batch([
      { query: 'INSERT INTO rentals (id, user_id, car_id, start_date, end_date) VALUES (?, ?, ?, ?, ?)', params: [rid, uid, cid, rental.start_date, rental.end_date] },
      { query: 'INSERT INTO rentals_by_user (user_id, rental_id, car_id, start_date, end_date) VALUES (?, ?, ?, ?, ?)', params: [uid, rid, cid, rental.start_date, rental.end_date] },
      { query: 'INSERT INTO rentals_by_car (car_id, rental_id, user_id, start_date, end_date) VALUES (?, ?, ?, ?, ?)', params: [cid, rid, uid, rental.start_date, rental.end_date] },
    ], { prepare: true });
    return rental;
  }

  async getRentals() {
    const [rentalResult, userResult, carResult] = await Promise.all([
      this.client.execute('SELECT * FROM rentals'),
      this.client.execute('SELECT * FROM users'),
      this.client.execute('SELECT * FROM cars'),
    ]);
    const userMap = Object.fromEntries(userResult.rows.map(u => [u.id.toString(), u]));
    const carMap = Object.fromEntries(carResult.rows.map(c => [c.id.toString(), c]));
    return rentalResult.rows.map(r => ({
      id: r.id.toString(), user_id: r.user_id.toString(), car_id: r.car_id.toString(),
      start_date: r.start_date, end_date: r.end_date,
      user_name: userMap[r.user_id.toString()]?.name || 'Unknown',
      car_brand: carMap[r.car_id.toString()]?.brand || 'Unknown',
      car_model: carMap[r.car_id.toString()]?.model || 'Unknown',
    }));
  }

  async getRentalsByUser(userId) {
    const [result, carResult] = await Promise.all([
      this.client.execute('SELECT * FROM rentals_by_user WHERE user_id = ?',
        [cassandra.types.Uuid.fromString(userId)], { prepare: true }),
      this.client.execute('SELECT * FROM cars'),
    ]);
    const carMap = Object.fromEntries(carResult.rows.map(c => [c.id.toString(), c]));
    return result.rows.map(r => ({
      id: r.rental_id.toString(), user_id: r.user_id.toString(), car_id: r.car_id.toString(),
      start_date: r.start_date, end_date: r.end_date,
      car_brand: carMap[r.car_id.toString()]?.brand || 'Unknown',
      car_model: carMap[r.car_id.toString()]?.model || 'Unknown',
    }));
  }

  async getRentalsByCar(carId) {
    const [result, userResult] = await Promise.all([
      this.client.execute('SELECT * FROM rentals_by_car WHERE car_id = ?',
        [cassandra.types.Uuid.fromString(carId)], { prepare: true }),
      this.client.execute('SELECT * FROM users'),
    ]);
    const userMap = Object.fromEntries(userResult.rows.map(u => [u.id.toString(), u]));
    return result.rows.map(r => ({
      id: r.rental_id.toString(), user_id: r.user_id.toString(), car_id: r.car_id.toString(),
      start_date: r.start_date, end_date: r.end_date,
      user_name: userMap[r.user_id.toString()]?.name || 'Unknown',
    }));
  }
}

module.exports = { CassandraRepository };
