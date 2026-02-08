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

type ProjectHandler struct {
	projectService *service.ProjectService
}

func NewProjectHandler(projectService *service.ProjectService) *ProjectHandler {
	return &ProjectHandler{projectService: projectService}
}

func (h *ProjectHandler) Create(w http.ResponseWriter, r *http.Request) {
	var input service.CreateProjectInput
	if err := json.NewDecoder(r.Body).Decode(&input); err != nil {
		writeJSON(w, http.StatusBadRequest, Response{
			Errors: []APIError{{Code: "INVALID_BODY", Message: "invalid request body"}},
		})
		return
	}

	ownerID := middleware.GetUserID(r.Context())
	project, err := h.projectService.Create(r.Context(), ownerID, input)
	if err != nil {
		writeError(w, err)
		return
	}

	writeData(w, http.StatusCreated, project)
}

func (h *ProjectHandler) List(w http.ResponseWriter, r *http.Request) {
	ownerID := middleware.GetUserID(r.Context())
	projects, err := h.projectService.ListByOwner(r.Context(), ownerID)
	if err != nil {
		writeError(w, err)
		return
	}
	if projects == nil {
		projects = []*domain.Project{}
	}
	writeData(w, http.StatusOK, projects)
}

func (h *ProjectHandler) Get(w http.ResponseWriter, r *http.Request) {
	id, err := uuid.Parse(chi.URLParam(r, "projectID"))
	if err != nil {
		writeJSON(w, http.StatusBadRequest, Response{
			Errors: []APIError{{Code: "INVALID_ID", Message: "invalid project ID"}},
		})
		return
	}

	project, err := h.projectService.GetByID(r.Context(), id)
	if err != nil {
		writeError(w, err)
		return
	}

	writeData(w, http.StatusOK, project)
}

func (h *ProjectHandler) Update(w http.ResponseWriter, r *http.Request) {
	id, err := uuid.Parse(chi.URLParam(r, "projectID"))
	if err != nil {
		writeJSON(w, http.StatusBadRequest, Response{
			Errors: []APIError{{Code: "INVALID_ID", Message: "invalid project ID"}},
		})
		return
	}

	var input service.UpdateProjectInput
	if err := json.NewDecoder(r.Body).Decode(&input); err != nil {
		writeJSON(w, http.StatusBadRequest, Response{
			Errors: []APIError{{Code: "INVALID_BODY", Message: "invalid request body"}},
		})
		return
	}

	ownerID := middleware.GetUserID(r.Context())
	project, err := h.projectService.Update(r.Context(), id, ownerID, input)
	if err != nil {
		writeError(w, err)
		return
	}

	writeData(w, http.StatusOK, project)
}

func (h *ProjectHandler) Delete(w http.ResponseWriter, r *http.Request) {
	id, err := uuid.Parse(chi.URLParam(r, "projectID"))
	if err != nil {
		writeJSON(w, http.StatusBadRequest, Response{
			Errors: []APIError{{Code: "INVALID_ID", Message: "invalid project ID"}},
		})
		return
	}

	ownerID := middleware.GetUserID(r.Context())
	if err := h.projectService.Delete(r.Context(), id, ownerID); err != nil {
		writeError(w, err)
		return
	}

	writeData(w, http.StatusOK, map[string]string{"message": "deleted"})
}
