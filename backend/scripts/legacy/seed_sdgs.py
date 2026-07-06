import sys
import os

# Add the backend directory to sys.path
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from sqlalchemy.orm import Session
from app.database import SessionLocal, engine, Base
from app.models.sdg import SDG

# Reliable UN SDG Icon URLs from Open SDG (standard developer source)
SDG_METADATA = [
    { "goal_number": 1, "name": "No Poverty", "color_code": "#E5243B", "description": "End poverty in all its forms everywhere.", "icon_url": "https://open-sdg.github.io/sdg-translations/assets/img/goals/en/1.png" },
    { "goal_number": 2, "name": "Zero Hunger", "color_code": "#DDA63A", "description": "End hunger, achieve food security and improved nutrition.", "icon_url": "https://open-sdg.github.io/sdg-translations/assets/img/goals/en/2.png" },
    { "goal_number": 3, "name": "Good Health", "color_code": "#4C9F38", "description": "Ensure healthy lives and promote well-being for all.", "icon_url": "https://open-sdg.github.io/sdg-translations/assets/img/goals/en/3.png" },
    { "goal_number": 4, "name": "Quality Education", "color_code": "#C5192D", "description": "Ensure inclusive and equitable quality education.", "icon_url": "https://open-sdg.github.io/sdg-translations/assets/img/goals/en/4.png" },
    { "goal_number": 5, "name": "Gender Equality", "color_code": "#FF3A21", "description": "Achieve gender equality and empower all women and girls.", "icon_url": "https://open-sdg.github.io/sdg-translations/assets/img/goals/en/5.png" },
    { "goal_number": 6, "name": "Clean Water", "color_code": "#26BDE2", "description": "Ensure availability and sustainable management of water.", "icon_url": "https://open-sdg.github.io/sdg-translations/assets/img/goals/en/6.png" },
    { "goal_number": 7, "name": "Clean Energy", "color_code": "#FCC30B", "description": "Ensure access to affordable, reliable, sustainable energy.", "icon_url": "https://open-sdg.github.io/sdg-translations/assets/img/goals/en/7.png" },
    { "goal_number": 8, "name": "Decent Work", "color_code": "#A21942", "description": "Promote inclusive and sustainable economic growth.", "icon_url": "https://open-sdg.github.io/sdg-translations/assets/img/goals/en/8.png" },
    { "goal_number": 9, "name": "Industry & Innovation", "color_code": "#FD6925", "description": "Build resilient infrastructure and foster innovation.", "icon_url": "https://open-sdg.github.io/sdg-translations/assets/img/goals/en/9.png" },
    { "goal_number": 10, "name": "Reduced Inequality", "color_code": "#DD1367", "description": "Reduce inequality within and among countries.", "icon_url": "https://open-sdg.github.io/sdg-translations/assets/img/goals/en/10.png" },
    { "goal_number": 11, "name": "Sustainable Cities", "color_code": "#FD9D24", "description": "Make cities and human settlements inclusive and safe.", "icon_url": "https://open-sdg.github.io/sdg-translations/assets/img/goals/en/11.png" },
    { "goal_number": 12, "name": "Responsible Consumption", "color_code": "#BF8B2E", "description": "Ensure sustainable consumption and production patterns.", "icon_url": "https://open-sdg.github.io/sdg-translations/assets/img/goals/en/12.png" },
    { "goal_number": 13, "name": "Climate Action", "color_code": "#3F7E44", "description": "Take urgent action to combat climate change.", "icon_url": "https://open-sdg.github.io/sdg-translations/assets/img/goals/en/13.png" },
    { "goal_number": 14, "name": "Life Below Water", "color_code": "#0A97D9", "description": "Conserve and sustainably use the oceans and seas.", "icon_url": "https://open-sdg.github.io/sdg-translations/assets/img/goals/en/14.png" },
    { "goal_number": 15, "name": "Life on Land", "color_code": "#56C02B", "description": "Protect, restore and promote terrestrial ecosystems.", "icon_url": "https://open-sdg.github.io/sdg-translations/assets/img/goals/en/15.png" },
    { "goal_number": 16, "name": "Peace & Justice", "color_code": "#00689D", "description": "Promote peaceful and inclusive societies for development.", "icon_url": "https://open-sdg.github.io/sdg-translations/assets/img/goals/en/16.png" },
    { "goal_number": 17, "name": "Partnerships", "color_code": "#19486A", "description": "Strengthen the means of implementation for the Goals.", "icon_url": "https://open-sdg.github.io/sdg-translations/assets/img/goals/en/17.png" }
]

def seed_sdgs():
    db = SessionLocal()
    try:
        print("Updating SDGs with high-reliability GitHub image URLs...")
        for meta in SDG_METADATA:
            sdg = db.query(SDG).filter(SDG.goal_number == meta["goal_number"]).first()
            if not sdg:
                sdg = SDG(**meta)
                db.add(sdg)
                print(f"Added SDG {meta['goal_number']}: {meta['name']}")
            else:
                # Update existing with new URLs
                sdg.icon_url = meta["icon_url"]
                sdg.color_code = meta["color_code"]
                sdg.name = meta["name"]
                sdg.description = meta["description"]
                print(f"Updated SDG {meta['goal_number']} URL to: {meta['icon_url']}")
        db.commit()
        print("SDG Update complete.")
    except Exception as e:
        print(f"Error updating SDGs: {e}")
        db.rollback()
    finally:
        db.close()

if __name__ == "__main__":
    seed_sdgs()
