from ..utils.database import get_db

class Device:
    def __init__(self, id, device_code, device_name, user_id, last_seen=None):
        self.id = id
        self.device_code = device_code
        self.device_name = device_name
        self.user_id = user_id
        self.last_seen = last_seen

    @staticmethod
    def get_by_id(device_id):
        db = get_db()
        device = db.execute(
            'SELECT * FROM devices WHERE id = ?', (device_id,)
        ).fetchone()
        return Device(**device) if device else None

    @staticmethod
    def get_by_code(device_code):
        db = get_db()
        device = db.execute(
            'SELECT * FROM devices WHERE device_code = ?', (device_code,)
        ).fetchone()
        return Device(**device) if device else None

    @staticmethod
    def get_by_user_id(user_id):
        db = get_db()
        devices = db.execute(
            'SELECT * FROM devices WHERE user_id = ?', (user_id,)
        ).fetchall()
        return [Device(**device) for device in devices]

    @staticmethod
    def create(device_code, device_name, user_id):
        db = get_db()
        try:
            cursor = db.execute(
                'INSERT INTO devices (device_code, device_name, user_id) VALUES (?, ?, ?)',
                (device_code, device_name, user_id)
            )
            db.commit()
            return Device.get_by_id(cursor.lastrowid)
        except db.IntegrityError:
            return None

    def update_location(self, latitude, longitude):
        db = get_db()
        db.execute(
            'UPDATE devices SET last_latitude = ?, last_longitude = ?, last_seen = CURRENT_TIMESTAMP WHERE id = ?',
            (latitude, longitude, self.id)
        )
        db.commit()