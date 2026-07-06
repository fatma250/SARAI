"""Quick fix: add planning columns to projects table."""
import psycopg
conn = psycopg.connect("host=localhost port=5432 dbname=SARAI_DB user=postgres password=0000")
conn.autocommit = True
cur = conn.cursor()

columns = [
    ("coverage",         "VARCHAR(300)"),
    ("planned_tasks",    "TEXT"),
    ("expected_impact",  "TEXT"),
    ("budget",           "VARCHAR(150)"),
    ("planned_duration", "VARCHAR(100)"),
]

for col, typ in columns:
    try:
        cur.execute(f"ALTER TABLE projects ADD COLUMN {col} {typ}")
        print(f"+ Added: {col}")
    except Exception as e:
        print(f"= Skip {col}: {e}")

cur.close()
conn.close()
print("Done.")
