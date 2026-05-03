# Polyglot Car Rental System — Project Report

## Table of Contents

1. [Introduction](#1-introduction)
2. [Technology Stack](#2-technology-stack)
3. [System Architecture](#3-system-architecture)
4. [Database Implementations](#4-database-implementations)
5. [ETL Pipeline & Data Migration](#5-etl-pipeline--data-migration)
6. [Frontend Dashboard](#6-frontend-dashboard)
7. [How to Run the Project](#7-how-to-run-the-project)
8. [Screenshots](#8-screenshots)
9. [Conclusion](#9-conclusion)

---

## 1. Introduction

### 1.1 Project Objective

This project demonstrates **polyglot persistence** — the concept of using multiple, specialized database technologies within a single application. We implement a **Car Rental System** that simultaneously maintains the same business data (Users, Cars, Rentals) across four fundamentally different database paradigms:

| Database | Paradigm | Use Case |
|----------|----------|----------|
| **MySQL** | Relational (SQL) | Normalized tables with foreign keys, ACID transactions |
| **MongoDB** | Document Store (NoSQL) | Flexible schema, embedded/referenced documents |
| **Apache Cassandra** | Wide-Column Store (NoSQL) | Query-driven denormalized tables, high write throughput |
| **Neo4j** | Graph Database (NoSQL) | Node-relationship model, traversal queries |

The project allows side-by-side comparison of how the same data is modeled, stored, and queried differently across each paradigm. An **ETL pipeline** migrates data from MySQL (source of truth) to the other three databases, demonstrating real-world data transformation and synchronization patterns.

### 1.2 Dataset Scale

The system is populated with **1,067 records per database** (4,268 total across all four):

- **100 Users** — realistic names and emails
- **117 Cars** — 20 real brands (BMW, Tesla, Peugeot, etc.) with authentic models
- **850 Rentals** — spanning January 2024 to December 2025 with varied durations

---

## 2. Technology Stack

### 2.1 Backend

| Component | Technology | Role |
|-----------|-----------|------|
| Runtime | **Node.js** (v18+) | JavaScript server runtime |
| Framework | **Express.js** | REST API routing and middleware |
| MySQL Driver | `mysql2/promise` | Connection pooling, prepared statements |
| MongoDB Driver | `mongodb` (official) | Native MongoDB client |
| Cassandra Driver | `cassandra-driver` (DataStax) | Prepared statements, batch operations |
| Neo4j Driver | `neo4j-driver` (official) | Bolt protocol, Cypher query execution |
| Utilities | `uuid`, `cors`, `dotenv` | UUID generation, CORS, environment config |

### 2.2 Frontend

| Component | Technology | Role |
|-----------|-----------|------|
| Framework | **React 18** (via Vite) | Component-based UI |
| Build Tool | **Vite** | Fast HMR development server |
| Graph Visualization | `vis-network` + `vis-data` | Interactive Neo4j graph rendering |
| Styling | **Vanilla CSS** | Custom glassmorphism dark theme |
| Typography | **Inter** (Google Fonts) | Modern sans-serif font |

### 2.3 Infrastructure

| Component | Technology | Role |
|-----------|-----------|------|
| Containerization | **Docker** + **Docker Compose** | Database orchestration |
| MySQL | `mysql:8.0` | Relational database container |
| MongoDB | `mongo:7` | Document database container |
| Cassandra | `cassandra:4.1` | Wide-column database container |
| Neo4j | `neo4j:5` | Graph database container |

---

## 3. System Architecture

### 3.1 Overview

```
┌──────────────────────────────────────────────────────────┐
│                   Frontend (React + Vite)                │
│              http://localhost:5173                        │
│   ┌──────────┬──────────┬──────────┬──────────┐         │
│   │  MySQL   │ MongoDB  │Cassandra │  Neo4j   │         │
│   │  Panel   │  Panel   │  Panel   │Panel+Graph│        │
│   └────┬─────┴────┬─────┴────┬─────┴────┬─────┘        │
└────────┼──────────┼──────────┼──────────┼────────────────┘
         │          │          │          │  REST API
┌────────┼──────────┼──────────┼──────────┼────────────────┐
│        ▼          ▼          ▼          ▼                 │
│   /api/mysql  /api/mongo /api/cassandra /api/neo4j       │
│        │          │          │          │                 │
│        ▼          ▼          ▼          ▼                 │
│   ┌─────────────────────────────────────────┐            │
│   │         Handler Factory (shared)         │           │
│   └──────────────────┬──────────────────────┘            │
│                      ▼                                    │
│   ┌─────────────────────────────────────────┐            │
│   │       RentalService (business logic)     │           │
│   └──────────────────┬──────────────────────┘            │
│                      ▼                                    │
│   ┌──────────┬──────────┬──────────┬──────────┐         │
│   │  MySQL   │  Mongo   │Cassandra │  Neo4j   │         │
│   │  Repo    │  Repo    │  Repo    │  Repo    │         │
│   └────┬─────┴────┬─────┴────┬─────┴────┬─────┘        │
│        Backend (Express.js) — http://localhost:8088       │
└────────┼──────────┼──────────┼──────────┼────────────────┘
         ▼          ▼          ▼          ▼
    ┌─────────┐┌─────────┐┌─────────┐┌─────────┐
    │ MySQL   ││ MongoDB ││Cassandra││  Neo4j  │
    │ :3306   ││ :27017  ││ :9042   ││ :7687   │
    └─────────┘└─────────┘└─────────┘└─────────┘
              Docker Containers
```

### 3.2 Design Patterns

**Repository Pattern**: A `BaseRepository` abstract class defines the contract (interface) that all four database implementations must follow. This ensures identical method signatures (`createUser`, `getCars`, `getRentals`, etc.) regardless of the underlying storage engine.

**Service Layer with Dependency Injection**: The `RentalService` class contains all business logic (validation, car availability checks) and receives a repository instance via constructor injection. The same service class is instantiated four times — once per database — ensuring identical business rules.

**Handler Factory**: A single `createHandler()` function generates Express routers. It is called four times with different service instances, producing `/api/mysql`, `/api/mongo`, `/api/cassandra`, and `/api/neo4j` route namespaces from the same code.

### 3.3 Project Structure

```
project/
├── docker-compose.yml              # All 4 database containers
├── .env                            # Environment configuration
├── screenshots/                    # Report screenshots
├── backend/
│   ├── server.js                   # Entry point — wires all databases
│   ├── config/config.js            # Environment-based configuration
│   ├── domain/models.js            # User, Car, Rental factory functions
│   ├── repository/
│   │   ├── interfaces.js           # BaseRepository abstract class
│   │   ├── mysql/mysql_repo.js     # MySQL implementation
│   │   ├── mongo/mongo_repo.js     # MongoDB implementation
│   │   ├── cassandra/cassandra_repo.js  # Cassandra implementation
│   │   └── neo4j/neo4j_repo.js     # Neo4j implementation
│   ├── service/rental_service.js   # Shared business logic
│   ├── handler/handler.js          # REST route factory
│   ├── seed/seeder.js              # Data generation (1000+ records)
│   ├── etl/transformer.js          # MySQL → others pipeline
│   ├── Dockerfile
│   └── package.json
└── frontend/
    ├── src/
    │   ├── App.jsx                 # Root — navigation + 4-panel grid
    │   ├── api/client.js           # HTTP client per database
    │   ├── hooks/useDbData.js      # Data fetching React hook
    │   ├── components/
    │   │   ├── DatabasePanel.jsx   # Generic panel with tabs
    │   │   ├── DataTable.jsx       # Reusable data table
    │   │   ├── Modal.jsx           # CRUD form dialogs
    │   │   ├── Neo4jGraph.jsx      # vis-network graph + expand
    │   │   ├── ETLVisualization.jsx # ETL pipeline animation
    │   │   └── DbLogos.jsx         # SVG database logos
    │   └── index.css               # Glassmorphism dark theme
    ├── Dockerfile
    └── package.json
```

---

## 4. Database Implementations

### 4.1 MySQL — Relational Model

MySQL uses a **normalized schema** with three tables connected by foreign keys:

```sql
CREATE TABLE users (
    id VARCHAR(36) PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    email VARCHAR(255) NOT NULL UNIQUE
);

CREATE TABLE cars (
    id VARCHAR(36) PRIMARY KEY,
    brand VARCHAR(255) NOT NULL,
    model VARCHAR(255) NOT NULL,
    available BOOLEAN DEFAULT TRUE
);

CREATE TABLE rentals (
    id VARCHAR(36) PRIMARY KEY,
    user_id VARCHAR(36) NOT NULL,
    car_id VARCHAR(36) NOT NULL,
    start_date DATE NOT NULL,
    end_date DATE NOT NULL,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (car_id) REFERENCES cars(id) ON DELETE CASCADE
);
```

**Key characteristics:**
- Schema enforced at the database level with constraints
- `JOIN` queries enrich rental data with user/car names
- `ON DELETE CASCADE` maintains referential integrity
- Migration tracking table inspired by `golang-migrate`

### 4.2 MongoDB — Document Model

MongoDB stores data in **three collections** using a reference pattern (IDs stored as references rather than embedded documents):

```javascript
// users collection
{ _id: "uuid", name: "Alice Martin", email: "alice@email.com" }

// cars collection
{ _id: "uuid", brand: "BMW", model: "Serie 3", available: true }

// rentals collection
{ _id: "uuid", user_id: "user-uuid", car_id: "car-uuid",
  start_date: "2024-03-15", end_date: "2024-03-20" }
```

**Key characteristics:**
- No schema enforcement — flexibility for evolving data models
- Indexes on `email` (unique), `user_id`, and `car_id` for query performance
- Rental enrichment done via **bulk map lookups** (not individual queries) for performance at scale
- `_id` field maps directly to our application UUID

### 4.3 Cassandra — Wide-Column Model

Cassandra uses a **query-driven, denormalized** design with five tables:

```cql
-- Core tables
CREATE TABLE users (id UUID PRIMARY KEY, name TEXT, email TEXT);
CREATE TABLE cars (id UUID PRIMARY KEY, brand TEXT, model TEXT, available BOOLEAN);
CREATE TABLE rentals (id UUID PRIMARY KEY, user_id UUID, car_id UUID,
                      start_date TEXT, end_date TEXT);

-- Query-optimized denormalized tables
CREATE TABLE rentals_by_user (
    user_id UUID, rental_id UUID, car_id UUID,
    start_date TEXT, end_date TEXT,
    PRIMARY KEY (user_id, start_date, rental_id)
) WITH CLUSTERING ORDER BY (start_date DESC, rental_id ASC);

CREATE TABLE rentals_by_car (
    car_id UUID, rental_id UUID, user_id UUID,
    start_date TEXT, end_date TEXT,
    PRIMARY KEY (car_id, start_date, rental_id)
) WITH CLUSTERING ORDER BY (start_date DESC, rental_id ASC);
```

**Key characteristics:**
- **No JOINs** — data is duplicated across tables to support specific query patterns
- `rentals_by_user` partitions by `user_id` for "find all rentals for a user" queries
- `rentals_by_car` partitions by `car_id` for "find all rentals for a car" queries
- **Batch writes** ensure all denormalized tables stay consistent when creating a rental
- UUIDs use Cassandra's native `UUID` type with strict 8-4-4-4-12 hex format

### 4.4 Neo4j — Graph Model

Neo4j represents the domain as a **property graph**:

```
(:User {id, name, email}) -[:RENTED {id, start_date, end_date}]-> (:Car {id, brand, model, available})
```

**Key characteristics:**
- Users and Cars are **nodes** with properties
- Rentals are **relationships** (edges) with date properties stored directly on the edge
- `MERGE` with rental `id` key prevents duplicate relationships
- Uniqueness constraints on `User.id` and `Car.id`
- A dedicated `/api/neo4j/graph` endpoint returns all nodes and edges for interactive visualization
- Graph traversal queries using **Cypher** query language

---

## 5. ETL Pipeline & Data Migration

### 5.1 Architecture

The ETL (Extract, Transform, Load) pipeline treats **MySQL as the source of truth** and synchronizes data to the other three databases:

```
MySQL (Source)
    │
    ├── EXTRACT: Read all users, cars, rentals via SQL queries
    │
    ├── TRANSFORM:
    │   ├── Strip JOIN fields from rentals (normalize for insertion)
    │   ├── Map relational FK references → document references (MongoDB)
    │   ├── Prepare batch inserts for denormalized tables (Cassandra)
    │   └── Convert to node/relationship creation queries (Neo4j)
    │
    └── LOAD (parallel to 3 targets):
        ├── MongoDB:   insertOne per document, skip duplicates
        ├── Cassandra: batch INSERT with prepared statements
        └── Neo4j:     MERGE nodes + MERGE relationships
```

### 5.2 Implementation Details

The ETL transformer (`etl/transformer.js`) implements an idempotent pipeline:

1. **Extract**: Queries MySQL for all users, cars, and rentals (with JOIN enrichment stripped)
2. **Transform**: Normalizes rental objects by removing JOIN-derived fields (`user_name`, `car_brand`, etc.) to produce clean insertion records
3. **Load**: Iterates over each target database, inserting users → cars → rentals in order (respecting dependency order). Duplicate entries are silently skipped via try/catch

**Idempotency** is achieved through:
- MySQL/MongoDB/Cassandra: Primary key constraints prevent duplicate inserts
- Neo4j: `MERGE` operations match on unique identifiers before creating

### 5.3 Frontend ETL Visualization

The frontend includes a dedicated **ETL Pipeline** view that provides:
- An animated flow diagram showing MySQL → Transform → MongoDB/Cassandra/Neo4j
- Real-time console logs with timestamps showing each pipeline stage
- Completion statistics showing record counts per target database
- A **Schema Comparison** panel showing how data is modeled differently across all four databases

*(See Screenshot: ETL Pipeline — Section 8)*

---

## 6. Frontend Dashboard

### 6.1 Overview

The React frontend provides a **four-panel dashboard** where each panel independently connects to one of the four database APIs. This enables real-time side-by-side comparison of the same data stored across different paradigms.

### 6.2 Panel Features

Each database panel includes:
- **Header**: SVG database logo, database name, paradigm type, and live record count badges (Users/Cars/Rentals)
- **Tabs**: Users, Cars, Rentals (+ Graph tab for Neo4j)
- **Data Tables**: Sortable tables with truncated UUIDs, availability badges
- **CRUD Actions**: "+ User", "+ Car", "+ Rental" buttons opening modal forms
- **Refresh**: Manual data refresh per panel

### 6.3 Neo4j Graph Visualization

The Neo4j panel includes an exclusive **Graph** tab that renders an interactive network visualization using the `vis-network` library:

- **Purple circles** represent User nodes
- **Orange rectangles** represent Car nodes
- **Gray lines** represent RENTED relationships
- Hover tooltips show entity details (email, availability, rental dates)
- **Expand button** opens a fullscreen overlay for detailed graph exploration
- The expanded view includes a color legend and node/edge statistics

The graph uses the `forceAtlas2Based` physics solver for aesthetically pleasing, force-directed layouts.

*(See Screenshot: Neo4j Graph — Section 8)*

### 6.4 Global Controls

The header provides:
- **Navigation**: Dashboard / ETL Pipeline view switching
- **Health Check**: Verifies connectivity to all four databases
- **Seed All**: Populates all databases with 1,067 records each
- **Database badges**: Visual indicators showing which databases are in use

### 6.5 Design

The UI uses a **glassmorphism dark theme** featuring:
- Dark background (`#0a0e1a`) with colored radial gradient accents per database
- `backdrop-filter: blur()` for frosted glass card effects
- Database-specific accent colors (MySQL teal, MongoDB green, Cassandra blue, Neo4j orange)
- Inter typeface from Google Fonts
- Responsive grid layout (2×2 on desktop, single column on mobile)

---

## 7. How to Run the Project

### 7.1 Prerequisites

- **Docker Desktop** (for database containers)
- **Node.js** v18+ and **npm**

### 7.2 Setup Steps

```bash
# 1. Clone / navigate to project
cd project/

# 2. Start database containers
docker-compose up -d mysql mongodb cassandra neo4j

# 3. Wait ~30 seconds for Cassandra to initialize, then:

# 4. Install backend dependencies and start
cd backend/
npm install
node server.js
# Server starts on http://localhost:8088
# All 4 databases connect automatically with retry logic

# 5. In a new terminal — install frontend and start
cd frontend/
npm install
npx vite --host
# Frontend starts on http://localhost:5173

# 6. Seed databases (via browser or API)
# Click "Seed All" in the UI, or:
curl -X POST http://localhost:8088/api/seed-all

# 7. Run ETL pipeline (optional — syncs MySQL → others)
# Click "ETL Pipeline" tab in the UI, or:
curl -X POST http://localhost:8088/api/etl
```

### 7.3 API Endpoints

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/{db}/users` | GET | List all users |
| `/api/{db}/users` | POST | Create a user |
| `/api/{db}/cars` | GET | List all cars |
| `/api/{db}/cars` | POST | Create a car |
| `/api/{db}/rentals` | GET | List all rentals (enriched) |
| `/api/{db}/rentals` | POST | Rent a car |
| `/api/{db}/rentals/by-user/:id` | GET | Rentals by user |
| `/api/{db}/rentals/by-car/:id` | GET | Rentals by car |
| `/api/neo4j/graph` | GET | Graph data for visualization |
| `/api/seed-all` | POST | Seed all 4 databases |
| `/api/etl` | POST | Run ETL MySQL → others |
| `/api/health` | GET | Health check all databases |

Where `{db}` is one of: `mysql`, `mongo`, `cassandra`, `neo4j`

### 7.4 Docker Compose Services

```yaml
services:
  mysql:      # Port 3306 — Relational DB
  mongodb:    # Port 27017 — Document DB
  cassandra:  # Port 9042 — Wide-Column DB
  neo4j:      # Ports 7474 (HTTP) + 7687 (Bolt) — Graph DB
```

All containers include health checks. The backend implements a `connectWithRetry` mechanism (up to 15 attempts with 5-second delays) to handle container startup ordering.

---

## 8. Screenshots

### 8.1 Dashboard — Four-Panel View

The main dashboard showing all four database panels simultaneously, each displaying 100 Users, 117 Cars, and 850 Rentals with their respective database logos.

> **File**: `screenshots/dashboard.png`

### 8.2 Dashboard — Cars & Rentals Tabs

The MySQL panel showing the Cars tab with availability badges (✓ Available / ✗ Rented), and other panels displaying user data.

> **File**: `screenshots/dashboard_cars.png`

### 8.3 ETL Pipeline — Flow Diagram

The ETL visualization page showing the data migration pipeline: MySQL (source) → Transform → MongoDB / Cassandra / Neo4j (targets), with "Run ETL Pipeline" and "Show Schema Comparison" controls.

> **File**: `screenshots/etl_pipeline.png`

### 8.4 ETL Pipeline — Running with Logs

The ETL pipeline mid-execution, showing green checkmarks on completed targets, real-time timestamped logs, and details about Cassandra partition table writes and Neo4j node creation.

> **File**: `screenshots/etl_running.png`

### 8.5 Neo4j Graph Visualization

The expanded fullscreen graph view showing 217 nodes (100 User nodes in purple, 117 Car nodes in orange) connected by 850 RENTED relationship edges, with a color legend in the header.

> **File**: `screenshots/neo4j_graph.png`

---

## 9. Conclusion

### 9.1 Key Takeaways

This project demonstrates that **polyglot persistence** is a practical architecture pattern for applications that benefit from multiple data access patterns:

- **MySQL** excels at enforcing data integrity through foreign keys and constraints, making it ideal as a source of truth
- **MongoDB** offers schema flexibility and fast reads for applications that primarily access complete documents
- **Cassandra** provides extreme write scalability through denormalization, at the cost of data duplication and query rigidity
- **Neo4j** naturally represents connected data, making relationship traversals (e.g., "which cars has this user rented?") intuitive through graph patterns

### 9.2 Challenges Solved

| Challenge | Solution |
|-----------|----------|
| N+1 query problem (850 rentals × 2 lookups = 1700 queries) | Bulk pre-loading with in-memory hash maps |
| Neo4j duplicate relationships on re-seeding | `MERGE` with rental ID key instead of `CREATE` |
| Cassandra UUID format requirements | Custom `makeId()` generating valid 8-4-4-4-12 hex UUIDs |
| Cassandra datacenter naming | Updated `localDataCenter` from `dc1` to `datacenter1` (Docker default) |
| Container startup ordering | Retry-based connection logic (15 attempts, 5s delay) |

### 9.3 Data Model Comparison Summary

| Aspect | MySQL | MongoDB | Cassandra | Neo4j |
|--------|-------|---------|-----------|-------|
| Schema | Enforced (DDL) | Flexible | Enforced per table | Schema-free |
| Data Model | Normalized tables | Document collections | Denormalized wide tables | Property graph |
| Relationships | Foreign keys + JOINs | Reference IDs + app-side lookup | Duplicated across tables | Native edges |
| Query Language | SQL | MongoDB Query API | CQL | Cypher |
| Tables/Collections | 3 | 3 | 5 | 2 node types + 1 edge type |
| Rental Access Pattern | `JOIN rentals ON user_id` | `find({user_id})` + lookup | `SELECT FROM rentals_by_user WHERE user_id=?` | `MATCH (u)-[:RENTED]->(c)` |
