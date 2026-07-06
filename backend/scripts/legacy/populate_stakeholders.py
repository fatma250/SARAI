"""
Populate database with REAL Arab AI Stakeholders
"""
from app.database import engine
from sqlalchemy import text
from datetime import datetime

print("=" * 80)
print("SARAI - Populate Real Arab AI Stakeholders")
print("=" * 80)

# Liste de stakeholders réels dans l'écosystème IA arabe
stakeholders = [
    # === UNIVERSITÉS ===
    {
        "name": "Cairo University AI Research Lab",
        "type": "University",
        "country": "Egypt",
        "city": "Cairo",
        "website": "https://cu.edu.eg",
        "email": "info@cu.edu.eg",
        "description": "Leading AI research center in Egypt, focusing on Arabic NLP, computer vision, and machine learning applications for the Arab region."
    },
    {
        "name": "King Abdullah University of Science and Technology",
        "type": "University",
        "country": "Saudi Arabia",
        "city": "Thuwal",
        "website": "https://www.kaust.edu.sa",
        "email": "info@kaust.edu.sa",
        "description": "World-class research university with strong AI and machine learning programs, focusing on climate research, computer vision, and data science."
    },
    {
        "name": "American University of Beirut",
        "type": "University",
        "country": "Lebanon",
        "city": "Beirut",
        "website": "https://www.aub.edu.lb",
        "email": "info@aub.edu.lb",
        "description": "Premier university in Lebanon with advanced AI research programs in healthcare analytics, predictive modeling, and data science."
    },
    {
        "name": "Mohammed VI Polytechnic University",
        "type": "University",
        "country": "Morocco",
        "city": "Ben Guerir",
        "website": "https://www.um6p.ma",
        "email": "contact@um6p.ma",
        "description": "Leading Moroccan university with focus on AI, data science, and innovation for sustainable development in Africa."
    },
    {
        "name": "Qatar University",
        "type": "University",
        "country": "Qatar",
        "city": "Doha",
        "website": "https://www.qu.edu.qa",
        "email": "info@qu.edu.qa",
        "description": "National university of Qatar with strong computer science and AI programs, focusing on smart cities and digital transformation."
    },
    {
        "name": "United Arab Emirates University",
        "type": "University",
        "country": "United Arab Emirates",
        "city": "Al Ain",
        "website": "https://www.uaeu.ac.ae",
        "email": "info@uaeu.ac.ae",
        "description": "Leading UAE university with advanced AI research in robotics, autonomous systems, and smart technologies."
    },
    {
        "name": "Sultan Qaboos University",
        "type": "University",
        "country": "Oman",
        "city": "Muscat",
        "website": "https://www.squ.edu.om",
        "email": "info@squ.edu.om",
        "description": "Premier university in Oman with research focus on AI, data science, and digital transformation for government services."
    },
    {
        "name": "University of Bahrain",
        "type": "University",
        "country": "Bahrain",
        "city": "Sakhir",
        "website": "https://www.uob.edu.bh",
        "email": "info@uob.edu.bh",
        "description": "National university with programs in AI, fintech, and digital innovation for the financial sector."
    },
    {
        "name": "Jordan University of Science and Technology",
        "type": "University",
        "country": "Jordan",
        "city": "Irbid",
        "website": "https://www.just.edu.jo",
        "email": "info@just.edu.jo",
        "description": "Leading technical university in Jordan with strong AI and engineering programs, focusing on smart agriculture and healthcare."
    },
    {
        "name": "Tunis Business School",
        "type": "University",
        "country": "Tunisia",
        "city": "Tunis",
        "website": "https://www.tbs.tn",
        "email": "contact@tbs.tn",
        "description": "Business school with focus on AI applications in education, e-learning, and digital transformation."
    },
    
    # === CENTRES DE RECHERCHE ===
    {
        "name": "Qatar Computing Research Institute",
        "type": "Research Lab",
        "country": "Qatar",
        "city": "Doha",
        "website": "https://www.qcri.org",
        "email": "info@qcri.org",
        "description": "World-class research institute focusing on Arabic NLP, social computing, data analytics, and AI for social good."
    },
    {
        "name": "Zewail City of Science and Technology",
        "type": "Research Lab",
        "country": "Egypt",
        "city": "Giza",
        "website": "https://www.zewailcity.edu.eg",
        "email": "info@zewailcity.edu.eg",
        "description": "Premier Egyptian research institution focusing on robotics, AI for manufacturing, and Industry 4.0 technologies."
    },
    {
        "name": "Kuwait Institute for Scientific Research",
        "type": "Research Lab",
        "country": "Kuwait",
        "city": "Kuwait City",
        "website": "https://www.kisr.edu.kw",
        "email": "info@kisr.edu.kw",
        "description": "Leading research institute in Kuwait with focus on AI for energy, environment, and sustainable development."
    },
    
    # === GOUVERNEMENTS ===
    {
        "name": "UAE Ministry of AI",
        "type": "Government",
        "country": "United Arab Emirates",
        "city": "Dubai",
        "website": "https://ai.gov.ae",
        "email": "info@ai.gov.ae",
        "description": "Government entity responsible for AI strategy and implementation across the UAE, leading smart city initiatives and digital transformation."
    },
    {
        "name": "Saudi Data and AI Authority",
        "type": "Government",
        "country": "Saudi Arabia",
        "city": "Riyadh",
        "website": "https://sdaia.gov.sa",
        "email": "info@sdaia.gov.sa",
        "description": "National authority for data and AI in Saudi Arabia, driving AI adoption and digital transformation across all sectors."
    },
    {
        "name": "Egypt Ministry of Communications and Information Technology",
        "type": "Government",
        "country": "Egypt",
        "city": "Cairo",
        "website": "https://mcit.gov.eg",
        "email": "info@mcit.gov.eg",
        "description": "Government ministry responsible for ICT strategy, digital transformation, and AI initiatives in Egypt."
    },
    {
        "name": "Morocco Ministry of Digital Transition",
        "type": "Government",
        "country": "Morocco",
        "city": "Rabat",
        "website": "https://www.mtds.gov.ma",
        "email": "contact@mtds.gov.ma",
        "description": "Ministry responsible for digital transformation, AI strategy, and innovation in Morocco."
    },
    {
        "name": "Jordan Ministry of Digital Economy and Entrepreneurship",
        "type": "Government",
        "country": "Jordan",
        "city": "Amman",
        "website": "https://modee.gov.jo",
        "email": "info@modee.gov.jo",
        "description": "Ministry driving digital economy, AI adoption, and entrepreneurship in Jordan."
    },
    
    # === ORGANISATIONS INTERNATIONALES ===
    {
        "name": "Arab ICT Organization",
        "type": "NGO",
        "country": "Egypt",
        "city": "Cairo",
        "website": "https://www.aicto.org",
        "email": "info@aicto.org",
        "description": "Regional organization promoting ICT and AI development across Arab countries, facilitating collaboration and knowledge sharing."
    },
    {
        "name": "UNESCO Regional Bureau for Arab States",
        "type": "NGO",
        "country": "Lebanon",
        "city": "Beirut",
        "website": "https://en.unesco.org/fieldoffice/beirut",
        "email": "beirut@unesco.org",
        "description": "UNESCO office supporting AI ethics, education, and capacity building in Arab states."
    },
    
    # === INNOVATION HUBS ===
    {
        "name": "Dubai Future Foundation",
        "type": "Government",
        "country": "United Arab Emirates",
        "city": "Dubai",
        "website": "https://www.dubaifuture.ae",
        "email": "info@dubaifuture.ae",
        "description": "Innovation hub driving future technologies including AI, robotics, and smart city solutions in Dubai."
    },
    {
        "name": "Bahrain Polytechnic",
        "type": "University",
        "country": "Bahrain",
        "city": "Isa Town",
        "website": "https://www.polytechnic.bh",
        "email": "info@polytechnic.bh",
        "description": "Technical education institution with focus on AI, fintech, and digital skills for the financial sector."
    },
]

with engine.connect() as conn:
    trans = conn.begin()
    
    try:
        print(f"\n[1/3] Loading countries...")
        
        # Get country IDs
        countries = {}
        result = conn.execute(text("SELECT id, name FROM countries"))
        for row in result:
            countries[row[1]] = row[0]
        print(f"✓ Loaded {len(countries)} countries")
        
        print(f"\n[2/3] Checking existing organizations...")
        
        # Check existing organizations
        result = conn.execute(text("SELECT name FROM organizations"))
        existing_names = {row[0] for row in result}
        print(f"✓ Found {len(existing_names)} existing organizations")
        
        print(f"\n[3/3] Adding {len(stakeholders)} stakeholders...")
        
        added = 0
        skipped = 0
        
        for s in stakeholders:
            # Skip if already exists
            if s["name"] in existing_names:
                print(f"  ⊘ Skipped: {s['name']} (already exists)")
                skipped += 1
                continue
            
            # Get country_id
            country_id = countries.get(s["country"])
            if not country_id:
                print(f"  ✗ Skipped: {s['name']} (country not found: {s['country']})")
                skipped += 1
                continue
            
            # Insert stakeholder
            conn.execute(text("""
                INSERT INTO organizations 
                (name, type, country_id, city, website, email, description,
                 is_active, is_verified, created_at, updated_at)
                VALUES 
                (:name, :type, :country_id, :city, :website, :email, :description,
                 1, 1, :now, :now)
            """), {
                "name": s["name"],
                "type": s["type"],
                "country_id": country_id,
                "city": s.get("city"),
                "website": s.get("website"),
                "email": s.get("email"),
                "description": s.get("description"),
                "now": datetime.utcnow()
            })
            
            added += 1
            print(f"  ✓ Added: {s['name']} ({s['type']}, {s['country']})")
        
        trans.commit()
        
        # Final count
        result = conn.execute(text("SELECT COUNT(*) FROM organizations"))
        total = result.scalar()
        
        print("\n" + "=" * 80)
        print("✅ SUCCESS! Stakeholders added")
        print("=" * 80)
        print(f"  New stakeholders added: {added}")
        print(f"  Skipped (already exist): {skipped}")
        print(f"  Total organizations in database: {total}")
        print("\nStakeholder types added:")
        
        # Count by type
        result = conn.execute(text("""
            SELECT type, COUNT(*) 
            FROM organizations 
            GROUP BY type 
            ORDER BY COUNT(*) DESC
        """))
        for row in result:
            print(f"  • {row[0]}: {row[1]}")
        
        print("\n" + "=" * 80)
        print("Next steps:")
        print("  1. View stakeholders: python show_stakeholders.py")
        print("  2. Check frontend: Stakeholder Directory page")
        print("=" * 80)
        
    except Exception as e:
        trans.rollback()
        print(f"\n✗ Error: {e}")
        import traceback
        traceback.print_exc()
        raise
