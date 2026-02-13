package handler

import (
	"encoding/json"
	"fmt"
	"net/http"
	"net/http/httptest"
	"testing"

	"github.com/letyshub/project-management/internal/domain"
)

func TestWriteError(t *testing.T) {
	tests := []struct {
		name           string
		err            error
		expectedStatus int
		expectedCode   string
	}{
		{
			name:           "validation error",
			err:            fmt.Errorf("%w: name is required", domain.ErrValidation),
			expectedStatus: http.StatusBadRequest,
			expectedCode:   "VALIDATION_ERROR",
		},
		{
			name:           "conflict error",
			err:            domain.ErrConflict,
			expectedStatus: http.StatusConflict,
			expectedCode:   "CONFLICT",
		},
		{
			name:           "not found error",
			err:            domain.ErrNotFound,
			expectedStatus: http.StatusNotFound,
			expectedCode:   "NOT_FOUND",
		},
		{
			name:           "invalid credentials error",
			err:            domain.ErrInvalidCredentials,
			expectedStatus: http.StatusUnauthorized,
			expectedCode:   "INVALID_CREDENTIALS",
		},
		{
			name:           "unauthorized error",
			err:            domain.ErrUnauthorized,
			expectedStatus: http.StatusUnauthorized,
			expectedCode:   "UNAUTHORIZED",
		},
		{
			name:           "forbidden error",
			err:            domain.ErrForbidden,
			expectedStatus: http.StatusForbidden,
			expectedCode:   "FORBIDDEN",
		},
		{
			name:           "unknown error",
			err:            fmt.Errorf("something went wrong"),
			expectedStatus: http.StatusInternalServerError,
			expectedCode:   "INTERNAL_ERROR",
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			rec := httptest.NewRecorder()
			writeError(rec, tt.err)

			if rec.Code != tt.expectedStatus {
				t.Errorf("expected status %d, got %d", tt.expectedStatus, rec.Code)
			}

			var resp Response
			if err := json.NewDecoder(rec.Body).Decode(&resp); err != nil {
				t.Fatalf("failed to decode response: %v", err)
			}

			if len(resp.Errors) == 0 {
				t.Fatal("expected at least one error in response")
			}

			if resp.Errors[0].Code != tt.expectedCode {
				t.Errorf("expected error code %s, got %s", tt.expectedCode, resp.Errors[0].Code)
			}
		})
	}
}

func TestWriteData(t *testing.T) {
	rec := httptest.NewRecorder()
	data := map[string]string{"key": "value"}
	writeData(rec, http.StatusOK, data)

	if rec.Code != http.StatusOK {
		t.Errorf("expected status 200, got %d", rec.Code)
	}

	var resp Response
	if err := json.NewDecoder(rec.Body).Decode(&resp); err != nil {
		t.Fatalf("failed to decode response: %v", err)
	}

	if resp.Data == nil {
		t.Error("expected data in response")
	}
}
