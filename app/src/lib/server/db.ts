import Database from 'better-sqlite3';
import fs from 'node:fs';
import { DATA_DIR, DB_PATH } from './paths';

let _db: Database.Database | null = null;

/** Singleton-Zugriff auf die SQLite-DB. Erstellt Datei + Schema bei Bedarf. */
export function getDb(): Database.Database {
	if (_db) return _db;
	fs.mkdirSync(DATA_DIR, { recursive: true });
	const db = new Database(DB_PATH);
	db.pragma('journal_mode = WAL');
	db.pragma('foreign_keys = ON');
	bootstrap(db);
	_db = db;
	return db;
}

function bootstrap(db: Database.Database) {
	db.exec(`
		CREATE TABLE IF NOT EXISTS character (
			id TEXT PRIMARY KEY,
			name TEXT NOT NULL,
			class_name TEXT NOT NULL DEFAULT '',
			race TEXT NOT NULL DEFAULT '',
			level INTEGER NOT NULL DEFAULT 1,
			background TEXT NOT NULL DEFAULT '',
			alignment TEXT NOT NULL DEFAULT '',
			proficiency_bonus INTEGER NOT NULL DEFAULT 2,
			str INTEGER NOT NULL DEFAULT 10,
			dex INTEGER NOT NULL DEFAULT 10,
			con INTEGER NOT NULL DEFAULT 10,
			int_ INTEGER NOT NULL DEFAULT 10,
			wis INTEGER NOT NULL DEFAULT 10,
			cha INTEGER NOT NULL DEFAULT 10,
			hp_current INTEGER NOT NULL DEFAULT 0,
			hp_max INTEGER NOT NULL DEFAULT 0,
			hp_temp INTEGER NOT NULL DEFAULT 0,
			ac INTEGER NOT NULL DEFAULT 10,
			initiative_bonus INTEGER NOT NULL DEFAULT 0,
			speed INTEGER NOT NULL DEFAULT 9,
			hit_dice TEXT NOT NULL DEFAULT '',
			hit_dice_remaining INTEGER NOT NULL DEFAULT 0,
			inspiration INTEGER NOT NULL DEFAULT 0,
			conditions TEXT NOT NULL DEFAULT '[]',
			death_save_successes INTEGER NOT NULL DEFAULT 0,
			death_save_failures INTEGER NOT NULL DEFAULT 0,
			spell_slots TEXT NOT NULL DEFAULT '[]',
			custom_trackers TEXT NOT NULL DEFAULT '[]',
			currency_gp INTEGER NOT NULL DEFAULT 0,
			currency_sp INTEGER NOT NULL DEFAULT 0,
			currency_cp INTEGER NOT NULL DEFAULT 0,
			notes TEXT NOT NULL DEFAULT '',
			created_at INTEGER NOT NULL,
			updated_at INTEGER NOT NULL,
			deleted_at INTEGER
		);

		CREATE TABLE IF NOT EXISTS character_event (
			id TEXT PRIMARY KEY,
			character_id TEXT NOT NULL,
			ts INTEGER NOT NULL,
			field TEXT NOT NULL,
			delta INTEGER,
			from_value TEXT,
			to_value TEXT,
			source TEXT NOT NULL DEFAULT 'manual',
			session_id TEXT
		);
		CREATE INDEX IF NOT EXISTS idx_event_char_ts ON character_event (character_id, ts);

		CREATE TABLE IF NOT EXISTS snapshot (
			id TEXT PRIMARY KEY,
			character_id TEXT NOT NULL,
			ts INTEGER NOT NULL,
			label TEXT NOT NULL DEFAULT '',
			state TEXT NOT NULL
		);
		CREATE INDEX IF NOT EXISTS idx_snapshot_char_ts ON snapshot (character_id, ts);

		CREATE TABLE IF NOT EXISTS inventory_item (
			id TEXT PRIMARY KEY,
			character_id TEXT NOT NULL,
			name TEXT NOT NULL,
			quantity INTEGER NOT NULL DEFAULT 1,
			weight REAL NOT NULL DEFAULT 0,
			category TEXT NOT NULL DEFAULT 'gear',
			equipped INTEGER NOT NULL DEFAULT 0,
			notes TEXT NOT NULL DEFAULT '',
			created_at INTEGER NOT NULL,
			updated_at INTEGER NOT NULL,
			deleted_at INTEGER
		);
		CREATE INDEX IF NOT EXISTS idx_item_char ON inventory_item (character_id);

		CREATE TABLE IF NOT EXISTS quest (
			id TEXT PRIMARY KEY,
			character_id TEXT NOT NULL,
			title TEXT NOT NULL,
			giver TEXT NOT NULL DEFAULT '',
			status TEXT NOT NULL DEFAULT 'active',
			priority TEXT NOT NULL DEFAULT 'normal',
			next_step TEXT NOT NULL DEFAULT '',
			reward TEXT NOT NULL DEFAULT '',
			notes TEXT NOT NULL DEFAULT '',
			sort_order INTEGER NOT NULL DEFAULT 0,
			created_at INTEGER NOT NULL,
			updated_at INTEGER NOT NULL,
			deleted_at INTEGER
		);
		CREATE INDEX IF NOT EXISTS idx_quest_char ON quest (character_id);
	`);
}
