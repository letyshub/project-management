package service

import (
	"context"
	"fmt"
	"time"

	"github.com/google/uuid"

	"github.com/letyshub/project-management/internal/domain"
)

type BoardService struct {
	boardRepo   domain.BoardRepository
	columnRepo  domain.ColumnRepository
	projectRepo domain.ProjectRepository
}

func NewBoardService(
	boardRepo domain.BoardRepository,
	columnRepo domain.ColumnRepository,
	projectRepo domain.ProjectRepository,
) *BoardService {
	return &BoardService{
		boardRepo:   boardRepo,
		columnRepo:  columnRepo,
		projectRepo: projectRepo,
	}
}

type CreateBoardInput struct {
	Name string `json:"name"`
}

func (s *BoardService) Create(ctx context.Context, projectID uuid.UUID, ownerID uuid.UUID, input CreateBoardInput) (*domain.Board, error) {
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

	now := time.Now()
	board := &domain.Board{
		ID:        uuid.New(),
		ProjectID: projectID,
		Name:      input.Name,
		CreatedAt: now,
		UpdatedAt: now,
	}

	if err := s.boardRepo.Create(ctx, board); err != nil {
		return nil, err
	}
	return board, nil
}

func (s *BoardService) GetByID(ctx context.Context, id uuid.UUID) (*domain.Board, error) {
	return s.boardRepo.GetByID(ctx, id)
}

func (s *BoardService) ListByProject(ctx context.Context, projectID uuid.UUID) ([]*domain.Board, error) {
	return s.boardRepo.ListByProject(ctx, projectID)
}

type UpdateBoardInput struct {
	Name *string `json:"name"`
}

func (s *BoardService) Update(ctx context.Context, id uuid.UUID, ownerID uuid.UUID, input UpdateBoardInput) (*domain.Board, error) {
	board, err := s.boardRepo.GetByID(ctx, id)
	if err != nil {
		return nil, err
	}
	project, err := s.projectRepo.GetByID(ctx, board.ProjectID)
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
		board.Name = *input.Name
	}
	board.UpdatedAt = time.Now()

	if err := s.boardRepo.Update(ctx, board); err != nil {
		return nil, err
	}
	return board, nil
}

func (s *BoardService) Delete(ctx context.Context, id uuid.UUID, ownerID uuid.UUID) error {
	board, err := s.boardRepo.GetByID(ctx, id)
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
	return s.boardRepo.Delete(ctx, id)
}

// Column operations

type CreateColumnInput struct {
	Name string `json:"name"`
}

func (s *BoardService) CreateColumn(ctx context.Context, boardID uuid.UUID, ownerID uuid.UUID, input CreateColumnInput) (*domain.Column, error) {
	board, err := s.boardRepo.GetByID(ctx, boardID)
	if err != nil {
		return nil, err
	}
	project, err := s.projectRepo.GetByID(ctx, board.ProjectID)
	if err != nil {
		return nil, err
	}
	if project.OwnerID != ownerID {
		return nil, domain.ErrForbidden
	}
	if input.Name == "" {
		return nil, fmt.Errorf("%w: name is required", domain.ErrValidation)
	}

	// Get existing columns to calculate position
	existing, err := s.columnRepo.ListByBoard(ctx, boardID)
	if err != nil {
		return nil, err
	}
	var maxPos float64
	for _, c := range existing {
		if c.Position > maxPos {
			maxPos = c.Position
		}
	}

	now := time.Now()
	col := &domain.Column{
		ID:        uuid.New(),
		BoardID:   boardID,
		Name:      input.Name,
		Position:  maxPos + 1000,
		CreatedAt: now,
		UpdatedAt: now,
	}

	if err := s.columnRepo.Create(ctx, col); err != nil {
		return nil, err
	}
	return col, nil
}

func (s *BoardService) ListColumns(ctx context.Context, boardID uuid.UUID) ([]*domain.Column, error) {
	return s.columnRepo.ListByBoard(ctx, boardID)
}

type UpdateColumnInput struct {
	Name     *string  `json:"name"`
	Position *float64 `json:"position"`
}

func (s *BoardService) UpdateColumn(ctx context.Context, colID uuid.UUID, ownerID uuid.UUID, input UpdateColumnInput) (*domain.Column, error) {
	col, err := s.columnRepo.GetByID(ctx, colID)
	if err != nil {
		return nil, err
	}
	board, err := s.boardRepo.GetByID(ctx, col.BoardID)
	if err != nil {
		return nil, err
	}
	project, err := s.projectRepo.GetByID(ctx, board.ProjectID)
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
		col.Name = *input.Name
	}
	if input.Position != nil {
		col.Position = *input.Position
	}
	col.UpdatedAt = time.Now()

	if err := s.columnRepo.Update(ctx, col); err != nil {
		return nil, err
	}
	return col, nil
}

func (s *BoardService) DeleteColumn(ctx context.Context, colID uuid.UUID, ownerID uuid.UUID) error {
	col, err := s.columnRepo.GetByID(ctx, colID)
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
	return s.columnRepo.Delete(ctx, colID)
}
