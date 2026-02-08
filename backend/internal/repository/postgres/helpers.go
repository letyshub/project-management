package postgres

import (
	"strings"
)

func isUniqueViolation(err error) bool {
	return strings.Contains(err.Error(), "23505")
}
