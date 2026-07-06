"""
Script to populate app.db with real, consistent AI projects and stakeholders from Arab countries.
"""

import sqlite3
from datetime import datetime

# Database path
DB_PATH = "app.db"

# Real AI Projects from Arab Countries (title, organization, country, sector, technology, sdg_alignment, description, website, status, year)
REAL_PROJECTS = [
    # UAE Projects
    ("Dubai AI Roadmap 2031", "Smart Dubai Office", "UAE", "Government", "AI Strategy & Governance", "SDG 9: Industry, Innovation and Infrastructure", 
     "Comprehensive AI strategy to make Dubai the world's leading AI-powered city by 2031. Includes AI ethics framework, talent development, and smart city infrastructure.", 
     "https://www.smartdubai.ae", "active", 2019),
    
    ("Mohamed Bin Zayed University of AI (MBZUAI)", "MBZUAI", "UAE", "Education", "AI Research & Education", "SDG 4: Quality Education",
     "World's first graduate-level, research-based AI university offering MSc and PhD programs in Computer Vision, Machine Learning, and NLP.",
     "https://mbzuai.ac.ae", "active", 2019),
    
    ("Falcon LLM", "Technology Innovation Institute (TII)", "UAE", "Research", "Large Language Models", "SDG 9: Industry, Innovation and Infrastructure",
     "Open-source large language model trained on 1.5 trillion tokens, competing with GPT-3. One of the most powerful Arabic-English bilingual models.",
     "https://falconllm.tii.ae", "active", 2023),
    
    # Saudi Arabia Projects
    ("NEOM Cognitive City", "NEOM", "Saudi Arabia", "Smart Cities", "AI, IoT, Computer Vision", "SDG 11: Sustainable Cities and Communities",
     "AI-powered cognitive infrastructure for NEOM smart city, including autonomous transportation, predictive maintenance, and intelligent resource management.",
     "https://www.neom.com", "in_progress", 2021),
    
    ("Saudi Data & AI Authority (SDAIA) National Strategy", "SDAIA", "Saudi Arabia", "Government", "AI Strategy & Governance", "SDG 9: Industry, Innovation and Infrastructure",
     "National AI strategy to position Saudi Arabia as a global leader in AI by 2030, with focus on healthcare, education, and smart cities.",
     "https://sdaia.gov.sa", "active", 2020),
    
    ("Seha Virtual Hospital", "Ministry of Health", "Saudi Arabia", "Healthcare", "AI Diagnostics, Telemedicine", "SDG 3: Good Health and Well-being",
     "AI-powered virtual hospital providing remote consultations, AI-assisted diagnostics, and predictive health analytics for Saudi citizens.",
     "https://www.moh.gov.sa", "active", 2020),
    
    # Egypt Projects
    ("Egypt AI Strategy 2030", "Ministry of Communications and Information Technology", "Egypt", "Government", "AI Strategy & Governance", "SDG 9: Industry, Innovation and Infrastructure",
     "National AI strategy focusing on digital transformation, AI talent development, and establishing Egypt as a regional AI hub.",
     "https://mcit.gov.eg", "active", 2019),
    
    ("Cairo University AI Research Center", "Cairo University", "Egypt", "Research", "Machine Learning, NLP", "SDG 4: Quality Education",
     "Leading research center focusing on Arabic NLP, computer vision for heritage preservation, and AI applications in agriculture.",
     "https://cu.edu.eg", "active", 2018),
    
    ("Smart Agriculture Egypt", "Ministry of Agriculture", "Egypt", "Agriculture", "Computer Vision, IoT, Predictive Analytics", "SDG 2: Zero Hunger",
     "AI-powered precision agriculture system using satellite imagery, IoT sensors, and predictive models to optimize crop yields and water usage.",
     "https://www.agr.gov.eg", "active", 2021),
    
    # Qatar Projects
    ("Qatar Computing Research Institute (QCRI) AI Lab", "QCRI", "Qatar", "Research", "NLP, Social Computing, Cybersecurity", "SDG 9: Industry, Innovation and Infrastructure",
     "World-class research in Arabic NLP, social media analysis, and AI for cybersecurity. Developed AraVec and other Arabic language models.",
     "https://www.hbku.edu.qa/en/qcri", "active", 2010),
    
    ("Qatar National AI Strategy", "Ministry of Transport and Communications", "Qatar", "Government", "AI Strategy & Governance", "SDG 9: Industry, Innovation and Infrastructure",
     "Comprehensive AI strategy aligned with Qatar National Vision 2030, focusing on healthcare, education, transportation, and energy.",
     "https://www.motc.gov.qa", "active", 2019),
    
    # Morocco Projects
    ("Morocco AI Movement", "UM6P - Mohammed VI Polytechnic University", "Morocco", "Research", "Machine Learning, Data Science", "SDG 4: Quality Education",
     "National initiative to develop AI talent and research capabilities, with focus on African languages and agricultural applications.",
     "https://www.um6p.ma", "active", 2018),
    
    ("Casablanca Smart City", "Casablanca Municipality", "Morocco", "Smart Cities", "IoT, Computer Vision, Predictive Analytics", "SDG 11: Sustainable Cities and Communities",
     "AI-powered smart city infrastructure including intelligent traffic management, waste optimization, and public safety systems.",
     "https://www.casablanca.ma", "in_progress", 2020),
    
    # Jordan Projects
    ("Jordan AI Roadmap", "Ministry of Digital Economy and Entrepreneurship", "Jordan", "Government", "AI Strategy & Governance", "SDG 9: Industry, Innovation and Infrastructure",
     "National AI strategy to position Jordan as a regional AI hub, with focus on talent development and startup ecosystem.",
     "https://modee.gov.jo", "active", 2020),
    
    ("King Abdullah II Center for AI", "Jordan University of Science and Technology", "Jordan", "Research", "Machine Learning, Robotics", "SDG 4: Quality Education",
     "Research center focusing on AI applications in healthcare, robotics, and Arabic language processing.",
     "https://www.just.edu.jo", "active", 2019),
    
    # Tunisia Projects
    ("Tunisia AI Strategy", "Ministry of Communication Technologies and Digital Economy", "Tunisia", "Government", "AI Strategy & Governance", "SDG 9: Industry, Innovation and Infrastructure",
     "National AI strategy focusing on digital transformation, AI education, and establishing Tunisia as a Mediterranean AI hub.",
     "https://www.mtcen.gov.tn", "active", 2021),
    
    ("InstaDeep Research", "InstaDeep", "Tunisia", "Private Sector", "Deep Learning, Reinforcement Learning", "SDG 9: Industry, Innovation and Infrastructure",
     "Leading African AI company (acquired by BioNTech) specializing in decision-making systems, with applications in logistics, energy, and biotech.",
     "https://www.instadeep.com", "active", 2014),
    
    # Lebanon Projects
    ("Beirut AI Hub", "American University of Beirut", "Lebanon", "Research", "Machine Learning, NLP", "SDG 4: Quality Education",
     "Research hub focusing on Arabic NLP, healthcare AI, and AI for social good in the MENA region.",
     "https://www.aub.edu.lb", "active", 2019),
    
    # Kuwait Projects
    ("Kuwait AI Strategy", "Central Agency for Information Technology", "Kuwait", "Government", "AI Strategy & Governance", "SDG 9: Industry, Innovation and Infrastructure",
     "National AI strategy to transform Kuwait into a digital society, with focus on e-government and smart services.",
     "https://www.cait.gov.kw", "active", 2020),
    
    # Bahrain Projects
    ("Bahrain AI Society", "Bahrain Polytechnic", "Bahrain", "Education", "AI Education & Research", "SDG 4: Quality Education",
     "Initiative to develop AI talent and promote AI adoption across Bahrain's economy, with focus on fintech and smart government.",
     "https://www.polytechnic.bh", "active", 2019),
    
    # Oman Projects
    ("Oman Vision 2040 Digital Transformation", "Ministry of Transport, Communications and Information Technology", "Oman", "Government", "AI, Cloud Computing, IoT", "SDG 9: Industry, Innovation and Infrastructure",
     "National digital transformation strategy incorporating AI for smart government, healthcare, and education.",
     "https://www.mtcit.gov.om", "active", 2020),
]

# Real Stakeholders
REAL_STAKEHOLDERS = [
    # UAE
    ("Mohamed Bin Zayed University of Artificial Intelligence", "University", "Education", "UAE",
     "World's first graduate-level, research-based AI university offering specialized programs in Computer Vision, Machine Learning, Natural Language Processing, and Robotics.",
     "https://mbzuai.ac.ae", "info@mbzuai.ac.ae"),
    
    ("Technology Innovation Institute (TII)", "Research Lab", "Research", "UAE",
     "Applied research institute developing breakthrough technologies including Falcon LLM, quantum computing, and autonomous systems.",
     "https://www.tii.ae", "info@tii.ae"),
    
    ("Smart Dubai Office", "Government", "Government", "UAE",
     "Government entity leading Dubai's transformation into the smartest and happiest city through AI, blockchain, and IoT initiatives.",
     "https://www.smartdubai.ae", "info@smartdubai.ae"),
    
    ("Inception AI", "Startup", "Private", "UAE",
     "AI company developing Arabic language models and NLP solutions for enterprises across the Middle East.",
     "https://www.inceptionai.ai", "contact@inceptionai.ai"),
    
    # Saudi Arabia
    ("Saudi Data & AI Authority (SDAIA)", "Government", "Government", "Saudi Arabia",
     "National authority responsible for leading Saudi Arabia's AI strategy, data governance, and digital transformation initiatives.",
     "https://sdaia.gov.sa", "info@sdaia.gov.sa"),
    
    ("King Abdullah University of Science and Technology (KAUST)", "University", "Education", "Saudi Arabia",
     "Leading research university with strong AI research programs in computer vision, machine learning, and computational biology.",
     "https://www.kaust.edu.sa", "info@kaust.edu.sa"),
    
    ("NEOM Tech & Digital Company", "Government", "Government", "Saudi Arabia",
     "Technology arm of NEOM developing cognitive city infrastructure, autonomous systems, and AI-powered urban solutions.",
     "https://www.neom.com", "info@neom.com"),
    
    ("Lean Technologies", "Startup", "Private", "Saudi Arabia",
     "Fintech startup using AI for open banking, fraud detection, and financial data analytics across MENA.",
     "https://www.leantech.me", "hello@leantech.me"),
    
    # Egypt
    ("Cairo University AI Research Center", "University", "Education", "Egypt",
     "Leading academic research center focusing on Arabic NLP, computer vision, and AI applications in agriculture and healthcare.",
     "https://cu.edu.eg", "ai@cu.edu.eg"),
    
    ("Ministry of Communications and Information Technology", "Government", "Government", "Egypt",
     "Government ministry leading Egypt's digital transformation and AI strategy implementation.",
     "https://mcit.gov.eg", "info@mcit.gov.eg"),
    
    ("Integrant AI", "Startup", "Private", "Egypt",
     "AI startup developing computer vision and NLP solutions for retail, manufacturing, and logistics sectors.",
     "https://www.integrant.ai", "contact@integrant.ai"),
    
    ("Nile University AI Lab", "Research Lab", "Research", "Egypt",
     "Research laboratory focusing on machine learning, robotics, and AI applications in smart cities.",
     "https://www.nu.edu.eg", "ailab@nu.edu.eg"),
    
    # Qatar
    ("Qatar Computing Research Institute (QCRI)", "Research Lab", "Research", "Qatar",
     "World-class research institute specializing in Arabic NLP, social computing, cybersecurity, and data analytics.",
     "https://www.hbku.edu.qa/en/qcri", "info@qcri.org"),
    
    ("Qatar University AI Lab", "University", "Education", "Qatar",
     "Academic research lab focusing on AI applications in healthcare, education, and smart infrastructure.",
     "https://www.qu.edu.qa", "ailab@qu.edu.qa"),
    
    ("Ministry of Transport and Communications", "Government", "Government", "Qatar",
     "Government ministry leading Qatar's AI strategy and digital transformation initiatives.",
     "https://www.motc.gov.qa", "info@motc.gov.qa"),
    
    # Morocco
    ("Mohammed VI Polytechnic University (UM6P)", "University", "Education", "Morocco",
     "Leading research university with strong focus on AI, data science, and applications in agriculture and mining.",
     "https://www.um6p.ma", "contact@um6p.ma"),
    
    ("Al Akhawayn University AI Lab", "Research Lab", "Research", "Morocco",
     "Research laboratory focusing on machine learning, computer vision, and AI for social good.",
     "https://www.aui.ma", "ailab@aui.ma"),
    
    ("MTDS (Moroccan Tech & Digital Services)", "Startup", "Private", "Morocco",
     "Tech company developing AI solutions for customer service, process automation, and data analytics.",
     "https://www.mtds.ma", "contact@mtds.ma"),
    
    # Jordan
    ("Jordan University of Science and Technology AI Center", "University", "Education", "Jordan",
     "Academic center focusing on AI research in healthcare, robotics, and Arabic language processing.",
     "https://www.just.edu.jo", "ai@just.edu.jo"),
    
    ("Ministry of Digital Economy and Entrepreneurship", "Government", "Government", "Jordan",
     "Government ministry leading Jordan's digital transformation and AI strategy implementation.",
     "https://modee.gov.jo", "info@modee.gov.jo"),
    
    ("Mawdoo3 AI", "Startup", "Private", "Jordan",
     "Leading Arabic content platform using AI for content recommendation, NLP, and knowledge management.",
     "https://www.mawdoo3.com", "ai@mawdoo3.com"),
    
    # Tunisia
    ("InstaDeep", "Startup", "Private", "Tunisia",
     "Leading African AI company (acquired by BioNTech) specializing in decision-making systems and deep learning applications.",
     "https://www.instadeep.com", "contact@instadeep.com"),
    
    ("Tunisia Polytechnic School AI Lab", "University", "Education", "Tunisia",
     "Research laboratory focusing on machine learning, computer vision, and AI applications in industry.",
     "https://www.ept.rnu.tn", "ailab@ept.rnu.tn"),
    
    ("Ministry of Communication Technologies", "Government", "Government", "Tunisia",
     "Government ministry leading Tunisia's digital transformation and AI strategy.",
     "https://www.mtcen.gov.tn", "info@mtcen.gov.tn"),
    
    # Lebanon
    ("American University of Beirut AI Hub", "University", "Education", "Lebanon",
     "Research hub focusing on Arabic NLP, healthcare AI, and AI for social good in the MENA region.",
     "https://www.aub.edu.lb", "aihub@aub.edu.lb"),
    
    ("Lebanese American University AI Lab", "Research Lab", "Research", "Lebanon",
     "Research laboratory focusing on machine learning, data science, and AI applications in healthcare.",
     "https://www.lau.edu.lb", "ailab@lau.edu.lb"),
    
    # Kuwait
    ("Central Agency for Information Technology", "Government", "Government", "Kuwait",
     "Government agency leading Kuwait's digital transformation and AI strategy implementation.",
     "https://www.cait.gov.kw", "info@cait.gov.kw"),
    
    ("Kuwait University AI Research Group", "University", "Education", "Kuwait",
     "Academic research group focusing on AI applications in education, healthcare, and smart government.",
     "https://www.ku.edu.kw", "ai@ku.edu.kw"),
    
    # Bahrain
    ("Bahrain Polytechnic AI Center", "University", "Education", "Bahrain",
     "Educational center developing AI talent and promoting AI adoption in fintech and smart government.",
     "https://www.polytechnic.bh", "ai@polytechnic.bh"),
    
    ("Bahrain Economic Development Board", "Government", "Government", "Bahrain",
     "Government entity promoting AI adoption and digital transformation in Bahrain's economy.",
     "https://www.bahrainedb.com", "info@bahrainedb.com"),
    
    # Oman
    ("Sultan Qaboos University AI Lab", "University", "Education", "Oman",
     "Research laboratory focusing on AI applications in healthcare, education, and smart infrastructure.",
     "https://www.squ.edu.om", "ailab@squ.edu.om"),
    
    ("Ministry of Transport, Communications and IT", "Government", "Government", "Oman",
     "Government ministry leading Oman's digital transformation and AI strategy.",
     "https://www.mtcit.gov.om", "info@mtcit.gov.om"),
]


def main():
    print("=" * 70)
    print("🚀 SARAI Database - Real Data Population")
    print("=" * 70)
    
    # Connect to database
    conn = sqlite3.connect(DB_PATH)
    cursor = conn.cursor()
    
    try:
        # Clear existing test data
        print("\n🗑️  Clearing existing test data...")
        cursor.execute("DELETE FROM projects")
        cursor.execute("DELETE FROM stakeholders")
        conn.commit()
        print("✅ Test data cleared successfully")
        
        # Insert real projects
        print("\n📊 Inserting real AI projects...")
        now = datetime.utcnow().isoformat()
        
        for project in REAL_PROJECTS:
            cursor.execute("""
                INSERT INTO projects (
                    title, organization, country, sector, technology,
                    sdg_alignment, description, website, status, created_at
                ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            """, (*project[:9], now))
            print(f"  ✓ Added: {project[0]}")
        
        conn.commit()
        print(f"✅ Successfully added {len(REAL_PROJECTS)} real projects")
        
        # Insert real stakeholders
        print("\n👥 Inserting real stakeholders...")
        
        for stakeholder in REAL_STAKEHOLDERS:
            cursor.execute("""
                INSERT INTO stakeholders (
                    name, type, category, country, description, website, contact_email,
                    created_at, updated_at
                ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
            """, (*stakeholder, now, now))
            print(f"  ✓ Added: {stakeholder[0]}")
        
        conn.commit()
        print(f"✅ Successfully added {len(REAL_STAKEHOLDERS)} real stakeholders")
        
        # Print summary
        cursor.execute("SELECT COUNT(*) FROM projects")
        total_projects = cursor.fetchone()[0]
        
        cursor.execute("SELECT COUNT(*) FROM stakeholders")
        total_stakeholders = cursor.fetchone()[0]
        
        print("\n" + "=" * 70)
        print("✅ Database population completed successfully!")
        print("=" * 70)
        print(f"\n📈 Summary:")
        print(f"   • Total Projects: {total_projects}")
        print(f"   • Total Stakeholders: {total_stakeholders}")
        print("\n")
        
    except Exception as e:
        print(f"\n❌ Error during population: {e}")
        conn.rollback()
    finally:
        conn.close()


if __name__ == "__main__":
    main()
