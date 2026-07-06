from sqlalchemy import create_engine, text
from sqlalchemy.orm import sessionmaker
from app.database import Base
from app.models.country import Country
from urllib.parse import quote_plus
import os

password = os.getenv("DB_PASSWORD", "0000")
db_name = os.getenv("DB_NAME", "SARAI_DB")
db_user = os.getenv("DB_USER", "postgres")
db_host = os.getenv("DB_HOST", "localhost")
db_port = os.getenv("DB_PORT", "5432")

DATABASE_URL = f"postgresql+psycopg://{db_user}:{quote_plus(password)}@{db_host}:{db_port}/{db_name}"

def get_flag_url(code: str) -> str:
    return f"https://flagcdn.com/w320/{code.lower()}.png"

def seed_countries():
    try:
        engine = create_engine(DATABASE_URL)
        print(f"Connecting to database {db_name}...")
        
        Session = sessionmaker(bind=engine)
        session = Session()

        # Delete existing countries to avoid conflicts
        session.query(Country).delete()
        session.commit()

        countries_data = [
            {"id": 1, "name": "Algeria", "latitude": 36.7539, "longitude": 3.0588, "region": "Maghreb", "code_alpha2": "DZ", "flag_url": get_flag_url("dz")},
            {"id": 2, "name": "Bahrain", "latitude": 26.0667, "longitude": 50.5580, "region": "Gulf", "code_alpha2": "BH", "flag_url": get_flag_url("bh")},
            {"id": 3, "name": "Comoros", "latitude": -11.6455, "longitude": 43.3333, "region": "East Africa", "code_alpha2": "KM", "flag_url": get_flag_url("km")},
            {"id": 4, "name": "Djibouti", "latitude": 11.8251, "longitude": 42.5903, "region": "East Africa", "code_alpha2": "DJ", "flag_url": get_flag_url("dj")},
            {"id": 5, "name": "Egypt", "latitude": 30.0444, "longitude": 31.2357, "region": "MENA", "code_alpha2": "EG", "flag_url": get_flag_url("eg")},
            {"id": 6, "name": "Iraq", "latitude": 33.3152, "longitude": 44.3661, "region": "Levant", "code_alpha2": "IQ", "flag_url": get_flag_url("iq")},
            {"id": 7, "name": "Jordan", "latitude": 31.9454, "longitude": 35.9284, "region": "Levant", "code_alpha2": "JO", "flag_url": get_flag_url("jo")},
            {"id": 8, "name": "Kuwait", "latitude": 29.3759, "longitude": 47.9774, "region": "Gulf", "code_alpha2": "KW", "flag_url": get_flag_url("kw")},
            {"id": 9, "name": "Lebanon", "latitude": 33.8938, "longitude": 35.5018, "region": "Levant", "code_alpha2": "LB", "flag_url": get_flag_url("lb")},
            {"id": 10, "name": "Libya", "latitude": 32.8872, "longitude": 13.1913, "region": "Maghreb", "code_alpha2": "LY", "flag_url": get_flag_url("ly")},
            {"id": 11, "name": "Mauritania", "latitude": 18.0735, "longitude": -15.9582, "region": "Maghreb", "code_alpha2": "MR", "flag_url": get_flag_url("mr")},
            {"id": 12, "name": "Morocco", "latitude": 34.0209, "longitude": -6.8416, "region": "Maghreb", "code_alpha2": "MA", "flag_url": get_flag_url("ma")},
            {"id": 13, "name": "Oman", "latitude": 23.5859, "longitude": 58.4059, "region": "Gulf", "code_alpha2": "OM", "flag_url": get_flag_url("om")},
            {"id": 14, "name": "Palestine", "latitude": 31.898, "longitude": 35.204, "region": "Levant", "code_alpha2": "PS", "flag_url": get_flag_url("ps")},
            {"id": 15, "name": "Qatar", "latitude": 25.2854, "longitude": 51.5310, "region": "Gulf", "code_alpha2": "QA", "flag_url": get_flag_url("qa")},
            {"id": 16, "name": "Saudi Arabia", "latitude": 24.7136, "longitude": 46.6753, "region": "Gulf", "code_alpha2": "SA", "flag_url": get_flag_url("sa")},
            {"id": 17, "name": "Somalia", "latitude": 2.0469, "longitude": 45.3182, "region": "East Africa", "code_alpha2": "SO", "flag_url": get_flag_url("so")},
            {"id": 18, "name": "Sudan", "latitude": 15.5007, "longitude": 32.5599, "region": "East Africa", "code_alpha2": "SD", "flag_url": get_flag_url("sd")},
            {"id": 19, "name": "Syria", "latitude": 33.5138, "longitude": 36.2765, "region": "Levant", "code_alpha2": "SY", "flag_url": get_flag_url("sy")},
            {"id": 20, "name": "Tunisia", "latitude": 36.8065, "longitude": 10.1815, "region": "Maghreb", "code_alpha2": "TN", "flag_url": get_flag_url("tn")},
            {"id": 21, "name": "United Arab Emirates", "latitude": 24.4539, "longitude": 54.3773, "region": "Gulf", "code_alpha2": "AE", "flag_url": get_flag_url("ae")},
            {"id": 22, "name": "Yemen", "latitude": 15.3694, "longitude": 44.1910, "region": "Arabian Peninsula", "code_alpha2": "YE", "flag_url": get_flag_url("ye")},
        ]

        for data in countries_data:
            country = Country(**data)
            session.add(country)
            
        session.commit()
        print(f"Successfully inserted {len(countries_data)} Arab countries!")

        session.close()
        print("Done!")

    except Exception as e:
        print(f"Error: {e}")

if __name__ == "__main__":
    seed_countries()
