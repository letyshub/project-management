package postgres

import (
	"context"
	"errors"

	"github.com/google/uuid"
	"github.com/jackc/pgx/v5"
	"github.com/jackc/pgx/v5/pgxpool"

	"github.com/letyshub/project-management/internal/domain"
)

type LabelRepo struct {
	pool *pgxpool.Pool
}

func NewLabelRepo(pool *pgxpool.Pool) *LabelRepo {
	return &LabelRepo{pool: pool}
}

func (r *LabelRepo) Create(ctx context.Context, label *domain.Label) error {
	query := `
		INSERT INTO labels (id, project_id, name, color, created_at)
		VALUES ($1, $2, $3, $4, $5)`
	_, err := r.pool.Exec(ctx, query,
		label.ID, label.ProjectID, label.Name, label.Color, label.CreatedAt,
	)
	return err
}

func (r *LabelRepo) GetByID(ctx context.Context, id uuid.UUID) (*domain.Label, error) {
	query := `SELECT id, project_id, name, color, created_at FROM labels WHERE id = $1`
	l := &domain.Label{}
	err := r.pool.QueryRow(ctx, query, id).Scan(&l.ID, &l.ProjectID, &l.Name, &l.Color, &l.CreatedAt)
	if err != nil {
		if errors.Is(err, pgx.ErrNoRows) {
			return nil, domain.ErrNotFound
		}
		return nil, err
	}
	return l, nil
}

func (r *LabelRepo) ListByProject(ctx context.Context, projectID uuid.UUID) ([]*domain.Label, error) {
	query := `SELECT id, project_id, name, color, created_at FROM labels WHERE project_id = $1 ORDER BY name ASC`
	rows, err := r.pool.Query(ctx, query, projectID)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var labels []*domain.Label
	for rows.Next() {
		l := &domain.Label{}
		if err := rows.Scan(&l.ID, &l.ProjectID, &l.Name, &l.Color, &l.CreatedAt); err != nil {
			return nil, err
		}
		labels = append(labels, l)
	}
	return labels, rows.Err()
}

func (r *LabelRepo) Delete(ctx context.Context, id uuid.UUID) error {
	tag, err := r.pool.Exec(ctx, `DELETE FROM labels WHERE id = $1`, id)
	if err != nil {
		return err
	}
	if tag.RowsAffected() == 0 {
		return domain.ErrNotFound
	}
	return nil
}

func (r *LabelRepo) AddToTask(ctx context.Context, taskID, labelID uuid.UUID) error {
	query := `INSERT INTO task_labels (task_id, label_id) VALUES ($1, $2) ON CONFLICT DO NOTHING`
	_, err := r.pool.Exec(ctx, query, taskID, labelID)
	return err
}

func (r *LabelRepo) RemoveFromTask(ctx context.Context, taskID, labelID uuid.UUID) error {
	_, err := r.pool.Exec(ctx, `DELETE FROM task_labels WHERE task_id = $1 AND label_id = $2`, taskID, labelID)
	return err
}

func (r *LabelRepo) ListByTask(ctx context.Context, taskID uuid.UUID) ([]*domain.Label, error) {
	query := `
		SELECT l.id, l.project_id, l.name, l.color, l.created_at
		FROM labels l
		JOIN task_labels tl ON tl.label_id = l.id
		WHERE tl.task_id = $1
		ORDER BY l.name ASC`
	rows, err := r.pool.Query(ctx, query, taskID)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var labels []*domain.Label
	for rows.Next() {
		l := &domain.Label{}
		if err := rows.Scan(&l.ID, &l.ProjectID, &l.Name, &l.Color, &l.CreatedAt); err != nil {
			return nil, err
		}
		labels = append(labels, l)
	}
	return labels, rows.Err()
}
