import sqlite3
import click
from flask import current_app, g
import os

def get_db():
    if 'db' not in g:
        # Ensure instance directory exists
        os.makedirs(os.path.dirname(current_app.config['DATABASE']), exist_ok=True)
        
        g.db = sqlite3.connect(
            current_app.config['DATABASE'],
            detect_types=sqlite3.PARSE_DECLTYPES
        )
        g.db.row_factory = sqlite3.Row
    return g.db

def close_db(e=None):
    db = g.pop('db', None)
    if db is not None:
        db.close()

def init_db():
    db = get_db()
    
    # Read schema from the correct path
    with open(current_app.config['SCHEMA_PATH'], 'r') as f:
        db.executescript(f.read())
    
    db.commit()

def init_app(app):
    app.teardown_appcontext(close_db)