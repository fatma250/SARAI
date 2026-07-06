"""
Clean fake/test organizations from the database
"""
from app.database import engine
from sqlalchemy import text

print("=" * 80)
print("SARAI - Clean Fake Organizations")
print("=" * 80)

# List of fake/test organization names to delete
fake_names = [
    'string', 'test', 'Test Org', 'a', 'aaaaaaaaaaaa', 
    'cvf', 'fgsxf', 'ghhhhhh', 'jbh', 'jgfds',
    ';,nb', ';:,nb', 'AIN', 'EY', 'JFDA', 'MoH'
]

with engine.connect() as conn:
    trans = conn.begin()
    
    try:
        print("\n[1/2] Identifying fake organizations...")
        
        # Build WHERE clause for fake names
        placeholders = ', '.join([f"'{name}'" for name in fake_names])
        
        # Get all organizations with suspicious names
        result = conn.execute(text(f"""
            SELECT id, name, type 
            FROM organizations 
            WHERE name IN ({placeholders}) OR LENGTH(name) < 3
        """))
        
        fake_orgs = result.fetchall()
        
        if len(fake_orgs) == 0:
            print("✓ No fake organizations found!")
            trans.commit()
        
        print(f"Found {len(fake_orgs)} fake organizations:")
        for org in fake_orgs:
            print(f"  • ID {org[0]}: {org[1]} ({org[2]})")
        
        print("\n[2/2] Deleting fake organizations...")
        
        for org in fake_orgs:
            conn.execute(text("DELETE FROM organizations WHERE id = :id"), {"id": org[0]})
            print(f"  ✓ Deleted: {org[1]}")
        
        trans.commit()
        
        # Final count
        result = conn.execute(text("SELECT COUNT(*) FROM organizations"))
        total = result.scalar()
        
        print("\n" + "=" * 80)
        print("✅ SUCCESS! Fake organizations deleted")
        print("=" * 80)
        print(f"  Deleted: {len(fake_orgs)}")
        print(f"  Remaining organizations: {total}")
        print("\n" + "=" * 80)
        
    except Exception as e:
        trans.rollback()
        print(f"\n✗ Error: {e}")
        import traceback
        traceback.print_exc()
        raise
