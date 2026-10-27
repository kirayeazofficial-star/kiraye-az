-- Host-only Kirayeal schema for MariaDB 10.11+. Apply to a NEW empty cPanel
-- database. It does not read, modify or delete the current Supabase project.
SET NAMES utf8mb4 COLLATE utf8mb4_unicode_ci;
SET time_zone = '+00:00';

CREATE TABLE IF NOT EXISTS users (
  id CHAR(36) PRIMARY KEY,
  email VARCHAR(254) NOT NULL,
  password_hash VARCHAR(255) NULL,
  email_confirmed_at DATETIME(3) NULL,
  disabled_at DATETIME(3) NULL,
  created_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  updated_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
  UNIQUE KEY users_email_unique (email)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS oauth_identities (
  provider VARCHAR(32) NOT NULL,
  provider_user_id VARCHAR(191) NOT NULL,
  user_id CHAR(36) NOT NULL,
  created_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  PRIMARY KEY (provider, provider_user_id),
  UNIQUE KEY oauth_user_provider_unique (user_id, provider),
  CONSTRAINT oauth_user_fk FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS verification_codes (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT PRIMARY KEY,
  user_id CHAR(36) NULL,
  email VARCHAR(254) NOT NULL,
  purpose ENUM('signup','recovery','email_change') NOT NULL,
  code_hash BINARY(32) NOT NULL,
  attempts TINYINT UNSIGNED NOT NULL DEFAULT 0,
  expires_at DATETIME(3) NOT NULL,
  consumed_at DATETIME(3) NULL,
  created_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  KEY verification_email_purpose_idx (email, purpose, created_at),
  CONSTRAINT verification_user_fk FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS sessions (
  id CHAR(36) PRIMARY KEY,
  user_id CHAR(36) NOT NULL,
  token_hash BINARY(32) NOT NULL,
  expires_at DATETIME(3) NOT NULL,
  last_seen_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  revoked_at DATETIME(3) NULL,
  created_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  UNIQUE KEY sessions_token_unique (token_hash),
  KEY sessions_user_idx (user_id, expires_at),
  CONSTRAINT sessions_user_fk FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS profiles (
  id CHAR(36) PRIMARY KEY,
  profile_no BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  display_name VARCHAR(100) NOT NULL DEFAULT '',
  phone VARCHAR(32) NOT NULL DEFAULT '',
  role ENUM('user','admin') NOT NULL DEFAULT 'user',
  phone_change_count TINYINT UNSIGNED NOT NULL DEFAULT 0,
  email_change_count TINYINT UNSIGNED NOT NULL DEFAULT 0,
  created_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  updated_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
  UNIQUE KEY profiles_number_unique (profile_no),
  CONSTRAINT profiles_user_fk FOREIGN KEY (id) REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS listings (
  id CHAR(36) PRIMARY KEY,
  owner_id CHAR(36) NOT NULL,
  title VARCHAR(140) NOT NULL,
  description TEXT NOT NULL,
  category VARCHAR(64) NOT NULL,
  city VARCHAR(80) NOT NULL,
  district VARCHAR(100) NULL,
  price DECIMAL(12,2) NOT NULL,
  rental_period ENUM('daily','weekly','monthly') NOT NULL,
  deposit DECIMAL(12,2) NULL,
  min_days SMALLINT UNSIGNED NOT NULL DEFAULT 1,
  contact VARCHAR(32) NOT NULL,
  status ENUM('draft','pending','published','rejected','archived','expired') NOT NULL DEFAULT 'pending',
  attributes JSON NULL,
  rejection_reason VARCHAR(500) NULL,
  first_published_at DATETIME(3) NULL,
  expires_at DATETIME(3) NULL,
  created_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  updated_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
  KEY listings_public_idx (status, created_at),
  KEY listings_owner_idx (owner_id, status, created_at),
  CONSTRAINT listings_owner_fk FOREIGN KEY (owner_id) REFERENCES users(id) ON DELETE RESTRICT
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS listing_images (
  id CHAR(36) PRIMARY KEY,
  listing_id CHAR(36) NOT NULL,
  owner_id CHAR(36) NOT NULL,
  storage_path VARCHAR(500) NOT NULL,
  public_path VARCHAR(500) NOT NULL,
  sha256 CHAR(64) NOT NULL,
  sort_order SMALLINT UNSIGNED NOT NULL DEFAULT 0,
  created_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  UNIQUE KEY listing_image_path_unique (storage_path),
  KEY listing_images_order_idx (listing_id, sort_order),
  CONSTRAINT listing_images_listing_fk FOREIGN KEY (listing_id) REFERENCES listings(id) ON DELETE CASCADE,
  CONSTRAINT listing_images_owner_fk FOREIGN KEY (owner_id) REFERENCES users(id) ON DELETE RESTRICT
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS chat_threads (
  id CHAR(36) PRIMARY KEY,
  listing_id CHAR(36) NOT NULL,
  buyer_id CHAR(36) NOT NULL,
  seller_id CHAR(36) NOT NULL,
  created_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  updated_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
  UNIQUE KEY chat_parties_unique (listing_id, buyer_id, seller_id),
  KEY chat_buyer_idx (buyer_id, updated_at),
  KEY chat_seller_idx (seller_id, updated_at),
  CONSTRAINT chat_listing_fk FOREIGN KEY (listing_id) REFERENCES listings(id) ON DELETE RESTRICT,
  CONSTRAINT chat_buyer_fk FOREIGN KEY (buyer_id) REFERENCES users(id) ON DELETE RESTRICT,
  CONSTRAINT chat_seller_fk FOREIGN KEY (seller_id) REFERENCES users(id) ON DELETE RESTRICT,
  CONSTRAINT chat_no_self CHECK (buyer_id <> seller_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS chat_messages (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT PRIMARY KEY,
  thread_id CHAR(36) NOT NULL,
  author_id CHAR(36) NOT NULL,
  body VARCHAR(2000) NOT NULL,
  created_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  KEY chat_messages_page_idx (thread_id, id),
  CONSTRAINT chat_messages_thread_fk FOREIGN KEY (thread_id) REFERENCES chat_threads(id) ON DELETE CASCADE,
  CONSTRAINT chat_messages_author_fk FOREIGN KEY (author_id) REFERENCES users(id) ON DELETE RESTRICT
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS chat_reads (
  thread_id CHAR(36) NOT NULL,
  user_id CHAR(36) NOT NULL,
  last_read_message_id BIGINT UNSIGNED NULL,
  updated_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
  PRIMARY KEY (thread_id, user_id),
  CONSTRAINT chat_reads_thread_fk FOREIGN KEY (thread_id) REFERENCES chat_threads(id) ON DELETE CASCADE,
  CONSTRAINT chat_reads_user_fk FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS chat_blocks (
  blocker_id CHAR(36) NOT NULL,
  blocked_id CHAR(36) NOT NULL,
  created_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  PRIMARY KEY (blocker_id, blocked_id),
  CONSTRAINT chat_blocks_blocker_fk FOREIGN KEY (blocker_id) REFERENCES users(id) ON DELETE CASCADE,
  CONSTRAINT chat_blocks_blocked_fk FOREIGN KEY (blocked_id) REFERENCES users(id) ON DELETE CASCADE,
  CONSTRAINT chat_block_no_self CHECK (blocker_id <> blocked_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS listing_reports (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT PRIMARY KEY,
  listing_id CHAR(36) NOT NULL,
  reporter_id CHAR(36) NOT NULL,
  reason VARCHAR(500) NOT NULL,
  status ENUM('open','resolved','dismissed') NOT NULL DEFAULT 'open',
  created_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  KEY listing_reports_status_idx (status, created_at),
  CONSTRAINT listing_reports_listing_fk FOREIGN KEY (listing_id) REFERENCES listings(id) ON DELETE RESTRICT,
  CONSTRAINT listing_reports_reporter_fk FOREIGN KEY (reporter_id) REFERENCES users(id) ON DELETE RESTRICT
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS staff_members (
  user_id CHAR(36) PRIMARY KEY,
  staff_role ENUM('moderator','leader') NOT NULL,
  enabled BOOLEAN NOT NULL DEFAULT TRUE,
  assigned_by CHAR(36) NOT NULL,
  created_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  updated_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
  CONSTRAINT staff_user_fk FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE RESTRICT,
  CONSTRAINT staff_assigner_fk FOREIGN KEY (assigned_by) REFERENCES users(id) ON DELETE RESTRICT
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS moderation_events (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT PRIMARY KEY,
  listing_id CHAR(36) NULL,
  actor_id CHAR(36) NOT NULL,
  action VARCHAR(64) NOT NULL,
  reason VARCHAR(500) NULL,
  snapshot JSON NULL,
  created_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  KEY moderation_events_listing_idx (listing_id, id),
  CONSTRAINT moderation_actor_fk FOREIGN KEY (actor_id) REFERENCES users(id) ON DELETE RESTRICT
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS listing_views (
  listing_id CHAR(36) NOT NULL,
  visitor_hash BINARY(32) NOT NULL,
  viewed_on DATE NOT NULL,
  created_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  PRIMARY KEY (listing_id, visitor_hash, viewed_on),
  CONSTRAINT listing_views_listing_fk FOREIGN KEY (listing_id) REFERENCES listings(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
