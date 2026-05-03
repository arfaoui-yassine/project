/**
 * Main Server Entry Point.
 * Wires all 4 database repositories, services, and handlers.
 * Each database gets its own API prefix: /api/mysql, /api/mongo, /api/cassandra, /api/neo4j
 */
const express = require('express');
const cors = require('cors');
const config = require('./config/config');
const { MySQLRepository } = require('./repository/mysql/mysql_repo');
const { MongoRepository } = require('./repository/mongo/mongo_repo');
const { CassandraRepository } = require('./repository/cassandra/cassandra_repo');
const { Neo4jRepository } = require('./repository/neo4j/neo4j_repo');
const { RentalService } = require('./service/rental_service');
const { createHandler } = require('./handler/handler');
const { seedRepository } = require('./seed/seeder');
const { transformMySQLToOthers } = require('./etl/transformer');

const app = express();
app.use(cors());
app.use(express.json());

// Track repositories for graceful shutdown
const repos = {};

async function connectWithRetry(name, connectFn, maxRetries = 15, delayMs = 3000) {
  for (let i = 1; i <= maxRetries; i++) {
    try {
      await connectFn();
      return true;
    } catch (err) {
      console.log(`[${name}] Connection attempt ${i}/${maxRetries} failed: ${err.message}`);
      if (i < maxRetries) await new Promise(r => setTimeout(r, delayMs));
    }
  }
  console.error(`[${name}] Failed to connect after ${maxRetries} attempts`);
  return false;
}

async function initDatabase(RepoClass, cfg, name) {
  const repo = new RepoClass(cfg);
  const connected = await connectWithRetry(name, () => repo.connect());
  if (!connected) return null;
  try {
    await repo.setup();
  } catch (err) {
    console.error(`[${name}] Setup error:`, err.message);
  }
  return repo;
}

async function main() {
  console.log('\n═══════════════════════════════════════════');
  console.log('  Polyglot Car Rental — Starting Server');
  console.log('═══════════════════════════════════════════\n');

  // ── Connect to all databases ──
  const [mysqlRepo, mongoRepo, cassandraRepo, neo4jRepo] = await Promise.all([
    initDatabase(MySQLRepository, config.mysql, 'MySQL'),
    initDatabase(MongoRepository, config.mongo, 'MongoDB'),
    initDatabase(CassandraRepository, config.cassandra, 'Cassandra'),
    initDatabase(Neo4jRepository, config.neo4j, 'Neo4j'),
  ]);

  // Store for shutdown
  Object.assign(repos, { mysqlRepo, mongoRepo, cassandraRepo, neo4jRepo });

  // ── Register API routes for each connected database ──
  if (mysqlRepo) {
    const svc = new RentalService(mysqlRepo);
    app.use('/api/mysql', createHandler(svc));
    console.log('[Router] /api/mysql/* registered');
  }

  if (mongoRepo) {
    const svc = new RentalService(mongoRepo);
    app.use('/api/mongo', createHandler(svc));
    console.log('[Router] /api/mongo/* registered');
  }

  if (cassandraRepo) {
    const svc = new RentalService(cassandraRepo);
    app.use('/api/cassandra', createHandler(svc));
    console.log('[Router] /api/cassandra/* registered');
  }

  if (neo4jRepo) {
    const svc = new RentalService(neo4jRepo);
    app.use('/api/neo4j', createHandler(svc, (router) => {
      // Neo4j-specific: graph visualization endpoint
      router.get('/graph', async (req, res) => {
        try { res.json(await neo4jRepo.getGraphData()); }
        catch (e) { res.status(500).json({ error: e.message }); }
      });
    }));
    console.log('[Router] /api/neo4j/* registered (with /graph endpoint)');
  }

  // ── Seed & ETL endpoints ──
  app.post('/api/seed/:db', async (req, res) => {
    const dbName = req.params.db;
    const repoMap = { mysql: mysqlRepo, mongo: mongoRepo, cassandra: cassandraRepo, neo4j: neo4jRepo };
    const repo = repoMap[dbName];
    if (!repo) return res.status(404).json({ error: `Database ${dbName} not connected` });
    try {
      await seedRepository(repo);
      res.json({ message: `${dbName} seeded successfully` });
    } catch (e) { res.status(500).json({ error: e.message }); }
  });

  app.post('/api/seed-all', async (req, res) => {
    try {
      const connected = [mysqlRepo, mongoRepo, cassandraRepo, neo4jRepo].filter(Boolean);
      for (const repo of connected) { await seedRepository(repo); }
      res.json({ message: `All ${connected.length} databases seeded` });
    } catch (e) { res.status(500).json({ error: e.message }); }
  });

  app.post('/api/etl', async (req, res) => {
    if (!mysqlRepo) return res.status(500).json({ error: 'MySQL not connected' });
    try {
      await transformMySQLToOthers(mysqlRepo, mongoRepo, cassandraRepo, neo4jRepo);
      res.json({ message: 'ETL pipeline complete' });
    } catch (e) { res.status(500).json({ error: e.message }); }
  });

  // ── Health check ──
  app.get('/api/health', (req, res) => {
    res.json({
      status: 'ok',
      databases: {
        mysql: !!mysqlRepo,
        mongodb: !!mongoRepo,
        cassandra: !!cassandraRepo,
        neo4j: !!neo4jRepo,
      },
    });
  });

  // Root landing page
  app.get('/', (req, res) => {
    res.send(`<!doctype html>
      <html>
        <head>
          <meta charset="utf-8" />
          <meta name="viewport" content="width=device-width,initial-scale=1" />
          <title>Polyglot Car Rental — API</title>
        </head>
        <body style="font-family:Arial,Helvetica,sans-serif;line-height:1.4;padding:24px">
          <h1>Polyglot Car Rental — API</h1>
          <p>Server is running. Quick links:</p>
          <ul>
            <li><a href="/api/health">/api/health</a></li>
            <li><a href="/api/mysql/users">/api/mysql/users</a></li>
            <li><a href="/api/mongo/users">/api/mongo/users</a></li>
            <li><a href="/api/cassandra/users">/api/cassandra/users</a></li>
            <li><a href="/api/neo4j/users">/api/neo4j/users</a></li>
            <li><a href="/api/neo4j/graph">/api/neo4j/graph</a> (Neo4j only)</li>
          </ul>
          <p>Use the API endpoints under <strong>/api/*</strong>.</p>
        </body>
      </html>
    `);
  });

  // ── Start server ──
  app.listen(config.port, () => {
    console.log(`\n🚀 Server running on http://localhost:${config.port}`);
    console.log('   /api/mysql/*      — MySQL endpoints');
    console.log('   /api/mongo/*      — MongoDB endpoints');
    console.log('   /api/cassandra/*  — Cassandra endpoints');
    console.log('   /api/neo4j/*      — Neo4j endpoints');
    console.log('   /api/seed-all     — Seed all databases');
    console.log('   /api/etl          — Run ETL pipeline');
    console.log('   /api/health       — Health check\n');
  });
}

// Graceful shutdown
process.on('SIGTERM', async () => {
  console.log('\nShutting down...');
  for (const repo of Object.values(repos)) {
    if (repo) try { await repo.disconnect(); } catch (e) { /* ignore */ }
  }
  process.exit(0);
});

main().catch(err => {
  console.error('Fatal error:', err);
  process.exit(1);
});
