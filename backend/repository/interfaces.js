/**
 * Repository Interface Definition.
 *
 * Every database repository (MySQL, MongoDB, Cassandra, Neo4j) must implement
 * this interface. We use a base class that throws "not implemented" errors
 * so that missing methods are caught at runtime.
 *
 * Inspired by golang-migrate's Driver interface pattern (driver.go):
 *   - Each driver implements the same contract
 *   - Drivers are registered and used interchangeably
 */

class BaseRepository {
  constructor(name) {
    this.name = name;
  }

  // ──────────── Lifecycle ────────────
  async connect() { throw new Error(`${this.name}: connect() not implemented`); }
  async disconnect() { throw new Error(`${this.name}: disconnect() not implemented`); }
  async setup() { throw new Error(`${this.name}: setup() not implemented`); }

  // ──────────── Users ────────────
  async createUser(user) { throw new Error(`${this.name}: createUser() not implemented`); }
  async getUsers() { throw new Error(`${this.name}: getUsers() not implemented`); }
  async getUser(id) { throw new Error(`${this.name}: getUser() not implemented`); }
  async deleteUser(id) { throw new Error(`${this.name}: deleteUser() not implemented`); }

  // ──────────── Cars ────────────
  async createCar(car) { throw new Error(`${this.name}: createCar() not implemented`); }
  async getCars() { throw new Error(`${this.name}: getCars() not implemented`); }
  async getCar(id) { throw new Error(`${this.name}: getCar() not implemented`); }
  async updateCarAvailability(id, available) { throw new Error(`${this.name}: updateCarAvailability() not implemented`); }
  async deleteCar(id) { throw new Error(`${this.name}: deleteCar() not implemented`); }

  // ──────────── Rentals ────────────
  async createRental(rental) { throw new Error(`${this.name}: createRental() not implemented`); }
  async getRentals() { throw new Error(`${this.name}: getRentals() not implemented`); }
  async getRentalsByUser(userId) { throw new Error(`${this.name}: getRentalsByUser() not implemented`); }
  async getRentalsByCar(carId) { throw new Error(`${this.name}: getRentalsByCar() not implemented`); }
}

module.exports = { BaseRepository };
