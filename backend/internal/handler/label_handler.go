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

type LabelHandler struct {
	labelService *service.LabelService
}

func NewLabelHandler(labelService *service.LabelService) *LabelHandler {
	return &LabelHandler{labelService: labelService}
}

func (h *LabelHandler) Create(w http.ResponseWriter, r *http.Request) {
	projectID, err := uuid.Parse(chi.URLParam(r, "projectID"))
	if err != nil {
		writeJSON(w, http.StatusBadRequest, Response{
			Errors: []APIError{{Code: "INVALID_ID", Message: "invalid project ID"}},
		})
		return
	}

	var input service.CreateLabelInput
	if err := json.NewDecoder(r.Body).Decode(&input); err != nil {
		writeJSON(w, http.StatusBadRequest, Response{
			Errors: []APIError{{Code: "INVALID_BODY", Message: "invalid request body"}},
		})
		return
	}

	ownerID := middleware.GetUserID(r.Context())
	label, err := h.labelService.Create(r.Context(), projectID, ownerID, input)
	if err != nil {
		writeError(w, err)
		return
	}

	writeData(w, http.StatusCreated, label)
}

func (h *LabelHandler) List(w http.ResponseWriter, r *http.Request) {
	projectID, err := uuid.Parse(chi.URLParam(r, "projectID"))
	if err != nil {
		writeJSON(w, http.StatusBadRequest, Response{
			Errors: []APIError{{Code: "INVALID_ID", Message: "invalid project ID"}},
		})
		return
	}

	labels, err := h.labelService.ListByProject(r.Context(), projectID)
	if err != nil {
		writeError(w, err)
		return
	}
	if labels == nil {
		labels = []*domain.Label{}
	}
	writeData(w, http.StatusOK, labels)
}

func (h *LabelHandler) Delete(w http.ResponseWriter, r *http.Request) {
	labelID, err := uuid.Parse(chi.URLParam(r, "labelID"))
	if err != nil {
		writeJSON(w, http.StatusBadRequest, Response{
			Errors: []APIError{{Code: "INVALID_ID", Message: "invalid label ID"}},
		})
		return
	}

	ownerID := middleware.GetUserID(r.Context())
	if err := h.labelService.Delete(r.Context(), labelID, ownerID); err != nil {
		writeError(w, err)
		return
	}

	writeData(w, http.StatusOK, map[string]string{"message": "deleted"})
}

func (h *LabelHandler) AddToTask(w http.ResponseWriter, r *http.Request) {
	taskID, err := uuid.Parse(chi.URLParam(r, "taskID"))
	if err != nil {
		writeJSON(w, http.StatusBadRequest, Response{
			Errors: []APIError{{Code: "INVALID_ID", Message: "invalid task ID"}},
		})
		return
	}

	var body struct {
		LabelID uuid.UUID `json:"label_id"`
	}
	if err := json.NewDecoder(r.Body).Decode(&body); err != nil {
		writeJSON(w, http.StatusBadRequest, Response{
			Errors: []APIError{{Code: "INVALID_BODY", Message: "invalid request body"}},
		})
		return
	}

	if err := h.labelService.AddToTask(r.Context(), taskID, body.LabelID); err != nil {
		writeError(w, err)
		return
	}

	writeData(w, http.StatusOK, map[string]string{"message": "label added"})
}

func (h *LabelHandler) RemoveFromTask(w http.ResponseWriter, r *http.Request) {
	taskID, err := uuid.Parse(chi.URLParam(r, "taskID"))
	if err != nil {
		writeJSON(w, http.StatusBadRequest, Response{
			Errors: []APIError{{Code: "INVALID_ID", Message: "invalid task ID"}},
		})
		return
	}
	labelID, err := uuid.Parse(chi.URLParam(r, "labelID"))
	if err != nil {
		writeJSON(w, http.StatusBadRequest, Response{
			Errors: []APIError{{Code: "INVALID_ID", Message: "invalid label ID"}},
		})
		return
	}

	if err := h.labelService.RemoveFromTask(r.Context(), taskID, labelID); err != nil {
		writeError(w, err)
		return
	}

	writeData(w, http.StatusOK, map[string]string{"message": "label removed"})
}

func (h *LabelHandler) ListByTask(w http.ResponseWriter, r *http.Request) {
	taskID, err := uuid.Parse(chi.URLParam(r, "taskID"))
	if err != nil {
		writeJSON(w, http.StatusBadRequest, Response{
			Errors: []APIError{{Code: "INVALID_ID", Message: "invalid task ID"}},
		})
		return
	}

	labels, err := h.labelService.ListByTask(r.Context(), taskID)
	if err != nil {
		writeError(w, err)
		return
	}
	if labels == nil {
		labels = []*domain.Label{}
	}
	writeData(w, http.StatusOK, labels)
}
