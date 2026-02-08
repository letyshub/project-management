package postgres

import (
	"context"
	"errors"

	"github.com/google/uuid"
	"github.com/jackc/pgx/v5"
	"github.com/jackc/pgx/v5/pgxpool"

	"github.com/letyshub/project-management/internal/domain"
)

type CommentRepo struct {
	pool *pgxpool.Pool
}

func NewCommentRepo(pool *pgxpool.Pool) *CommentRepo {
	return &CommentRepo{pool: pool}
}

func (r *CommentRepo) Create(ctx context.Context, comment *domain.Comment) error {
	query := `
		INSERT INTO comments (id, task_id, author_id, content, created_at, updated_at)
		VALUES ($1, $2, $3, $4, $5, $6)`
	_, err := r.pool.Exec(ctx, query,
		comment.ID, comment.TaskID, comment.AuthorID,
		comment.Content, comment.CreatedAt, comment.UpdatedAt,
	)
	return err
}

func (r *CommentRepo) GetByID(ctx context.Context, id uuid.UUID) (*domain.Comment, error) {
	query := `
		SELECT id, task_id, author_id, content, created_at, updated_at
		FROM comments WHERE id = $1`
	c := &domain.Comment{}
	err := r.pool.QueryRow(ctx, query, id).Scan(
		&c.ID, &c.TaskID, &c.AuthorID, &c.Content, &c.CreatedAt, &c.UpdatedAt,
	)
	if err != nil {
		if errors.Is(err, pgx.ErrNoRows) {
			return nil, domain.ErrNotFound
		}
		return nil, err
	}
	return c, nil
}

func (r *CommentRepo) ListByTask(ctx context.Context, taskID uuid.UUID) ([]*domain.Comment, error) {
	query := `
		SELECT id, task_id, author_id, content, created_at, updated_at
		FROM comments WHERE task_id = $1
		ORDER BY created_at ASC`
	rows, err := r.pool.Query(ctx, query, taskID)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var comments []*domain.Comment
	for rows.Next() {
		c := &domain.Comment{}
		if err := rows.Scan(&c.ID, &c.TaskID, &c.AuthorID, &c.Content, &c.CreatedAt, &c.UpdatedAt); err != nil {
			return nil, err
		}
		comments = append(comments, c)
	}
	return comments, rows.Err()
}

func (r *CommentRepo) Update(ctx context.Context, comment *domain.Comment) error {
	query := `UPDATE comments SET content = $1, updated_at = $2 WHERE id = $3`
	tag, err := r.pool.Exec(ctx, query, comment.Content, comment.UpdatedAt, comment.ID)
	if err != nil {
		return err
	}
	if tag.RowsAffected() == 0 {
		return domain.ErrNotFound
	}
	return nil
}

func (r *CommentRepo) Delete(ctx context.Context, id uuid.UUID) error {
	tag, err := r.pool.Exec(ctx, `DELETE FROM comments WHERE id = $1`, id)
	if err != nil {
		return err
	}
	if tag.RowsAffected() == 0 {
		return domain.ErrNotFound
	}
	return nil
}
