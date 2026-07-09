# Help+ Cloud-Native Architecture - Phase 1 Implementation Plan

Building the entire Help+ Cloud-Native Architecture is a large-scale undertaking. To make this manageable, we will approach this iteratively. This plan covers **Phase 1: Foundation & Scaffolding**, which will establish the core infrastructure and microservice skeletons so they can be developed and run locally.

## Goal Description
Set up the foundational infrastructure (databases, message brokers, observability tools) and the directory structure/Dockerfiles for all 13 microservices outlined in the architecture specification. This will provide a fully runnable local development environment using Docker Compose.

## Proposed Changes

### 1. Project Scaffolding
Create the directory structure for all services to isolate their codebases.

#### [NEW] Directories
- `/edge-gateway` (Nginx)
- `/bff-patient`
- `/bff-clinician`
- `/iam-service`
- `/patient-service`
- `/clinical-service`
- `/ai-cds-service`
- `/telehealth-service`
- `/scheduling-service`
- `/interop-gateway`
- `/billing-service`
- `/notification-service`
- `/analytics-service`
- `/audit-service`

### 2. Infrastructure Setup (Docker Compose)
Create a centralized `docker-compose.yml` to manage the core infrastructure dependencies and the services themselves.

#### [NEW] `docker-compose.yml`
Will include definitions for:
- **PostgreSQL**: Shared cluster with multiple logical databases (`iam_db`, `patient_db`, etc.)
- **Redis**: For caching and session management.
- **RabbitMQ**: The event backbone.
- **MLflow**: Model registry.
- **ChromaDB**: Vector database.
- **Prometheus & Grafana**: Observability stack.

### 3. Service Skeletons
For each service, we will create a basic `Dockerfile` to establish the deployment model from the start. (We can decide on the specific programming language/framework for the backend services, e.g., Node.js/Express, Python/FastAPI, Go, or Java/Spring Boot based on your preference).

#### [NEW] `[service-name]/Dockerfile`
Basic container definition for each service.

#### [NEW] `edge-gateway/nginx.conf`
Initial Nginx configuration for reverse proxying to the BFFs.

## User Review Required

> [!IMPORTANT]
> **Technology Stack for Microservices**
> The architecture document doesn't specify the programming languages for the microservices. We need to decide this before generating the service code.
> - **Recommendation**: Python (FastAPI) for AI/CDS and Analytics, Node.js (Express/NestJS) or Go for transactional services (Patient, Clinical, etc.). 
> Please let me know your preferred languages/frameworks for the backend services.

## Open Questions

> [!CAUTION]
> This is a massive system. Building out the full business logic for all 13 services will take many subsequent phases. Are we aligned on starting with just the Docker infrastructure and service skeletons (empty runnable containers) to establish the topology first?

## Verification Plan

### Automated Tests
- N/A for scaffolding.

### Manual Verification
- Run `docker-compose up -d`.
- Verify all infrastructure containers (Postgres, RabbitMQ, etc.) start successfully.
- Verify Nginx is routing traffic correctly on the local exposed ports.
- Verify RabbitMQ management UI is accessible.
- Verify Grafana dashboard is accessible.
