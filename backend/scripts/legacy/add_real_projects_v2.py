
import os
import sys
from datetime import datetime, timezone
from sqlalchemy import text

# Add backend directory to path
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from app.database import SessionLocal, engine
from app.models.project import Project
from app.models.country import Country
from app.models.sdg import SDG
from app.models.sector import Sector
from app.models.ai_technology import AITechnology

def add_real_projects():
    db = SessionLocal()
    try:
        # Load reference data
        countries = {c.name: c.id for c in db.query(Country).all()}
        sdgs = {s.goal_number: s.id for s in db.query(SDG).all()}
        
        # Additional real-world projects
        new_projects = [
            {
                "title": "SDAIA - Tawakkalna Platform AI",
                "description": "The Saudi Data and AI Authority's (SDAIA) comprehensive digital identity and health platform using AI for resource allocation and public health monitoring.",
                "organization": "Saudi Data and AI Authority (SDAIA)",
                "country": "Saudi Arabia",
                "sector": "Government",
                "technology": "Machine Learning",
                "sdg_alignment": "SDG 3: Bonne santé et bien-être",
                "sdg_num": 3,
                "year": 2021,
                "website": "https://tawakkalna.sdaia.gov.sa/"
            },
            {
                "title": "InstaDeep - BioAI DeepChain",
                "description": "A collaborative protein design platform using deep learning to discover new protein structures and accelerate drug discovery, founded in Tunisia.",
                "organization": "InstaDeep",
                "country": "Tunisia",
                "sector": "Health",
                "technology": "Deep Learning",
                "sdg_alignment": "SDG 3: Bonne santé et bien-être",
                "sdg_num": 3,
                "year": 2022,
                "website": "https://www.instadeep.com/"
            },
            {
                "title": "Swvl - AI Transport Optimization",
                "description": "An Egyptian-founded global tech startup that uses AI algorithms to optimize bus routes and dynamic pricing for affordable mass transit.",
                "organization": "Swvl",
                "country": "Egypt",
                "sector": "Transportation",
                "technology": "Machine Learning",
                "sdg_alignment": "SDG 11: Villes et communautés durables",
                "sdg_num": 11,
                "year": 2020,
                "website": "https://www.swvl.com/"
            },
            {
                "title": "Masdar City - Autonomous AI Shuttles",
                "description": "Abu Dhabi's flagship sustainable urban community using AI-powered autonomous pods and shuttles for zero-carbon public transport.",
                "organization": "Masdar",
                "country": "United Arab Emirates",
                "sector": "Smart Cities",
                "technology": "Robotics",
                "sdg_alignment": "SDG 11: Villes et communautés durables",
                "sdg_num": 11,
                "year": 2023,
                "website": "https://masdar.ae/"
            },
            {
                "title": "iSante - Moroccan e-Health AI",
                "description": "A Moroccan digital health platform integrating AI to improve patient follow-up and chronic disease management across rural areas.",
                "organization": "Moroccan Ministry of Health",
                "country": "Morocco",
                "sector": "Health",
                "technology": "Predictive Analytics",
                "sdg_alignment": "SDG 3: Bonne santé et bien-être",
                "sdg_num": 3,
                "year": 2024,
                "website": "https://www.sante.gov.ma/"
            },
            {
                "title": "Gaza Sky Geeks - AI for Social Good",
                "description": "Mentorship and training program in Palestine focusing on building AI-driven solutions for local agricultural and environmental challenges.",
                "organization": "Gaza Sky Geeks",
                "country": "Palestine",
                "sector": "Education",
                "technology": "Machine Learning",
                "sdg_alignment": "SDG 4: Éducation de qualité",
                "sdg_num": 4,
                "year": 2023,
                "website": "https://gazaskygeeks.com/"
            }
        ]

        added = 0
        for p_data in new_projects:
            # Check if exists
            exists = db.query(Project).filter(Project.title == p_data["title"]).first()
            if exists:
                print(f"Skipping: {p_data['title']} (exists)")
                continue
            
            project = Project(
                title=p_data["title"],
                description=p_data["description"],
                organization=p_data["organization"],
                country=p_data["country"],
                sector=p_data["sector"],
                technology=p_data["technology"],
                sdg_alignment=p_data["sdg_alignment"],
                year_of_implementation=p_data["year"],
                website=p_data["website"],
                status="approved",
                is_published=1,
                user_id=1,
                country_id=countries.get(p_data["country"]),
                created_at=datetime.now(timezone.utc),
                updated_at=datetime.now(timezone.utc)
            )
            db.add(project)
            db.flush() # Get project ID

            # Add many-to-many relationship for SDG if possible
            sdg_id = sdgs.get(p_data["sdg_num"])
            if sdg_id:
                db.execute(text("INSERT INTO project_sdgs (project_id, sdg_id, created_at) VALUES (:p_id, :s_id, :now)"), 
                           {"p_id": project.id, "s_id": sdg_id, "now": datetime.now(timezone.utc)})

            added += 1
            print(f"Added: {p_data['title']}")

        db.commit()
        print(f"\nSuccessfully added {added} real projects.")

    except Exception as e:
        db.rollback()
        print(f"Error: {e}")
    finally:
        db.close()

if __name__ == "__main__":
    add_real_projects()
