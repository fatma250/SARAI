import sys, os
sys.path.insert(0, os.path.join(os.path.dirname(__file__), ".."))

"""
Script pour forcer la création/mise à jour d'un compte admin fonctionnel.
Définit is_email_verified=1 et is_admin_approved=1.
"""
from app.database import SessionLocal, engine, Base
from app.models.user import User
from passlib.context import CryptContext

pwd_context = CryptContext(schemes=["pbkdf2_sha256"], deprecated="auto")

def fix_admin():
    Base.metadata.create_all(bind=engine)
    db = SessionLocal()

    admin_email = "admin@aicto.org"
    password = "Admin@123"
    
    admin = db.query(User).filter(User.email == admin_email).first()
    
    if admin:
        print(f"Updating existing user {admin_email}...")
        admin.role = "admin"
        admin.password_hash = pwd_context.hash(password)
        admin.is_active = 1
        admin.is_email_verified = 1
        admin.is_admin_approved = 1
        db.commit()
        print("Admin user updated successfully.")
    else:
        print(f"Creating new admin user {admin_email}...")
        admin = User(
            organization_name="AICTO Admin",
            organization_type="Government",
            email=admin_email,
            password_hash=pwd_context.hash(password),
            role="admin",
            is_active=1,
            is_email_verified=1,
            is_admin_approved=1
        )
        db.add(admin)
        db.commit()
        print("Admin user created successfully.")
    
    print(f"\nVous pouvez maintenant vous connecter avec :")
    print(f"  Email : {admin_email}")
    print(f"  Password : {password}")
    db.close()

if __name__ == "__main__":
    fix_admin()
