/**
 * MongoDB Repository Implementation.
 *
 * Uses document collections with reference pattern.
 * Rentals reference users and cars by ID.
 */

const { MongoClient } = require('mongodb');
const { BaseRepository } = require('../interfaces');

class MongoRepository extends BaseRepository {
  constructor(config) {
    super('MongoDB');
    this.config = config;
    this.client = null;
    this.db = null;
  }

  // ──────────── Lifecycle ────────────

  async connect() {
    this.client = new MongoClient(this.config.uri);
    await this.client.connect();
    this.db = this.client.db(this.config.database);
    console.log('[MongoDB] Connected successfully');
  }

  async disconnect() {
    if (this.client) {
      await this.client.close();
      console.log('[MongoDB] Disconnected');
    }
  }

  async setup() {
    // Create collections (idempotent)
    const collections = await this.db.listCollections().toArray();
    const colNames = collections.map(c => c.name);

    if (!colNames.includes('users')) {
      await this.db.createCollection('users');
      console.log('[MongoDB] Created collection: users');
    }
    if (!colNames.includes('cars')) {
      await this.db.createCollection('cars');
      console.log('[MongoDB] Created collection: cars');
    }
    if (!colNames.includes('rentals')) {
      await this.db.createCollection('rentals');
      console.log('[MongoDB] Created collection: rentals');
    }

    // Create indexes
    await this.db.collection('users').createIndex({ email: 1 }, { unique: true });
    await this.db.collection('rentals').createIndex({ user_id: 1 });
    await this.db.collection('rentals').createIndex({ car_id: 1 });
    console.log('[MongoDB] Indexes created');
    console.log('[MongoDB] Schema is up to date');
  }

  // ──────────── Users ────────────

  async createUser(user) {
    const doc = { _id: user.id, name: user.name, email: user.email };
    await this.db.collection('users').insertOne(doc);
    return user;
  }

  async getUsers() {
    const docs = await this.db.collection('users').find().sort({ name: 1 }).toArray();
    return docs.map(d => ({ id: d._id, name: d.name, email: d.email }));
  }

  async getUser(id) {
    const doc = await this.db.collection('users').findOne({ _id: id });
    if (!doc) return null;
    return { id: doc._id, name: doc.name, email: doc.email };
  }

  async deleteUser(id) {
    await this.db.collection('users').deleteOne({ _id: id });
  }

  // ──────────── Cars ────────────

  async createCar(car) {
    const doc = { _id: car.id, brand: car.brand, model: car.model, available: car.available };
    await this.db.collection('cars').insertOne(doc);
    return car;
  }

  async getCars() {
    const docs = await this.db.collection('cars').find().sort({ brand: 1, model: 1 }).toArray();
    return docs.map(d => ({ id: d._id, brand: d.brand, model: d.model, available: d.available }));
  }

  async getCar(id) {
    const doc = await this.db.collection('cars').findOne({ _id: id });
    if (!doc) return null;
    return { id: doc._id, brand: doc.brand, model: doc.model, available: doc.available };
  }

  async updateCarAvailability(id, available) {
    await this.db.collection('cars').updateOne({ _id: id }, { $set: { available } });
  }

  async deleteCar(id) {
    await this.db.collection('cars').deleteOne({ _id: id });
  }

  // ──────────── Rentals ────────────

  async createRental(rental) {
    const doc = {
      _id: rental.id,
      user_id: rental.user_id,
      car_id: rental.car_id,
      start_date: rental.start_date,
      end_date: rental.end_date,
    };
    await this.db.collection('rentals').insertOne(doc);
    return rental;
  }

  async getRentals() {
    const [rentals, users, cars] = await Promise.all([
      this.db.collection('rentals').find().sort({ start_date: -1 }).toArray(),
      this.db.collection('users').find().toArray(),
      this.db.collection('cars').find().toArray(),
    ]);
    const userMap = Object.fromEntries(users.map(u => [u._id, u]));
    const carMap = Object.fromEntries(cars.map(c => [c._id, c]));
    return rentals.map(r => ({
      id: r._id, user_id: r.user_id, car_id: r.car_id,
      start_date: r.start_date, end_date: r.end_date,
      user_name: userMap[r.user_id]?.name || 'Unknown',
      car_brand: carMap[r.car_id]?.brand || 'Unknown',
      car_model: carMap[r.car_id]?.model || 'Unknown',
    }));
  }

  async getRentalsByUser(userId) {
    const [rentals, cars] = await Promise.all([
      this.db.collection('rentals').find({ user_id: userId }).sort({ start_date: -1 }).toArray(),
      this.db.collection('cars').find().toArray(),
    ]);
    const carMap = Object.fromEntries(cars.map(c => [c._id, c]));
    return rentals.map(r => ({
      id: r._id, user_id: r.user_id, car_id: r.car_id,
      start_date: r.start_date, end_date: r.end_date,
      car_brand: carMap[r.car_id]?.brand || 'Unknown',
      car_model: carMap[r.car_id]?.model || 'Unknown',
    }));
  }

  async getRentalsByCar(carId) {
    const [rentals, users] = await Promise.all([
      this.db.collection('rentals').find({ car_id: carId }).sort({ start_date: -1 }).toArray(),
      this.db.collection('users').find().toArray(),
    ]);
    const userMap = Object.fromEntries(users.map(u => [u._id, u]));
    return rentals.map(r => ({
      id: r._id, user_id: r.user_id, car_id: r.car_id,
      start_date: r.start_date, end_date: r.end_date,
      user_name: userMap[r.user_id]?.name || 'Unknown',
    }));
  }
}

module.exports = { MongoRepository };
