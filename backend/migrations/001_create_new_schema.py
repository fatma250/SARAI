"""
Migration Script: Create New SARAI Database Schema
This script creates all new tables and relationships for the refactored SARAI platform
Run this AFTER backing up your existing database
"""

import sys
import os
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from sqlalchemy import create_engine, text, inspect
from app.database import DATABASE_URL, Base
from app.models import *  # Import all models
import logging

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)


def check_table_exists(engine, table_name):
    """Check if a table exists in the database"""
    inspector = inspect(engine)
    return table_name in inspector.get_table_names()


def create_new_tables(engine):
    """Create all new tables defined in models"""
    logger.info("=" * 80)
    logger.info("SARAI Database Migration - Creating New Schema")
    logger.info("=" * 80)
    
    # Get list of tables that will be created
    tables_to_create = []
    for table_name, table in Base.metadata.tables.items():
        if not check_table_exists(engine, table_name):
            tables_to_create.append(table_name)
    
    if tables_to_create:
        logger.info(f"\nTables to be created ({len(tables_to_create)}):")
        for table_name in sorted(tables_to_create):
            logger.info(f"  - {table_name}")
        
        # Create all tables
        logger.info("\nCreating tables...")
        Base.metadata.create_all(bind=engine)
        logger.info("✓ All new tables created successfully")
    else:
        logger.info("\n✓ All tables already exist")
    
    # List existing tables
    inspector = inspect(engine)
    existing_tables = inspector.get_table_names()
    logger.info(f"\nTotal tables in database: {len(existing_tables)}")
    for table_name in sorted(existing_tables):
        logger.info(f"  - {table_name}")


def seed_reference_data(engine):
    """Seed reference data for sectors, SDGs, and AI technologies"""
    from sqlalchemy.orm import sessionmaker
    
    Session = sessionmaker(bind=engine)
    session = Session()
    
    try:
        logger.info("\n" + "=" * 80)
        logger.info("Seeding Reference Data")
        logger.info("=" * 80)
        
        # Seed Sectors
        logger.info("\nSeeding sectors...")
        sectors_data = [
            {"name": "Healthcare", "description": "AI applications in healthcare and medical services"},
            {"name": "Education", "description": "AI in education, e-learning, and training"},
            {"name": "Finance", "description": "FinTech and AI in financial services"},
            {"name": "Agriculture", "description": "Smart farming and agricultural AI"},
            {"name": "Transportation", "description": "Autonomous vehicles and smart transportation"},
            {"name": "Energy", "description": "Smart grids and energy optimization"},
            {"name": "Government", "description": "E-government and public services"},
            {"name": "Security", "description": "Cybersecurity and public safety"},
            {"name": "Retail", "description": "E-commerce and retail AI"},
            {"name": "Manufacturing", "description": "Industry 4.0 and smart manufacturing"},
            {"name": "Environment", "description": "Climate change and environmental monitoring"},
            {"name": "Media", "description": "Content creation and media AI"},
            {"name": "Telecommunications", "description": "Network optimization and telecom AI"},
            {"name": "Tourism", "description": "Smart tourism and hospitality"},
            {"name": "Entrepreneuriat", "description": "Entrepreneurship, startups and innovation ecosystems"},
            {"name": "Other", "description": "Other sectors"},
        ]
        
        for sector_data in sectors_data:
            existing = session.query(Sector).filter_by(name=sector_data["name"]).first()
            if not existing:
                sector = Sector(**sector_data)
                session.add(sector)
        session.commit()
        logger.info(f"✓ Seeded {len(sectors_data)} sectors")
        
        # Seed SDGs
        logger.info("\nSeeding UN Sustainable Development Goals...")
        sdgs_data = [
            {"goal_number": 1, "name": "No Poverty", "color_code": "#E5243B"},
            {"goal_number": 2, "name": "Zero Hunger", "color_code": "#DDA63A"},
            {"goal_number": 3, "name": "Good Health and Well-being", "color_code": "#4C9F38"},
            {"goal_number": 4, "name": "Quality Education", "color_code": "#C5192D"},
            {"goal_number": 5, "name": "Gender Equality", "color_code": "#FF3A21"},
            {"goal_number": 6, "name": "Clean Water and Sanitation", "color_code": "#26BDE2"},
            {"goal_number": 7, "name": "Affordable and Clean Energy", "color_code": "#FCC30B"},
            {"goal_number": 8, "name": "Decent Work and Economic Growth", "color_code": "#A21942"},
            {"goal_number": 9, "name": "Industry, Innovation and Infrastructure", "color_code": "#FD6925"},
            {"goal_number": 10, "name": "Reduced Inequalities", "color_code": "#DD1367"},
            {"goal_number": 11, "name": "Sustainable Cities and Communities", "color_code": "#FD9D24"},
            {"goal_number": 12, "name": "Responsible Consumption and Production", "color_code": "#BF8B2E"},
            {"goal_number": 13, "name": "Climate Action", "color_code": "#3F7E44"},
            {"goal_number": 14, "name": "Life Below Water", "color_code": "#0A97D9"},
            {"goal_number": 15, "name": "Life on Land", "color_code": "#56C02B"},
            {"goal_number": 16, "name": "Peace, Justice and Strong Institutions", "color_code": "#00689D"},
            {"goal_number": 17, "name": "Partnerships for the Goals", "color_code": "#19486A"},
        ]
        
        for sdg_data in sdgs_data:
            existing = session.query(SDG).filter_by(goal_number=sdg_data["goal_number"]).first()
            if not existing:
                sdg = SDG(**sdg_data)
                session.add(sdg)
        session.commit()
        logger.info(f"✓ Seeded {len(sdgs_data)} SDGs")
        
        # Seed AI Technologies
        logger.info("\nSeeding AI Technologies...")
        technologies_data = [
            {"name": "Machine Learning", "category": "ML", "description": "General machine learning algorithms and models"},
            {"name": "Deep Learning", "category": "DL", "description": "Neural networks and deep learning"},
            {"name": "Natural Language Processing", "category": "NLP", "description": "Text analysis and language understanding"},
            {"name": "Computer Vision", "category": "CV", "description": "Image and video analysis"},
            {"name": "Robotics", "category": "Robotics", "description": "Autonomous robots and automation"},
            {"name": "Speech Recognition", "category": "NLP", "description": "Voice and speech processing"},
            {"name": "Recommendation Systems", "category": "ML", "description": "Personalization and recommendations"},
            {"name": "Predictive Analytics", "category": "ML", "description": "Forecasting and prediction"},
            {"name": "Reinforcement Learning", "category": "ML", "description": "Learning through interaction"},
            {"name": "Generative AI", "category": "DL", "description": "Content generation (text, images, etc.)"},
            {"name": "Expert Systems", "category": "AI", "description": "Rule-based AI systems"},
            {"name": "Knowledge Graphs", "category": "AI", "description": "Semantic networks and ontologies"},
            {"name": "Edge AI", "category": "AI", "description": "AI on edge devices"},
            {"name": "Explainable AI", "category": "AI", "description": "Interpretable AI models"},
            {"name": "Other", "category": "Other", "description": "Other AI technologies"},
        ]
        
        for tech_data in technologies_data:
            existing = session.query(AITechnology).filter_by(name=tech_data["name"]).first()
            if not existing:
                tech = AITechnology(**tech_data)
                session.add(tech)
        session.commit()
        logger.info(f"✓ Seeded {len(technologies_data)} AI technologies")
        
        logger.info("\n✓ Reference data seeding completed successfully")
        
    except Exception as e:
        logger.error(f"✗ Error seeding reference data: {e}")
        session.rollback()
        raise
    finally:
        session.close()


def main():
    """Main migration function"""
    try:
        logger.info(f"\nConnecting to database: {DATABASE_URL}")
        engine = create_engine(DATABASE_URL)
        
        # Test connection
        with engine.connect() as conn:
            conn.execute(text("SELECT 1"))
        logger.info("✓ Database connection successful")
        
        # Create new tables
        create_new_tables(engine)
        
        # Seed reference data
        seed_reference_data(engine)
        
        logger.info("\n" + "=" * 80)
        logger.info("Migration completed successfully!")
        logger.info("=" * 80)
        logger.info("\nNext steps:")
        logger.info("1. Run data migration script to migrate existing data")
        logger.info("2. Update API endpoints to use new schema")
        logger.info("3. Test all functionality")
        logger.info("4. Update frontend to match new API")
        
    except Exception as e:
        logger.error(f"\n✗ Migration failed: {e}")
        import traceback
        logger.error(traceback.format_exc())
        sys.exit(1)


if __name__ == "__main__":
    main()
