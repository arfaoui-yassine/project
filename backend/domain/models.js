/**
 * Domain Models for the Car Rental System.
 *
 * These are plain JS factory functions that produce domain objects.
 * All repositories must accept and return objects matching these shapes.
 */

const { v4: uuidv4 } = require('uuid');

/**
 * Create a User domain object.
 */
function createUser({ id, name, email }) {
  return {
    id: id || uuidv4(),
    name,
    email,
  };
}

/**
 * Create a Car domain object.
 */
function createCar({ id, brand, model, available }) {
  return {
    id: id || uuidv4(),
    brand,
    model,
    available: available !== undefined ? available : true,
  };
}

/**
 * Create a Rental domain object.
 */
function createRental({ id, user_id, car_id, start_date, end_date }) {
  return {
    id: id || uuidv4(),
    user_id,
    car_id,
    start_date,
    end_date,
  };
}

module.exports = { createUser, createCar, createRental };
