/**
 * Creates Express router for a given database service.
 * Reused for all 4 databases — only the injected service differs.
 */
const express = require('express');

function createHandler(service, extraRoutes) {
  const router = express.Router();

  // ──── Users ────
  router.get('/users', async (req, res) => {
    try { res.json(await service.getUsers()); }
    catch (e) { res.status(500).json({ error: e.message }); }
  });

  router.get('/users/:id', async (req, res) => {
    try { res.json(await service.getUser(req.params.id)); }
    catch (e) { res.status(404).json({ error: e.message }); }
  });

  router.post('/users', async (req, res) => {
    try { res.status(201).json(await service.createUser(req.body)); }
    catch (e) { res.status(400).json({ error: e.message }); }
  });

  // ──── Cars ────
  router.get('/cars', async (req, res) => {
    try { res.json(await service.getCars()); }
    catch (e) { res.status(500).json({ error: e.message }); }
  });

  router.get('/cars/:id', async (req, res) => {
    try { res.json(await service.getCar(req.params.id)); }
    catch (e) { res.status(404).json({ error: e.message }); }
  });

  router.post('/cars', async (req, res) => {
    try { res.status(201).json(await service.createCar(req.body)); }
    catch (e) { res.status(400).json({ error: e.message }); }
  });

  // ──── Rentals ────
  router.get('/rentals', async (req, res) => {
    try { res.json(await service.getRentals()); }
    catch (e) { res.status(500).json({ error: e.message }); }
  });

  router.post('/rentals', async (req, res) => {
    try { res.status(201).json(await service.rentCar(req.body)); }
    catch (e) { res.status(400).json({ error: e.message }); }
  });

  router.get('/rentals/by-user/:userId', async (req, res) => {
    try { res.json(await service.getRentalsByUser(req.params.userId)); }
    catch (e) { res.status(500).json({ error: e.message }); }
  });

  router.get('/rentals/by-car/:carId', async (req, res) => {
    try { res.json(await service.getRentalsByCar(req.params.carId)); }
    catch (e) { res.status(500).json({ error: e.message }); }
  });

  // Add any extra routes (e.g., Neo4j graph endpoint)
  if (extraRoutes) extraRoutes(router);

  return router;
}

module.exports = { createHandler };
