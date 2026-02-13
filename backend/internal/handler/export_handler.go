package handler

import (
	"encoding/csv"
	"fmt"
	"net/http"

	"github.com/go-chi/chi/v5"
	"github.com/google/uuid"

	"github.com/letyshub/project-management/internal/domain"
	"github.com/letyshub/project-management/internal/service"
)

type ExportHandler struct {
	taskService  *service.TaskService
	boardService *service.BoardService
}

func NewExportHandler(ts *service.TaskService, bs *service.BoardService) *ExportHandler {
	return &ExportHandler{taskService: ts, boardService: bs}
}

func (h *ExportHandler) TasksCSV(w http.ResponseWriter, r *http.Request) {
	boardID, err := uuid.Parse(chi.URLParam(r, "boardID"))
	if err != nil {
		writeJSON(w, http.StatusBadRequest, Response{
			Errors: []APIError{{Code: "INVALID_ID", Message: "invalid board ID"}},
		})
		return
	}

	tasks, err := h.taskService.ListByBoard(r.Context(), boardID, domain.TaskFilter{})
	if err != nil {
		writeError(w, err)
		return
	}

	columns, err := h.boardService.ListColumns(r.Context(), boardID)
	if err != nil {
		writeError(w, err)
		return
	}

	colNames := make(map[uuid.UUID]string)
	for _, c := range columns {
		colNames[c.ID] = c.Name
	}

	w.Header().Set("Content-Type", "text/csv")
	w.Header().Set("Content-Disposition", "attachment; filename=tasks.csv")

	cw := csv.NewWriter(w)
	_ = cw.Write([]string{"Title", "Description", "Priority", "Column", "Created"})
	for _, t := range tasks {
		colName := colNames[t.ColumnID]
		if colName == "" {
			colName = t.ColumnID.String()
		}
		_ = cw.Write([]string{
			t.Title,
			t.Description,
			t.Priority,
			colName,
			t.CreatedAt.Format("2006-01-02"),
		})
	}
	cw.Flush()

	if err := cw.Error(); err != nil {
		fmt.Printf("csv write error: %v\n", err)
	}
}
