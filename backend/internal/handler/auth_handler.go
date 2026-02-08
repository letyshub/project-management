package handler

import (
	"encoding/json"
	"net/http"

	"github.com/letyshub/project-management/internal/service"
)

type AuthHandler struct {
	authService *service.AuthService
}

func NewAuthHandler(authService *service.AuthService) *AuthHandler {
	return &AuthHandler{authService: authService}
}

func (h *AuthHandler) Register(w http.ResponseWriter, r *http.Request) {
	var input service.RegisterInput
	if err := json.NewDecoder(r.Body).Decode(&input); err != nil {
		writeJSON(w, http.StatusBadRequest, Response{
			Errors: []APIError{{Code: "INVALID_BODY", Message: "invalid request body"}},
		})
		return
	}

	user, err := h.authService.Register(r.Context(), input)
	if err != nil {
		writeError(w, err)
		return
	}

	writeData(w, http.StatusCreated, user)
}

func (h *AuthHandler) Login(w http.ResponseWriter, r *http.Request) {
	var input service.LoginInput
	if err := json.NewDecoder(r.Body).Decode(&input); err != nil {
		writeJSON(w, http.StatusBadRequest, Response{
			Errors: []APIError{{Code: "INVALID_BODY", Message: "invalid request body"}},
		})
		return
	}

	user, tokens, err := h.authService.Login(r.Context(), input)
	if err != nil {
		writeError(w, err)
		return
	}

	writeData(w, http.StatusOK, map[string]interface{}{
		"user":          user,
		"access_token":  tokens.AccessToken,
		"refresh_token": tokens.RefreshToken,
	})
}

func (h *AuthHandler) Refresh(w http.ResponseWriter, r *http.Request) {
	var body struct {
		RefreshToken string `json:"refresh_token"`
	}
	if err := json.NewDecoder(r.Body).Decode(&body); err != nil || body.RefreshToken == "" {
		writeJSON(w, http.StatusBadRequest, Response{
			Errors: []APIError{{Code: "INVALID_BODY", Message: "refresh_token is required"}},
		})
		return
	}

	user, tokens, err := h.authService.RefreshToken(r.Context(), body.RefreshToken)
	if err != nil {
		writeError(w, err)
		return
	}

	writeData(w, http.StatusOK, map[string]interface{}{
		"user":          user,
		"access_token":  tokens.AccessToken,
		"refresh_token": tokens.RefreshToken,
	})
}

func (h *AuthHandler) Logout(w http.ResponseWriter, r *http.Request) {
	var body struct {
		RefreshToken string `json:"refresh_token"`
	}
	if err := json.NewDecoder(r.Body).Decode(&body); err != nil || body.RefreshToken == "" {
		writeJSON(w, http.StatusBadRequest, Response{
			Errors: []APIError{{Code: "INVALID_BODY", Message: "refresh_token is required"}},
		})
		return
	}

	if err := h.authService.Logout(r.Context(), body.RefreshToken); err != nil {
		writeError(w, err)
		return
	}

	writeData(w, http.StatusOK, map[string]string{"message": "logged out"})
}
