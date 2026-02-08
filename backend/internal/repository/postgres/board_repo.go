package postgres

import (
	"context"
	"errors"

	"github.com/google/uuid"
	"github.com/jackc/pgx/v5"
	"github.com/jackc/pgx/v5/pgxpool"

	"github.com/letyshub/project-management/internal/domain"
)

type BoardRepo struct {
	pool *pgxpool.Pool
}

func NewBoardRepo(pool *pgxpool.Pool) *BoardRepo {
	return &BoardRepo{pool: pool}
}

func (r *BoardRepo) Create(ctx context.Context, board *domain.Board) error {
	query := `
		INSERT INTO boards (id, project_id, name, created_at, updated_at)
		VALUES ($1, $2, $3, $4, $5)`

	_, err := r.pool.Exec(ctx, query,
		board.ID, board.ProjectID, board.Name, board.CreatedAt, board.UpdatedAt,
	)
	return err
}

func (r *BoardRepo) GetByID(ctx context.Context, id uuid.UUID) (*domain.Board, error) {
	query := `
		SELECT id, project_id, name, created_at, updated_at
		FROM boards WHERE id = $1`

	b := &domain.Board{}
	err := r.pool.QueryRow(ctx, query, id).Scan(
		&b.ID, &b.ProjectID, &b.Name, &b.CreatedAt, &b.UpdatedAt,
	)
	if err != nil {
		if errors.Is(err, pgx.ErrNoRows) {
			return nil, domain.ErrNotFound
		}
		return nil, err
	}
	return b, nil
}

func (r *BoardRepo) ListByProject(ctx context.Context, projectID uuid.UUID) ([]*domain.Board, error) {
	query := `
		SELECT id, project_id, name, created_at, updated_at
		FROM boards WHERE project_id = $1
		ORDER BY created_at ASC`

	rows, err := r.pool.Query(ctx, query, projectID)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var boards []*domain.Board
	for rows.Next() {
		b := &domain.Board{}
		if err := rows.Scan(&b.ID, &b.ProjectID, &b.Name, &b.CreatedAt, &b.UpdatedAt); err != nil {
			return nil, err
		}
		boards = append(boards, b)
	}
	return boards, rows.Err()
}

func (r *BoardRepo) Update(ctx context.Context, board *domain.Board) error {
	query := `UPDATE boards SET name = $1, updated_at = $2 WHERE id = $3`

	tag, err := r.pool.Exec(ctx, query, board.Name, board.UpdatedAt, board.ID)
	if err != nil {
		return err
	}
	if tag.RowsAffected() == 0 {
		return domain.ErrNotFound
	}
	return nil
}

func (r *BoardRepo) Delete(ctx context.Context, id uuid.UUID) error {
	tag, err := r.pool.Exec(ctx, `DELETE FROM boards WHERE id = $1`, id)
	if err != nil {
		return err
	}
	if tag.RowsAffected() == 0 {
		return domain.ErrNotFound
	}
	return nil
}
