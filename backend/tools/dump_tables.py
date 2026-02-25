import sqlite3
import os
import json

ROOT = os.path.dirname(os.path.dirname(os.path.dirname(__file__)))
DB = os.path.join(ROOT, 'boardgames.db')
if not os.path.exists(DB):
    print('DB file not found at', DB)
    raise SystemExit(1)

conn = sqlite3.connect(DB)
conn.row_factory = sqlite3.Row
c = conn.cursor()

tables = ['board_games','shared_game_instances','game_queue','events','users']

for t in tables:
    print('\n' + '='*60)
    print(f'Table: {t}')
    print('-'*60)
    try:
        rows = c.execute(f'SELECT * FROM {t} LIMIT 20').fetchall()
        if not rows:
            print('(no rows)')
            continue
        # print header
        cols = rows[0].keys()
        print('\t'.join(cols))
        for r in rows:
            vals = [str(r[col]) if r[col] is not None else 'NULL' for col in cols]
            print('\t'.join(vals))
    except Exception as e:
        print('ERROR querying table:', e)

conn.close()
print('\nDone.')
