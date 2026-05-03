/**
 * Rental Service — Shared business logic.
 * Same logic regardless of which repository (MySQL/Mongo/Cassandra/Neo4j) is injected.
 */
const { createUser, createCar, createRental } = require('../domain/models');

class RentalService {
  constructor(repo) {
    this.repo = repo;
  }

  // ──────────── Users ────────────
  async createUser({ name, email }) {
    if (!name || !email) throw new Error('Name and email are required');
    const user = createUser({ name, email });
    return this.repo.createUser(user);
  }

  async getUsers() {
    return this.repo.getUsers();
  }

  async getUser(id) {
    const user = await this.repo.getUser(id);
    if (!user) throw new Error('User not found');
    return user;
  }

  // ──────────── Cars ────────────
  async createCar({ brand, model }) {
    if (!brand || !model) throw new Error('Brand and model are required');
    const car = createCar({ brand, model, available: true });
    return this.repo.createCar(car);
  }

  async getCars() {
    return this.repo.getCars();
  }

  async getCar(id) {
    const car = await this.repo.getCar(id);
    if (!car) throw new Error('Car not found');
    return car;
  }

  // ──────────── Rentals ────────────
  async rentCar({ user_id, car_id, start_date, end_date }) {
    if (!user_id || !car_id || !start_date || !end_date)
      throw new Error('user_id, car_id, start_date, and end_date are required');

    // Verify user exists
    const user = await this.repo.getUser(user_id);
    if (!user) throw new Error('User not found');

    // Verify car exists and is available
    const car = await this.repo.getCar(car_id);
    if (!car) throw new Error('Car not found');
    if (!car.available) throw new Error('Car is not available');

    // Create rental
    const rental = createRental({ user_id, car_id, start_date, end_date });
    await this.repo.createRental(rental);

    // Mark car as unavailable
    await this.repo.updateCarAvailability(car_id, false);

    return rental;
  }

  async getRentals() {
    return this.repo.getRentals();
  }

  async getRentalsByUser(userId) {
    return this.repo.getRentalsByUser(userId);
  }

  async getRentalsByCar(carId) {
    return this.repo.getRentalsByCar(carId);
  }
}

module.exports = { RentalService };
