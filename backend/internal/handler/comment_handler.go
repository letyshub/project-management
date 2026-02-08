package handler

import (
	"encoding/json"
	"net/http"

	"github.com/go-chi/chi/v5"
	"github.com/google/uuid"

	"github.com/letyshub/project-management/internal/domain"
	"github.com/letyshub/project-management/internal/middleware"
	"github.com/letyshub/project-management/internal/service"
)

type CommentHandler struct {
	commentService *service.CommentService
}

func NewCommentHandler(commentService *service.CommentService) *CommentHandler {
	return &CommentHandler{commentService: commentService}
}

func (h *CommentHandler) Create(w http.ResponseWriter, r *http.Request) {
	taskID, err := uuid.Parse(chi.URLParam(r, "taskID"))
	if err != nil {
		writeJSON(w, http.StatusBadRequest, Response{
			Errors: []APIError{{Code: "INVALID_ID", Message: "invalid task ID"}},
		})
		return
	}

	var input service.CreateCommentInput
	if err := json.NewDecoder(r.Body).Decode(&input); err != nil {
		writeJSON(w, http.StatusBadRequest, Response{
			Errors: []APIError{{Code: "INVALID_BODY", Message: "invalid request body"}},
		})
		return
	}

	authorID := middleware.GetUserID(r.Context())
	comment, err := h.commentService.Create(r.Context(), taskID, authorID, input)
	if err != nil {
		writeError(w, err)
		return
	}

	writeData(w, http.StatusCreated, comment)
}

func (h *CommentHandler) List(w http.ResponseWriter, r *http.Request) {
	taskID, err := uuid.Parse(chi.URLParam(r, "taskID"))
	if err != nil {
		writeJSON(w, http.StatusBadRequest, Response{
			Errors: []APIError{{Code: "INVALID_ID", Message: "invalid task ID"}},
		})
		return
	}

	comments, err := h.commentService.ListByTask(r.Context(), taskID)
	if err != nil {
		writeError(w, err)
		return
	}
	if comments == nil {
		comments = []*domain.Comment{}
	}
	writeData(w, http.StatusOK, comments)
}

func (h *CommentHandler) Update(w http.ResponseWriter, r *http.Request) {
	commentID, err := uuid.Parse(chi.URLParam(r, "commentID"))
	if err != nil {
		writeJSON(w, http.StatusBadRequest, Response{
			Errors: []APIError{{Code: "INVALID_ID", Message: "invalid comment ID"}},
		})
		return
	}

	var body struct {
		Content string `json:"content"`
	}
	if err := json.NewDecoder(r.Body).Decode(&body); err != nil {
		writeJSON(w, http.StatusBadRequest, Response{
			Errors: []APIError{{Code: "INVALID_BODY", Message: "invalid request body"}},
		})
		return
	}

	authorID := middleware.GetUserID(r.Context())
	comment, err := h.commentService.Update(r.Context(), commentID, authorID, body.Content)
	if err != nil {
		writeError(w, err)
		return
	}

	writeData(w, http.StatusOK, comment)
}

func (h *CommentHandler) Delete(w http.ResponseWriter, r *http.Request) {
	commentID, err := uuid.Parse(chi.URLParam(r, "commentID"))
	if err != nil {
		writeJSON(w, http.StatusBadRequest, Response{
			Errors: []APIError{{Code: "INVALID_ID", Message: "invalid comment ID"}},
		})
		return
	}

	authorID := middleware.GetUserID(r.Context())
	if err := h.commentService.Delete(r.Context(), commentID, authorID); err != nil {
		writeError(w, err)
		return
	}

	writeData(w, http.StatusOK, map[string]string{"message": "deleted"})
}
