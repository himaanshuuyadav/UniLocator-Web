from ..utils.database import get_db
from werkzeug.security import check_password_hash, generate_password_hash

class User:
    def __init__(self, id, username, email, password_hash):
        self.id = id
        self.username = username
        self.email = email
        self.password_hash = password_hash

    @staticmethod
    def get_by_id(user_id):
        db = get_db()
        user = db.execute(
            'SELECT * FROM users WHERE id = ?', (user_id,)
        ).fetchone()
        return User(**user) if user else None

    @staticmethod
    def get_by_username(username):
        db = get_db()
        user = db.execute(
            'SELECT * FROM users WHERE username = ?', (username,)
        ).fetchone()
        return User(**user) if user else None

    @staticmethod
    def create(username, email, password):
        db = get_db()
        try:
            cursor = db.execute(
                'INSERT INTO users (username, email, password) VALUES (?, ?, ?)',
                (username, email, generate_password_hash(password))
            )
            db.commit()
            return User.get_by_id(cursor.lastrowid)
        except db.IntegrityError:
            return None

    def verify_password(self, password):
        return check_password_hash(self.password_hash, password)

    def get_devices(self):
        from .device import Device
        return Device.get_by_user_id(self.id)