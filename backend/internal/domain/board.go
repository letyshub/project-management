package domain

import (
	"context"
	"time"

	"github.com/google/uuid"
)

type Board struct {
	ID        uuid.UUID `json:"id"`
	ProjectID uuid.UUID `json:"project_id"`
	Name      string    `json:"name"`
	CreatedAt time.Time `json:"created_at"`
	UpdatedAt time.Time `json:"updated_at"`
}

type Column struct {
	ID        uuid.UUID `json:"id"`
	BoardID   uuid.UUID `json:"board_id"`
	Name      string    `json:"name"`
	Position  float64   `json:"position"`
	CreatedAt time.Time `json:"created_at"`
	UpdatedAt time.Time `json:"updated_at"`
}

type BoardRepository interface {
	Create(ctx context.Context, board *Board) error
	GetByID(ctx context.Context, id uuid.UUID) (*Board, error)
	ListByProject(ctx context.Context, projectID uuid.UUID) ([]*Board, error)
	Update(ctx context.Context, board *Board) error
	Delete(ctx context.Context, id uuid.UUID) error
}

type ColumnRepository interface {
	Create(ctx context.Context, col *Column) error
	GetByID(ctx context.Context, id uuid.UUID) (*Column, error)
	ListByBoard(ctx context.Context, boardID uuid.UUID) ([]*Column, error)
	Update(ctx context.Context, col *Column) error
	Delete(ctx context.Context, id uuid.UUID) error
}
