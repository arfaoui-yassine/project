/**
 * Neo4j Repository Implementation.
 * Graph model: (:User)-[:RENTED {id, start_date, end_date}]->(:Car)
 * Inspired by data2neo's relational-to-graph conversion patterns.
 */
const neo4j = require('neo4j-driver');
const { BaseRepository } = require('../interfaces');

class Neo4jRepository extends BaseRepository {
  constructor(config) {
    super('Neo4j');
    this.config = config;
    this.driver = null;
  }

  async connect() {
    this.driver = neo4j.driver(
      this.config.uri,
      neo4j.auth.basic(this.config.user, this.config.password)
    );
    const serverInfo = await this.driver.getServerInfo();
    console.log('[Neo4j] Connected to', serverInfo.address);
  }

  async disconnect() {
    if (this.driver) { await this.driver.close(); console.log('[Neo4j] Disconnected'); }
  }

  async setup() {
    const session = this.driver.session();
    try {
      await session.run('CREATE CONSTRAINT user_id IF NOT EXISTS FOR (u:User) REQUIRE u.id IS UNIQUE');
      await session.run('CREATE CONSTRAINT car_id IF NOT EXISTS FOR (c:Car) REQUIRE c.id IS UNIQUE');
      console.log('[Neo4j] Constraints created');
      console.log('[Neo4j] Schema is up to date');
    } finally { await session.close(); }
  }

  // ──────────── Users ────────────
  async createUser(user) {
    const session = this.driver.session();
    try {
      await session.run('CREATE (u:User {id: $id, name: $name, email: $email})', user);
      return user;
    } finally { await session.close(); }
  }

  async getUsers() {
    const session = this.driver.session();
    try {
      const result = await session.run('MATCH (u:User) RETURN u ORDER BY u.name');
      return result.records.map(r => r.get('u').properties);
    } finally { await session.close(); }
  }

  async getUser(id) {
    const session = this.driver.session();
    try {
      const result = await session.run('MATCH (u:User {id: $id}) RETURN u', { id });
      if (result.records.length === 0) return null;
      return result.records[0].get('u').properties;
    } finally { await session.close(); }
  }

  async deleteUser(id) {
    const session = this.driver.session();
    try {
      await session.run('MATCH (u:User {id: $id}) DETACH DELETE u', { id });
    } finally { await session.close(); }
  }

  // ──────────── Cars ────────────
  async createCar(car) {
    const session = this.driver.session();
    try {
      await session.run('CREATE (c:Car {id: $id, brand: $brand, model: $model, available: $available})', car);
      return car;
    } finally { await session.close(); }
  }

  async getCars() {
    const session = this.driver.session();
    try {
      const result = await session.run('MATCH (c:Car) RETURN c ORDER BY c.brand, c.model');
      return result.records.map(r => r.get('c').properties);
    } finally { await session.close(); }
  }

  async getCar(id) {
    const session = this.driver.session();
    try {
      const result = await session.run('MATCH (c:Car {id: $id}) RETURN c', { id });
      if (result.records.length === 0) return null;
      return result.records[0].get('c').properties;
    } finally { await session.close(); }
  }

  async updateCarAvailability(id, available) {
    const session = this.driver.session();
    try {
      await session.run('MATCH (c:Car {id: $id}) SET c.available = $available', { id, available });
    } finally { await session.close(); }
  }

  async deleteCar(id) {
    const session = this.driver.session();
    try {
      await session.run('MATCH (c:Car {id: $id}) DETACH DELETE c', { id });
    } finally { await session.close(); }
  }

  // ──────────── Rentals ────────────
  async createRental(rental) {
    const session = this.driver.session();
    try {
      await session.run(`
        MATCH (u:User {id: $user_id}), (c:Car {id: $car_id})
        MERGE (u)-[r:RENTED {id: $id}]->(c)
        ON CREATE SET r.start_date = $start_date, r.end_date = $end_date
      `, rental);
      return rental;
    } finally { await session.close(); }
  }

  async getRentals() {
    const session = this.driver.session();
    try {
      const result = await session.run(`
        MATCH (u:User)-[r:RENTED]->(c:Car)
        RETURN r.id AS id, u.id AS user_id, c.id AS car_id,
               r.start_date AS start_date, r.end_date AS end_date,
               u.name AS user_name, c.brand AS car_brand, c.model AS car_model
        ORDER BY r.start_date DESC
      `);
      return result.records.map(r => ({
        id: r.get('id'), user_id: r.get('user_id'), car_id: r.get('car_id'),
        start_date: r.get('start_date'), end_date: r.get('end_date'),
        user_name: r.get('user_name'), car_brand: r.get('car_brand'), car_model: r.get('car_model'),
      }));
    } finally { await session.close(); }
  }

  async getRentalsByUser(userId) {
    const session = this.driver.session();
    try {
      const result = await session.run(`
        MATCH (u:User {id: $userId})-[r:RENTED]->(c:Car)
        RETURN r.id AS id, u.id AS user_id, c.id AS car_id,
               r.start_date AS start_date, r.end_date AS end_date,
               c.brand AS car_brand, c.model AS car_model
        ORDER BY r.start_date DESC
      `, { userId });
      return result.records.map(r => ({
        id: r.get('id'), user_id: r.get('user_id'), car_id: r.get('car_id'),
        start_date: r.get('start_date'), end_date: r.get('end_date'),
        car_brand: r.get('car_brand'), car_model: r.get('car_model'),
      }));
    } finally { await session.close(); }
  }

  async getRentalsByCar(carId) {
    const session = this.driver.session();
    try {
      const result = await session.run(`
        MATCH (u:User)-[r:RENTED]->(c:Car {id: $carId})
        RETURN r.id AS id, u.id AS user_id, c.id AS car_id,
               r.start_date AS start_date, r.end_date AS end_date,
               u.name AS user_name
        ORDER BY r.start_date DESC
      `, { carId });
      return result.records.map(r => ({
        id: r.get('id'), user_id: r.get('user_id'), car_id: r.get('car_id'),
        start_date: r.get('start_date'), end_date: r.get('end_date'),
        user_name: r.get('user_name'),
      }));
    } finally { await session.close(); }
  }

  /** Returns full graph data for vis.js visualization */
  async getGraphData() {
    const session = this.driver.session();
    try {
      const nodesResult = await session.run(`
        MATCH (n) WHERE n:User OR n:Car
        RETURN labels(n)[0] AS label, properties(n) AS props
      `);
      const nodes = nodesResult.records.map(r => ({
        type: r.get('label'),
        ...r.get('props'),
      }));

      const edgesResult = await session.run(`
        MATCH (u:User)-[r:RENTED]->(c:Car)
        RETURN u.id AS from, c.id AS to, properties(r) AS props
      `);
      const edges = edgesResult.records.map(r => ({
        from: r.get('from'),
        to: r.get('to'),
        ...r.get('props'),
      }));

      return { nodes, edges };
    } finally { await session.close(); }
  }
}

module.exports = { Neo4jRepository };
