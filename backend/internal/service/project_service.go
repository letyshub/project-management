package service

import (
	"context"
	"fmt"
	"time"

	"github.com/google/uuid"

	"github.com/letyshub/project-management/internal/domain"
)

type ProjectService struct {
	projectRepo domain.ProjectRepository
	boardRepo   domain.BoardRepository
	columnRepo  domain.ColumnRepository
}

func NewProjectService(
	projectRepo domain.ProjectRepository,
	boardRepo domain.BoardRepository,
	columnRepo domain.ColumnRepository,
) *ProjectService {
	return &ProjectService{
		projectRepo: projectRepo,
		boardRepo:   boardRepo,
		columnRepo:  columnRepo,
	}
}

type CreateProjectInput struct {
	Name        string `json:"name"`
	Description string `json:"description"`
}

func (s *ProjectService) Create(ctx context.Context, ownerID uuid.UUID, input CreateProjectInput) (*domain.Project, error) {
	if input.Name == "" {
		return nil, fmt.Errorf("%w: name is required", domain.ErrValidation)
	}

	now := time.Now()
	project := &domain.Project{
		ID:          uuid.New(),
		Name:        input.Name,
		Description: input.Description,
		OwnerID:     ownerID,
		CreatedAt:   now,
		UpdatedAt:   now,
	}

	if err := s.projectRepo.Create(ctx, project); err != nil {
		return nil, err
	}

	// Create a default board with standard columns
	board := &domain.Board{
		ID:        uuid.New(),
		ProjectID: project.ID,
		Name:      "Main Board",
		CreatedAt: now,
		UpdatedAt: now,
	}
	if err := s.boardRepo.Create(ctx, board); err != nil {
		return nil, err
	}

	defaults := []string{"To Do", "In Progress", "Done"}
	for i, name := range defaults {
		col := &domain.Column{
			ID:        uuid.New(),
			BoardID:   board.ID,
			Name:      name,
			Position:  float64((i + 1) * 1000),
			CreatedAt: now,
			UpdatedAt: now,
		}
		if err := s.columnRepo.Create(ctx, col); err != nil {
			return nil, err
		}
	}

	return project, nil
}

func (s *ProjectService) GetByID(ctx context.Context, id uuid.UUID) (*domain.Project, error) {
	return s.projectRepo.GetByID(ctx, id)
}

func (s *ProjectService) ListByOwner(ctx context.Context, ownerID uuid.UUID) ([]*domain.Project, error) {
	return s.projectRepo.ListByOwner(ctx, ownerID)
}

type UpdateProjectInput struct {
	Name        *string `json:"name"`
	Description *string `json:"description"`
}

func (s *ProjectService) Update(ctx context.Context, id uuid.UUID, ownerID uuid.UUID, input UpdateProjectInput) (*domain.Project, error) {
	project, err := s.projectRepo.GetByID(ctx, id)
	if err != nil {
		return nil, err
	}
	if project.OwnerID != ownerID {
		return nil, domain.ErrForbidden
	}

	if input.Name != nil {
		if *input.Name == "" {
			return nil, fmt.Errorf("%w: name cannot be empty", domain.ErrValidation)
		}
		project.Name = *input.Name
	}
	if input.Description != nil {
		project.Description = *input.Description
	}
	project.UpdatedAt = time.Now()

	if err := s.projectRepo.Update(ctx, project); err != nil {
		return nil, err
	}
	return project, nil
}

func (s *ProjectService) Delete(ctx context.Context, id uuid.UUID, ownerID uuid.UUID) error {
	project, err := s.projectRepo.GetByID(ctx, id)
	if err != nil {
		return err
	}
	if project.OwnerID != ownerID {
		return domain.ErrForbidden
	}
	return s.projectRepo.Delete(ctx, id)
}
