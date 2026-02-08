package config

import (
	"fmt"
	"time"

	"github.com/joho/godotenv"
	"github.com/kelseyhightower/envconfig"
)

type Config struct {
	Server   ServerConfig
	Database DatabaseConfig
	JWT      JWTConfig
}

type ServerConfig struct {
	Port         int           `envconfig:"SERVER_PORT" default:"8080"`
	ReadTimeout  time.Duration `envconfig:"SERVER_READ_TIMEOUT" default:"10s"`
	WriteTimeout time.Duration `envconfig:"SERVER_WRITE_TIMEOUT" default:"30s"`
	IdleTimeout  time.Duration `envconfig:"SERVER_IDLE_TIMEOUT" default:"60s"`
	CORSOrigins  []string      `envconfig:"CORS_ORIGINS" default:"http://localhost:4200"`
}

type DatabaseConfig struct {
	Host     string `envconfig:"DB_HOST" default:"localhost"`
	Port     int    `envconfig:"DB_PORT" default:"5432"`
	User     string `envconfig:"DB_USER" default:"postgres"`
	Password string `envconfig:"DB_PASSWORD" default:"postgres"`
	Name     string `envconfig:"DB_NAME" default:"project_management"`
	SSLMode  string `envconfig:"DB_SSLMODE" default:"disable"`
}

type JWTConfig struct {
	Secret            string        `envconfig:"JWT_SECRET" required:"true"`
	AccessExpiration  time.Duration `envconfig:"JWT_ACCESS_EXPIRATION" default:"15m"`
	RefreshExpiration time.Duration `envconfig:"JWT_REFRESH_EXPIRATION" default:"168h"`
}

func (d DatabaseConfig) DSN() string {
	return fmt.Sprintf(
		"postgres://%s:%s@%s:%d/%s?sslmode=%s",
		d.User, d.Password, d.Host, d.Port, d.Name, d.SSLMode,
	)
}

func Load() (*Config, error) {
	_ = godotenv.Load()

	var cfg Config
	if err := envconfig.Process("", &cfg.Server); err != nil {
		return nil, fmt.Errorf("server config: %w", err)
	}
	if err := envconfig.Process("", &cfg.Database); err != nil {
		return nil, fmt.Errorf("database config: %w", err)
	}
	if err := envconfig.Process("", &cfg.JWT); err != nil {
		return nil, fmt.Errorf("jwt config: %w", err)
	}

	return &cfg, nil
}
