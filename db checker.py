import sqlite3

def check_database():
    conn = sqlite3.connect('unilocator.db')
    cursor = conn.cursor()

    # List all tables
    cursor.execute("SELECT name FROM sqlite_master WHERE type='table';")
    tables = cursor.fetchall()

    print("📋 Tables in database:")
    for table in tables:
        table_name = table[0]
        print(f"\n📊 Table: {table_name}")
        
        # Get table schema
        cursor.execute(f"PRAGMA table_info({table_name})")
        columns = cursor.fetchall()
        
        print("Columns:")
        for col in columns:
            print(f"  - {col[1]}: {col[2]} {'PRIMARY KEY' if col[5] else ''}")
        
        # Get row count
        cursor.execute(f"SELECT COUNT(*) FROM {table_name}")
        count = cursor.fetchone()[0]
        print(f"Total rows: {count}")

    conn.close()

if __name__ == "__main__":
    check_database()
