package handler

import (
	"encoding/json"
	"net/http"
	"time"

	"github.com/letyshub/project-management/internal/domain"
	"github.com/letyshub/project-management/internal/middleware"
)

type ProfileHandler struct {
	userRepo domain.UserRepository
}

func NewProfileHandler(userRepo domain.UserRepository) *ProfileHandler {
	return &ProfileHandler{userRepo: userRepo}
}

func (h *ProfileHandler) GetMe(w http.ResponseWriter, r *http.Request) {
	userID := middleware.GetUserID(r.Context())
	user, err := h.userRepo.GetByID(r.Context(), userID)
	if err != nil {
		writeError(w, err)
		return
	}
	writeData(w, http.StatusOK, user)
}

func (h *ProfileHandler) UpdateMe(w http.ResponseWriter, r *http.Request) {
	userID := middleware.GetUserID(r.Context())

	var body struct {
		Name string `json:"name"`
	}
	if err := json.NewDecoder(r.Body).Decode(&body); err != nil {
		writeJSON(w, http.StatusBadRequest, Response{
			Errors: []APIError{{Code: "INVALID_BODY", Message: "invalid request body"}},
		})
		return
	}

	user, err := h.userRepo.GetByID(r.Context(), userID)
	if err != nil {
		writeError(w, err)
		return
	}

	if body.Name != "" {
		user.Name = body.Name
	}
	user.UpdatedAt = time.Now()

	if err := h.userRepo.Update(r.Context(), user); err != nil {
		writeError(w, err)
		return
	}

	writeData(w, http.StatusOK, user)
}
