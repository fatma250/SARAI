"""
Migration Script: Migrate Existing Data to New Schema
This script migrates data from old schema to new normalized schema
Run this AFTER running 001_create_new_schema.py
"""

import sys
import os
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from sqlalchemy import create_engine, text
from sqlalchemy.orm import sessionmaker
from app.database import DATABASE_URL
from app.models import *
import logging

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)


def migrate_countries(session):
    """Migrate and normalize country data"""
    logger.info("\n" + "-" * 80)
    logger.info("Migrating Countries")
    logger.info("-" * 80)
    
    try:
        # Check if countries table has old schema (column named 'country' instead of 'name')
        result = session.execute(text("SELECT column_name FROM information_schema.columns WHERE table_name = 'countries'"))
        columns = [row[0] for row in result.fetchall()]
        
        if 'country' in columns and 'name' not in columns:
            logger.info("Detected old country schema, migrating...")
            # Rename column
            session.execute(text("ALTER TABLE countries RENAME COLUMN country TO name"))
            session.commit()
            logger.info("✓ Renamed 'country' column to 'name'")
        
        # Add missing columns if they don't exist
        if 'code_alpha2' not in columns:
            session.execute(text("ALTER TABLE countries ADD COLUMN code_alpha2 VARCHAR(2)"))
            logger.info("✓ Added code_alpha2 column")
        
        if 'code_alpha3' not in columns:
            session.execute(text("ALTER TABLE countries ADD COLUMN code_alpha3 VARCHAR(3)"))
            logger.info("✓ Added code_alpha3 column")
        
        if 'flag_url' not in columns:
            session.execute(text("ALTER TABLE countries ADD COLUMN flag_url VARCHAR(500)"))
            logger.info("✓ Added flag_url column")
        
        if 'description' not in columns:
            session.execute(text("ALTER TABLE countries ADD COLUMN description TEXT"))
            logger.info("✓ Added description column")
        
        if 'created_at' not in columns:
            session.execute(text("ALTER TABLE countries ADD COLUMN created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP"))
            logger.info("✓ Added created_at column")
        
        if 'updated_at' not in columns:
            session.execute(text("ALTER TABLE countries ADD COLUMN updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP"))
            logger.info("✓ Added updated_at column")
        
        session.commit()
        
        count = session.query(Country).count()
        logger.info(f"✓ Countries migrated: {count} records")
        
    except Exception as e:
        logger.error(f"✗ Error migrating countries: {e}")
        session.rollback()
        raise


def migrate_stakeholders_to_organizations(session):
    """Migrate stakeholders to organizations table"""
    logger.info("\n" + "-" * 80)
    logger.info("Migrating Stakeholders to Organizations")
    logger.info("-" * 80)
    
    try:
        # Check if stakeholders table exists and has data
        result = session.execute(text("SELECT COUNT(*) FROM stakeholders"))
        stakeholder_count = result.scalar()
        
        if stakeholder_count == 0:
            logger.info("No stakeholders to migrate")
            return
        
        logger.info(f"Found {stakeholder_count} stakeholders to migrate")
        
        # Get all stakeholders
        stakeholders = session.execute(text("""
            SELECT id, name, type, category, country, website, description, contact_email, created_at, updated_at
            FROM stakeholders
        """)).fetchall()
        
        migrated = 0
        skipped = 0
        for stakeholder in stakeholders:
            # Skip invalid data (test data with "string" values)
            if stakeholder[1] == "string" or stakeholder[2] == "string":
                logger.info(f"  Skipping invalid stakeholder: ID {stakeholder[0]} (test data)")
                skipped += 1
                continue
            
            # Check if organization already exists
            existing = session.execute(text("""
                SELECT id FROM organizations WHERE name = :name
            """), {"name": stakeholder[1]}).first()
            
            if existing:
                logger.info(f"  Skipping '{stakeholder[1]}' (already exists)")
                continue
            
            # Find country_id
            country_id = None
            if stakeholder[4]:  # country name
                country = session.execute(text("""
                    SELECT id FROM countries WHERE name = :name
                """), {"name": stakeholder[4]}).first()
                if country:
                    country_id = country[0]
            
            # Insert into organizations
            session.execute(text("""
                INSERT INTO organizations (name, type, category, country_id, website, description, email, is_active, is_verified, created_at, updated_at)
                VALUES (:name, :type, :category, :country_id, :website, :description, :email, :is_active, :is_verified, :created_at, :updated_at)
            """), {
                "name": stakeholder[1],
                "type": stakeholder[2],
                "category": stakeholder[3],
                "country_id": country_id,
                "website": stakeholder[5],
                "description": stakeholder[6],
                "email": stakeholder[7],
                "is_active": 1,
                "is_verified": 1,
                "created_at": stakeholder[8],
                "updated_at": stakeholder[9],
            })
            migrated += 1
        
        session.commit()
        logger.info(f"✓ Migrated {migrated} stakeholders to organizations")
        if skipped > 0:
            logger.info(f"⚠ Skipped {skipped} invalid stakeholders")
        
    except Exception as e:
        logger.error(f"✗ Error migrating stakeholders: {e}")
        session.rollback()
        raise


def migrate_projects(session):
    """Migrate projects to new schema with proper foreign keys"""
    logger.info("\n" + "-" * 80)
    logger.info("Migrating Projects")
    logger.info("-" * 80)
    
    try:
        # Check current project schema
        result = session.execute(text("SELECT column_name FROM information_schema.columns WHERE table_name = 'projects'"))
        columns = [row[0] for row in result.fetchall()]
        
        logger.info(f"Current project columns: {', '.join(columns)}")
        
        # Add new columns if they don't exist
        new_columns = {
            'organization_id': 'INTEGER',
            'sector_id': 'INTEGER',
            'is_featured': 'INTEGER DEFAULT 0',
            'is_published': 'INTEGER DEFAULT 1',
            'views_count': 'INTEGER DEFAULT 0',
            'published_at': 'TIMESTAMP WITH TIME ZONE',
            'approved_at': 'TIMESTAMP WITH TIME ZONE',
            'start_date': 'TIMESTAMP WITH TIME ZONE',
            'end_date': 'TIMESTAMP WITH TIME ZONE',
        }
        
        for col_name, col_type in new_columns.items():
            if col_name not in columns:
                session.execute(text(f"ALTER TABLE projects ADD COLUMN {col_name} {col_type}"))
                logger.info(f"✓ Added {col_name} column")
        
        # Migrate country string to country_id if needed
        if 'country' in columns and 'country_id' not in columns:
            logger.info("Migrating country names to country_id...")
            session.execute(text("ALTER TABLE projects ADD COLUMN country_id INTEGER"))
            
            # Update country_id based on country name
            session.execute(text("""
                UPDATE projects p
                SET country_id = c.id
                FROM countries c
                WHERE p.country = c.name
            """))
            logger.info("✓ Migrated country to country_id")
        
        # Migrate sector string to sector_id if needed
        if 'sector' in columns and isinstance(columns, list):
            logger.info("Migrating sector names to sector_id...")
            
            # Get unique sectors from projects
            sectors = session.execute(text("SELECT DISTINCT sector FROM projects WHERE sector IS NOT NULL")).fetchall()
            
            for (sector_name,) in sectors:
                # Find or create sector
                sector = session.query(Sector).filter_by(name=sector_name).first()
                if not sector:
                    sector = Sector(name=sector_name)
                    session.add(sector)
                    session.flush()
                
                # Update projects
                session.execute(text("""
                    UPDATE projects SET sector_id = :sector_id WHERE sector = :sector_name
                """), {"sector_id": sector.id, "sector_name": sector_name})
            
            logger.info("✓ Migrated sector to sector_id")
        
        # Migrate organization string to organization_id if needed
        if 'organization' in columns:
            logger.info("Migrating organization names to organization_id...")
            
            # Get unique organizations from projects
            orgs = session.execute(text("SELECT DISTINCT organization FROM projects WHERE organization IS NOT NULL")).fetchall()
            
            for (org_name,) in orgs:
                # Find or create organization
                org = session.query(Organization).filter_by(name=org_name).first()
                if not org:
                    org = Organization(name=org_name, type="Company")  # Default type
                    session.add(org)
                    session.flush()
                
                # Update projects
                session.execute(text("""
                    UPDATE projects SET organization_id = :org_id WHERE organization = :org_name
                """), {"org_id": org.id, "org_name": org_name})
            
            logger.info("✓ Migrated organization to organization_id")
        
        session.commit()
        
        count = session.query(Project).count()
        logger.info(f"✓ Projects migrated: {count} records")
        
    except Exception as e:
        logger.error(f"✗ Error migrating projects: {e}")
        session.rollback()
        raise


def migrate_project_technologies(session):
    """Migrate technology strings to many-to-many relationships"""
    logger.info("\n" + "-" * 80)
    logger.info("Migrating Project Technologies")
    logger.info("-" * 80)
    
    try:
        # Check if old 'technology' column exists
        result = session.execute(text("SELECT column_name FROM information_schema.columns WHERE table_name = 'projects' AND column_name = 'technology'"))
        if not result.first():
            logger.info("No technology column to migrate")
            return
        
        # Get all projects with technologies
        projects = session.execute(text("""
            SELECT id, technology FROM projects WHERE technology IS NOT NULL
        """)).fetchall()
        
        migrated = 0
        for project_id, technology_name in projects:
            if not technology_name:
                continue
            
            # Find or create technology
            tech = session.query(AITechnology).filter_by(name=technology_name).first()
            if not tech:
                tech = AITechnology(name=technology_name, category="Other")
                session.add(tech)
                session.flush()
            
            # Check if relationship already exists
            existing = session.execute(text("""
                SELECT id FROM project_technologies WHERE project_id = :pid AND technology_id = :tid
            """), {"pid": project_id, "tid": tech.id}).first()
            
            if not existing:
                session.execute(text("""
                    INSERT INTO project_technologies (project_id, technology_id, created_at)
                    VALUES (:pid, :tid, CURRENT_TIMESTAMP)
                """), {"pid": project_id, "tid": tech.id})
                migrated += 1
        
        session.commit()
        logger.info(f"✓ Migrated {migrated} project-technology relationships")
        
    except Exception as e:
        logger.error(f"✗ Error migrating project technologies: {e}")
        session.rollback()
        raise


def migrate_project_sdgs(session):
    """Migrate SDG strings to many-to-many relationships"""
    logger.info("\n" + "-" * 80)
    logger.info("Migrating Project SDGs")
    logger.info("-" * 80)
    
    try:
        # Check if old 'sdg_alignment' column exists
        result = session.execute(text("SELECT column_name FROM information_schema.columns WHERE table_name = 'projects' AND column_name = 'sdg_alignment'"))
        if not result.first():
            logger.info("No sdg_alignment column to migrate")
            return
        
        # Get all projects with SDG alignments
        projects = session.execute(text("""
            SELECT id, sdg_alignment FROM projects WHERE sdg_alignment IS NOT NULL
        """)).fetchall()
        
        migrated = 0
        for project_id, sdg_text in projects:
            if not sdg_text:
                continue
            
            # Parse SDG numbers (e.g., "SDG 3", "3", "SDG 3, SDG 4")
            import re
            sdg_numbers = re.findall(r'\d+', sdg_text)
            
            for sdg_num_str in sdg_numbers:
                sdg_num = int(sdg_num_str)
                if sdg_num < 1 or sdg_num > 17:
                    continue
                
                # Find SDG
                sdg = session.query(SDG).filter_by(goal_number=sdg_num).first()
                if not sdg:
                    continue
                
                # Check if relationship already exists
                existing = session.execute(text("""
                    SELECT id FROM project_sdgs WHERE project_id = :pid AND sdg_id = :sid
                """), {"pid": project_id, "sid": sdg.id}).first()
                
                if not existing:
                    session.execute(text("""
                        INSERT INTO project_sdgs (project_id, sdg_id, created_at)
                        VALUES (:pid, :sid, CURRENT_TIMESTAMP)
                    """), {"pid": project_id, "sid": sdg.id})
                    migrated += 1
        
        session.commit()
        logger.info(f"✓ Migrated {migrated} project-SDG relationships")
        
    except Exception as e:
        logger.error(f"✗ Error migrating project SDGs: {e}")
        session.rollback()
        raise


def main():
    """Main data migration function"""
    try:
        logger.info("=" * 80)
        logger.info("SARAI Data Migration - Migrating Existing Data")
        logger.info("=" * 80)
        logger.info(f"\nConnecting to database: {DATABASE_URL}")
        
        engine = create_engine(DATABASE_URL)
        Session = sessionmaker(bind=engine)
        session = Session()
        
        # Test connection
        session.execute(text("SELECT 1"))
        logger.info("✓ Database connection successful")
        
        # Run migrations
        migrate_countries(session)
        migrate_stakeholders_to_organizations(session)
        migrate_projects(session)
        migrate_project_technologies(session)
        migrate_project_sdgs(session)
        
        logger.info("\n" + "=" * 80)
        logger.info("Data migration completed successfully!")
        logger.info("=" * 80)
        logger.info("\nNext steps:")
        logger.info("1. Verify migrated data")
        logger.info("2. Update API endpoints")
        logger.info("3. Test all functionality")
        logger.info("4. Remove old columns after verification")
        
        session.close()
        
    except Exception as e:
        logger.error(f"\n✗ Data migration failed: {e}")
        import traceback
        logger.error(traceback.format_exc())
        sys.exit(1)


if __name__ == "__main__":
    main()
