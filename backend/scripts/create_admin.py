import sys, os
sys.path.insert(0, os.path.join(os.path.dirname(__file__), ".."))

"""
Script pour créer un utilisateur admin dans la base de données.
Exécuter: python create_admin.py
"""
from app.database import SessionLocal, engine, Base
from app.models.user import User
from passlib.context import CryptContext

pwd_context = CryptContext(schemes=["pbkdf2_sha256"], deprecated="auto")

def create_admin():
    Base.metadata.create_all(bind=engine)
    db = SessionLocal()

    admin_email = "admin@aicto.org"
    existing = db.query(User).filter(User.email == admin_email).first()
    if existing:
        if existing.role == "admin":
            print("Admin user already exists.")
            db.close()
            return
        existing.role = "admin"
        existing.password_hash = pwd_context.hash("Admin@123")
        db.commit()
        print("Existing user updated to admin.")
    else:
        admin = User(
            organization_name="AICTO Admin",
            organization_type="Government",
            email=admin_email,
            password_hash=pwd_context.hash("Admin@123"),
            role="admin"
        )
        db.add(admin)
        db.commit()
        print("Admin user created successfully.")
    
    print(f"\nLogin credentials:")
    print(f"  Email: {admin_email}")
    print(f"  Password: Admin@123")
    db.close()

if __name__ == "__main__":
    create_admin()
