package postgres

import (
	"context"
	"errors"
	"fmt"
	"strings"

	"github.com/google/uuid"
	"github.com/jackc/pgx/v5"
	"github.com/jackc/pgx/v5/pgxpool"

	"github.com/letyshub/project-management/internal/domain"
)

type TaskRepo struct {
	pool *pgxpool.Pool
}

func NewTaskRepo(pool *pgxpool.Pool) *TaskRepo {
	return &TaskRepo{pool: pool}
}

func (r *TaskRepo) Create(ctx context.Context, task *domain.Task) error {
	query := `
		INSERT INTO tasks (id, column_id, title, description, priority, assignee_id, position, created_at, updated_at)
		VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)`

	_, err := r.pool.Exec(ctx, query,
		task.ID, task.ColumnID, task.Title, task.Description,
		task.Priority, task.AssigneeID, task.Position,
		task.CreatedAt, task.UpdatedAt,
	)
	return err
}

func (r *TaskRepo) GetByID(ctx context.Context, id uuid.UUID) (*domain.Task, error) {
	query := `
		SELECT id, column_id, title, description, priority, assignee_id, position, created_at, updated_at
		FROM tasks WHERE id = $1`

	t := &domain.Task{}
	err := r.pool.QueryRow(ctx, query, id).Scan(
		&t.ID, &t.ColumnID, &t.Title, &t.Description,
		&t.Priority, &t.AssigneeID, &t.Position,
		&t.CreatedAt, &t.UpdatedAt,
	)
	if err != nil {
		if errors.Is(err, pgx.ErrNoRows) {
			return nil, domain.ErrNotFound
		}
		return nil, err
	}
	return t, nil
}

func (r *TaskRepo) ListByColumn(ctx context.Context, columnID uuid.UUID) ([]*domain.Task, error) {
	query := `
		SELECT id, column_id, title, description, priority, assignee_id, position, created_at, updated_at
		FROM tasks WHERE column_id = $1
		ORDER BY position ASC`

	return r.queryTasks(ctx, query, columnID)
}

func (r *TaskRepo) ListByBoard(ctx context.Context, boardID uuid.UUID, filter domain.TaskFilter) ([]*domain.Task, error) {
	var conditions []string
	var args []interface{}
	argIdx := 1

	conditions = append(conditions, fmt.Sprintf("t.column_id IN (SELECT id FROM columns WHERE board_id = $%d)", argIdx))
	args = append(args, boardID)
	argIdx++

	if filter.ColumnID != nil {
		conditions = append(conditions, fmt.Sprintf("t.column_id = $%d", argIdx))
		args = append(args, *filter.ColumnID)
		argIdx++
	}
	if filter.Priority != nil {
		conditions = append(conditions, fmt.Sprintf("t.priority = $%d", argIdx))
		args = append(args, *filter.Priority)
		argIdx++
	}
	if filter.AssigneeID != nil {
		conditions = append(conditions, fmt.Sprintf("t.assignee_id = $%d", argIdx))
		args = append(args, *filter.AssigneeID)
	}

	query := fmt.Sprintf(`
		SELECT t.id, t.column_id, t.title, t.description, t.priority, t.assignee_id, t.position, t.created_at, t.updated_at
		FROM tasks t
		WHERE %s
		ORDER BY t.position ASC`, strings.Join(conditions, " AND "))

	return r.queryTasks(ctx, query, args...)
}

func (r *TaskRepo) Update(ctx context.Context, task *domain.Task) error {
	query := `
		UPDATE tasks SET column_id = $1, title = $2, description = $3, priority = $4,
		assignee_id = $5, position = $6, updated_at = $7
		WHERE id = $8`

	tag, err := r.pool.Exec(ctx, query,
		task.ColumnID, task.Title, task.Description, task.Priority,
		task.AssigneeID, task.Position, task.UpdatedAt, task.ID,
	)
	if err != nil {
		return err
	}
	if tag.RowsAffected() == 0 {
		return domain.ErrNotFound
	}
	return nil
}

func (r *TaskRepo) Delete(ctx context.Context, id uuid.UUID) error {
	tag, err := r.pool.Exec(ctx, `DELETE FROM tasks WHERE id = $1`, id)
	if err != nil {
		return err
	}
	if tag.RowsAffected() == 0 {
		return domain.ErrNotFound
	}
	return nil
}

func (r *TaskRepo) queryTasks(ctx context.Context, query string, args ...interface{}) ([]*domain.Task, error) {
	rows, err := r.pool.Query(ctx, query, args...)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var tasks []*domain.Task
	for rows.Next() {
		t := &domain.Task{}
		if err := rows.Scan(
			&t.ID, &t.ColumnID, &t.Title, &t.Description,
			&t.Priority, &t.AssigneeID, &t.Position,
			&t.CreatedAt, &t.UpdatedAt,
		); err != nil {
			return nil, err
		}
		tasks = append(tasks, t)
	}
	return tasks, rows.Err()
}
