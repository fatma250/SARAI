import os
import sys
from datetime import datetime, timezone
from sqlalchemy.orm import Session
from app.database import SessionLocal, engine
from app.models.project import Project
from app.models.stakeholder import Stakeholder
from app.models.country import Country
from app.models.user import User
from app.models.project_stakeholder import ProjectStakeholder
from app.models.sector import Sector
from app.models.sdg import SDG
from app.models.ai_technology import AITechnology

def populate_final():
    db = SessionLocal()
    try:
        print("🚀 Starting Final Comprehensive Population...")
        
        # 1. Get Admin User
        admin = db.query(User).filter(User.email == "admin@example.com").first()
        if not admin:
            admin = db.query(User).first()
        if not admin:
            print("❌ No admin user found. Please run ensure_admin_user.py first.")
            return

        # 2. Clear existing dynamic data (but keep reference data like Countries, Sectors, etc.)
        print("🗑️  Clearing existing projects and stakeholders...")
        db.query(ProjectStakeholder).delete()
        db.query(Project).delete()
        db.query(Stakeholder).delete()
        db.commit()

        # 3. Get reference maps
        countries = {c.name: c.id for c in db.query(Country).all()}
        sectors = [s.name for s in db.query(Sector).all()]
        techs = [t.name for t in db.query(AITechnology).all()]
        sdgs = {s.goal_number: s.name for s in db.query(SDG).all()}

        print(f"📊 Reference data loaded: {len(countries)} countries, {len(sectors)} sectors, {len(techs)} technologies")

        # 4. Stakeholders Data
        stakeholders_data = [
            # UAE
            {"name": "Mohamed Bin Zayed University of AI", "type": "University", "country": "United Arab Emirates", "description": "World's first graduate research university dedicated to AI."},
            {"name": "Technology Innovation Institute (TII)", "type": "Research Lab", "country": "United Arab Emirates", "description": "Applied research pillar of ATRC, focusing on advanced tech."},
            {"name": "Smart Dubai Office", "type": "Government", "country": "United Arab Emirates", "description": "Leading Dubai's smart city transformation."},
            # Saudi Arabia
            {"name": "SDAIA", "type": "Government", "country": "Saudi Arabia", "description": "Saudi Data and AI Authority leading the national strategy."},
            {"name": "KAUST AI Initiative", "type": "University", "country": "Saudi Arabia", "description": "Promoting excellence in AI research and education."},
            {"name": "NEOM Tech & Digital", "type": "Company", "country": "Saudi Arabia", "description": "Building the world's first cognitive city."},
            # Egypt
            {"name": "Cairo University AI Lab", "type": "University", "country": "Egypt", "description": "Leading AI research center in North Africa."},
            {"name": "Zewail City of Science", "type": "Research Lab", "country": "Egypt", "description": "Excellence center for scientific research and innovation."},
            {"name": "Ministry of CIT Egypt", "type": "Government", "country": "Egypt", "description": "Government body driving digital Egypt strategy."},
            # Morocco
            {"name": "UM6P - Mohammed VI Polytechnic", "type": "University", "country": "Morocco", "description": "Research-oriented university focusing on innovation."},
            {"name": "Morocco AI Movement", "type": "NGO", "country": "Morocco", "description": "Association promoting AI adoption and education."},
            # Jordan
            {"name": "Mawdoo3 AI", "type": "Startup", "country": "Jordan", "description": "Leading Arabic NLP and content platform."},
            {"name": "Jordan Ministry of Digital Economy", "type": "Government", "country": "Jordan", "description": "Leading digital transformation in the Kingdom."},
            # Tunisia
            {"name": "InstaDeep", "type": "Startup", "country": "Tunisia", "description": "Decision-making AI company for industrial applications."},
            {"name": "Tunisia AI Society", "type": "NGO", "country": "Tunisia", "description": "Community of AI researchers and practitioners."},
            # Qatar
            {"name": "Qatar Computing Research Institute", "type": "Research Lab", "country": "Qatar", "description": "Leading research in Arabic NLP and social computing."},
            # Kuwait
            {"name": "Kuwait Institute for Scientific Research", "type": "Research Lab", "country": "Kuwait", "description": "National institute for applied scientific research."},
        ]

        inserted_stakeholders = []
        for s_data in stakeholders_data:
            c_id = countries.get(s_data["country"])
            stakeholder = Stakeholder(
                name=s_data["name"],
                type=s_data["type"],
                country=s_data["country"],
                country_id=c_id,
                description=s_data["description"],
                website=f"https://www.{s_data['name'].lower().replace(' ', '')}.org",
                created_at=datetime.now(timezone.utc)
            )
            db.add(stakeholder)
            inserted_stakeholders.append(stakeholder)
        
        db.commit()
        print(f"✅ Created {len(inserted_stakeholders)} Stakeholders")

        # 5. Projects Data
        projects_data = [
            {
                "title": "Falcon Large Language Model",
                "description": "A high-performing open-source large language model developed by TII. It competes with top global models and supports various languages including Arabic.",
                "sector": "Telecommunications", "tech": "Generative AI", "sdg": "SDG 9: Industry, Innovation and Infrastructure",
                "country": "United Arab Emirates", "org": "Technology Innovation Institute (TII)", "year": 2023
            },
            {
                "title": "NEOM Cognitive City Infrastructure",
                "description": "AI-powered urban infrastructure for the city of the future, integrating IoT, computer vision, and predictive analytics for sustainable living.",
                "sector": "Transportation", "tech": "Machine Learning", "sdg": "SDG 11: Sustainable Cities and Communities",
                "country": "Saudi Arabia", "org": "NEOM Tech & Digital", "year": 2022
            },
            {
                "title": "Arabic NLP for Healthcare",
                "description": "Developing specialized Natural Language Processing models for medical diagnosis and patient support in Arabic dialects.",
                "sector": "Healthcare", "tech": "Natural Language Processing", "sdg": "SDG 3: Good Health and Well-being",
                "country": "Egypt", "org": "Cairo University AI Lab", "year": 2024
            },
            {
                "title": "Smart Irrigation AI Morocco",
                "description": "An AI system using satellite imagery and soil sensors to optimize water usage in large-scale agriculture in the Maghreb region.",
                "sector": "Agriculture", "tech": "Computer Vision", "sdg": "SDG 2: Zero Hunger",
                "country": "Morocco", "org": "UM6P - Mohammed VI Polytechnic", "year": 2023
            },
            {
                "title": "AraVec: Arabic Word Embeddings",
                "description": "A world-class project providing pre-trained word embeddings for Arabic, used by thousands of researchers globally.",
                "sector": "Education", "tech": "Natural Language Processing", "sdg": "SDG 4: Quality Education",
                "country": "Qatar", "org": "Qatar Computing Research Institute", "year": 2018
            },
            {
                "title": "DeepChain™ - AI for Protein Design",
                "description": "A platform developed by InstaDeep to accelerate vaccine and drug discovery using reinforcement learning and deep learning.",
                "sector": "Healthcare", "tech": "Deep Learning", "sdg": "SDG 3: Good Health and Well-being",
                "country": "Tunisia", "org": "InstaDeep", "year": 2021
            },
            {
                "title": "Jordan Smart Traffic Management",
                "description": "National AI initiative to reduce congestion in Amman using real-time camera data and adaptive signaling algorithms.",
                "sector": "Transportation", "tech": "Computer Vision", "sdg": "SDG 11: Sustainable Cities and Communities",
                "country": "Jordan", "org": "Jordan Ministry of Digital Economy", "year": 2024
            },
            {
                "title": "Kuwait Oil Leak Detection AI",
                "description": "Predictive maintenance and leak detection system for oil pipelines using acoustic sensors and machine learning.",
                "sector": "Energy", "tech": "Predictive Analytics", "sdg": "SDG 9: Industry, Innovation and Infrastructure",
                "country": "Kuwait", "org": "Kuwait Institute for Scientific Research", "year": 2023
            },
            {
                "title": "Oman AI for Fisheries Sustainability",
                "description": "Using computer vision to monitor fish stocks and prevent overfishing in Omani waters.",
                "sector": "Environment", "tech": "Computer Vision", "sdg": "SDG 14: Life Below Water",
                "country": "Oman", "org": "Sultan Qaboos University AI Lab", "year": 2024
            },
            {
                "title": "Bahrain FinTech Sandbox AI",
                "description": "A testing environment for AI-powered financial startups to validate their algorithms in a regulated space.",
                "sector": "Finance", "tech": "Machine Learning", "sdg": "SDG 8: Decent Work and Economic Growth",
                "country": "Bahrain", "org": "Bahrain Polytechnic AI Center", "year": 2022
            },
            {
                "title": "Algeria Forest Fire Prediction",
                "description": "Early warning system using satellite data and meteorological models to predict and prevent forest fires in Northern Algeria.",
                "sector": "Environment", "tech": "Predictive Analytics", "sdg": "SDG 15: Life on Land",
                "country": "Algeria", "org": "Algeria AI Research Center", "year": 2025
            },
            {
                "title": "Palestine AI-Powered E-Learning",
                "description": "Adaptive learning platform for students in remote areas, providing personalized content based on learning patterns.",
                "sector": "Education", "tech": "Recommendation Systems", "sdg": "SDG 4: Quality Education",
                "country": "Palestine", "org": "Birzeit University", "year": 2024
            },
            {
                "title": "Lebanon Smart Grid Optimization",
                "description": "AI platform to balance energy demand and supply in distributed energy resource environments.",
                "sector": "Energy", "tech": "Machine Learning", "sdg": "SDG 7: Affordable and Clean Energy",
                "country": "Lebanon", "org": "AUB AI Hub", "year": 2023
            },
            {
                "title": "Saudi Arabic Dialect Chatbot",
                "description": "Advanced conversational AI tailored for Saudi citizens to access government services using natural language.",
                "sector": "Government", "tech": "Natural Language Processing", "sdg": "SDG 16: Peace, Justice and Strong Institutions",
                "country": "Saudi Arabia", "org": "SDAIA", "year": 2024
            },
            {
                "title": "UAE Autonomous Taxi Fleet",
                "description": "Testing and deployment of self-driving taxis in Dubai, powered by advanced computer vision and edge AI.",
                "sector": "Transportation", "tech": "Robotics", "sdg": "SDG 11: Sustainable Cities and Communities",
                "country": "United Arab Emirates", "org": "Smart Dubai Office", "year": 2025
            }
        ]

        inserted_projects = []
        for p_data in projects_data:
            c_id = countries.get(p_data["country"])
            project = Project(
                title=p_data["title"],
                description=p_data["description"],
                sector=p_data["sector"],
                ai_technology=p_data["tech"],
                sdg_alignment=p_data["sdg"],
                status="approved",
                country_id=c_id,
                user_id=admin.id,
                website=f"https://www.{p_data['title'].lower().replace(' ', '')}.gov",
                year_of_implementation=p_data["year"],
                created_at=datetime.now(timezone.utc)
            )
            db.add(project)
            inserted_projects.append((project, p_data["org"]))
        
        db.commit()
        print(f"✅ Created {len(inserted_projects)} Projects")

        # 6. Link Stakeholders to Projects
        print("🔗 Linking Stakeholders to Projects...")
        stakeholder_map = {s.name: s.id for s in db.query(Stakeholder).all()}
        
        for project, org_name in inserted_projects:
            s_id = stakeholder_map.get(org_name)
            if s_id:
                link = ProjectStakeholder(
                    project_id=project.id,
                    stakeholder_id=s_id,
                    role="primary_developer"
                )
                db.add(link)
        
        db.commit()
        print("✅ Stakeholder-Project links established")

        print("\n" + "=" * 50)
        print("🎉 POPULATION COMPLETE!")
        print(f"   Total Stakeholders: {db.query(Stakeholder).count()}")
        print(f"   Total Projects: {db.query(Project).count()}")
        print("=" * 50)

    except Exception as e:
        db.rollback()
        print(f"❌ Error during population: {e}")
        import traceback
        traceback.print_exc()
    finally:
        db.close()

if __name__ == "__main__":
    populate_final()
