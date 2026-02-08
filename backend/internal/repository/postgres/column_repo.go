package postgres

import (
	"context"
	"errors"

	"github.com/google/uuid"
	"github.com/jackc/pgx/v5"
	"github.com/jackc/pgx/v5/pgxpool"

	"github.com/letyshub/project-management/internal/domain"
)

type ColumnRepo struct {
	pool *pgxpool.Pool
}

func NewColumnRepo(pool *pgxpool.Pool) *ColumnRepo {
	return &ColumnRepo{pool: pool}
}

func (r *ColumnRepo) Create(ctx context.Context, col *domain.Column) error {
	query := `
		INSERT INTO columns (id, board_id, name, position, created_at, updated_at)
		VALUES ($1, $2, $3, $4, $5, $6)`

	_, err := r.pool.Exec(ctx, query,
		col.ID, col.BoardID, col.Name, col.Position, col.CreatedAt, col.UpdatedAt,
	)
	return err
}

func (r *ColumnRepo) GetByID(ctx context.Context, id uuid.UUID) (*domain.Column, error) {
	query := `
		SELECT id, board_id, name, position, created_at, updated_at
		FROM columns WHERE id = $1`

	col := &domain.Column{}
	err := r.pool.QueryRow(ctx, query, id).Scan(
		&col.ID, &col.BoardID, &col.Name, &col.Position, &col.CreatedAt, &col.UpdatedAt,
	)
	if err != nil {
		if errors.Is(err, pgx.ErrNoRows) {
			return nil, domain.ErrNotFound
		}
		return nil, err
	}
	return col, nil
}

func (r *ColumnRepo) ListByBoard(ctx context.Context, boardID uuid.UUID) ([]*domain.Column, error) {
	query := `
		SELECT id, board_id, name, position, created_at, updated_at
		FROM columns WHERE board_id = $1
		ORDER BY position ASC`

	rows, err := r.pool.Query(ctx, query, boardID)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var columns []*domain.Column
	for rows.Next() {
		col := &domain.Column{}
		if err := rows.Scan(&col.ID, &col.BoardID, &col.Name, &col.Position, &col.CreatedAt, &col.UpdatedAt); err != nil {
			return nil, err
		}
		columns = append(columns, col)
	}
	return columns, rows.Err()
}

func (r *ColumnRepo) Update(ctx context.Context, col *domain.Column) error {
	query := `
		UPDATE columns SET name = $1, position = $2, updated_at = $3
		WHERE id = $4`

	tag, err := r.pool.Exec(ctx, query, col.Name, col.Position, col.UpdatedAt, col.ID)
	if err != nil {
		return err
	}
	if tag.RowsAffected() == 0 {
		return domain.ErrNotFound
	}
	return nil
}

func (r *ColumnRepo) Delete(ctx context.Context, id uuid.UUID) error {
	tag, err := r.pool.Exec(ctx, `DELETE FROM columns WHERE id = $1`, id)
	if err != nil {
		return err
	}
	if tag.RowsAffected() == 0 {
		return domain.ErrNotFound
	}
	return nil
}
