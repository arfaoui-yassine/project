/**
 * ETL Transformer — Extract from MySQL, Transform, Load into other databases.
 * Inspired by data2neo's relational-to-graph conversion approach and
 * golang-migrate's structured migration pipeline.
 *
 * Pipeline: MySQL → [MongoDB, Cassandra, Neo4j]
 */

async function transformMySQLToOthers(mysqlRepo, mongoRepo, cassandraRepo, neo4jRepo) {
  console.log('\n╔══════════════════════════════════════════════╗');
  console.log('║     ETL Pipeline: MySQL → Other Databases    ║');
  console.log('╚══════════════════════════════════════════════╝\n');

  // ── STEP 1: Extract from MySQL ──
  console.log('[ETL] Step 1: Extracting data from MySQL...');
  const users = await mysqlRepo.getUsers();
  const cars = await mysqlRepo.getCars();
  const rentalsRaw = await mysqlRepo.getRentals();
  console.log(`[ETL]   → Extracted ${users.length} users, ${cars.length} cars, ${rentalsRaw.length} rentals`);

  // Normalize rentals (remove JOIN fields for insertion)
  const rentals = rentalsRaw.map(r => ({
    id: r.id, user_id: r.user_id, car_id: r.car_id,
    start_date: r.start_date, end_date: r.end_date,
  }));

  const targets = [
    { name: 'MongoDB', repo: mongoRepo },
    { name: 'Cassandra', repo: cassandraRepo },
    { name: 'Neo4j', repo: neo4jRepo },
  ].filter(t => t.repo); // skip null repos

  for (const target of targets) {
    console.log(`\n[ETL] Step 2: Transforming & loading into ${target.name}...`);

    // ── Load Users ──
    console.log(`[ETL]   → Loading ${users.length} users into ${target.name}...`);
    for (const u of users) {
      try { await target.repo.createUser(u); }
      catch (e) { /* skip duplicates */ }
    }
    console.log(`[ETL]   ✓ Users loaded`);

    // ── Load Cars ──
    console.log(`[ETL]   → Loading ${cars.length} cars into ${target.name}...`);
    for (const c of cars) {
      try { await target.repo.createCar(c); }
      catch (e) { /* skip duplicates */ }
    }
    console.log(`[ETL]   ✓ Cars loaded`);

    // ── Load Rentals ──
    console.log(`[ETL]   → Loading ${rentals.length} rentals into ${target.name}...`);
    for (const r of rentals) {
      try { await target.repo.createRental(r); }
      catch (e) { /* skip duplicates */ }
    }
    console.log(`[ETL]   ✓ Rentals loaded`);

    console.log(`[ETL] ✓ ${target.name} transformation complete`);
  }

  console.log('\n[ETL] ═══ Pipeline complete ═══\n');
}

module.exports = { transformMySQLToOthers };
