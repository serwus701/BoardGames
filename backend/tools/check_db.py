import sqlite3
import os

db_path = os.path.join(os.path.dirname(os.path.dirname(os.path.dirname(__file__))), 'boardgames.db')
print('Checking DB file:', db_path)
if not os.path.exists(db_path):
    print('DB file not found at', db_path)
    raise SystemExit(1)

conn = sqlite3.connect(db_path)
c = conn.cursor()
tables = ['board_games','shared_game_instances','game_queue','events','users']
for t in tables:
    try:
        n = c.execute(f"SELECT COUNT(*) FROM {t}").fetchone()[0]
    except Exception as e:
        n = f'ERROR: {e}'
    print(f"{t}: {n}")
conn.close()