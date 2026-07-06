
import os
import sys
from datetime import datetime, timezone
from sqlalchemy import text

# Add backend directory to path
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from app.database import SessionLocal, engine
from app.models.project import Project
from app.models.stakeholder import Stakeholder
from app.models.country import Country
from app.models.sdg import SDG
from app.models.sector import Sector
from app.models.ai_technology import AITechnology

def populate_v4():
    db = SessionLocal()
    try:
        print("Cleaning up old projects for a fresh start...")
        db.execute(text("DELETE FROM project_stakeholders"))
        db.execute(text("DELETE FROM project_sdgs"))
        db.execute(text("DELETE FROM project_technologies"))
        db.execute(text("DELETE FROM projects"))
        db.commit()

        # Load reference data
        countries = {c.name: c.id for c in db.query(Country).all()}
        sdgs = {s.goal_number: s.id for s in db.query(SDG).all()}
        
        # Real-world projects data
        projects_data = [
            # Original 12
            {
                "title": "Egyptian Arabic NLP Platform",
                "description": "A comprehensive Natural Language Processing platform specifically designed for Egyptian Arabic dialect. The project focuses on developing advanced NLP models for sentiment analysis, named entity recognition, and machine translation tailored to Egyptian Arabic linguistic patterns.",
                "stakeholder": "Cairo University AI Research Lab",
                "type": "University",
                "country": "Egypt",
                "sector": "Education",
                "tech": "Natural Language Processing",
                "sdg_num": 4,
                "website": "https://ai.cu.edu.eg/nlp"
            },
            {
                "title": "Morocco AI-Powered Medical Diagnosis System",
                "description": "An innovative AI system developed by the Moroccan Ministry of Health to assist doctors in diagnosing diseases using computer vision and deep learning. The system analyzes medical images including X-rays, CT scans, and MRIs to detect abnormalities and provide diagnostic suggestions.",
                "stakeholder": "Morocco Ministry of Health",
                "type": "Government",
                "country": "Morocco",
                "sector": "Healthcare",
                "tech": "Computer Vision",
                "sdg_num": 3,
                "website": "https://sante.gov.ma/ai-diagnosis"
            },
            {
                "title": "Jordan Smart Agriculture Initiative",
                "description": "A national initiative by the Jordan Food and Drug Administration to implement AI-driven precision agriculture. The project uses machine learning algorithms to optimize crop yields, predict weather patterns, manage irrigation systems, and detect plant diseases early through satellite imagery analysis.",
                "stakeholder": "Jordan Food and Drug Administration",
                "type": "Government",
                "country": "Jordan",
                "sector": "Agriculture",
                "tech": "Machine Learning",
                "sdg_num": 2,
                "website": "https://jfda.jo/smart-agriculture"
            },
            {
                "title": "KAUST Deep Learning for Climate Research",
                "description": "King Abdullah University of Science and Technology (KAUST) research initiative using deep learning to model climate change impacts in the Middle East region. The project analyzes satellite data, weather patterns, and environmental indicators to predict climate trends and support policy decisions.",
                "stakeholder": "KAUST AI Initiative",
                "type": "University",
                "country": "Saudi Arabia",
                "sector": "Environment",
                "tech": "Deep Learning",
                "sdg_num": 13,
                "website": "https://www.kaust.edu.sa/climate-ai"
            },
            {
                "title": "Qatar Arabic Speech Recognition System",
                "description": "Qatar Computing Research Institute's advanced speech recognition system optimized for Arabic dialects. The system enables voice-controlled applications, transcription services, and accessibility tools for Arabic speakers across the Gulf region.",
                "stakeholder": "Qatar Computing Research Institute",
                "type": "Research Lab",
                "country": "Qatar",
                "sector": "Telecommunications",
                "tech": "Speech Recognition",
                "sdg_num": 9,
                "website": "https://www.qcri.org/speech-ai"
            },
            {
                "title": "UAE Smart City AI Platform",
                "description": "A comprehensive AI platform developed by the UAE Ministry of AI to power smart city initiatives across the Emirates. The system integrates traffic management, energy optimization, waste management, and public services using AI and IoT technologies.",
                "stakeholder": "UAE Ministry of AI",
                "type": "Government",
                "country": "United Arab Emirates",
                "sector": "Government",
                "tech": "Machine Learning",
                "sdg_num": 11,
                "website": "https://ai.gov.ae/smart-cities"
            },
            {
                "title": "Tunisia E-Learning Recommendation Engine",
                "description": "An AI-powered personalized learning platform developed by Tunis Business School. The system uses recommendation algorithms to create customized learning paths for students based on their performance, interests, and learning styles.",
                "stakeholder": "Tunis Business School",
                "type": "University",
                "country": "Tunisia",
                "sector": "Education",
                "tech": "Recommendation Systems",
                "sdg_num": 4,
                "website": "https://www.tbs.tn/ai-learning"
            },
            {
                "title": "Lebanon Healthcare Predictive Analytics",
                "description": "American University of Beirut's predictive analytics platform for healthcare resource optimization. The system forecasts patient admissions, disease outbreaks, and resource needs to help hospitals and clinics manage their operations more efficiently.",
                "stakeholder": "American University of Beirut",
                "type": "University",
                "country": "Lebanon",
                "sector": "Healthcare",
                "tech": "Predictive Analytics",
                "sdg_num": 3,
                "website": "https://www.aub.edu.lb/health-ai"
            },
            {
                "title": "Egypt Robotics for Manufacturing",
                "description": "Zewail City's robotics initiative to modernize Egyptian manufacturing through Industry 4.0 technologies. The project develops autonomous robots and automation systems for factories, focusing on quality control, assembly, and logistics.",
                "stakeholder": "Zewail City of Science",
                "type": "Research Lab",
                "country": "Egypt",
                "sector": "Manufacturing",
                "tech": "Robotics",
                "sdg_num": 9,
                "website": "https://www.zewailcity.edu.eg/robotics"
            },
            {
                "title": "Morocco Generative AI for Content Creation",
                "description": "UM6P's research project on generative AI models for Arabic content creation. The system generates text, images, and multimedia content in Arabic, supporting creative industries, education, and media production.",
                "stakeholder": "UM6P Morocco",
                "type": "University",
                "country": "Morocco",
                "sector": "Media",
                "tech": "Generative AI",
                "sdg_num": 8,
                "website": "https://www.um6p.ma/generative-ai"
            },
            {
                "title": "Bahrain Financial AI Risk Assessment",
                "description": "Bahrain Polytechnic's AI system for financial risk assessment and fraud detection in the banking sector. The platform uses machine learning to analyze transactions, detect anomalies, and predict credit risks.",
                "stakeholder": "Bahrain Polytechnic",
                "type": "University",
                "country": "Bahrain",
                "sector": "Finance",
                "tech": "Machine Learning",
                "sdg_num": 8,
                "website": "https://www.polytechnic.bh/fintech-ai"
            },
            {
                "title": "Oman Explainable AI for Government Services",
                "description": "Sultan Qaboos University's research on explainable AI for transparent government decision-making. The project develops interpretable AI models that provide clear explanations for automated decisions in public services.",
                "stakeholder": "Sultan Qaboos University",
                "type": "University",
                "country": "Oman",
                "sector": "Government",
                "tech": "Explainable AI",
                "sdg_num": 16,
                "website": "https://www.squ.edu.om/xai"
            },
            # Additional 6
            {
                "title": "SDAIA - Tawakkalna Platform AI",
                "description": "The Saudi Data and AI Authority's (SDAIA) comprehensive digital identity and health platform using AI for resource allocation and public health monitoring.",
                "stakeholder": "SDAIA",
                "type": "Government",
                "country": "Saudi Arabia",
                "sector": "Government",
                "tech": "Machine Learning",
                "sdg_num": 3,
                "website": "https://tawakkalna.sdaia.gov.sa/"
            },
            {
                "title": "InstaDeep - BioAI DeepChain",
                "description": "A collaborative protein design platform using deep learning to discover new protein structures and accelerate drug discovery, founded in Tunisia.",
                "stakeholder": "InstaDeep",
                "type": "Company",
                "country": "Tunisia",
                "sector": "Health",
                "tech": "Deep Learning",
                "sdg_num": 3,
                "website": "https://www.instadeep.com/"
            },
            {
                "title": "Swvl - AI Transport Optimization",
                "description": "An Egyptian-founded global tech startup that uses AI algorithms to optimize bus routes and dynamic pricing for affordable mass transit.",
                "stakeholder": "Swvl",
                "type": "Startup",
                "country": "Egypt",
                "sector": "Transportation",
                "tech": "Machine Learning",
                "sdg_num": 11,
                "website": "https://www.swvl.com/"
            },
            {
                "title": "Masdar City - Autonomous AI Shuttles",
                "description": "Abu Dhabi's flagship sustainable urban community using AI-powered autonomous pods and shuttles for zero-carbon public transport.",
                "stakeholder": "Masdar",
                "type": "Company",
                "country": "United Arab Emirates",
                "sector": "Smart Cities",
                "tech": "Robotics",
                "sdg_num": 11,
                "website": "https://masdar.ae/"
            },
            {
                "title": "iSante - Moroccan e-Health AI",
                "description": "A Moroccan digital health platform integrating AI to improve patient follow-up and chronic disease management across rural areas.",
                "stakeholder": "Moroccan Ministry of Health",
                "type": "Government",
                "country": "Morocco",
                "sector": "Health",
                "tech": "Predictive Analytics",
                "sdg_num": 3,
                "website": "https://www.sante.gov.ma/"
            },
            {
                "title": "Gaza Sky Geeks - AI for Social Good",
                "description": "Mentorship and training program in Palestine focusing on building AI-driven solutions for local agricultural and environmental challenges.",
                "stakeholder": "Gaza Sky Geeks",
                "type": "NGO",
                "country": "Palestine",
                "sector": "Education",
                "tech": "Machine Learning",
                "sdg_num": 4,
                "website": "https://gazaskygeeks.com/"
            }
        ]

        added = 0
        for p in projects_data:
            # 1. Create/Get Stakeholder
            sh = db.query(Stakeholder).filter(Stakeholder.name == p["stakeholder"]).first()
            if not sh:
                sh = Stakeholder(
                    name=p["stakeholder"],
                    type=p["type"],
                    country=p["country"],
                    country_id=countries.get(p["country"]),
                    website=p["website"],
                    created_at=datetime.now(timezone.utc),
                    updated_at=datetime.now(timezone.utc)
                )
                db.add(sh)
                db.flush()
            
            # 2. Create Project
            proj = Project(
                title=p["title"],
                description=p["description"],
                sector=p.get("sector"),
                ai_technology=p.get("tech"),
                sdg_alignment=f"SDG {p['sdg_num']}",
                status="approved",
                is_published=1,
                user_id=1,
                country_id=countries.get(p["country"]),
                stakeholder_id=sh.id,
                website=p["website"],
                created_at=datetime.now(timezone.utc),
                updated_at=datetime.now(timezone.utc)
            )
            db.add(proj)
            db.flush()

            # 3. Add Many-to-Many links
            # Project-Stakeholder
            db.execute(text("INSERT INTO project_stakeholders (project_id, stakeholder_id, role, added_at) VALUES (:p_id, :s_id, 'lead', :now)"),
                       {"p_id": proj.id, "s_id": sh.id, "now": datetime.now(timezone.utc)})
            
            # Project-SDG
            sdg_id = sdgs.get(p["sdg_num"])
            if sdg_id:
                db.execute(text("INSERT INTO project_sdgs (project_id, sdg_id, created_at) VALUES (:p_id, :s_id, :now)"),
                           {"p_id": proj.id, "s_id": sdg_id, "now": datetime.now(timezone.utc)})
            
            added += 1
            print(f"Added project: {p['title']}")

        db.commit()
        print(f"\nSuccessfully populated database with {added} real Arab AI projects.")

    except Exception as e:
        db.rollback()
        print(f"Error: {e}")
        import traceback
        traceback.print_exc()
    finally:
        db.close()

if __name__ == "__main__":
    populate_v4()
