# Project Management App

A full-stack task and project management application (mini Jira) with Kanban boards, drag-and-drop, comments, labels, and JWT authentication.

## Tech Stack

**Backend:** Go 1.23 with Chi v5 router, pgx v5 (PostgreSQL driver), JWT authentication
**Frontend:** Angular 19 (standalone components), Angular Material, Angular CDK drag-and-drop
**Database:** PostgreSQL 16
**DevOps:** Docker Compose, multi-stage Dockerfiles

## Features

- User registration and login with JWT access/refresh token rotation
- Project CRUD with automatic board and column creation
- Kanban board with drag-and-drop task management
- Fractional indexing for O(1) position updates
- Task filtering by priority
- Comment threads on tasks (create, edit, delete)
- Project labels with color picker and task association
- User profile page
- Responsive Material Design UI

## Project Structure

```
project-management/
├── backend/                  # Go REST API
│   ├── cmd/api/              # Application entrypoint
│   ├── internal/
│   │   ├── config/           # Environment configuration
│   │   ├── domain/           # Domain models and repository interfaces
│   │   ├── handler/          # HTTP handlers (controllers)
│   │   ├── middleware/       # Auth and logging middleware
│   │   ├── repository/       # PostgreSQL implementations
│   │   └── service/          # Business logic layer
│   └── migrations/           # SQL migration files
├── frontend/                 # Angular 19 SPA
│   └── src/app/
│       ├── core/             # Auth, API services, guards, interceptors
│       └── features/         # Lazy-loaded feature modules
│           ├── auth/         # Login/Register
│           ├── board/        # Kanban board with drag-and-drop
│           ├── profile/      # User profile
│           └── projects/     # Project list and detail
└── docker-compose.yml        # Development environment
```

## Getting Started

### Prerequisites

- Go 1.23+
- Node.js 20+
- PostgreSQL 16+ (or Docker)

### Quick Start with Docker

```bash
docker compose up -d
```

This starts:
- **API** at `http://localhost:8080` (with hot-reload via Air)
- **Frontend** at `http://localhost:4200`
- **PostgreSQL** at `localhost:5432`

### Manual Setup

**Database:**

```bash
# Create database
createdb project_management

# Run migrations
cd backend
for f in migrations/*.up.sql; do psql -d project_management -f "$f"; done
```

**Backend:**

```bash
cd backend
cp .env.example .env   # Edit with your DB credentials
go mod download
go run ./cmd/api
```

**Frontend:**

```bash
cd frontend
npm ci
npx ng serve
```

Open `http://localhost:4200` in your browser.

## API Endpoints

### Auth (Public)
| Method | Path | Description |
|--------|------|-------------|
| POST | `/api/v1/auth/register` | Register new user |
| POST | `/api/v1/auth/login` | Login |
| POST | `/api/v1/auth/refresh` | Refresh access token |
| POST | `/api/v1/auth/logout` | Logout |

### Profile (Authenticated)
| Method | Path | Description |
|--------|------|-------------|
| GET | `/api/v1/me` | Get current user |
| PATCH | `/api/v1/me` | Update profile |

### Projects
| Method | Path | Description |
|--------|------|-------------|
| POST | `/api/v1/projects` | Create project |
| GET | `/api/v1/projects` | List my projects |
| GET | `/api/v1/projects/:id` | Get project |
| PATCH | `/api/v1/projects/:id` | Update project |
| DELETE | `/api/v1/projects/:id` | Delete project |

### Boards & Columns
| Method | Path | Description |
|--------|------|-------------|
| POST | `/api/v1/projects/:id/boards` | Create board |
| GET | `/api/v1/projects/:id/boards` | List boards |
| GET | `/api/v1/boards/:id` | Get board |
| POST | `/api/v1/boards/:id/columns` | Create column |
| GET | `/api/v1/boards/:id/columns` | List columns |

### Tasks
| Method | Path | Description |
|--------|------|-------------|
| POST | `/api/v1/columns/:id/tasks` | Create task |
| GET | `/api/v1/boards/:id/tasks` | List tasks (supports filters) |
| PATCH | `/api/v1/tasks/:id` | Update task |
| PUT | `/api/v1/tasks/:id/move` | Move task (column + position) |
| DELETE | `/api/v1/tasks/:id` | Delete task |

### Comments
| Method | Path | Description |
|--------|------|-------------|
| POST | `/api/v1/tasks/:id/comments` | Add comment |
| GET | `/api/v1/tasks/:id/comments` | List comments |
| PATCH | `/api/v1/comments/:id` | Edit comment |
| DELETE | `/api/v1/comments/:id` | Delete comment |

### Labels
| Method | Path | Description |
|--------|------|-------------|
| POST | `/api/v1/projects/:id/labels` | Create label |
| GET | `/api/v1/projects/:id/labels` | List project labels |
| DELETE | `/api/v1/labels/:id` | Delete label |
| POST | `/api/v1/tasks/:id/labels` | Add label to task |
| DELETE | `/api/v1/tasks/:tid/labels/:lid` | Remove label from task |
| GET | `/api/v1/tasks/:id/labels` | List task labels |

## Environment Variables

```env
# backend/.env
DB_HOST=localhost
DB_PORT=5432
DB_USER=postgres
DB_PASSWORD=postgres
DB_NAME=project_management
DB_SSLMODE=disable
SERVER_PORT=8080
JWT_SECRET=your-secret-key
JWT_ACCESS_EXPIRY=15m
JWT_REFRESH_EXPIRY=168h
CORS_ORIGINS=http://localhost:4200
```

## Architecture Decisions

- **Chi v5** - stdlib-compatible router, zero external deps, idiomatic Go
- **pgx v5** - High-performance PostgreSQL driver (no ORM overhead)
- **Clean Architecture** - domain/service/handler/repository layers with interfaces
- **Fractional Indexing** - FLOAT positions for O(1) drag-and-drop reordering
- **JWT + Refresh Rotation** - 15min access tokens, 7-day refresh with rotation
- **Angular Standalone** - No NgModules, tree-shakable, lazy-loaded routes
- **Signals** - Angular signals for reactive UI state

## License

MIT
