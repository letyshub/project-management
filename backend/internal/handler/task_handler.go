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

type TaskHandler struct {
	taskService *service.TaskService
}

func NewTaskHandler(taskService *service.TaskService) *TaskHandler {
	return &TaskHandler{taskService: taskService}
}

func (h *TaskHandler) Create(w http.ResponseWriter, r *http.Request) {
	columnID, err := uuid.Parse(chi.URLParam(r, "columnID"))
	if err != nil {
		writeJSON(w, http.StatusBadRequest, Response{
			Errors: []APIError{{Code: "INVALID_ID", Message: "invalid column ID"}},
		})
		return
	}

	var input service.CreateTaskInput
	if err := json.NewDecoder(r.Body).Decode(&input); err != nil {
		writeJSON(w, http.StatusBadRequest, Response{
			Errors: []APIError{{Code: "INVALID_BODY", Message: "invalid request body"}},
		})
		return
	}

	ownerID := middleware.GetUserID(r.Context())
	task, err := h.taskService.Create(r.Context(), columnID, ownerID, input)
	if err != nil {
		writeError(w, err)
		return
	}

	writeData(w, http.StatusCreated, task)
}

func (h *TaskHandler) ListByBoard(w http.ResponseWriter, r *http.Request) {
	boardID, err := uuid.Parse(chi.URLParam(r, "boardID"))
	if err != nil {
		writeJSON(w, http.StatusBadRequest, Response{
			Errors: []APIError{{Code: "INVALID_ID", Message: "invalid board ID"}},
		})
		return
	}

	filter := domain.TaskFilter{}
	if v := r.URL.Query().Get("priority"); v != "" {
		filter.Priority = &v
	}
	if v := r.URL.Query().Get("assignee_id"); v != "" {
		id, err := uuid.Parse(v)
		if err == nil {
			filter.AssigneeID = &id
		}
	}
	if v := r.URL.Query().Get("column_id"); v != "" {
		id, err := uuid.Parse(v)
		if err == nil {
			filter.ColumnID = &id
		}
	}

	tasks, err := h.taskService.ListByBoard(r.Context(), boardID, filter)
	if err != nil {
		writeError(w, err)
		return
	}
	if tasks == nil {
		tasks = []*domain.Task{}
	}
	writeData(w, http.StatusOK, tasks)
}

func (h *TaskHandler) Get(w http.ResponseWriter, r *http.Request) {
	id, err := uuid.Parse(chi.URLParam(r, "taskID"))
	if err != nil {
		writeJSON(w, http.StatusBadRequest, Response{
			Errors: []APIError{{Code: "INVALID_ID", Message: "invalid task ID"}},
		})
		return
	}

	task, err := h.taskService.GetByID(r.Context(), id)
	if err != nil {
		writeError(w, err)
		return
	}

	writeData(w, http.StatusOK, task)
}

func (h *TaskHandler) Update(w http.ResponseWriter, r *http.Request) {
	id, err := uuid.Parse(chi.URLParam(r, "taskID"))
	if err != nil {
		writeJSON(w, http.StatusBadRequest, Response{
			Errors: []APIError{{Code: "INVALID_ID", Message: "invalid task ID"}},
		})
		return
	}

	var input service.UpdateTaskInput
	if err := json.NewDecoder(r.Body).Decode(&input); err != nil {
		writeJSON(w, http.StatusBadRequest, Response{
			Errors: []APIError{{Code: "INVALID_BODY", Message: "invalid request body"}},
		})
		return
	}

	ownerID := middleware.GetUserID(r.Context())
	task, err := h.taskService.Update(r.Context(), id, ownerID, input)
	if err != nil {
		writeError(w, err)
		return
	}

	writeData(w, http.StatusOK, task)
}

func (h *TaskHandler) Move(w http.ResponseWriter, r *http.Request) {
	id, err := uuid.Parse(chi.URLParam(r, "taskID"))
	if err != nil {
		writeJSON(w, http.StatusBadRequest, Response{
			Errors: []APIError{{Code: "INVALID_ID", Message: "invalid task ID"}},
		})
		return
	}

	var input service.MoveTaskInput
	if err := json.NewDecoder(r.Body).Decode(&input); err != nil {
		writeJSON(w, http.StatusBadRequest, Response{
			Errors: []APIError{{Code: "INVALID_BODY", Message: "invalid request body"}},
		})
		return
	}

	ownerID := middleware.GetUserID(r.Context())
	task, err := h.taskService.Move(r.Context(), id, ownerID, input)
	if err != nil {
		writeError(w, err)
		return
	}

	writeData(w, http.StatusOK, task)
}

func (h *TaskHandler) Delete(w http.ResponseWriter, r *http.Request) {
	id, err := uuid.Parse(chi.URLParam(r, "taskID"))
	if err != nil {
		writeJSON(w, http.StatusBadRequest, Response{
			Errors: []APIError{{Code: "INVALID_ID", Message: "invalid task ID"}},
		})
		return
	}

	ownerID := middleware.GetUserID(r.Context())
	if err := h.taskService.Delete(r.Context(), id, ownerID); err != nil {
		writeError(w, err)
		return
	}

	writeData(w, http.StatusOK, map[string]string{"message": "deleted"})
}
