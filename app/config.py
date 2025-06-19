import os

class Config:
    SECRET_KEY = 'your-secret-key'
    BASE_DIR = os.path.dirname(os.path.dirname(__file__))
    DATABASE = os.path.join(BASE_DIR, 'instance', 'unilocator.db')
    SCHEMA_PATH = os.path.join(BASE_DIR, 'instance', 'schema.sql')