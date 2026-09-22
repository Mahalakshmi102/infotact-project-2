# StreamWeaver

> Scalable Large File Processing & Streaming ETL Pipeline Platform.

StreamWeaver processes large CSV datasets using **native Node.js streams** and **MongoDB** without buffering entire files into memory.

---

## Week 1 Deliverables Summary

| Day | Feature / Module | Status | Deliverables |
|---|---|---|---|
| **Day 1** | Project Setup & Architecture | Verified | MongoDB connection, event listeners, 5 initial collections (`users`, `datasets`, `pipelines`, `etl_jobs`, `transformations`), Schema ER diagram ([docs/database_schema.md](docs/database_schema.md)) |
| **Day 2** | Authentication & Basic Dashboard | Verified | User Schema, unique email index, bcrypt hashing, JWT auth, CRUD test scripts |
| **Day 3** | Large File Upload Module | Verified | Dataset model, Multer streaming storage, metadata tracking (filename, size, type, status, headers) |
| **Day 4** | Native Node.js Streaming | Verified | High-throughput streaming parser (`csv-parser` + `streamProcessor.js`), low memory delta, sample dataset generator (`small.csv`, `medium.csv`, `large.csv`) |
| **Day 5** | Week 1 Integration & Demo | Verified | React Dashboard UI + End-to-end demo flow (`Login -> Dashboard -> Upload CSV -> Backend Stream -> MongoDB -> Status`) |

---

## Architecture

See [docs/database_schema.md](docs/database_schema.md) for full collection specifications and Mermaid Entity-Relationship (ER) diagram.

---

## Quick Start

### 1. Backend Server Setup
```bash
cd server
npm install
npm run test:db      # Test Day 1 MongoDB connection & collections
npm run test:auth    # Test Day 2 Auth, unique index & CRUD
npm run test:stream  # Test Day 3 & 4 streaming with small, medium, and large CSVs
npm start            # Start backend server on http://localhost:5000
```

### 2. Frontend React Dashboard Setup
```bash
cd client
npm install
npm run dev          # Start React dashboard on http://localhost:5173
```

---

## Automated Verification Suite

Run all automated test scripts:
```bash
# Day 1 DB & Schema:
node server/scripts/test-db-connection.js

# Day 2 User Auth & CRUD:
node server/scripts/test-auth.js

# Day 3 & 4 Streaming on small (100 rows), medium (10k rows), large (50k rows):
node server/scripts/test-streaming.js

# Day 5 Full E2E Flow:
node server/scripts/test-e2e.js
```
