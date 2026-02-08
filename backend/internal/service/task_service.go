package service

import (
	"context"
	"fmt"
	"time"

	"github.com/google/uuid"

	"github.com/letyshub/project-management/internal/domain"
)

type TaskService struct {
	taskRepo    domain.TaskRepository
	columnRepo  domain.ColumnRepository
	boardRepo   domain.BoardRepository
	projectRepo domain.ProjectRepository
}

func NewTaskService(
	taskRepo domain.TaskRepository,
	columnRepo domain.ColumnRepository,
	boardRepo domain.BoardRepository,
	projectRepo domain.ProjectRepository,
) *TaskService {
	return &TaskService{
		taskRepo:    taskRepo,
		columnRepo:  columnRepo,
		boardRepo:   boardRepo,
		projectRepo: projectRepo,
	}
}

type CreateTaskInput struct {
	Title       string     `json:"title"`
	Description string     `json:"description"`
	Priority    string     `json:"priority"`
	AssigneeID  *uuid.UUID `json:"assignee_id"`
}

func (s *TaskService) Create(ctx context.Context, columnID uuid.UUID, ownerID uuid.UUID, input CreateTaskInput) (*domain.Task, error) {
	if err := s.authorizeColumn(ctx, columnID, ownerID); err != nil {
		return nil, err
	}
	if input.Title == "" {
		return nil, fmt.Errorf("%w: title is required", domain.ErrValidation)
	}
	priority := input.Priority
	if priority == "" {
		priority = "medium"
	}
	if !isValidPriority(priority) {
		return nil, fmt.Errorf("%w: priority must be low, medium, or high", domain.ErrValidation)
	}

	// Calculate position: append to end
	existing, err := s.taskRepo.ListByColumn(ctx, columnID)
	if err != nil {
		return nil, err
	}
	var maxPos float64
	for _, t := range existing {
		if t.Position > maxPos {
			maxPos = t.Position
		}
	}

	now := time.Now()
	task := &domain.Task{
		ID:          uuid.New(),
		ColumnID:    columnID,
		Title:       input.Title,
		Description: input.Description,
		Priority:    priority,
		AssigneeID:  input.AssigneeID,
		Position:    maxPos + 1000,
		CreatedAt:   now,
		UpdatedAt:   now,
	}

	if err := s.taskRepo.Create(ctx, task); err != nil {
		return nil, err
	}
	return task, nil
}

func (s *TaskService) GetByID(ctx context.Context, id uuid.UUID) (*domain.Task, error) {
	return s.taskRepo.GetByID(ctx, id)
}

func (s *TaskService) ListByBoard(ctx context.Context, boardID uuid.UUID, filter domain.TaskFilter) ([]*domain.Task, error) {
	return s.taskRepo.ListByBoard(ctx, boardID, filter)
}

type UpdateTaskInput struct {
	Title       *string    `json:"title"`
	Description *string    `json:"description"`
	Priority    *string    `json:"priority"`
	AssigneeID  *uuid.UUID `json:"assignee_id"`
}

func (s *TaskService) Update(ctx context.Context, id uuid.UUID, ownerID uuid.UUID, input UpdateTaskInput) (*domain.Task, error) {
	task, err := s.taskRepo.GetByID(ctx, id)
	if err != nil {
		return nil, err
	}
	if err := s.authorizeColumn(ctx, task.ColumnID, ownerID); err != nil {
		return nil, err
	}

	if input.Title != nil {
		if *input.Title == "" {
			return nil, fmt.Errorf("%w: title cannot be empty", domain.ErrValidation)
		}
		task.Title = *input.Title
	}
	if input.Description != nil {
		task.Description = *input.Description
	}
	if input.Priority != nil {
		if !isValidPriority(*input.Priority) {
			return nil, fmt.Errorf("%w: priority must be low, medium, or high", domain.ErrValidation)
		}
		task.Priority = *input.Priority
	}
	if input.AssigneeID != nil {
		task.AssigneeID = input.AssigneeID
	}
	task.UpdatedAt = time.Now()

	if err := s.taskRepo.Update(ctx, task); err != nil {
		return nil, err
	}
	return task, nil
}

type MoveTaskInput struct {
	ColumnID uuid.UUID `json:"column_id"`
	Position float64   `json:"position"`
}

func (s *TaskService) Move(ctx context.Context, id uuid.UUID, ownerID uuid.UUID, input MoveTaskInput) (*domain.Task, error) {
	task, err := s.taskRepo.GetByID(ctx, id)
	if err != nil {
		return nil, err
	}
	if err := s.authorizeColumn(ctx, input.ColumnID, ownerID); err != nil {
		return nil, err
	}

	task.ColumnID = input.ColumnID
	task.Position = input.Position
	task.UpdatedAt = time.Now()

	if err := s.taskRepo.Update(ctx, task); err != nil {
		return nil, err
	}
	return task, nil
}

func (s *TaskService) Delete(ctx context.Context, id uuid.UUID, ownerID uuid.UUID) error {
	task, err := s.taskRepo.GetByID(ctx, id)
	if err != nil {
		return err
	}
	if err := s.authorizeColumn(ctx, task.ColumnID, ownerID); err != nil {
		return err
	}
	return s.taskRepo.Delete(ctx, id)
}

func (s *TaskService) authorizeColumn(ctx context.Context, columnID uuid.UUID, ownerID uuid.UUID) error {
	col, err := s.columnRepo.GetByID(ctx, columnID)
	if err != nil {
		return err
	}
	board, err := s.boardRepo.GetByID(ctx, col.BoardID)
	if err != nil {
		return err
	}
	project, err := s.projectRepo.GetByID(ctx, board.ProjectID)
	if err != nil {
		return err
	}
	if project.OwnerID != ownerID {
		return domain.ErrForbidden
	}
	return nil
}

func isValidPriority(p string) bool {
	return p == "low" || p == "medium" || p == "high"
}
