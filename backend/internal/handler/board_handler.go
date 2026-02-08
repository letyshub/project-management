package handler

import (
	"encoding/json"
	"net/http"

	"github.com/go-chi/chi/v5"
	"github.com/google/uuid"

	"github.com/letyshub/project-management/internal/middleware"
	"github.com/letyshub/project-management/internal/service"
)

type BoardHandler struct {
	boardService *service.BoardService
}

func NewBoardHandler(boardService *service.BoardService) *BoardHandler {
	return &BoardHandler{boardService: boardService}
}

// Board CRUD

func (h *BoardHandler) Create(w http.ResponseWriter, r *http.Request) {
	projectID, err := uuid.Parse(chi.URLParam(r, "projectID"))
	if err != nil {
		writeJSON(w, http.StatusBadRequest, Response{
			Errors: []APIError{{Code: "INVALID_ID", Message: "invalid project ID"}},
		})
		return
	}

	var input service.CreateBoardInput
	if err := json.NewDecoder(r.Body).Decode(&input); err != nil {
		writeJSON(w, http.StatusBadRequest, Response{
			Errors: []APIError{{Code: "INVALID_BODY", Message: "invalid request body"}},
		})
		return
	}

	ownerID := middleware.GetUserID(r.Context())
	board, err := h.boardService.Create(r.Context(), projectID, ownerID, input)
	if err != nil {
		writeError(w, err)
		return
	}

	writeData(w, http.StatusCreated, board)
}

func (h *BoardHandler) List(w http.ResponseWriter, r *http.Request) {
	projectID, err := uuid.Parse(chi.URLParam(r, "projectID"))
	if err != nil {
		writeJSON(w, http.StatusBadRequest, Response{
			Errors: []APIError{{Code: "INVALID_ID", Message: "invalid project ID"}},
		})
		return
	}

	boards, err := h.boardService.ListByProject(r.Context(), projectID)
	if err != nil {
		writeError(w, err)
		return
	}
	writeData(w, http.StatusOK, boards)
}

func (h *BoardHandler) Get(w http.ResponseWriter, r *http.Request) {
	id, err := uuid.Parse(chi.URLParam(r, "boardID"))
	if err != nil {
		writeJSON(w, http.StatusBadRequest, Response{
			Errors: []APIError{{Code: "INVALID_ID", Message: "invalid board ID"}},
		})
		return
	}

	board, err := h.boardService.GetByID(r.Context(), id)
	if err != nil {
		writeError(w, err)
		return
	}

	writeData(w, http.StatusOK, board)
}

func (h *BoardHandler) Update(w http.ResponseWriter, r *http.Request) {
	id, err := uuid.Parse(chi.URLParam(r, "boardID"))
	if err != nil {
		writeJSON(w, http.StatusBadRequest, Response{
			Errors: []APIError{{Code: "INVALID_ID", Message: "invalid board ID"}},
		})
		return
	}

	var input service.UpdateBoardInput
	if err := json.NewDecoder(r.Body).Decode(&input); err != nil {
		writeJSON(w, http.StatusBadRequest, Response{
			Errors: []APIError{{Code: "INVALID_BODY", Message: "invalid request body"}},
		})
		return
	}

	ownerID := middleware.GetUserID(r.Context())
	board, err := h.boardService.Update(r.Context(), id, ownerID, input)
	if err != nil {
		writeError(w, err)
		return
	}

	writeData(w, http.StatusOK, board)
}

func (h *BoardHandler) Delete(w http.ResponseWriter, r *http.Request) {
	id, err := uuid.Parse(chi.URLParam(r, "boardID"))
	if err != nil {
		writeJSON(w, http.StatusBadRequest, Response{
			Errors: []APIError{{Code: "INVALID_ID", Message: "invalid board ID"}},
		})
		return
	}

	ownerID := middleware.GetUserID(r.Context())
	if err := h.boardService.Delete(r.Context(), id, ownerID); err != nil {
		writeError(w, err)
		return
	}

	writeData(w, http.StatusOK, map[string]string{"message": "deleted"})
}

// Column CRUD

func (h *BoardHandler) CreateColumn(w http.ResponseWriter, r *http.Request) {
	boardID, err := uuid.Parse(chi.URLParam(r, "boardID"))
	if err != nil {
		writeJSON(w, http.StatusBadRequest, Response{
			Errors: []APIError{{Code: "INVALID_ID", Message: "invalid board ID"}},
		})
		return
	}

	var input service.CreateColumnInput
	if err := json.NewDecoder(r.Body).Decode(&input); err != nil {
		writeJSON(w, http.StatusBadRequest, Response{
			Errors: []APIError{{Code: "INVALID_BODY", Message: "invalid request body"}},
		})
		return
	}

	ownerID := middleware.GetUserID(r.Context())
	col, err := h.boardService.CreateColumn(r.Context(), boardID, ownerID, input)
	if err != nil {
		writeError(w, err)
		return
	}

	writeData(w, http.StatusCreated, col)
}

func (h *BoardHandler) ListColumns(w http.ResponseWriter, r *http.Request) {
	boardID, err := uuid.Parse(chi.URLParam(r, "boardID"))
	if err != nil {
		writeJSON(w, http.StatusBadRequest, Response{
			Errors: []APIError{{Code: "INVALID_ID", Message: "invalid board ID"}},
		})
		return
	}

	columns, err := h.boardService.ListColumns(r.Context(), boardID)
	if err != nil {
		writeError(w, err)
		return
	}
	writeData(w, http.StatusOK, columns)
}

func (h *BoardHandler) UpdateColumn(w http.ResponseWriter, r *http.Request) {
	colID, err := uuid.Parse(chi.URLParam(r, "columnID"))
	if err != nil {
		writeJSON(w, http.StatusBadRequest, Response{
			Errors: []APIError{{Code: "INVALID_ID", Message: "invalid column ID"}},
		})
		return
	}

	var input service.UpdateColumnInput
	if err := json.NewDecoder(r.Body).Decode(&input); err != nil {
		writeJSON(w, http.StatusBadRequest, Response{
			Errors: []APIError{{Code: "INVALID_BODY", Message: "invalid request body"}},
		})
		return
	}

	ownerID := middleware.GetUserID(r.Context())
	col, err := h.boardService.UpdateColumn(r.Context(), colID, ownerID, input)
	if err != nil {
		writeError(w, err)
		return
	}

	writeData(w, http.StatusOK, col)
}

func (h *BoardHandler) DeleteColumn(w http.ResponseWriter, r *http.Request) {
	colID, err := uuid.Parse(chi.URLParam(r, "columnID"))
	if err != nil {
		writeJSON(w, http.StatusBadRequest, Response{
			Errors: []APIError{{Code: "INVALID_ID", Message: "invalid column ID"}},
		})
		return
	}

	ownerID := middleware.GetUserID(r.Context())
	if err := h.boardService.DeleteColumn(r.Context(), colID, ownerID); err != nil {
		writeError(w, err)
		return
	}

	writeData(w, http.StatusOK, map[string]string{"message": "deleted"})
}
