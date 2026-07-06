"""
Add more real Arab AI projects to the database
Use this script to expand the project collection after initial cleanup
"""
from app.database import engine
from sqlalchemy import text
from datetime import datetime

print("=" * 80)
print("SARAI - Add More Real Arab AI Projects")
print("=" * 80)

# Additional real Arab AI projects to add
additional_projects = [
    {
        "title": "Palestine AI for Agriculture Optimization",
        "description": "An AI-powered platform developed by Palestinian researchers to optimize agricultural practices in challenging environments. Uses satellite imagery and ML to monitor crop health, predict yields, and optimize water usage in water-scarce regions.",
        "organization": "Birzeit University",
        "org_type": "University",
        "country": "Palestine",
        "sector": "Agriculture",
        "technology": "Machine Learning",
        "sdgs": [2, 6],  # Zero Hunger, Clean Water
        "website": "https://www.birzeit.edu/agri-ai",
        "year": 2024
    },
    {
        "title": "Kuwait Smart Energy Grid Management",
        "description": "Kuwait Institute for Scientific Research's AI system for optimizing national energy grid operations. The platform uses predictive analytics to balance energy supply and demand, integrate renewable energy sources, and reduce carbon emissions.",
        "organization": "Kuwait Institute for Scientific Research",
        "org_type": "Research",
        "country": "Kuwait",
        "sector": "Energy",
        "technology": "Predictive Analytics",
        "sdgs": [7, 13],  # Clean Energy, Climate Action
        "website": "https://www.kisr.edu.kw/smart-grid",
        "year": 2025
    },
    {
        "title": "Iraq Heritage Preservation AI",
        "description": "University of Baghdad's AI project for digitally preserving and restoring Iraqi cultural heritage sites. Uses computer vision and 3D reconstruction to document historical sites and create virtual tours of damaged monuments.",
        "organization": "University of Baghdad",
        "org_type": "University",
        "country": "Iraq",
        "sector": "Other",
        "technology": "Computer Vision",
        "sdgs": [11],  # Sustainable Cities
        "website": "https://www.uobaghdad.edu.iq/heritage-ai",
        "year": 2024
    },
    {
        "title": "Algeria Traffic Management AI System",
        "description": "Algerian Ministry of Transport's intelligent traffic management system for major cities. Uses real-time data analysis and ML to optimize traffic flow, reduce congestion, and improve public transportation efficiency.",
        "organization": "Algeria Ministry of Transport",
        "org_type": "Government",
        "country": "Algeria",
        "sector": "Transportation",
        "technology": "Machine Learning",
        "sdgs": [11],  # Sustainable Cities
        "website": "https://www.transport.gov.dz/smart-traffic",
        "year": 2025
    },
    {
        "title": "Saudi Arabia Arabic Chatbot Platform",
        "description": "SDAIA's (Saudi Data and AI Authority) comprehensive Arabic chatbot platform for government services. Provides 24/7 citizen support using advanced NLP and conversational AI tailored for Saudi dialects.",
        "organization": "Saudi Data and AI Authority",
        "org_type": "Government",
        "country": "Saudi Arabia",
        "sector": "Government",
        "technology": "Natural Language Processing",
        "sdgs": [16],  # Peace & Justice
        "website": "https://sdaia.gov.sa/chatbot",
        "year": 2024
    },
    {
        "title": "UAE Autonomous Drone Delivery Network",
        "description": "Dubai's autonomous drone delivery system using AI for last-mile logistics. Combines computer vision, path planning, and edge AI for safe and efficient package delivery in urban environments.",
        "organization": "Dubai Future Foundation",
        "org_type": "Government",
        "country": "United Arab Emirates",
        "sector": "Transportation",
        "technology": "Robotics",
        "sdgs": [9, 11],  # Innovation, Sustainable Cities
        "website": "https://www.dubaifuture.ae/drone-delivery",
        "year": 2025
    },
    {
        "title": "Egypt Nile Water Quality Monitoring AI",
        "description": "Egyptian Environmental Affairs Agency's AI system for real-time monitoring of Nile water quality. Uses IoT sensors and ML to detect pollution, predict contamination events, and protect water resources.",
        "organization": "Egyptian Environmental Affairs Agency",
        "org_type": "Government",
        "country": "Egypt",
        "sector": "Environment",
        "technology": "Machine Learning",
        "sdgs": [6, 14],  # Clean Water, Life Below Water
        "website": "https://www.eeaa.gov.eg/water-ai",
        "year": 2024
    },
    {
        "title": "Morocco Tourism Recommendation AI",
        "description": "Moroccan National Tourist Office's AI-powered tourism recommendation platform. Provides personalized travel itineraries, cultural insights, and real-time guidance for tourists visiting Morocco.",
        "organization": "Morocco National Tourist Office",
        "org_type": "Government",
        "country": "Morocco",
        "sector": "Tourism",
        "technology": "Recommendation Systems",
        "sdgs": [8],  # Economic Growth
        "website": "https://www.visitmorocco.com/ai-guide",
        "year": 2025
    },
]

with engine.connect() as conn:
    trans = conn.begin()
    
    try:
        print(f"\n[1/3] Loading reference data...")
        
        # Get reference data
        countries = {}
        result = conn.execute(text("SELECT id, name FROM countries"))
        for row in result:
            countries[row[1]] = row[0]
        
        sectors = {}
        result = conn.execute(text("SELECT id, name FROM sectors"))
        for row in result:
            sectors[row[1]] = row[0]
        
        technologies = {}
        result = conn.execute(text("SELECT id, name FROM ai_technologies"))
        for row in result:
            technologies[row[1]] = row[0]
        
        sdgs = {}
        result = conn.execute(text("SELECT id, goal_number FROM sdgs"))
        for row in result:
            sdgs[row[1]] = row[0]
        
        print(f"✓ Loaded reference data")
        
        print(f"\n[2/3] Creating organizations...")
        organizations = {}
        
        for p in additional_projects:
            org_name = p["organization"]
            
            # Check if organization exists
            result = conn.execute(text("SELECT id FROM organizations WHERE name = :name"), {"name": org_name})
            existing = result.first()
            
            if existing:
                organizations[org_name] = existing[0]
            else:
                # Create organization
                country_id = countries.get(p["country"])
                result = conn.execute(text("""
                    INSERT INTO organizations (name, type, country_id, is_active, is_verified, created_at, updated_at)
                    VALUES (:name, :type, :country_id, 1, 1, :now, :now)
                    RETURNING id
                """), {
                    "name": org_name,
                    "type": p["org_type"],
                    "country_id": country_id,
                    "now": datetime.utcnow()
                })
                org_id = result.scalar()
                organizations[org_name] = org_id
                print(f"  ✓ Created: {org_name}")
        
        print(f"\n[3/3] Adding {len(additional_projects)} new projects...")
        
        inserted = 0
        skipped = 0
        
        for p in additional_projects:
            # Check if project already exists
            result = conn.execute(text("SELECT id FROM projects WHERE title = :title"), {"title": p["title"]})
            if result.first():
                print(f"  ⊘ Skipped: {p['title']} (already exists)")
                skipped += 1
                continue
            
            # Get IDs
            org_id = organizations.get(p["organization"])
            country_id = countries.get(p["country"])
            sector_id = sectors.get(p["sector"])
            tech_id = technologies.get(p["technology"])
            
            if not all([org_id, country_id, sector_id, tech_id]):
                print(f"  ✗ Skipped: {p['title']} (missing reference data)")
                skipped += 1
                continue
            
            # Insert project
            result = conn.execute(text("""
                INSERT INTO projects (
                    title, description, organization_id, user_id, country_id, sector_id,
                    website, year_of_implementation, status, is_published, is_featured,
                    created_at, updated_at, published_at, approved_at
                ) VALUES (
                    :title, :description, :org_id, 1, :country_id, :sector_id,
                    :website, :year, 'approved', 1, 0,
                    :now, :now, :now, :now
                )
                RETURNING id
            """), {
                "title": p["title"],
                "description": p["description"],
                "org_id": org_id,
                "country_id": country_id,
                "sector_id": sector_id,
                "website": p["website"],
                "year": p["year"],
                "now": datetime.utcnow()
            })
            project_id = result.scalar()
            
            # Add technology
            conn.execute(text("""
                INSERT INTO project_technologies (project_id, technology_id, created_at)
                VALUES (:project_id, :tech_id, :now)
            """), {
                "project_id": project_id,
                "tech_id": tech_id,
                "now": datetime.utcnow()
            })
            
            # Add SDGs
            for sdg_num in p["sdgs"]:
                sdg_id = sdgs.get(sdg_num)
                if sdg_id:
                    conn.execute(text("""
                        INSERT INTO project_sdgs (project_id, sdg_id, created_at)
                        VALUES (:project_id, :sdg_id, :now)
                    """), {
                        "project_id": project_id,
                        "sdg_id": sdg_id,
                        "now": datetime.utcnow()
                    })
            
            inserted += 1
            print(f"  ✓ Added: {p['title']}")
        
        trans.commit()
        
        # Final count
        result = conn.execute(text("SELECT COUNT(*) FROM projects"))
        total = result.scalar()
        
        print("\n" + "=" * 80)
        print("✅ Projects added successfully!")
        print("=" * 80)
        print(f"  New projects added: {inserted}")
        print(f"  Skipped (duplicates): {skipped}")
        print(f"  Total projects in database: {total}")
        print("=" * 80)
        
    except Exception as e:
        trans.rollback()
        print(f"\n✗ Error: {e}")
        import traceback
        traceback.print_exc()
        raise
