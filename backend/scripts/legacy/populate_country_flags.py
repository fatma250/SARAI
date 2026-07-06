"""
Script to populate flag_url in the PostgreSQL countries table
"""
from app.database import engine
from sqlalchemy import text
import logging

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Map country names to flagcdn URLs
FLAGS = {
    'Algeria': 'https://flagcdn.com/dz.svg',
    'Bahrain': 'https://flagcdn.com/bh.svg',
    'Comoros': 'https://flagcdn.com/km.svg',
    'Djibouti': 'https://flagcdn.com/dj.svg',
    'Egypt': 'https://flagcdn.com/eg.svg',
    'Iraq': 'https://flagcdn.com/iq.svg',
    'Jordan': 'https://flagcdn.com/jo.svg',
    'Kuwait': 'https://flagcdn.com/kw.svg',
    'Lebanon': 'https://flagcdn.com/lb.svg',
    'Libya': 'https://flagcdn.com/ly.svg',
    'Mauritania': 'https://flagcdn.com/mr.svg',
    'Morocco': 'https://flagcdn.com/ma.svg',
    'Oman': 'https://flagcdn.com/om.svg',
    'Palestine': 'https://flagcdn.com/ps.svg',
    'Qatar': 'https://flagcdn.com/qa.svg',
    'Saudi Arabia': 'https://flagcdn.com/sa.svg',
    'Somalia': 'https://flagcdn.com/so.svg',
    'Sudan': 'https://flagcdn.com/sd.svg',
    'Syria': 'https://flagcdn.com/sy.svg',
    'Tunisia': 'https://flagcdn.com/tn.svg',
    'United Arab Emirates': 'https://flagcdn.com/ae.svg',
    'UAE': 'https://flagcdn.com/ae.svg',
    'Yemen': 'https://flagcdn.com/ye.svg'
}

def populate_flags():
    with engine.connect() as conn:
        logger.info("Updating country flags in database...")
        
        for country_name, flag_url in FLAGS.items():
            result = conn.execute(text("""
                UPDATE countries 
                SET flag_url = :flag_url 
                WHERE name = :name
            """), {"flag_url": flag_url, "name": country_name})
            
            if result.rowcount > 0:
                logger.info(f"✓ Updated flag for {country_name}")
            else:
                # Try partial match or case insensitive if needed
                logger.warning(f"✗ Could not find country {country_name} in database")
        
        conn.commit()
        logger.info("Flag population complete.")

if __name__ == "__main__":
    populate_flags()
