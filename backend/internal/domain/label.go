package domain

import (
	"context"
	"time"

	"github.com/google/uuid"
)

type Label struct {
	ID        uuid.UUID `json:"id"`
	ProjectID uuid.UUID `json:"project_id"`
	Name      string    `json:"name"`
	Color     string    `json:"color"`
	CreatedAt time.Time `json:"created_at"`
}

type LabelRepository interface {
	Create(ctx context.Context, label *Label) error
	GetByID(ctx context.Context, id uuid.UUID) (*Label, error)
	ListByProject(ctx context.Context, projectID uuid.UUID) ([]*Label, error)
	Delete(ctx context.Context, id uuid.UUID) error
	AddToTask(ctx context.Context, taskID, labelID uuid.UUID) error
	RemoveFromTask(ctx context.Context, taskID, labelID uuid.UUID) error
	ListByTask(ctx context.Context, taskID uuid.UUID) ([]*Label, error)
}
