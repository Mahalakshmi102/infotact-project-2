# StreamWeaver Database Architecture

## Overview
StreamWeaver is a streaming ETL pipeline platform capable of handling large-scale datasets using native Node.js streams and MongoDB.

The Week 1 database architecture establishes the following 5 initial collections:
1. **`users`**: User identity, authentication, and access control.
2. **`datasets`**: File metadata, storage details, row metrics, and upload states.
3. **`pipelines`**: Configuration and sequence of transformations for data workflows.
4. **`etl_jobs`**: Execution instances of pipelines running on datasets.
5. **`transformations`**: Reusable data transformation definitions (filter, map, aggregate, clean).

---

## Entity Relationship (ER) Diagram

```mermaid
erDiagram
    User ||--o{ Dataset : "uploads"
    User ||--o{ Pipeline : "creates"
    Pipeline ||--|{ Transformation : "contains"
    Dataset ||--o{ EtlJob : "processed_by"
    Pipeline ||--o{ EtlJob : "executed_in"

    User {
        ObjectId _id PK
        string name
        string email UK "Indexed, unique, lowercase"
        string password "Bcrypt hashed"
        string role "user | admin"
        date createdAt
        date updatedAt
    }

    Dataset {
        ObjectId _id PK
        string fileName "Original file name"
        number fileSize "File size in bytes"
        string fileType "MIME type (e.g. text/csv)"
        number totalRows "Calculated via stream"
        string status "pending | processing | completed | failed"
        ObjectId uploadedBy FK "References User"
        string filePath "Relative storage path"
        array headers "Detected column headers"
        number processingTimeMs "Stream processing time"
        date createdAt
        date updatedAt
    }

    Pipeline {
        ObjectId _id PK
        string name
        string description
        ObjectId createdBy FK "References User"
        string status "active | draft | archived"
        array transformationSteps "Ordered list of transformations"
        date createdAt
        date updatedAt
    }

    Transformation {
        ObjectId _id PK
        string name
        string type "filter | map | aggregate | deduplicate | custom"
        object config "Configuration parameters"
        ObjectId createdBy FK "References User"
        date createdAt
        date updatedAt
    }

    EtlJob {
        ObjectId _id PK
        ObjectId datasetId FK "References Dataset"
        ObjectId pipelineId FK "References Pipeline"
        ObjectId triggeredBy FK "References User"
        string status "queued | running | completed | failed"
        number processedRows
        number errorRows
        date startedAt
        date completedAt
        string logSummary
        date createdAt
    }
```

---

## Collections Specification

### 1. `users` Collection
- **Indexes**:
  - `{ email: 1 }` (Unique)
- **Validation**:
  - Email format regex validation
  - Minimum password length: 6 characters (hashed via bcrypt before saving)

### 2. `datasets` Collection
- **Indexes**:
  - `{ uploadedBy: 1, createdAt: -1 }` (Quick user dataset listing)
  - `{ status: 1 }` (Querying pending/processing jobs)
- **Validation & Defaults**:
  - `status`: Default `'pending'`, enum: `['pending', 'processing', 'completed', 'failed']`
  - `totalRows`: Default `0`

### 3. `pipelines` Collection
- Stores workflow configurations linking multiple transformation steps.

### 4. `etl_jobs` Collection
- Tracks real-time job execution state, row throughput, error rates, and timing.

### 5. `transformations` Collection
- Modular, pluggable transformations reusable across pipelines.
