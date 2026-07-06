from app.database import engine, using_postgresql
from sqlalchemy import text

def migrate():
    if not using_postgresql:
        print("Not using PostgreSQL, skipping migration.")
        return

    print("Migrating PostgreSQL 'projects' table...")
    columns_to_add = [
        ("organization", "VARCHAR(255)"),
        ("country", "VARCHAR(100)"),
        ("sector", "VARCHAR(100)"),
        ("technology", "VARCHAR(100)"),
        ("sdg_alignment", "VARCHAR(255)")
    ]

    with engine.connect() as conn:
        for col_name, col_type in columns_to_add:
            try:
                # Check if column exists
                check_sql = f"""
                    SELECT 1 FROM information_schema.columns 
                    WHERE table_name = 'projects' AND column_name = '{col_name}'
                """
                exists = conn.execute(text(check_sql)).fetchone()
                
                if exists:
                    print(f"  Column '{col_name}' already exists.")
                else:
                    print(f"  Adding column '{col_name}'...")
                    conn.execute(text(f"ALTER TABLE projects ADD COLUMN {col_name} {col_type}"))
                    conn.commit()
                    print(f"  Successfully added '{col_name}'.")
            except Exception as e:
                print(f"  Error adding '{col_name}': {e}")
                conn.rollback()

    print("Migration complete.")

if __name__ == "__main__":
    migrate()
