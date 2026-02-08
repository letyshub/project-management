package main

import (
	"context"
	"fmt"
	"log/slog"
	"net/http"
	"os"
	"time"

	"github.com/go-chi/chi/v5"
	chimiddleware "github.com/go-chi/chi/v5/middleware"
	"github.com/go-chi/cors"
	"github.com/jackc/pgx/v5/pgxpool"

	"github.com/letyshub/project-management/internal/config"
	"github.com/letyshub/project-management/internal/handler"
	"github.com/letyshub/project-management/internal/middleware"
	"github.com/letyshub/project-management/internal/repository/postgres"
	"github.com/letyshub/project-management/internal/service"
)

func main() {
	cfg, err := config.Load()
	if err != nil {
		slog.Error("failed to load config", "error", err)
		os.Exit(1)
	}

	// Database
	pool, err := pgxpool.New(context.Background(), cfg.Database.DSN())
	if err != nil {
		slog.Error("failed to connect to database", "error", err)
		os.Exit(1)
	}
	defer pool.Close()

	if err := pool.Ping(context.Background()); err != nil {
		slog.Error("failed to ping database", "error", err)
		os.Exit(1)
	}
	slog.Info("connected to database")

	// Repositories
	userRepo := postgres.NewUserRepo(pool)
	refreshTokenRepo := postgres.NewRefreshTokenRepo(pool)
	projectRepo := postgres.NewProjectRepo(pool)
	boardRepo := postgres.NewBoardRepo(pool)
	columnRepo := postgres.NewColumnRepo(pool)
	taskRepo := postgres.NewTaskRepo(pool)
	commentRepo := postgres.NewCommentRepo(pool)
	labelRepo := postgres.NewLabelRepo(pool)

	// Services
	authService := service.NewAuthService(userRepo, refreshTokenRepo, cfg.JWT)
	projectService := service.NewProjectService(projectRepo, boardRepo, columnRepo)
	boardService := service.NewBoardService(boardRepo, columnRepo, projectRepo)
	taskService := service.NewTaskService(taskRepo, columnRepo, boardRepo, projectRepo)
	commentService := service.NewCommentService(commentRepo)
	labelService := service.NewLabelService(labelRepo, projectRepo)

	// Handlers
	healthHandler := handler.NewHealthHandler()
	authHandler := handler.NewAuthHandler(authService)
	projectHandler := handler.NewProjectHandler(projectService)
	boardHandler := handler.NewBoardHandler(boardService)
	taskHandler := handler.NewTaskHandler(taskService)
	commentHandler := handler.NewCommentHandler(commentService)
	labelHandler := handler.NewLabelHandler(labelService)
	profileHandler := handler.NewProfileHandler(userRepo)

	// Router
	r := chi.NewRouter()

	r.Use(chimiddleware.RequestID)
	r.Use(chimiddleware.RealIP)
	r.Use(middleware.Logger)
	r.Use(chimiddleware.Recoverer)
	r.Use(cors.Handler(cors.Options{
		AllowedOrigins:   cfg.Server.CORSOrigins,
		AllowedMethods:   []string{"GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"},
		AllowedHeaders:   []string{"Accept", "Authorization", "Content-Type"},
		ExposedHeaders:   []string{"Link"},
		AllowCredentials: true,
		MaxAge:           300,
	}))

	r.Route("/api/v1", func(r chi.Router) {
		r.Get("/health", healthHandler.Health)

		// Auth (public)
		r.Post("/auth/register", authHandler.Register)
		r.Post("/auth/login", authHandler.Login)
		r.Post("/auth/refresh", authHandler.Refresh)
		r.Post("/auth/logout", authHandler.Logout)

		// Protected routes
		r.Group(func(r chi.Router) {
			r.Use(middleware.Auth(authService))

			// Profile
			r.Get("/me", profileHandler.GetMe)
			r.Patch("/me", profileHandler.UpdateMe)

			// Projects
			r.Post("/projects", projectHandler.Create)
			r.Get("/projects", projectHandler.List)
			r.Get("/projects/{projectID}", projectHandler.Get)
			r.Patch("/projects/{projectID}", projectHandler.Update)
			r.Delete("/projects/{projectID}", projectHandler.Delete)

			// Boards
			r.Post("/projects/{projectID}/boards", boardHandler.Create)
			r.Get("/projects/{projectID}/boards", boardHandler.List)
			r.Get("/boards/{boardID}", boardHandler.Get)
			r.Patch("/boards/{boardID}", boardHandler.Update)
			r.Delete("/boards/{boardID}", boardHandler.Delete)

			// Columns
			r.Post("/boards/{boardID}/columns", boardHandler.CreateColumn)
			r.Get("/boards/{boardID}/columns", boardHandler.ListColumns)
			r.Patch("/columns/{columnID}", boardHandler.UpdateColumn)
			r.Delete("/columns/{columnID}", boardHandler.DeleteColumn)

			// Tasks
			r.Post("/columns/{columnID}/tasks", taskHandler.Create)
			r.Get("/boards/{boardID}/tasks", taskHandler.ListByBoard)
			r.Get("/tasks/{taskID}", taskHandler.Get)
			r.Patch("/tasks/{taskID}", taskHandler.Update)
			r.Put("/tasks/{taskID}/move", taskHandler.Move)
			r.Delete("/tasks/{taskID}", taskHandler.Delete)

			// Comments
			r.Post("/tasks/{taskID}/comments", commentHandler.Create)
			r.Get("/tasks/{taskID}/comments", commentHandler.List)
			r.Patch("/comments/{commentID}", commentHandler.Update)
			r.Delete("/comments/{commentID}", commentHandler.Delete)

			// Labels
			r.Post("/projects/{projectID}/labels", labelHandler.Create)
			r.Get("/projects/{projectID}/labels", labelHandler.List)
			r.Delete("/labels/{labelID}", labelHandler.Delete)
			r.Post("/tasks/{taskID}/labels", labelHandler.AddToTask)
			r.Delete("/tasks/{taskID}/labels/{labelID}", labelHandler.RemoveFromTask)
			r.Get("/tasks/{taskID}/labels", labelHandler.ListByTask)
		})
	})

	addr := fmt.Sprintf(":%d", cfg.Server.Port)
	srv := &http.Server{
		Addr:         addr,
		Handler:      r,
		ReadTimeout:  cfg.Server.ReadTimeout,
		WriteTimeout: cfg.Server.WriteTimeout,
		IdleTimeout:  cfg.Server.IdleTimeout,
	}

	slog.Info("server starting", "addr", addr, "time", time.Now().Format(time.RFC3339))
	if err := srv.ListenAndServe(); err != nil {
		slog.Error("server failed", "error", err)
		os.Exit(1)
	}
}
