"""Export inventory edits to an upsert script for Cloudflare D1."""
import csv
import sqlite3
import sys
from pathlib import Path

source, target = map(Path, sys.argv[1:])
columns = ['id', 'title', 'author', 'genre', 'price_rwf', 'quantity', 'preorder', 'cover']
con = sqlite3.connect(':memory:')
con.executescript(Path(__file__).with_name('01-schema.sql').read_text())
with source.open(encoding='utf-8-sig', newline='') as file:
    reader = csv.DictReader(file)
    if not set(columns).issubset(reader.fieldnames or []):
        raise SystemExit('Use the eight column headers in inventory-template.csv.')
    for row in reader:
        values = [(row[key] or '').strip() for key in columns]
        values[6] = values[6].lower()
        con.execute('INSERT INTO books VALUES (?,?,?,?,?,?,?,?)', values)
updates = ', '.join(f'{key}=excluded.{key}' for key in columns[1:])
statements = []
for row in con.execute('SELECT * FROM books ORDER BY rowid'):
    literals = [con.execute('SELECT quote(?)', (v,)).fetchone()[0] for v in row]
    statements.append(f"INSERT INTO books ({', '.join(columns)}) VALUES ({', '.join(literals)}) ON CONFLICT(id) DO UPDATE SET {updates};")
target.write_text('\n'.join(statements)+'\n', encoding='utf-8')
print(f'Prepared {len(statements)} editions.')
