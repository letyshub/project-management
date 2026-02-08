.PHONY: help dev dev-down build test lint migrate-up migrate-down

help: ## Show this help
	@grep -E '^[a-zA-Z_-]+:.*?## .*$$' $(MAKEFILE_LIST) | sort | awk 'BEGIN {FS = ":.*?## "}; {printf "\033[36m%-20s\033[0m %s\n", $$1, $$2}'

dev: ## Start development environment
	docker compose up --build

dev-down: ## Stop development environment
	docker compose down

dev-logs: ## Tail development logs
	docker compose logs -f

build: ## Build production images
	docker compose -f docker-compose.prod.yml build

test: ## Run all tests
	cd backend && go test ./...
	cd frontend && npm test -- --watch=false --browsers=ChromeHeadless

test-backend: ## Run backend tests
	cd backend && go test ./...

test-frontend: ## Run frontend tests
	cd frontend && npm test -- --watch=false --browsers=ChromeHeadless

lint: ## Run linters
	cd backend && golangci-lint run ./...
	cd frontend && npx ng lint

lint-backend: ## Run backend linter
	cd backend && golangci-lint run ./...

lint-frontend: ## Run frontend linter
	cd frontend && npx ng lint

migrate-up: ## Run database migrations up
	cd backend && migrate -path migrations -database "$${DATABASE_URL}" up

migrate-down: ## Rollback last migration
	cd backend && migrate -path migrations -database "$${DATABASE_URL}" down 1
