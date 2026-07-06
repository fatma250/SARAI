import sqlite3

conn = sqlite3.connect('sarai.db')
cursor = conn.cursor()

# Get all projects
cursor.execute('SELECT id, title, country, organization FROM projects ORDER BY id')
all_projects = cursor.fetchall()

print(f"Total projects in database: {len(all_projects)}")
print("\nFirst 10 projects:")
for p in all_projects[:10]:
    print(f"  ID {p[0]}: {p[1]} - {p[2]} - {p[3]}")

# The new projects start from a specific pattern - they have proper country names
# Old test projects have sectors in the country field
print("\n\nAnalyzing projects...")

# Find projects with proper country names (the 110 new ones)
arab_countries = [
    'Algeria', 'Bahrain', 'Comoros', 'Djibouti', 'Egypt', 'Iraq', 'Jordan',
    'Kuwait', 'Lebanon', 'Libya', 'Mauritania', 'Morocco', 'Oman', 'Palestine',
    'Qatar', 'Saudi Arabia', 'Somalia', 'Sudan', 'Syria', 'Tunisia',
    'United Arab Emirates', 'Yemen'
]

good_projects = []
bad_projects = []

for p in all_projects:
    if p[2] in arab_countries:  # country field
        good_projects.append(p[0])
    else:
        bad_projects.append(p[0])

print(f"\nProjects with valid Arab country names: {len(good_projects)}")
print(f"Projects with invalid data (test data): {len(bad_projects)}")

if bad_projects:
    print(f"\nDeleting {len(bad_projects)} test projects...")
    cursor.execute(f"DELETE FROM projects WHERE id IN ({','.join(map(str, bad_projects))})")
    conn.commit()
    print("✓ Test projects deleted!")

# Verify
cursor.execute('SELECT COUNT(*) FROM projects')
final_count = cursor.fetchone()[0]
print(f"\nFinal project count: {final_count}")

# Show first 5 remaining projects
cursor.execute('SELECT id, title, country, sector FROM projects LIMIT 5')
print("\nFirst 5 remaining projects:")
for p in cursor.fetchall():
    print(f"  ID {p[0]}: {p[1]} - {p[2]} - {p[3]}")

conn.close()
