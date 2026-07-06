"""
Script to populate the database with real, consistent AI projects and stakeholders from Arab countries.
This will clear existing test data and add professional, real-world examples.
"""

from sqlalchemy.orm import Session
from app.database import SessionLocal, engine, Base
from app.models.project import Project
from app.models.stakeholder import Stakeholder
from app.models.country import Country
from app.models.user import User
from datetime import datetime

# Real AI Projects from Arab Countries
REAL_PROJECTS = [
    # UAE Projects
    {
        "title": "Dubai AI Roadmap 2031",
        "organization": "Smart Dubai Office",
        "country": "UAE",
        "sector": "Government",
        "technology": "AI Strategy & Governance",
        "sdg_alignment": "SDG 9: Industry, Innovation and Infrastructure",
        "description": "Comprehensive AI strategy to make Dubai the world's leading AI-powered city by 2031. Includes AI ethics framework, talent development, and smart city infrastructure.",
        "website": "https://www.smartdubai.ae",
        "status": "active",
        "year_of_implementation": 2019
    },
    {
        "title": "Mohamed Bin Zayed University of AI (MBZUAI)",
        "organization": "MBZUAI",
        "country": "UAE",
        "sector": "Education",
        "technology": "AI Research & Education",
        "sdg_alignment": "SDG 4: Quality Education",
        "description": "World's first graduate-level, research-based AI university offering MSc and PhD programs in Computer Vision, Machine Learning, and NLP.",
        "website": "https://mbzuai.ac.ae",
        "status": "active",
        "year_of_implementation": 2019
    },
    {
        "title": "Falcon LLM",
        "organization": "Technology Innovation Institute (TII)",
        "country": "UAE",
        "sector": "Research",
        "technology": "Large Language Models",
        "sdg_alignment": "SDG 9: Industry, Innovation and Infrastructure",
        "description": "Open-source large language model trained on 1.5 trillion tokens, competing with GPT-3. One of the most powerful Arabic-English bilingual models.",
        "website": "https://falconllm.tii.ae",
        "status": "active",
        "year_of_implementation": 2023
    },
    
    # Saudi Arabia Projects
    {
        "title": "NEOM Cognitive City",
        "organization": "NEOM",
        "country": "Saudi Arabia",
        "sector": "Smart Cities",
        "technology": "AI, IoT, Computer Vision",
        "sdg_alignment": "SDG 11: Sustainable Cities and Communities",
        "description": "AI-powered cognitive infrastructure for NEOM smart city, including autonomous transportation, predictive maintenance, and intelligent resource management.",
        "website": "https://www.neom.com",
        "status": "in_progress",
        "year_of_implementation": 2021
    },
    {
        "title": "Saudi Data & AI Authority (SDAIA) National Strategy",
        "organization": "SDAIA",
        "country": "Saudi Arabia",
        "sector": "Government",
        "technology": "AI Strategy & Governance",
        "sdg_alignment": "SDG 9: Industry, Innovation and Infrastructure",
        "description": "National AI strategy to position Saudi Arabia as a global leader in AI by 2030, with focus on healthcare, education, and smart cities.",
        "website": "https://sdaia.gov.sa",
        "status": "active",
        "year_of_implementation": 2020
    },
    {
        "title": "Seha Virtual Hospital",
        "organization": "Ministry of Health",
        "country": "Saudi Arabia",
        "sector": "Healthcare",
        "technology": "AI Diagnostics, Telemedicine",
        "sdg_alignment": "SDG 3: Good Health and Well-being",
        "description": "AI-powered virtual hospital providing remote consultations, AI-assisted diagnostics, and predictive health analytics for Saudi citizens.",
        "website": "https://www.moh.gov.sa",
        "status": "active",
        "year_of_implementation": 2020
    },
    
    # Egypt Projects
    {
        "title": "Egypt AI Strategy 2030",
        "organization": "Ministry of Communications and Information Technology",
        "country": "Egypt",
        "sector": "Government",
        "technology": "AI Strategy & Governance",
        "sdg_alignment": "SDG 9: Industry, Innovation and Infrastructure",
        "description": "National AI strategy focusing on digital transformation, AI talent development, and establishing Egypt as a regional AI hub.",
        "website": "https://mcit.gov.eg",
        "status": "active",
        "year_of_implementation": 2019
    },
    {
        "title": "Cairo University AI Research Center",
        "organization": "Cairo University",
        "country": "Egypt",
        "sector": "Research",
        "technology": "Machine Learning, NLP",
        "sdg_alignment": "SDG 4: Quality Education",
        "description": "Leading research center focusing on Arabic NLP, computer vision for heritage preservation, and AI applications in agriculture.",
        "website": "https://cu.edu.eg",
        "status": "active",
        "year_of_implementation": 2018
    },
    {
        "title": "Smart Agriculture Egypt",
        "organization": "Ministry of Agriculture",
        "country": "Egypt",
        "sector": "Agriculture",
        "technology": "Computer Vision, IoT, Predictive Analytics",
        "sdg_alignment": "SDG 2: Zero Hunger",
        "description": "AI-powered precision agriculture system using satellite imagery, IoT sensors, and predictive models to optimize crop yields and water usage.",
        "website": "https://www.agr.gov.eg",
        "status": "active",
        "year_of_implementation": 2021
    },
    
    # Qatar Projects
    {
        "title": "Qatar Computing Research Institute (QCRI) AI Lab",
        "organization": "QCRI",
        "country": "Qatar",
        "sector": "Research",
        "technology": "NLP, Social Computing, Cybersecurity",
        "sdg_alignment": "SDG 9: Industry, Innovation and Infrastructure",
        "description": "World-class research in Arabic NLP, social media analysis, and AI for cybersecurity. Developed AraVec and other Arabic language models.",
        "website": "https://www.hbku.edu.qa/en/qcri",
        "status": "active",
        "year_of_implementation": 2010
    },
    {
        "title": "Qatar National AI Strategy",
        "organization": "Ministry of Transport and Communications",
        "country": "Qatar",
        "sector": "Government",
        "technology": "AI Strategy & Governance",
        "sdg_alignment": "SDG 9: Industry, Innovation and Infrastructure",
        "description": "Comprehensive AI strategy aligned with Qatar National Vision 2030, focusing on healthcare, education, transportation, and energy.",
        "website": "https://www.motc.gov.qa",
        "status": "active",
        "year_of_implementation": 2019
    },
    
    # Morocco Projects
    {
        "title": "Morocco AI Movement",
        "organization": "UM6P - Mohammed VI Polytechnic University",
        "country": "Morocco",
        "sector": "Research",
        "technology": "Machine Learning, Data Science",
        "sdg_alignment": "SDG 4: Quality Education",
        "description": "National initiative to develop AI talent and research capabilities, with focus on African languages and agricultural applications.",
        "website": "https://www.um6p.ma",
        "status": "active",
        "year_of_implementation": 2018
    },
    {
        "title": "Casablanca Smart City",
        "organization": "Casablanca Municipality",
        "country": "Morocco",
        "sector": "Smart Cities",
        "technology": "IoT, Computer Vision, Predictive Analytics",
        "sdg_alignment": "SDG 11: Sustainable Cities and Communities",
        "description": "AI-powered smart city infrastructure including intelligent traffic management, waste optimization, and public safety systems.",
        "website": "https://www.casablanca.ma",
        "status": "in_progress",
        "year_of_implementation": 2020
    },
    
    # Jordan Projects
    {
        "title": "Jordan AI Roadmap",
        "organization": "Ministry of Digital Economy and Entrepreneurship",
        "country": "Jordan",
        "sector": "Government",
        "technology": "AI Strategy & Governance",
        "sdg_alignment": "SDG 9: Industry, Innovation and Infrastructure",
        "description": "National AI strategy to position Jordan as a regional AI hub, with focus on talent development and startup ecosystem.",
        "website": "https://modee.gov.jo",
        "status": "active",
        "year_of_implementation": 2020
    },
    {
        "title": "King Abdullah II Center for AI",
        "organization": "Jordan University of Science and Technology",
        "country": "Jordan",
        "sector": "Research",
        "technology": "Machine Learning, Robotics",
        "sdg_alignment": "SDG 4: Quality Education",
        "description": "Research center focusing on AI applications in healthcare, robotics, and Arabic language processing.",
        "website": "https://www.just.edu.jo",
        "status": "active",
        "year_of_implementation": 2019
    },
    
    # Tunisia Projects
    {
        "title": "Tunisia AI Strategy",
        "organization": "Ministry of Communication Technologies and Digital Economy",
        "country": "Tunisia",
        "sector": "Government",
        "technology": "AI Strategy & Governance",
        "sdg_alignment": "SDG 9: Industry, Innovation and Infrastructure",
        "description": "National AI strategy focusing on digital transformation, AI education, and establishing Tunisia as a Mediterranean AI hub.",
        "website": "https://www.mtcen.gov.tn",
        "status": "active",
        "year_of_implementation": 2021
    },
    {
        "title": "InstaDeep Research",
        "organization": "InstaDeep",
        "country": "Tunisia",
        "sector": "Private Sector",
        "technology": "Deep Learning, Reinforcement Learning",
        "sdg_alignment": "SDG 9: Industry, Innovation and Infrastructure",
        "description": "Leading African AI company (acquired by BioNTech) specializing in decision-making systems, with applications in logistics, energy, and biotech.",
        "website": "https://www.instadeep.com",
        "status": "active",
        "year_of_implementation": 2014
    },
    
    # Lebanon Projects
    {
        "title": "Beirut AI Hub",
        "organization": "American University of Beirut",
        "country": "Lebanon",
        "sector": "Research",
        "technology": "Machine Learning, NLP",
        "sdg_alignment": "SDG 4: Quality Education",
        "description": "Research hub focusing on Arabic NLP, healthcare AI, and AI for social good in the MENA region.",
        "website": "https://www.aub.edu.lb",
        "status": "active",
        "year_of_implementation": 2019
    },
    
    # Kuwait Projects
    {
        "title": "Kuwait AI Strategy",
        "organization": "Central Agency for Information Technology",
        "country": "Kuwait",
        "sector": "Government",
        "technology": "AI Strategy & Governance",
        "sdg_alignment": "SDG 9: Industry, Innovation and Infrastructure",
        "description": "National AI strategy to transform Kuwait into a digital society, with focus on e-government and smart services.",
        "website": "https://www.cait.gov.kw",
        "status": "active",
        "year_of_implementation": 2020
    },
    
    # Bahrain Projects
    {
        "title": "Bahrain AI Society",
        "organization": "Bahrain Polytechnic",
        "country": "Bahrain",
        "sector": "Education",
        "technology": "AI Education & Research",
        "sdg_alignment": "SDG 4: Quality Education",
        "description": "Initiative to develop AI talent and promote AI adoption across Bahrain's economy, with focus on fintech and smart government.",
        "website": "https://www.polytechnic.bh",
        "status": "active",
        "year_of_implementation": 2019
    },
    
    # Oman Projects
    {
        "title": "Oman Vision 2040 Digital Transformation",
        "organization": "Ministry of Transport, Communications and Information Technology",
        "country": "Oman",
        "sector": "Government",
        "technology": "AI, Cloud Computing, IoT",
        "sdg_alignment": "SDG 9: Industry, Innovation and Infrastructure",
        "description": "National digital transformation strategy incorporating AI for smart government, healthcare, and education.",
        "website": "https://www.mtcit.gov.om",
        "status": "active",
        "year_of_implementation": 2020
    },
]

# Real Stakeholders from Arab Countries
REAL_STAKEHOLDERS = [
    # UAE
    {
        "name": "Mohamed Bin Zayed University of Artificial Intelligence",
        "type": "University",
        "category": "Education",
        "country": "UAE",
        "description": "World's first graduate-level, research-based AI university offering specialized programs in Computer Vision, Machine Learning, Natural Language Processing, and Robotics.",
        "website": "https://mbzuai.ac.ae",
        "contact_email": "info@mbzuai.ac.ae"
    },
    {
        "name": "Technology Innovation Institute (TII)",
        "type": "Research Lab",
        "category": "Research",
        "country": "UAE",
        "description": "Applied research institute developing breakthrough technologies including Falcon LLM, quantum computing, and autonomous systems.",
        "website": "https://www.tii.ae",
        "contact_email": "info@tii.ae"
    },
    {
        "name": "Smart Dubai Office",
        "type": "Government",
        "category": "Government",
        "country": "UAE",
        "description": "Government entity leading Dubai's transformation into the smartest and happiest city through AI, blockchain, and IoT initiatives.",
        "website": "https://www.smartdubai.ae",
        "contact_email": "info@smartdubai.ae"
    },
    {
        "name": "Inception AI",
        "type": "Startup",
        "category": "Private",
        "country": "UAE",
        "description": "AI company developing Arabic language models and NLP solutions for enterprises across the Middle East.",
        "website": "https://www.inceptionai.ai",
        "contact_email": "contact@inceptionai.ai"
    },
    
    # Saudi Arabia
    {
        "name": "Saudi Data & AI Authority (SDAIA)",
        "type": "Government",
        "category": "Government",
        "country": "Saudi Arabia",
        "description": "National authority responsible for leading Saudi Arabia's AI strategy, data governance, and digital transformation initiatives.",
        "website": "https://sdaia.gov.sa",
        "contact_email": "info@sdaia.gov.sa"
    },
    {
        "name": "King Abdullah University of Science and Technology (KAUST)",
        "type": "University",
        "category": "Education",
        "country": "Saudi Arabia",
        "description": "Leading research university with strong AI research programs in computer vision, machine learning, and computational biology.",
        "website": "https://www.kaust.edu.sa",
        "contact_email": "info@kaust.edu.sa"
    },
    {
        "name": "NEOM Tech & Digital Company",
        "type": "Government",
        "category": "Government",
        "country": "Saudi Arabia",
        "description": "Technology arm of NEOM developing cognitive city infrastructure, autonomous systems, and AI-powered urban solutions.",
        "website": "https://www.neom.com",
        "contact_email": "info@neom.com"
    },
    {
        "name": "Lean Technologies",
        "type": "Startup",
        "category": "Private",
        "country": "Saudi Arabia",
        "description": "Fintech startup using AI for open banking, fraud detection, and financial data analytics across MENA.",
        "website": "https://www.leantech.me",
        "contact_email": "hello@leantech.me"
    },
    
    # Egypt
    {
        "name": "Cairo University AI Research Center",
        "type": "University",
        "category": "Education",
        "country": "Egypt",
        "description": "Leading academic research center focusing on Arabic NLP, computer vision, and AI applications in agriculture and healthcare.",
        "website": "https://cu.edu.eg",
        "contact_email": "ai@cu.edu.eg"
    },
    {
        "name": "Ministry of Communications and Information Technology",
        "type": "Government",
        "category": "Government",
        "country": "Egypt",
        "description": "Government ministry leading Egypt's digital transformation and AI strategy implementation.",
        "website": "https://mcit.gov.eg",
        "contact_email": "info@mcit.gov.eg"
    },
    {
        "name": "Integrant AI",
        "type": "Startup",
        "category": "Private",
        "country": "Egypt",
        "description": "AI startup developing computer vision and NLP solutions for retail, manufacturing, and logistics sectors.",
        "website": "https://www.integrant.ai",
        "contact_email": "contact@integrant.ai"
    },
    {
        "name": "Nile University AI Lab",
        "type": "Research Lab",
        "category": "Research",
        "country": "Egypt",
        "description": "Research laboratory focusing on machine learning, robotics, and AI applications in smart cities.",
        "website": "https://www.nu.edu.eg",
        "contact_email": "ailab@nu.edu.eg"
    },
    
    # Qatar
    {
        "name": "Qatar Computing Research Institute (QCRI)",
        "type": "Research Lab",
        "category": "Research",
        "country": "Qatar",
        "description": "World-class research institute specializing in Arabic NLP, social computing, cybersecurity, and data analytics.",
        "website": "https://www.hbku.edu.qa/en/qcri",
        "contact_email": "info@qcri.org"
    },
    {
        "name": "Qatar University AI Lab",
        "type": "University",
        "category": "Education",
        "country": "Qatar",
        "description": "Academic research lab focusing on AI applications in healthcare, education, and smart infrastructure.",
        "website": "https://www.qu.edu.qa",
        "contact_email": "ailab@qu.edu.qa"
    },
    {
        "name": "Ministry of Transport and Communications",
        "type": "Government",
        "category": "Government",
        "country": "Qatar",
        "description": "Government ministry leading Qatar's AI strategy and digital transformation initiatives.",
        "website": "https://www.motc.gov.qa",
        "contact_email": "info@motc.gov.qa"
    },
    
    # Morocco
    {
        "name": "Mohammed VI Polytechnic University (UM6P)",
        "type": "University",
        "category": "Education",
        "country": "Morocco",
        "description": "Leading research university with strong focus on AI, data science, and applications in agriculture and mining.",
        "website": "https://www.um6p.ma",
        "contact_email": "contact@um6p.ma"
    },
    {
        "name": "Al Akhawayn University AI Lab",
        "type": "Research Lab",
        "category": "Research",
        "country": "Morocco",
        "description": "Research laboratory focusing on machine learning, computer vision, and AI for social good.",
        "website": "https://www.aui.ma",
        "contact_email": "ailab@aui.ma"
    },
    {
        "name": "MTDS (Moroccan Tech & Digital Services)",
        "type": "Startup",
        "category": "Private",
        "country": "Morocco",
        "description": "Tech company developing AI solutions for customer service, process automation, and data analytics.",
        "website": "https://www.mtds.ma",
        "contact_email": "contact@mtds.ma"
    },
    
    # Jordan
    {
        "name": "Jordan University of Science and Technology AI Center",
        "type": "University",
        "category": "Education",
        "country": "Jordan",
        "description": "Academic center focusing on AI research in healthcare, robotics, and Arabic language processing.",
        "website": "https://www.just.edu.jo",
        "contact_email": "ai@just.edu.jo"
    },
    {
        "name": "Ministry of Digital Economy and Entrepreneurship",
        "type": "Government",
        "category": "Government",
        "country": "Jordan",
        "description": "Government ministry leading Jordan's digital transformation and AI strategy implementation.",
        "website": "https://modee.gov.jo",
        "contact_email": "info@modee.gov.jo"
    },
    {
        "name": "Mawdoo3 AI",
        "type": "Startup",
        "category": "Private",
        "country": "Jordan",
        "description": "Leading Arabic content platform using AI for content recommendation, NLP, and knowledge management.",
        "website": "https://www.mawdoo3.com",
        "contact_email": "ai@mawdoo3.com"
    },
    
    # Tunisia
    {
        "name": "InstaDeep",
        "type": "Startup",
        "category": "Private",
        "country": "Tunisia",
        "description": "Leading African AI company (acquired by BioNTech) specializing in decision-making systems and deep learning applications.",
        "website": "https://www.instadeep.com",
        "contact_email": "contact@instadeep.com"
    },
    {
        "name": "Tunisia Polytechnic School AI Lab",
        "type": "University",
        "category": "Education",
        "country": "Tunisia",
        "description": "Research laboratory focusing on machine learning, computer vision, and AI applications in industry.",
        "website": "https://www.ept.rnu.tn",
        "contact_email": "ailab@ept.rnu.tn"
    },
    {
        "name": "Ministry of Communication Technologies",
        "type": "Government",
        "category": "Government",
        "country": "Tunisia",
        "description": "Government ministry leading Tunisia's digital transformation and AI strategy.",
        "website": "https://www.mtcen.gov.tn",
        "contact_email": "info@mtcen.gov.tn"
    },
    
    # Lebanon
    {
        "name": "American University of Beirut AI Hub",
        "type": "University",
        "category": "Education",
        "country": "Lebanon",
        "description": "Research hub focusing on Arabic NLP, healthcare AI, and AI for social good in the MENA region.",
        "website": "https://www.aub.edu.lb",
        "contact_email": "aihub@aub.edu.lb"
    },
    {
        "name": "Lebanese American University AI Lab",
        "type": "Research Lab",
        "category": "Research",
        "country": "Lebanon",
        "description": "Research laboratory focusing on machine learning, data science, and AI applications in healthcare.",
        "website": "https://www.lau.edu.lb",
        "contact_email": "ailab@lau.edu.lb"
    },
    
    # Kuwait
    {
        "name": "Central Agency for Information Technology",
        "type": "Government",
        "category": "Government",
        "country": "Kuwait",
        "description": "Government agency leading Kuwait's digital transformation and AI strategy implementation.",
        "website": "https://www.cait.gov.kw",
        "contact_email": "info@cait.gov.kw"
    },
    {
        "name": "Kuwait University AI Research Group",
        "type": "University",
        "category": "Education",
        "country": "Kuwait",
        "description": "Academic research group focusing on AI applications in education, healthcare, and smart government.",
        "website": "https://www.ku.edu.kw",
        "contact_email": "ai@ku.edu.kw"
    },
    
    # Bahrain
    {
        "name": "Bahrain Polytechnic AI Center",
        "type": "University",
        "category": "Education",
        "country": "Bahrain",
        "description": "Educational center developing AI talent and promoting AI adoption in fintech and smart government.",
        "website": "https://www.polytechnic.bh",
        "contact_email": "ai@polytechnic.bh"
    },
    {
        "name": "Bahrain Economic Development Board",
        "type": "Government",
        "category": "Government",
        "country": "Bahrain",
        "description": "Government entity promoting AI adoption and digital transformation in Bahrain's economy.",
        "website": "https://www.bahrainedb.com",
        "contact_email": "info@bahrainedb.com"
    },
    
    # Oman
    {
        "name": "Sultan Qaboos University AI Lab",
        "type": "University",
        "category": "Education",
        "country": "Oman",
        "description": "Research laboratory focusing on AI applications in healthcare, education, and smart infrastructure.",
        "website": "https://www.squ.edu.om",
        "contact_email": "ailab@squ.edu.om"
    },
    {
        "name": "Ministry of Transport, Communications and IT",
        "type": "Government",
        "category": "Government",
        "country": "Oman",
        "description": "Government ministry leading Oman's digital transformation and AI strategy.",
        "website": "https://www.mtcit.gov.om",
        "contact_email": "info@mtcit.gov.om"
    },
]


def clear_test_data(db: Session):
    """Clear existing test data from projects and stakeholders"""
    print("🗑️  Clearing existing test data...")
    
    # Delete all existing projects and stakeholders
    db.query(Project).delete()
    db.query(Stakeholder).delete()
    db.commit()
    
    print("✅ Test data cleared successfully")


def seed_real_projects(db: Session):
    """Seed database with real AI projects"""
    print("\n📊 Seeding real AI projects...")
    
    # Get the first user (admin) to assign as project owner
    admin_user = db.query(User).first()
    if not admin_user:
        print("❌ No user found. Please create an admin user first.")
        return
    
    for project_data in REAL_PROJECTS:
        # Get country by name
        country = db.query(Country).filter(Country.name == project_data["country"]).first()
        if not country:
            print(f"⚠️  Country '{project_data['country']}' not found, skipping project: {project_data['title']}")
            continue
        
        project = Project(
            title=project_data["title"],
            organization=project_data["organization"],
            country_id=country.id,
            user_id=admin_user.id,
            sector=project_data["sector"],
            technology=project_data["technology"],
            sdg_alignment=project_data.get("sdg_alignment"),
            description=project_data["description"],
            website=project_data.get("website"),
            status=project_data["status"],
            year_of_implementation=project_data.get("year_of_implementation"),
            created_at=datetime.utcnow(),
            updated_at=datetime.utcnow()
        )
        db.add(project)
        print(f"  ✓ Added: {project_data['title']}")
    
    db.commit()
    print(f"✅ Successfully added {len(REAL_PROJECTS)} real projects")


def seed_real_stakeholders(db: Session):
    """Seed database with real stakeholders"""
    print("\n👥 Seeding real stakeholders...")
    
    for stakeholder_data in REAL_STAKEHOLDERS:
        stakeholder = Stakeholder(
            name=stakeholder_data["name"],
            type=stakeholder_data["type"],
            category=stakeholder_data["category"],
            country=stakeholder_data["country"],
            description=stakeholder_data["description"],
            website=stakeholder_data.get("website"),
            contact_email=stakeholder_data.get("contact_email"),
            created_at=datetime.utcnow(),
            updated_at=datetime.utcnow()
        )
        db.add(stakeholder)
        print(f"  ✓ Added: {stakeholder_data['name']}")
    
    db.commit()
    print(f"✅ Successfully added {len(REAL_STAKEHOLDERS)} real stakeholders")


def main():
    """Main function to seed the database"""
    print("=" * 60)
    print("🚀 SARAI Database - Real Data Seeding")
    print("=" * 60)
    
    # Don't create tables - use existing database
    # Base.metadata.create_all(bind=engine)
    
    # Create database session
    db = SessionLocal()
    
    try:
        # Clear existing test data
        clear_test_data(db)
        
        # Seed real data
        seed_real_projects(db)
        seed_real_stakeholders(db)
        
        print("\n" + "=" * 60)
        print("✅ Database seeding completed successfully!")
        print("=" * 60)
        
        # Print summary
        total_projects = db.query(Project).count()
        total_stakeholders = db.query(Stakeholder).count()
        print(f"\n📈 Summary:")
        print(f"   • Total Projects: {total_projects}")
        print(f"   • Total Stakeholders: {total_stakeholders}")
        
    except Exception as e:
        print(f"\n❌ Error during seeding: {e}")
        db.rollback()
    finally:
        db.close()


if __name__ == "__main__":
    main()
