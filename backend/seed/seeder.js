/**
 * Seed Data — Populates all databases with large-scale sample data.
 * Generates 100 users, 150 cars, 800+ rentals for a realistic demo.
 */
const { createUser, createCar, createRental } = require('../domain/models');

// ── 100 Realistic Users ──
const FIRST_NAMES = [
  'Alice','Bob','Clara','David','Eva','Frank','Grace','Hassan','Isabelle','James',
  'Khalid','Léa','Mohamed','Nina','Oscar','Patricia','Quentin','Rachel','Samuel','Tanya',
  'Umar','Valérie','William','Xia','Youssef','Zoé','Antoine','Brigitte','Cédric','Diana',
  'Émile','Fatima','Gabriel','Hélène','Ibrahim','Julie','Karim','Laure','Maxime','Nadia',
  'Olivier','Pauline','Romain','Sophie','Théo','Ursula','Victor','Wendy','Xavier','Yasmina',
];
const LAST_NAMES = [
  'Martin','Johnson','Dupont','Chen','Rodriguez','Weber','Kim','Ali','Moreau','Wilson',
  'Bernard','Thomas','Petit','Robert','Richard','Durand','Leroy','Simon','Laurent','Michel',
  'Garcia','Martinez','Lopez','Gonzalez','Hernandez','Moore','Taylor','Anderson','Jackson','White',
  'Harris','Clark','Lewis','Robinson','Walker','Hall','Young','King','Wright','Scott',
  'Green','Adams','Baker','Nelson','Carter','Mitchell','Perez','Campbell','Parker','Evans',
];

// ── 150 Cars (real brands & models) ──
const CAR_CATALOG = [
  { brand: 'BMW', models: ['Serie 1','Serie 3','Serie 5','X1','X3','X5','M3','M5'] },
  { brand: 'Mercedes', models: ['Classe A','Classe C','Classe E','GLA','GLC','GLE','AMG GT'] },
  { brand: 'Audi', models: ['A1','A3','A4','A6','Q3','Q5','Q7','RS6','e-tron'] },
  { brand: 'Tesla', models: ['Model 3','Model Y','Model S','Model X'] },
  { brand: 'Toyota', models: ['Corolla','Camry','RAV4','Yaris','C-HR','Land Cruiser','Supra'] },
  { brand: 'Peugeot', models: ['208','308','3008','5008','508','2008','e-208'] },
  { brand: 'Renault', models: ['Clio','Megane','Captur','Kadjar','Scenic','Zoe','Arkana'] },
  { brand: 'Volkswagen', models: ['Golf','Polo','Tiguan','Passat','T-Roc','ID.4','Arteon'] },
  { brand: 'Ford', models: ['Focus','Fiesta','Mustang','Puma','Kuga','Explorer','Bronco'] },
  { brand: 'Hyundai', models: ['Tucson','Kona','i20','i30','Ioniq 5','Santa Fe'] },
  { brand: 'Honda', models: ['Civic','Jazz','CR-V','HR-V','e:Ny1'] },
  { brand: 'Nissan', models: ['Qashqai','Juke','Leaf','X-Trail','Ariya'] },
  { brand: 'Porsche', models: ['Cayenne','Macan','911','Taycan','Panamera'] },
  { brand: 'Fiat', models: ['500','Panda','Tipo','500X'] },
  { brand: 'Volvo', models: ['XC40','XC60','XC90','S60','V60','EX30'] },
  { brand: 'Citroën', models: ['C3','C4','C5 X','ë-C4','Berlingo'] },
  { brand: 'Kia', models: ['Sportage','Ceed','Niro','EV6','Picanto','Stonic'] },
  { brand: 'Mazda', models: ['CX-5','Mazda3','CX-30','MX-5','CX-60'] },
  { brand: 'Jeep', models: ['Renegade','Compass','Wrangler','Avenger'] },
  { brand: 'Alfa Romeo', models: ['Giulia','Stelvio','Tonale'] },
];

// Generate deterministic UUIDs (valid for Cassandra)
// UUID format: 8-4-4-4-12 hex chars = 32 hex digits
function makeId(prefix, index) {
  const hex = index.toString(16).padStart(8, '0');
  return `${prefix}0000000-0000-4000-8000-0000${hex}`;
}

function generateSeedData() {
  // ── Generate 100 Users ──
  const users = [];
  for (let i = 0; i < 100; i++) {
    const first = FIRST_NAMES[i % FIRST_NAMES.length];
    const last = LAST_NAMES[i % LAST_NAMES.length];
    const suffix = i >= 50 ? (Math.floor(i / 50) + 1) : '';
    users.push(createUser({
      id: makeId('a', i + 1),
      name: `${first} ${last}`,
      email: `${first.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '')}.${last.toLowerCase()}${suffix}@email.com`,
    }));
  }

  // ── Generate 150 Cars ──
  const cars = [];
  let carIdx = 0;
  for (const entry of CAR_CATALOG) {
    for (const model of entry.models) {
      if (carIdx >= 150) break;
      cars.push(createCar({
        id: makeId('b', carIdx + 1),
        brand: entry.brand,
        model,
        available: true,
      }));
      carIdx++;
    }
    if (carIdx >= 150) break;
  }

  // ── Generate 800+ Rentals (spanning 2024-01 to 2025-12) ──
  const rentals = [];
  const startYear = 2024;
  const rng = seedRandom(42); // deterministic pseudo-random

  for (let i = 0; i < 850; i++) {
    const userIdx = Math.floor(rng() * users.length);
    const carIdx2 = Math.floor(rng() * cars.length);
    const monthOffset = Math.floor(rng() * 24); // 0-23 months
    const dayStart = 1 + Math.floor(rng() * 25);
    const duration = 1 + Math.floor(rng() * 14); // 1-14 days

    const startMonth = monthOffset % 12;
    const startYr = startYear + Math.floor(monthOffset / 12);
    const start = new Date(startYr, startMonth, dayStart);
    const end = new Date(start.getTime() + duration * 86400000);

    const startStr = start.toISOString().split('T')[0];
    const endStr = end.toISOString().split('T')[0];

    rentals.push(createRental({
      id: makeId('c', i + 1),
      user_id: users[userIdx].id,
      car_id: cars[carIdx2].id,
      start_date: startStr,
      end_date: endStr,
    }));
  }

  // Mark ~30% of cars as unavailable (currently rented)
  const unavailableCount = Math.floor(cars.length * 0.3);
  for (let i = 0; i < unavailableCount; i++) {
    const idx = Math.floor(rng() * cars.length);
    cars[idx].available = false;
  }

  return { users, cars, rentals };
}

// Simple seeded PRNG (mulberry32)
function seedRandom(seed) {
  return function() {
    seed |= 0; seed = seed + 0x6D2B79F5 | 0;
    let t = Math.imul(seed ^ seed >>> 15, 1 | seed);
    t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t;
    return ((t ^ t >>> 14) >>> 0) / 4294967296;
  };
}

/**
 * Seeds a single repository with sample data.
 * Uses batching for performance with large datasets.
 */
async function seedRepository(repo) {
  const { users, cars, rentals } = generateSeedData();
  const name = repo.name;

  console.log(`[${name}] Seeding ${users.length} users...`);
  let userOk = 0;
  for (const u of users) {
    try { await repo.createUser(u); userOk++; } catch (e) { /* skip duplicates */ }
  }
  console.log(`[${name}]   ✓ ${userOk} users loaded`);

  console.log(`[${name}] Seeding ${cars.length} cars...`);
  let carOk = 0;
  for (const c of cars) {
    try { await repo.createCar(c); carOk++; } catch (e) { /* skip duplicates */ }
  }
  console.log(`[${name}]   ✓ ${carOk} cars loaded`);

  console.log(`[${name}] Seeding ${rentals.length} rentals...`);
  let rentalOk = 0;
  for (const r of rentals) {
    try { await repo.createRental(r); rentalOk++; } catch (e) { /* skip duplicates */ }
  }
  console.log(`[${name}]   ✓ ${rentalOk} rentals loaded`);

  // Mark unavailable cars
  const unavailable = cars.filter(c => !c.available);
  for (const c of unavailable) {
    try { await repo.updateCarAvailability(c.id, false); } catch (e) { /* ignore */ }
  }

  console.log(`[${name}] Seeding complete ✓ (${userOk} users, ${carOk} cars, ${rentalOk} rentals)`);
  return { users: userOk, cars: carOk, rentals: rentalOk };
}

module.exports = { generateSeedData, seedRepository };
