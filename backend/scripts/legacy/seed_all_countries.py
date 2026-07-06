"""
Complete data seeding for all 22 Arab countries
"""
import sqlite3
from datetime import datetime

DB_PATH = "sarai.db"

# All 22 Arab countries
ARAB_COUNTRIES = [
    "Algeria", "Bahrain", "Comoros", "Djibouti", "Egypt", "Iraq", "Jordan",
    "Kuwait", "Lebanon", "Libya", "Mauritania", "Morocco", "Oman", "Palestine",
    "Qatar", "Saudi Arabia", "Somalia", "Sudan", "Syria", "Tunisia", "UAE", "Yemen"
]

# Project templates by sector
PROJECT_TEMPLATES = {
    "Government": [
        ("National AI Strategy {year}", "{country} Ministry of Digital Affairs", "Government", "AI Strategy & Governance",
         "SDG 9: Industry, Innovation and Infrastructure",
         "Comprehensive national AI strategy to drive digital transformation and position {country} as a regional AI leader.",
         "approved"),
        ("Smart Government Initiative", "{country} Government", "Government", "AI, Cloud, IoT",
         "SDG 16: Peace, Justice and Strong Institutions",
         "AI-powered e-government platform providing intelligent public services and automated administrative processes.",
         "approved"),
        ("Digital Transformation Program", "Ministry of Technology", "Government", "AI & Digital Infrastructure",
         "SDG 9: Industry, Innovation and Infrastructure",
         "National program to modernize government services using AI, big data, and cloud computing.",
         "approved"),
    ],
    "Healthcare": [
        ("AI Healthcare System", "{country} Ministry of Health", "Healthcare", "AI Diagnostics, Telemedicine",
         "SDG 3: Good Health and Well-being",
         "AI-powered healthcare platform for remote diagnostics, patient monitoring, and predictive health analytics.",
         "approved"),
        ("Medical AI Research Center", "National Health Institute", "Healthcare", "Medical AI, Computer Vision",
         "SDG 3: Good Health and Well-being",
         "Research center developing AI solutions for disease detection, drug discovery, and personalized medicine.",
         "approved"),
    ],
    "Education": [
        ("{country} AI University Program", "National University", "Education", "AI Research & Education",
         "SDG 4: Quality Education",
         "Graduate programs in AI, machine learning, and data science to develop national AI talent.",
         "approved"),
        ("Smart Education Platform", "Ministry of Education", "Education", "AI, Adaptive Learning",
         "SDG 4: Quality Education",
         "AI-powered personalized learning platform with intelligent tutoring and student performance analytics.",
         "approved"),
    ],
    "Smart Cities": [
        ("{country} Smart City Initiative", "Urban Development Authority", "Smart Cities", "IoT, AI, Computer Vision",
         "SDG 11: Sustainable Cities and Communities",
         "Integrated smart city infrastructure with AI-powered traffic management, energy optimization, and public safety.",
         "approved"),
        ("Intelligent Transportation System", "Transport Authority", "Transportation", "AI, Computer Vision, IoT",
         "SDG 11: Sustainable Cities and Communities",
         "AI-based traffic optimization, autonomous vehicle infrastructure, and smart public transportation.",
         "approved"),
    ],
    "Research": [
        ("{country} AI Research Lab", "National Research Center", "Research", "Machine Learning, NLP",
         "SDG 9: Industry, Innovation and Infrastructure",
         "Leading research laboratory focusing on Arabic NLP, computer vision, and AI applications for regional challenges.",
         "approved"),
        ("Data Science Center", "Institute of Technology", "Research", "Data Science, AI",
         "SDG 9: Industry, Innovation and Infrastructure",
         "Research center advancing AI methodologies and developing solutions for industry and society.",
         "approved"),
    ],
    "Agriculture": [
        ("Smart Agriculture Program", "Ministry of Agriculture", "Agriculture", "Computer Vision, IoT, Predictive Analytics",
         "SDG 2: Zero Hunger",
         "AI-powered precision agriculture using satellite imagery, IoT sensors, and predictive models for crop optimization.",
         "approved"),
    ],
    "Finance": [
        ("FinTech AI Hub", "{country} Central Bank", "Finance", "AI, Blockchain, Cybersecurity",
         "SDG 8: Decent Work and Economic Growth",
         "AI-powered financial services platform with fraud detection, risk assessment, and automated compliance.",
         "approved"),
    ],
}

# Stakeholder templates
STAKEHOLDER_TEMPLATES = {
    "University": [
        ("{country} National University AI Lab", "University", "Education",
         "Leading academic institution with AI research programs in machine learning, computer vision, and natural language processing."),
        ("{country} Institute of Technology", "University", "Education",
         "Technical university offering AI and data science programs with focus on practical applications and industry collaboration."),
        ("{country} Polytechnic AI Center", "University", "Education",
         "Educational center developing AI talent through specialized programs in deep learning, robotics, and intelligent systems."),
    ],
    "Government": [
        ("Ministry of Digital Economy - {country}", "Government", "Government",
         "Government ministry leading national digital transformation and AI strategy implementation."),
        ("{country} Data & AI Authority", "Government", "Government",
         "National authority responsible for AI governance, data strategy, and digital innovation initiatives."),
        ("{country} Innovation Agency", "Government", "Government",
         "Government agency promoting AI adoption, supporting startups, and fostering innovation ecosystem."),
    ],
    "Research Lab": [
        ("{country} AI Research Institute", "Research Lab", "Research",
         "Independent research institute conducting cutting-edge AI research in machine learning, robotics, and cognitive computing."),
        ("{country} Computing Research Center", "Research Lab", "Research",
         "Research center specializing in AI applications, data analytics, and computational intelligence."),
    ],
    "Startup": [
        ("{country} AI Solutions", "Startup", "Private",
         "AI startup developing innovative solutions for enterprise automation, data analytics, and intelligent systems."),
        ("{country} Tech Innovations", "Startup", "Private",
         "Technology company creating AI-powered products for healthcare, education, and smart cities."),
        ("{country} Data Analytics", "Startup", "Private",
         "Data science company providing AI-driven insights, predictive analytics, and business intelligence solutions."),
    ],
    "NGO": [
        ("{country} AI Society", "NGO", "Civil Society",
         "Non-profit organization promoting AI education, ethical AI development, and digital inclusion."),
    ],
}

def generate_projects_for_country(country):
    """Generate diverse AI projects for a country"""
    projects = []
    year = 2020
    
    # Select 3-5 project types per country
    import random
    random.seed(hash(country))  # Consistent randomization per country
    
    sectors = random.sample(list(PROJECT_TEMPLATES.keys()), min(5, len(PROJECT_TEMPLATES)))
    
    for sector in sectors:
        templates = PROJECT_TEMPLATES[sector]
        template = random.choice(templates)
        
        title = template[0].format(country=country, year=year)
        org = template[1].format(country=country)
        
        project = (
            title,
            org,
            country,
            template[2],  # sector
            template[3],  # technology
            template[4],  # sdg
            template[5].format(country=country),  # description
            f"https://www.{country.lower().replace(' ', '')}-ai.gov",  # website
            template[6],  # status
        )
        projects.append(project)
        year += 1
    
    return projects

def generate_stakeholders_for_country(country):
    """Generate stakeholders for a country"""
    stakeholders = []
    
    import random
    random.seed(hash(country))
    
    # Each country gets 2-3 stakeholders of different types
    types = random.sample(list(STAKEHOLDER_TEMPLATES.keys()), min(3, len(STAKEHOLDER_TEMPLATES)))
    
    for stype in types:
        templates = STAKEHOLDER_TEMPLATES[stype]
        template = random.choice(templates)
        
        stakeholder = (
            template[0].format(country=country),
            template[1],  # type
            template[2],  # category
            country,
            template[3].format(country=country),  # description
            f"https://www.{country.lower().replace(' ', '')}-{stype.lower().replace(' ', '')}.org",
            f"info@{country.lower().replace(' ', '')}-{stype.lower().replace(' ', '')}.org",
        )
        stakeholders.append(stakeholder)
    
    return stakeholders

def main():
    print("=" * 70)
    print("🌍 Seeding Complete Data for All 22 Arab Countries")
    print("=" * 70)
    
    conn = sqlite3.connect(DB_PATH)
    cursor = conn.cursor()
    now = datetime.utcnow().isoformat()
    
    try:
        # Create tables if they don't exist
        print("\n📋 Creating tables...")
        cursor.execute("""
            CREATE TABLE IF NOT EXISTS projects (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                title VARCHAR(255) NOT NULL,
                organization VARCHAR(255) NOT NULL,
                country VARCHAR(100) NOT NULL,
                sector VARCHAR(100) NOT NULL,
                technology VARCHAR(100) NOT NULL,
                sdg_alignment VARCHAR(100),
                description TEXT,
                website VARCHAR(500),
                status VARCHAR(50) DEFAULT 'pending',
                created_at DATETIME,
                updated_at DATETIME
            )
        """)
        cursor.execute("""
            CREATE TABLE IF NOT EXISTS stakeholders (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                name VARCHAR(255) NOT NULL,
                type VARCHAR(100) NOT NULL,
                category VARCHAR(100) NOT NULL,
                country VARCHAR(100) NOT NULL,
                description TEXT,
                website VARCHAR(500),
                contact_email VARCHAR(255),
                created_at DATETIME,
                updated_at DATETIME
            )
        """)
        conn.commit()
        print("✅ Tables created")
        
        # Clear existing data
        print("\n🗑️  Clearing existing data...")
        cursor.execute("DELETE FROM projects")
        cursor.execute("DELETE FROM stakeholders")
        conn.commit()
        print("✅ Data cleared")
        
        # Generate and insert projects for all countries
        print("\n📊 Generating projects for all 22 countries...")
        all_projects = []
        for country in ARAB_COUNTRIES:
            projects = generate_projects_for_country(country)
            all_projects.extend(projects)
            print(f"  ✓ {country}: {len(projects)} projects")
        
        print(f"\n💾 Inserting {len(all_projects)} projects...")
        for project in all_projects:
            cursor.execute("""
                INSERT INTO projects (
                    title, organization, country, sector, technology,
                    sdg_alignment, description, website, status, created_at
                ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            """, (*project, now))
        conn.commit()
        print(f"✅ {len(all_projects)} projects inserted")
        
        # Generate and insert stakeholders for all countries
        print("\n👥 Generating stakeholders for all 22 countries...")
        all_stakeholders = []
        for country in ARAB_COUNTRIES:
            stakeholders = generate_stakeholders_for_country(country)
            all_stakeholders.extend(stakeholders)
            print(f"  ✓ {country}: {len(stakeholders)} stakeholders")
        
        print(f"\n💾 Inserting {len(all_stakeholders)} stakeholders...")
        for stakeholder in all_stakeholders:
            cursor.execute("""
                INSERT INTO stakeholders (
                    name, type, category, country, description, website, contact_email,
                    created_at, updated_at
                ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
            """, (*stakeholder, now, now))
        conn.commit()
        print(f"✅ {len(all_stakeholders)} stakeholders inserted")
        
        # Summary
        cursor.execute("SELECT COUNT(*) FROM projects")
        total_projects = cursor.fetchone()[0]
        
        cursor.execute("SELECT COUNT(*) FROM stakeholders")
        total_stakeholders = cursor.fetchone()[0]
        
        cursor.execute("SELECT COUNT(DISTINCT country) FROM projects")
        countries_with_projects = cursor.fetchone()[0]
        
        cursor.execute("SELECT COUNT(DISTINCT country) FROM stakeholders")
        countries_with_stakeholders = cursor.fetchone()[0]
        
        print("\n" + "=" * 70)
        print("✅ Complete Data Seeding Successful!")
        print("=" * 70)
        print(f"\n📈 Summary:")
        print(f"   • Total Projects: {total_projects}")
        print(f"   • Total Stakeholders: {total_stakeholders}")
        print(f"   • Countries with Projects: {countries_with_projects}/22")
        print(f"   • Countries with Stakeholders: {countries_with_stakeholders}/22")
        print()
        
    except Exception as e:
        print(f"\n❌ Error: {e}")
        conn.rollback()
    finally:
        conn.close()

if __name__ == "__main__":
    main()
