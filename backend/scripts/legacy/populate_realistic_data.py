import os
import sys
import random
from datetime import datetime, timezone, timedelta
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
import hashlib

def get_flag_url(code: str) -> str:
    return f"https://flagcdn.com/w320/{code.lower()}.png"

def populate_realistic_data():
    db = SessionLocal()
    try:
        print("🚀 Starting Realistic Data Population for 22 Arab Countries...")
        
        # 1. Ensure Admin User exists
        admin_email = "admin@sarai.org"
        admin = db.query(User).filter(User.email == admin_email).first()
        if not admin:
            print("👤 Creating admin user...")
            hashed_password = hashlib.sha256("admin123".encode()).hexdigest()
            admin = User(
                email=admin_email,
                password_hash=hashed_password,
                role="admin",
                organization_name="SARAI Admin",
                is_active=1
            )
            db.add(admin)
            db.commit()
            db.refresh(admin)

        # 2. Clear existing dynamic data for a fresh start (optional, but requested for high-quality demo)
        print("🗑️  Cleaning existing projects and stakeholders...")
        db.query(ProjectStakeholder).delete()
        db.query(Project).delete()
        db.query(Stakeholder).delete()
        db.commit()

        # 3. Seed/Ensure Countries
        print("🌍 Ensuring 22 Arab Countries...")
        arab_countries = [
            {"name": "Algeria", "code": "dz", "lat": 36.7538, "lng": 3.0588, "region": "North Africa"},
            {"name": "Bahrain", "code": "bh", "lat": 26.0667, "lng": 50.55, "region": "Gulf"},
            {"name": "Comoros", "code": "km", "lat": -11.6455, "lng": 43.3333, "region": "Horn of Africa"},
            {"name": "Djibouti", "code": "dj", "lat": 11.8251, "lng": 42.5903, "region": "Horn of Africa"},
            {"name": "Egypt", "code": "eg", "lat": 30.0444, "lng": 31.2357, "region": "North Africa"},
            {"name": "Iraq", "code": "iq", "lat": 33.3152, "lng": 44.3661, "region": "Levant"},
            {"name": "Jordan", "code": "jo", "lat": 31.9454, "lng": 35.9284, "region": "Levant"},
            {"name": "Kuwait", "code": "kw", "lat": 29.3759, "lng": 47.9774, "region": "Gulf"},
            {"name": "Lebanon", "code": "lb", "lat": 33.8938, "lng": 35.5018, "region": "Levant"},
            {"name": "Libya", "code": "ly", "lat": 32.8872, "lng": 13.1913, "region": "North Africa"},
            {"name": "Mauritania", "code": "mr", "lat": 18.0735, "lng": -15.9582, "region": "North Africa"},
            {"name": "Morocco", "code": "ma", "lat": 33.5731, "lng": -7.5898, "region": "North Africa"},
            {"name": "Oman", "code": "om", "lat": 23.5859, "lng": 58.4059, "region": "Gulf"},
            {"name": "Palestine", "code": "ps", "lat": 31.9522, "lng": 35.2332, "region": "Levant"},
            {"name": "Qatar", "code": "qa", "lat": 25.2854, "lng": 51.531, "region": "Gulf"},
            {"name": "Saudi Arabia", "code": "sa", "lat": 24.7136, "lng": 46.6753, "region": "Gulf"},
            {"name": "Somalia", "code": "so", "lat": 2.0469, "lng": 45.3182, "region": "Horn of Africa"},
            {"name": "Sudan", "code": "sd", "lat": 15.5007, "lng": 32.5599, "region": "North Africa"},
            {"name": "Syria", "code": "sy", "lat": 33.5138, "lng": 36.2765, "region": "Levant"},
            {"name": "Tunisia", "code": "tn", "lat": 36.8065, "lng": 10.1815, "region": "North Africa"},
            {"name": "United Arab Emirates", "code": "ae", "lat": 24.4539, "lng": 54.3773, "region": "Gulf"},
            {"name": "Yemen", "code": "ye", "lat": 15.3694, "lng": 44.191, "region": "Arabian Peninsula"},
        ]
        
        for c_data in arab_countries:
            country = db.query(Country).filter(Country.name == c_data["name"]).first()
            if not country:
                country = Country(
                    name=c_data["name"],
                    code_alpha2=c_data["code"].upper(),
                    latitude=c_data["lat"],
                    longitude=c_data["lng"],
                    region=c_data["region"],
                    flag_url=get_flag_url(c_data["code"])
                )
                db.add(country)
        db.commit()
        
        country_map = {c.name: c.id for c in db.query(Country).all()}

        # 4. Seed Reference Tables (Sectors, SDGs, Technologies)
        print("📑 Seeding reference tables...")
        
        sectors_list = ["Health", "Agriculture", "Education", "Smart Cities", "Finance", "Climate", "GovTech", "Energy", "Transportation", "Telecommunications"]
        for s_name in sectors_list:
            if not db.query(Sector).filter(Sector.name == s_name).first():
                db.add(Sector(name=s_name))
        
        tech_list = [
            {"name": "NLP", "cat": "Natural Language Processing"},
            {"name": "Computer Vision", "cat": "CV"},
            {"name": "Robotics", "cat": "Robotics"},
            {"name": "Predictive Analytics", "cat": "ML"},
            {"name": "LLMs", "cat": "Generative AI"},
            {"name": "Deep Learning", "cat": "DL"},
            {"name": "Machine Learning", "cat": "ML"}
        ]
        for t_data in tech_list:
            if not db.query(AITechnology).filter(AITechnology.name == t_data["name"]).first():
                db.add(AITechnology(name=t_data["name"], category=t_data["cat"]))
        
        sdgs_data = [
            (1, "No Poverty"), (2, "Zero Hunger"), (3, "Good Health and Well-being"), (4, "Quality Education"),
            (5, "Gender Equality"), (6, "Clean Water and Sanitation"), (7, "Affordable and Clean Energy"),
            (8, "Decent Work and Economic Growth"), (9, "Industry, Innovation and Infrastructure"),
            (10, "Reduced Inequality"), (11, "Sustainable Cities and Communities"), (12, "Responsible Consumption and Production"),
            (13, "Climate Action"), (14, "Life Below Water"), (15, "Life on Land"), (16, "Peace, Justice and Strong Institutions"),
            (17, "Partnerships for the Goals")
        ]
        for g_num, g_name in sdgs_data:
            if not db.query(SDG).filter(SDG.goal_number == g_num).first():
                db.add(SDG(goal_number=g_num, name=f"SDG {g_num}: {g_name}"))
        
        db.commit()

        # 5. Realistic Stakeholders Data (approx 4-6 per country)
        print("🏢 Generating realistic stakeholders...")
        stakeholders_raw = {
            "Algeria": [
                ("Algeria AI Research Center", "Research Lab", "Algiers"),
                ("CDTA - Advanced Tech Development", "Research Lab", "Algiers"),
                ("USTHB AI & Robotics Lab", "University", "Algiers"),
                ("Algiers Tech Hub", "Innovation Hub", "Algiers"),
                ("Yassir AI Team", "Tech Company", "Algiers")
            ],
            "Bahrain": [
                ("Bahrain Polytechnic AI Center", "University", "Isa Town"),
                ("Tamkeen (Labour Fund)", "Government Agency", "Manama"),
                ("University of Bahrain AI Lab", "University", "Sakhir"),
                ("NSSA Bahrain", "Government Agency", "Manama"),
                ("Bahrain FinTech Bay", "Innovation Hub", "Manama")
            ],
            "Comoros": [
                ("University of Comoros", "University", "Moroni"),
                ("Comoros Telecom AI Unit", "Tech Company", "Moroni"),
                ("Ministry of ICT Comoros", "Government Agency", "Moroni")
            ],
            "Djibouti": [
                ("Djibouti Data Center", "Tech Company", "Djibouti City"),
                ("University of Djibouti", "University", "Djibouti City"),
                ("Port of Djibouti Tech Unit", "Government Agency", "Djibouti City")
            ],
            "Egypt": [
                ("Cairo University AI Lab", "University", "Cairo"),
                ("Zewail City of Science", "University", "Giza"),
                ("Ministry of CIT (MCIT)", "Government Agency", "Cairo"),
                ("Ain Shams University AI Hub", "University", "Cairo"),
                ("Nile University Research", "University", "Giza"),
                ("Synapse Analytics", "AI Startup", "Cairo")
            ],
            "Iraq": [
                ("University of Baghdad", "University", "Baghdad"),
                ("Iraq Tech Hub", "Innovation Hub", "Baghdad"),
                ("Al-Nahrain University", "University", "Baghdad"),
                ("Ministry of Science & Tech", "Government Agency", "Baghdad")
            ],
            "Jordan": [
                ("Mawdoo3 AI", "AI Startup", "Amman"),
                ("JUST University AI Lab", "University", "Irbid"),
                ("Princess Sumaya University", "University", "Amman"),
                ("Orange Digital Village", "Innovation Hub", "Amman"),
                ("Labiba.ai", "AI Startup", "Amman")
            ],
            "Kuwait": [
                ("KISR (Kuwait Institute for Scientific Research)", "Research Lab", "Kuwait City"),
                ("Kuwait University AI Center", "University", "Kuwait City"),
                ("KFAS (Advancement of Sciences)", "NGO", "Kuwait City"),
                ("CITRA Kuwait", "Government Agency", "Kuwait City")
            ],
            "Lebanon": [
                ("AUB AI Hub", "University", "Beirut"),
                ("Berytech Innovation Center", "Innovation Hub", "Beirut"),
                ("USJ AI Lab", "University", "Beirut"),
                ("LAU AI Research", "University", "Beirut")
            ],
            "Libya": [
                ("University of Tripoli", "University", "Tripoli"),
                ("Libyan Authority for Research", "Government Agency", "Tripoli"),
                ("Misrata Tech Hub", "Innovation Hub", "Misrata")
            ],
            "Mauritania": [
                ("University of Nouakchott", "University", "Nouakchott"),
                ("Mauritania Tech Hub", "Innovation Hub", "Nouakchott"),
                ("SUP'MANAGEMENT Mauritanie", "University", "Nouakchott")
            ],
            "Morocco": [
                ("UM6P - Mohammed VI Polytechnic", "University", "Benguerir"),
                ("MAScIR Research Center", "Research Lab", "Rabat"),
                ("Al Akhawayn University", "University", "Ifrane"),
                ("Technopark Morocco", "Innovation Hub", "Casablanca"),
                ("Morocco AI Movement", "NGO", "Rabat")
            ],
            "Oman": [
                ("Sultan Qaboos University AI", "University", "Muscat"),
                ("Oman Broadband", "Tech Company", "Muscat"),
                ("SUTech Oman", "University", "Muscat"),
                ("ITA Oman", "Government Agency", "Muscat")
            ],
            "Palestine": [
                ("Birzeit University", "University", "Birzeit"),
                ("An-Najah National University", "University", "Nablus"),
                ("Gaza Sky Geeks", "Innovation Hub", "Gaza"),
                ("Arab American University", "University", "Jenin")
            ],
            "Qatar": [
                ("QCRI (Qatar Computing Research Institute)", "Research Lab", "Doha"),
                ("Qatar University AI Hub", "University", "Doha"),
                ("CMU Qatar AI Research", "University", "Doha"),
                ("TASMU Smart Qatar", "Government Agency", "Doha")
            ],
            "Saudi Arabia": [
                ("SDAIA", "Government Agency", "Riyadh"),
                ("KAUST AI Initiative", "University", "Thuwal"),
                ("KACST", "Research Lab", "Riyadh"),
                ("NEOM Tech & Digital", "Tech Company", "NEOM"),
                ("Aramco AI Center", "Tech Company", "Dhahran"),
                ("Unit X", "AI Startup", "Jeddah")
            ],
            "Somalia": [
                ("Mogadishu University", "University", "Mogadishu"),
                ("SIMAD University", "University", "Mogadishu"),
                ("Somalia Tech Hub", "Innovation Hub", "Mogadishu")
            ],
            "Sudan": [
                ("University of Khartoum", "University", "Khartoum"),
                ("Sudan University of Science", "University", "Khartoum"),
                ("Nile Tech Hub", "Innovation Hub", "Khartoum")
            ],
            "Syria": [
                ("Damascus University", "University", "Damascus"),
                ("HIAST (Higher Institute of Applied Sciences)", "University", "Damascus"),
                ("Syria Tech Hub", "Innovation Hub", "Damascus")
            ],
            "Tunisia": [
                ("InstaDeep", "AI Startup", "Tunis"),
                ("SUP'COM Tunisia", "University", "Tunis"),
                ("ENIT Lab", "University", "Tunis"),
                ("Tunisian AI Society", "NGO", "Tunis"),
                ("Cognira", "Tech Company", "Tunis")
            ],
            "United Arab Emirates": [
                ("MBZUAI", "University", "Abu Dhabi"),
                ("TII (Technology Innovation Institute)", "Research Lab", "Abu Dhabi"),
                ("Smart Dubai Office", "Government Agency", "Dubai"),
                ("G42", "Tech Company", "Abu Dhabi"),
                ("Hub71", "Innovation Hub", "Abu Dhabi")
            ],
            "Yemen": [
                ("Sana'a University", "University", "Sana'a"),
                ("University of Aden", "University", "Aden"),
                ("Yemen Tech Hub", "Innovation Hub", "Sana'a")
            ]
        }

        stakeholder_objs = []
        for country_name, stakeholders in stakeholders_raw.items():
            c_id = country_map.get(country_name)
            for s_name, s_type, city in stakeholders:
                s = Stakeholder(
                    name=s_name,
                    type=s_type,
                    country=country_name,
                    country_id=c_id,
                    city=city,
                    website=f"https://www.{s_name.lower().replace(' ', '').replace('(', '').replace(')', '').replace('&', '')}.org",
                    description=f"Leading {s_type} based in {city}, {country_name}, focusing on AI innovation and digital transformation.",
                    contact_email=f"info@{s_name.lower().replace(' ', '').split('(')[0]}.org",
                    created_at=datetime.now(timezone.utc)
                )
                db.add(s)
                stakeholder_objs.append(s)
        
        db.commit()
        print(f"✅ Created {len(stakeholder_objs)} Stakeholders.")

        # 6. Realistic Projects Data (approx 3-5 per country)
        print("🚀 Generating realistic projects...")
        
        def get_random_date(start_year, end_year):
            year = random.randint(start_year, end_year)
            month = random.randint(1, 12)
            day = random.randint(1, 28)
            return datetime(year, month, day, tzinfo=timezone.utc)

        projects_raw = {
            "Algeria": [
                ("Forest Fire Prediction System", "Early warning system using satellite data and meteorological models to predict and prevent forest fires in Northern Algeria.", "Climate", "Predictive Analytics", "SDG 15: Life on Land", "Algeria AI Research Center"),
                ("Arabic-Berber Translation AI", "Neural machine translation system specifically designed for Algerian dialects and Berber languages.", "Education", "NLP", "SDG 4: Quality Education", "USTHB AI & Robotics Lab"),
                ("Smart Irrigation for Sahara", "AI-driven irrigation management using soil sensors to optimize water usage in Saharan agriculture.", "Agriculture", "Machine Learning", "SDG 2: Zero Hunger", "CDTA - Advanced Tech Development"),
                ("AI for Petroleum Exploration", "Using deep learning to analyze seismic data for more accurate oil and gas exploration in the Hassi Messaoud region.", "Energy", "Deep Learning", "SDG 9: Industry, Innovation and Infrastructure", "Yassir AI Team")
            ],
            "Bahrain": [
                ("FinTech Sandbox AI", "A testing environment for AI-powered financial startups to validate their algorithms in a regulated space.", "Finance", "Machine Learning", "SDG 8: Decent Work and Economic Growth", "Bahrain FinTech Bay"),
                ("Satellite Coastal Monitoring", "Using computer vision on satellite imagery to monitor coastal erosion and urban sprawl in the Kingdom.", "Climate", "Computer Vision", "SDG 14: Life Below Water", "NSSA Bahrain"),
                ("AI E-Government Assistant", "A multi-lingual virtual assistant for Bahrain's national portal, handling complex citizen queries.", "GovTech", "LLMs", "SDG 16: Peace, Justice and Strong Institutions", "University of Bahrain AI Lab")
            ],
            "Egypt": [
                ("Arabic NLP for Healthcare", "Developing specialized Natural Language Processing models for medical diagnosis and patient support in Egyptian dialects.", "Health", "NLP", "SDG 3: Good Health and Well-being", "Cairo University AI Lab"),
                ("Nile Water Level Prediction", "Using predictive analytics to forecast Nile water levels based on regional rainfall and dam data.", "Climate", "Predictive Analytics", "SDG 6: Clean Water and Sanitation", "Zewail City of Science"),
                ("AI for Ancient Artifacts", "Computer vision system for the classification and restoration of Ancient Egyptian artifacts in the Grand Egyptian Museum.", "Education", "Computer Vision", "SDG 9: Industry, Innovation and Infrastructure", "Ministry of CIT (MCIT)"),
                ("Smart Traffic Cairo", "AI-powered traffic management system using real-time camera feeds to optimize signal timing in Greater Cairo.", "Smart Cities", "Computer Vision", "SDG 11: Sustainable Cities and Communities", "Ain Shams University AI Hub"),
                ("Synapse Health AI", "Predictive model for early detection of chronic diseases among the Egyptian population.", "Health", "Predictive Analytics", "SDG 3: Good Health and Well-being", "Synapse Analytics")
            ],
            "Jordan": [
                ("AraSpeech: Dialect Recognition", "Advanced speech recognition system supporting various Levantine and Arabic dialects.", "Telecommunications", "NLP", "SDG 9: Industry, Innovation and Infrastructure", "Mawdoo3 AI"),
                ("Smart Water Management Jordan", "AI system to detect leaks and optimize distribution in Jordan's national water grid.", "Smart Cities", "Machine Learning", "SDG 6: Clean Water and Sanitation", "JUST University AI Lab"),
                ("Labiba Chatbot Platform", "Enterprise-grade conversational AI platform used by government and private sectors across the region.", "GovTech", "NLP", "SDG 9: Industry, Innovation and Infrastructure", "Labiba.ai")
            ],
            "Morocco": [
                ("Phosphate Mining Optimization", "AI models to optimize the extraction and processing of phosphates at OCP sites.", "Energy", "Machine Learning", "SDG 9: Industry, Innovation and Infrastructure", "UM6P - Mohammed VI Polytechnic"),
                ("Smart Irrigation Morocco", "Satellite-based AI system for precision agriculture in the Souss-Massa region.", "Agriculture", "Computer Vision", "SDG 2: Zero Hunger", "MAScIR Research Center"),
                ("Renewable Energy Forecaster", "Predictive analytics for wind and solar energy production at the Noor Ouarzazate complex.", "Energy", "Predictive Analytics", "SDG 7: Affordable and Clean Energy", "Al Akhawayn University")
            ],
            "Qatar": [
                ("AraVec: Arabic Embeddings", "A world-class project providing pre-trained word embeddings for Arabic, used globally.", "Education", "NLP", "SDG 4: Quality Education", "QCRI (Qatar Computing Research Institute)"),
                ("Smart Stadium Analytics", "AI-powered fan engagement and security analytics for major sporting events in Qatar.", "Smart Cities", "Computer Vision", "SDG 11: Sustainable Cities and Communities", "Qatar University AI Hub"),
                ("TASMU Logistics AI", "National platform for optimizing supply chains and logistics using AI and IoT.", "Transportation", "Predictive Analytics", "SDG 9: Industry, Innovation and Infrastructure", "TASMU Smart Qatar")
            ],
            "Saudi Arabia": [
                ("NEOM Cognitive City Infrastructure", "AI-powered urban infrastructure for the city of the future, integrating IoT and computer vision.", "Smart Cities", "Deep Learning", "SDG 11: Sustainable Cities and Communities", "NEOM Tech & Digital"),
                ("Arabic Dialect Chatbot (SDAIA)", "Advanced conversational AI tailored for Saudi citizens to access government services.", "GovTech", "LLMs", "SDG 16: Peace, Justice and Strong Institutions", "SDAIA"),
                ("Hajj Crowd Management AI", "Predictive models and computer vision to manage pilgrim flows and safety in Makkah and Madinah.", "Smart Cities", "Predictive Analytics", "SDG 11: Sustainable Cities and Communities", "KAUST AI Initiative"),
                ("Aramco Predictive Maintenance", "Deep learning system for monitoring pipeline integrity and preventing oil leaks.", "Energy", "Deep Learning", "SDG 9: Industry, Innovation and Infrastructure", "Aramco AI Center")
            ],
            "Tunisia": [
                ("DeepChain Protein Design", "Accelerating vaccine and drug discovery using reinforcement learning and deep learning.", "Health", "Deep Learning", "SDG 3: Good Health and Well-being", "InstaDeep"),
                ("AI for Olive Harvest", "Using computer vision and drones to predict olive yield and detect pests in Tunisian groves.", "Agriculture", "Computer Vision", "SDG 2: Zero Hunger", "Tunisian AI Society"),
                ("Smart Mobility Tunis", "AI platform to optimize public transport routes and schedules in the capital.", "Transportation", "Machine Learning", "SDG 11: Sustainable Cities and Communities", "SUP'COM Tunisia")
            ],
            "United Arab Emirates": [
                ("Falcon Large Language Model", "A high-performing open-source LLM developed in Abu Dhabi, competing with global models.", "Telecommunications", "LLMs", "SDG 9: Industry, Innovation and Infrastructure", "TII (Technology Innovation Institute)"),
                ("Autonomous Taxi Fleet", "Testing and deployment of self-driving taxis in Dubai, powered by advanced computer vision.", "Transportation", "Robotics", "SDG 11: Sustainable Cities and Communities", "Smart Dubai Office"),
                ("Mars Mission Data Analytics", "Using AI to analyze data from the Hope Probe to understand the Martian atmosphere.", "Climate", "Deep Learning", "SDG 9: Industry, Innovation and Infrastructure", "MBZUAI"),
                ("G42 Healthcare Insight", "AI-driven genomics and population health management platform.", "Health", "Deep Learning", "SDG 3: Good Health and Well-being", "G42")
            ]
        }
        
        # Add generic projects for countries not explicitly detailed above to ensure all 22 are covered
        all_arab_countries = [c["name"] for c in arab_countries]
        
        # Activity Intensity Configuration - INCREASED for 2026 vision
        intensity_map = {
            "Saudi Arabia": 28, "United Arab Emirates": 35, "Egypt": 24,
            "Morocco": 20, "Qatar": 22, "Tunisia": 18, "Jordan": 16, "Algeria": 14,
            "Kuwait": 12, "Bahrain": 10, "Oman": 10, "Iraq": 8, "Lebanon": 8,
            "Yemen": 5, "Syria": 5, "Libya": 5, "Palestine": 6, "Sudan": 5,
            "Somalia": 4, "Mauritania": 4, "Djibouti": 4, "Comoros": 4
        }

        generic_project_templates = [
            ("{country} National AI Portal", "Strategic initiative to digitize government services using AI in {country}.", "GovTech", "Machine Learning", "SDG 16: Peace, Justice and Strong Institutions"),
            ("Smart Agriculture {country}", "Precision farming initiative for local crops in {country} using satellite data.", "Agriculture", "Predictive Analytics", "SDG 2: Zero Hunger"),
            ("{country} E-Learning AI", "Adaptive learning platform for students in {country}, personalizing education paths.", "Education", "NLP", "SDG 4: Quality Education"),
            ("Intelligent Traffic {country}", "AI-powered urban mobility and traffic management for capital cities in {country}.", "Smart Cities", "Computer Vision", "SDG 11: Sustainable Cities and Communities"),
            ("{country} Health Diagnostic AI", "A national screening tool using AI to assist doctors in early disease detection.", "Health", "Deep Learning", "SDG 3: Good Health and Well-being"),
            ("Clean Energy Forecast {country}", "Optimizing renewable energy production using predictive meteorological models.", "Energy", "Predictive Analytics", "SDG 7: Affordable and Clean Energy"),
            ("Arabic Dialect Assistant {country}", "Custom LLM-based assistant trained on {country} local dialects for citizen engagement.", "Telecommunications", "LLMs", "SDG 9: Industry, Innovation and Infrastructure")
        ]

        for country in all_arab_countries:
            if country not in projects_raw:
                projects_raw[country] = []
            
            target_count = intensity_map.get(country, 3)
            current_count = len(projects_raw[country])
            
            # Fill up to target count with diverse generic projects
            while len(projects_raw[country]) < target_count:
                template = random.choice(generic_project_templates)
                # Avoid duplicates in same country
                if not any(template[0].format(country=country) == p[0] for p in projects_raw[country]):
                    stakeholder_name = stakeholders_raw[country][0][0]
                    projects_raw[country].append((
                        template[0].format(country=country),
                        template[1].format(country=country),
                        template[2], template[3], template[4], stakeholder_name
                    ))
                else:
                    # If duplicate, just break and take what we have to avoid infinite loop
                    if len(projects_raw[country]) >= 3: break 

        project_objs = []
        for country_name, projects in projects_raw.items():
            c_id = country_map.get(country_name)
            for title, desc, sector, tech, sdg, primary_org in projects:
                # EXTENDED RANGE: 2019 to 2026
                s_date = get_random_date(2019, 2026)
                # Some are ongoing (end_date is None)
                e_date = None if random.random() > 0.3 else s_date + timedelta(days=random.randint(365, 1000))
                
                # Derive status (consider 2026 dates)
                now = datetime.now(timezone.utc)
                status = "completed" if e_date and e_date < now else "ongoing"
                
                p = Project(
                    title=title,
                    description=desc,
                    sector=sector,
                    ai_technology=tech,
                    sdg_alignment=sdg,
                    status=status,
                    country_id=c_id,
                    user_id=admin.id,
                    website=f"https://www.{title.lower().replace(' ', '-')}.gov",
                    start_date=s_date,
                    end_date=e_date,
                    is_published=1,
                    created_at=datetime.now(timezone.utc)
                )
                db.add(p)
                project_objs.append((p, primary_org))
        
        db.commit()
        print(f"✅ Created {len(project_objs)} Projects.")

        # 7. Link Stakeholders to Projects
        print("🔗 Linking stakeholders to projects...")
        stakeholder_name_map = {s.name: s.id for s in stakeholder_objs}
        
        for project, org_name in project_objs:
            s_id = stakeholder_name_map.get(org_name)
            if s_id:
                link = ProjectStakeholder(
                    project_id=project.id,
                    stakeholder_id=s_id,
                    role="Developer"
                )
                db.add(link)
                
                # Add a second random stakeholder from the same country as a partner
                country_stakeholders = [s for s in stakeholder_objs if s.country == project.country.name and s.name != org_name]
                if country_stakeholders:
                    partner = random.choice(country_stakeholders)
                    link2 = ProjectStakeholder(
                        project_id=project.id,
                        stakeholder_id=partner.id,
                        role="Partner"
                    )
                    db.add(link2)
        
        db.commit()
        print("✅ Stakeholder-Project links established.")

        print("\n" + "=" * 50)
        print("🎉 POPULATION COMPLETE!")
        print(f"   Total Stakeholders: {db.query(Stakeholder).count()}")
        print(f"   Total Projects: {db.query(Project).count()}")
        print(f"   Countries Covered: {db.query(Project.country_id).distinct().count()}")
        print("=" * 50)

    except Exception as e:
        db.rollback()
        print(f"❌ Error: {e}")
        import traceback
        traceback.print_exc()
    finally:
        db.close()

if __name__ == "__main__":
    populate_realistic_data()
