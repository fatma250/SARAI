import os
import sys
from datetime import datetime, timezone

# Add backend directory to path
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from app.database import SessionLocal
from app.models.project import Project
from app.models.country import Country

def add_projects():
    db = SessionLocal()
    try:
        # Get some countries for reference
        countries = {c.name: c.id for c in db.query(Country).all()}
        
        new_projects_data = [
            {
                "title": "Tunisia AI Health Diagnostic",
                "description": "An AI system for early detection of diabetic retinopathy using deep learning on retinal images.",
                "organization": "Tunisian Ministry of Health",
                "country": "Tunisia",
                "sector": "Health",
                "technology": "Deep Learning",
                "sdg_alignment": "SDG 3: Bonne santé et bien-être",
                "year_of_implementation": 2024,
                "website": "https://health.gov.tn/ai-diagnostic"
            },
            {
                "title": "Morocco Smart Agri-Water Management",
                "description": "IoT and AI platform to optimize irrigation in the Souss-Massa region, reducing water waste by 30%.",
                "organization": "INRA Morocco",
                "country": "Morocco",
                "sector": "AgriTech",
                "technology": "Machine Learning",
                "sdg_alignment": "SDG 6: Eau propre et assainissement",
                "year_of_implementation": 2023,
                "website": "http://www.inra.org.ma/agri-water"
            },
            {
                "title": "Jordan AI Education Assistant",
                "description": "A personalized learning platform for high school students in Jordan, adapting content based on student performance.",
                "organization": "Queen Rania Foundation",
                "country": "Jordan",
                "sector": "EduTech",
                "technology": "NLP",
                "sdg_alignment": "SDG 4: Éducation de qualité",
                "year_of_implementation": 2025,
                "website": "https://www.qrf.org/ai-learning"
            }
        ]

        added_count = 0
        for data in new_projects_data:
            # Check if project already exists
            existing = db.query(Project).filter(Project.title == data["title"]).first()
            if existing:
                print(f"Skipping '{data['title']}' - already exists.")
                continue

            project = Project(
                title=data["title"],
                description=data["description"],
                organization=data["organization"],
                country=data["country"],
                sector=data["sector"],
                technology=data["technology"],
                sdg_alignment=data["sdg_alignment"],
                year_of_implementation=data["year_of_implementation"],
                website=data["website"],
                status="approved",  # Set to approved to show up in frontend
                user_id=1,          # Admin user
                country_id=countries.get(data["country"]),
                is_published=1,
                created_at=datetime.now(timezone.utc),
                updated_at=datetime.now(timezone.utc)
            )
            db.add(project)
            added_count += 1
            print(f"Added: {data['title']}")

        db.commit()
        print(f"\nSuccessfully added {added_count} projects to the database.")
        
    except Exception as e:
        db.rollback()
        print(f"Error adding projects: {e}")
    finally:
        db.close()

if __name__ == "__main__":
    add_projects()
