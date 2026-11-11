CREATE DATABASE IF NOT EXISTS pweb_mysql_lab CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE pweb_mysql_lab;

CREATE TABLE IF NOT EXISTS workspaces (
  id CHAR(32) PRIMARY KEY,
  created_at VARCHAR(30) NOT NULL,
  seeded SMALLINT NOT NULL DEFAULT 0
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS users (
  id VARCHAR(36) PRIMARY KEY,
  workspace_id CHAR(32) NOT NULL,
  name VARCHAR(100) NOT NULL,
  email VARCHAR(254) NOT NULL,
  age SMALLINT NOT NULL CHECK (age BETWEEN 1 AND 120),
  created_at VARCHAR(30) NOT NULL,
  CONSTRAINT users_email_unique UNIQUE (workspace_id,email),
  CONSTRAINT users_workspace_fk FOREIGN KEY (workspace_id) REFERENCES workspaces(id) ON DELETE CASCADE
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS calon_siswa (
  id VARCHAR(36) PRIMARY KEY,
  workspace_id CHAR(32) NOT NULL,
  nama VARCHAR(64) NOT NULL,
  alamat VARCHAR(255) NOT NULL,
  jenis_kelamin VARCHAR(16) NOT NULL,
  agama VARCHAR(64) NOT NULL,
  sekolah_asal VARCHAR(64) NOT NULL,
  created_at VARCHAR(30) NOT NULL,
  CONSTRAINT siswa_workspace_fk FOREIGN KEY (workspace_id) REFERENCES workspaces(id) ON DELETE CASCADE
) ENGINE=InnoDB;
