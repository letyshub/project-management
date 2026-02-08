package service

import (
	"context"
	"fmt"
	"time"

	"github.com/google/uuid"

	"github.com/letyshub/project-management/internal/domain"
)

type LabelService struct {
	labelRepo   domain.LabelRepository
	projectRepo domain.ProjectRepository
}

func NewLabelService(labelRepo domain.LabelRepository, projectRepo domain.ProjectRepository) *LabelService {
	return &LabelService{labelRepo: labelRepo, projectRepo: projectRepo}
}

type CreateLabelInput struct {
	Name  string `json:"name"`
	Color string `json:"color"`
}

func (s *LabelService) Create(ctx context.Context, projectID, ownerID uuid.UUID, input CreateLabelInput) (*domain.Label, error) {
	project, err := s.projectRepo.GetByID(ctx, projectID)
	if err != nil {
		return nil, err
	}
	if project.OwnerID != ownerID {
		return nil, domain.ErrForbidden
	}
	if input.Name == "" {
		return nil, fmt.Errorf("%w: name is required", domain.ErrValidation)
	}
	color := input.Color
	if color == "" {
		color = "#6b7280"
	}

	label := &domain.Label{
		ID:        uuid.New(),
		ProjectID: projectID,
		Name:      input.Name,
		Color:     color,
		CreatedAt: time.Now(),
	}

	if err := s.labelRepo.Create(ctx, label); err != nil {
		return nil, err
	}
	return label, nil
}

func (s *LabelService) ListByProject(ctx context.Context, projectID uuid.UUID) ([]*domain.Label, error) {
	return s.labelRepo.ListByProject(ctx, projectID)
}

func (s *LabelService) Delete(ctx context.Context, labelID, ownerID uuid.UUID) error {
	label, err := s.labelRepo.GetByID(ctx, labelID)
	if err != nil {
		return err
	}
	project, err := s.projectRepo.GetByID(ctx, label.ProjectID)
	if err != nil {
		return err
	}
	if project.OwnerID != ownerID {
		return domain.ErrForbidden
	}
	return s.labelRepo.Delete(ctx, labelID)
}

func (s *LabelService) AddToTask(ctx context.Context, taskID, labelID uuid.UUID) error {
	return s.labelRepo.AddToTask(ctx, taskID, labelID)
}

func (s *LabelService) RemoveFromTask(ctx context.Context, taskID, labelID uuid.UUID) error {
	return s.labelRepo.RemoveFromTask(ctx, taskID, labelID)
}

func (s *LabelService) ListByTask(ctx context.Context, taskID uuid.UUID) ([]*domain.Label, error) {
	return s.labelRepo.ListByTask(ctx, taskID)
}
