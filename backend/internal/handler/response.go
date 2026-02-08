package handler

import (
	"encoding/json"
	"errors"
	"net/http"

	"github.com/letyshub/project-management/internal/domain"
)

type Response struct {
	Data   interface{} `json:"data,omitempty"`
	Meta   interface{} `json:"meta,omitempty"`
	Errors []APIError  `json:"errors,omitempty"`
}

type APIError struct {
	Code    string `json:"code"`
	Message string `json:"message"`
}

func writeJSON(w http.ResponseWriter, status int, v interface{}) {
	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(status)
	json.NewEncoder(w).Encode(v)
}

func writeData(w http.ResponseWriter, status int, data interface{}) {
	writeJSON(w, status, Response{Data: data})
}

func writeError(w http.ResponseWriter, err error) {
	switch {
	case errors.Is(err, domain.ErrValidation):
		writeJSON(w, http.StatusBadRequest, Response{
			Errors: []APIError{{Code: "VALIDATION_ERROR", Message: err.Error()}},
		})
	case errors.Is(err, domain.ErrConflict):
		writeJSON(w, http.StatusConflict, Response{
			Errors: []APIError{{Code: "CONFLICT", Message: "resource already exists"}},
		})
	case errors.Is(err, domain.ErrNotFound):
		writeJSON(w, http.StatusNotFound, Response{
			Errors: []APIError{{Code: "NOT_FOUND", Message: "resource not found"}},
		})
	case errors.Is(err, domain.ErrInvalidCredentials):
		writeJSON(w, http.StatusUnauthorized, Response{
			Errors: []APIError{{Code: "INVALID_CREDENTIALS", Message: "invalid email or password"}},
		})
	case errors.Is(err, domain.ErrUnauthorized):
		writeJSON(w, http.StatusUnauthorized, Response{
			Errors: []APIError{{Code: "UNAUTHORIZED", Message: "unauthorized"}},
		})
	case errors.Is(err, domain.ErrForbidden):
		writeJSON(w, http.StatusForbidden, Response{
			Errors: []APIError{{Code: "FORBIDDEN", Message: "forbidden"}},
		})
	default:
		writeJSON(w, http.StatusInternalServerError, Response{
			Errors: []APIError{{Code: "INTERNAL_ERROR", Message: "internal server error"}},
		})
	}
}
