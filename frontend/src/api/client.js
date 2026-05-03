const API_BASE = 'http://localhost:8088/api';

const DB_PREFIXES = {
  mysql: `${API_BASE}/mysql`,
  mongo: `${API_BASE}/mongo`,
  cassandra: `${API_BASE}/cassandra`,
  neo4j: `${API_BASE}/neo4j`,
};

async function request(url, options = {}) {
  const res = await fetch(url, {
    headers: { 'Content-Type': 'application/json' },
    ...options,
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: res.statusText }));
    throw new Error(err.error || 'Request failed');
  }
  return res.json();
}

export function createApiClient(db) {
  const base = DB_PREFIXES[db];
  return {
    getUsers: () => request(`${base}/users`),
    createUser: (data) => request(`${base}/users`, { method: 'POST', body: JSON.stringify(data) }),
    getCars: () => request(`${base}/cars`),
    createCar: (data) => request(`${base}/cars`, { method: 'POST', body: JSON.stringify(data) }),
    getRentals: () => request(`${base}/rentals`),
    createRental: (data) => request(`${base}/rentals`, { method: 'POST', body: JSON.stringify(data) }),
    getRentalsByUser: (id) => request(`${base}/rentals/by-user/${id}`),
    getRentalsByCar: (id) => request(`${base}/rentals/by-car/${id}`),
    getGraph: () => request(`${base}/graph`),
  };
}

export async function seedAll() {
  return request(`${API_BASE}/seed-all`, { method: 'POST' });
}

export async function runETL() {
  return request(`${API_BASE}/etl`, { method: 'POST' });
}

export async function healthCheck() {
  return request(`${API_BASE}/health`);
}
