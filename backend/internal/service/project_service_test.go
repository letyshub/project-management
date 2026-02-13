package service

import (
	"context"
	"testing"

	"github.com/google/uuid"
	"github.com/letyshub/project-management/internal/domain"
)

// Mock repositories

type mockProjectRepo struct {
	createFn    func(ctx context.Context, project *domain.Project) error
	getByIDFn   func(ctx context.Context, id uuid.UUID) (*domain.Project, error)
	listByOwner func(ctx context.Context, ownerID uuid.UUID) ([]*domain.Project, error)
	updateFn    func(ctx context.Context, project *domain.Project) error
	deleteFn    func(ctx context.Context, id uuid.UUID) error
}

func (m *mockProjectRepo) Create(ctx context.Context, project *domain.Project) error {
	if m.createFn != nil {
		return m.createFn(ctx, project)
	}
	return nil
}

func (m *mockProjectRepo) GetByID(ctx context.Context, id uuid.UUID) (*domain.Project, error) {
	if m.getByIDFn != nil {
		return m.getByIDFn(ctx, id)
	}
	return nil, domain.ErrNotFound
}

func (m *mockProjectRepo) ListByOwner(ctx context.Context, ownerID uuid.UUID) ([]*domain.Project, error) {
	if m.listByOwner != nil {
		return m.listByOwner(ctx, ownerID)
	}
	return nil, nil
}

func (m *mockProjectRepo) Update(ctx context.Context, project *domain.Project) error {
	if m.updateFn != nil {
		return m.updateFn(ctx, project)
	}
	return nil
}

func (m *mockProjectRepo) Delete(ctx context.Context, id uuid.UUID) error {
	if m.deleteFn != nil {
		return m.deleteFn(ctx, id)
	}
	return nil
}

type mockBoardRepo struct{}

func (m *mockBoardRepo) Create(ctx context.Context, board *domain.Board) error   { return nil }
func (m *mockBoardRepo) GetByID(ctx context.Context, id uuid.UUID) (*domain.Board, error) {
	return nil, domain.ErrNotFound
}
func (m *mockBoardRepo) ListByProject(ctx context.Context, projectID uuid.UUID) ([]*domain.Board, error) {
	return nil, nil
}
func (m *mockBoardRepo) Update(ctx context.Context, board *domain.Board) error { return nil }
func (m *mockBoardRepo) Delete(ctx context.Context, id uuid.UUID) error        { return nil }

type mockColumnRepo struct{}

func (m *mockColumnRepo) Create(ctx context.Context, col *domain.Column) error { return nil }
func (m *mockColumnRepo) GetByID(ctx context.Context, id uuid.UUID) (*domain.Column, error) {
	return nil, domain.ErrNotFound
}
func (m *mockColumnRepo) ListByBoard(ctx context.Context, boardID uuid.UUID) ([]*domain.Column, error) {
	return nil, nil
}
func (m *mockColumnRepo) Update(ctx context.Context, col *domain.Column) error { return nil }
func (m *mockColumnRepo) Delete(ctx context.Context, id uuid.UUID) error       { return nil }

// Tests

func TestProjectService_Create_Success(t *testing.T) {
	svc := NewProjectService(&mockProjectRepo{}, &mockBoardRepo{}, &mockColumnRepo{})

	project, err := svc.Create(context.Background(), uuid.New(), CreateProjectInput{
		Name:        "Test Project",
		Description: "A test project",
	})

	if err != nil {
		t.Fatalf("expected no error, got %v", err)
	}
	if project.Name != "Test Project" {
		t.Errorf("expected name 'Test Project', got %s", project.Name)
	}
	if project.Description != "A test project" {
		t.Errorf("expected description 'A test project', got %s", project.Description)
	}
	if project.ID == uuid.Nil {
		t.Error("expected non-nil project ID")
	}
}

func TestProjectService_Create_EmptyName(t *testing.T) {
	svc := NewProjectService(&mockProjectRepo{}, &mockBoardRepo{}, &mockColumnRepo{})

	_, err := svc.Create(context.Background(), uuid.New(), CreateProjectInput{
		Name: "",
	})

	if err == nil {
		t.Fatal("expected validation error, got nil")
	}
}

func TestProjectService_Delete_Forbidden(t *testing.T) {
	ownerID := uuid.New()
	otherUserID := uuid.New()
	projectID := uuid.New()

	repo := &mockProjectRepo{
		getByIDFn: func(ctx context.Context, id uuid.UUID) (*domain.Project, error) {
			return &domain.Project{
				ID:      projectID,
				OwnerID: ownerID,
				Name:    "Test",
			}, nil
		},
	}

	svc := NewProjectService(repo, &mockBoardRepo{}, &mockColumnRepo{})

	err := svc.Delete(context.Background(), projectID, otherUserID)
	if err != domain.ErrForbidden {
		t.Errorf("expected ErrForbidden, got %v", err)
	}
}

func TestProjectService_Delete_Success(t *testing.T) {
	ownerID := uuid.New()
	projectID := uuid.New()
	deleted := false

	repo := &mockProjectRepo{
		getByIDFn: func(ctx context.Context, id uuid.UUID) (*domain.Project, error) {
			return &domain.Project{
				ID:      projectID,
				OwnerID: ownerID,
				Name:    "Test",
			}, nil
		},
		deleteFn: func(ctx context.Context, id uuid.UUID) error {
			deleted = true
			return nil
		},
	}

	svc := NewProjectService(repo, &mockBoardRepo{}, &mockColumnRepo{})

	err := svc.Delete(context.Background(), projectID, ownerID)
	if err != nil {
		t.Fatalf("expected no error, got %v", err)
	}
	if !deleted {
		t.Error("expected delete to be called")
	}
}
