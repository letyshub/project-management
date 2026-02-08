package service

import (
	"context"
	"fmt"
	"time"

	"github.com/google/uuid"

	"github.com/letyshub/project-management/internal/domain"
)

type CommentService struct {
	commentRepo domain.CommentRepository
}

func NewCommentService(commentRepo domain.CommentRepository) *CommentService {
	return &CommentService{commentRepo: commentRepo}
}

type CreateCommentInput struct {
	Content string `json:"content"`
}

func (s *CommentService) Create(ctx context.Context, taskID, authorID uuid.UUID, input CreateCommentInput) (*domain.Comment, error) {
	if input.Content == "" {
		return nil, fmt.Errorf("%w: content is required", domain.ErrValidation)
	}

	now := time.Now()
	comment := &domain.Comment{
		ID:        uuid.New(),
		TaskID:    taskID,
		AuthorID:  authorID,
		Content:   input.Content,
		CreatedAt: now,
		UpdatedAt: now,
	}

	if err := s.commentRepo.Create(ctx, comment); err != nil {
		return nil, err
	}
	return comment, nil
}

func (s *CommentService) ListByTask(ctx context.Context, taskID uuid.UUID) ([]*domain.Comment, error) {
	return s.commentRepo.ListByTask(ctx, taskID)
}

func (s *CommentService) Update(ctx context.Context, commentID, authorID uuid.UUID, content string) (*domain.Comment, error) {
	comment, err := s.commentRepo.GetByID(ctx, commentID)
	if err != nil {
		return nil, err
	}
	if comment.AuthorID != authorID {
		return nil, domain.ErrForbidden
	}
	if content == "" {
		return nil, fmt.Errorf("%w: content is required", domain.ErrValidation)
	}

	comment.Content = content
	comment.UpdatedAt = time.Now()

	if err := s.commentRepo.Update(ctx, comment); err != nil {
		return nil, err
	}
	return comment, nil
}

func (s *CommentService) Delete(ctx context.Context, commentID, authorID uuid.UUID) error {
	comment, err := s.commentRepo.GetByID(ctx, commentID)
	if err != nil {
		return err
	}
	if comment.AuthorID != authorID {
		return domain.ErrForbidden
	}
	return s.commentRepo.Delete(ctx, commentID)
}
