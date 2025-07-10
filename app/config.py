import os
import secrets

class Config:
    SECRET_KEY = os.environ.get('SECRET_KEY') or secrets.token_hex(32)
    BASE_DIR = os.path.dirname(os.path.dirname(__file__))
    DATABASE = os.path.join(BASE_DIR, 'instance', 'unilocator.db')
    SCHEMA_PATH = os.path.join(BASE_DIR, 'instance', 'schema.sql')