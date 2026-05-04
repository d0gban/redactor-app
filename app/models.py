import sqlite3
from flask import current_app, g


def get_db():
    if "db" not in g:
        g.db = sqlite3.connect(
            current_app.config["DATABASE"],
            detect_types=sqlite3.PARSE_DECLTYPES,
        )
        g.db.row_factory = sqlite3.Row
    return g.db


def close_db(e=None):
    db = g.pop("db", None)
    if db is not None:
        db.close()


def init_db(app):
    with app.app_context():
        db = get_db()
        db.executescript(
            """
            CREATE TABLE IF NOT EXISTS redaction_jobs (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                created_at TEXT NOT NULL,
                original_hash TEXT NOT NULL,
                redacted_text TEXT NOT NULL
            );

            CREATE TABLE IF NOT EXISTS token_map (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                job_id INTEGER NOT NULL,
                entity_type TEXT NOT NULL,
                token TEXT NOT NULL,
                original_value_encrypted TEXT NOT NULL,
                original_value_preview TEXT NOT NULL,
                FOREIGN KEY(job_id) REFERENCES redaction_jobs(id)
            );
            """
        )
        db.commit()