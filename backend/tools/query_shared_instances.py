import sqlite3
import os

ROOT = os.path.dirname(os.path.dirname(os.path.dirname(__file__)))
# Try several likely locations for the sqlite DB
possible = [
    os.path.join(ROOT, 'boardgames.db'),
    os.path.join(ROOT, 'backend', 'boardgames.db'),
    os.path.join(os.path.dirname(ROOT), 'boardgames.db')
]
DB = None
for p in possible:
    if os.path.exists(p):
        DB = p
        break
if not DB:
    print('DB file not found; tried:', possible)
    raise SystemExit(1)

conn = sqlite3.connect(DB)
conn.row_factory = sqlite3.Row
c = conn.cursor()

query = '''
SELECT s.id, s.game_id, b.name as game_name, s.contributor_id, u.name as contributor_name, s.added_at
FROM shared_game_instances s
LEFT JOIN board_games b ON b.id = s.game_id
LEFT JOIN users u ON u.id = s.contributor_id
ORDER BY s.id;
'''

rows = c.execute(query).fetchall()
print('Query:')
print(query)
print('\nResults:')
if not rows:
    print('(no rows)')
else:
    cols = rows[0].keys()
    print('\t'.join(cols))
    for r in rows:
        print('\t'.join([str(r[c]) if r[c] is not None else 'NULL' for c in cols]))

conn.close()
