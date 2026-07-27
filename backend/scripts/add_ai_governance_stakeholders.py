"""
Adds stakeholder commitments from the "Arab AI Governance Initiative -
Stakeholder Commitments" tracking sheet as Stakeholder records.

The Stakeholder model has no fields for contact name / per-objective
support / notes, so that detail is folded into `description` as
structured free text. Safe to re-run: skips any (name, country) pair
that already exists.
"""
import sys, os
sys.path.insert(0, os.path.join(os.path.dirname(__file__), ".."))

from app.database import SessionLocal
from app.models.stakeholder import Stakeholder


def build_description(contact, objectives):
    lines = [f"Contact: {contact}"]
    for label, objective, support in objectives:
        if not objective or objective in ("None", "None specified"):
            continue
        line = f"{label}: {objective}"
        if support and support not in ("None", "None specified", "—", "-"):
            line += f" — Support: {support}"
        lines.append(line)
    return "\n".join(lines)


stakeholders_data = [
    {
        "name": "General Authority for Communications & IT",
        "type": "Government Agency",
        "country": "Libya",
        "description": build_description("Wasim Abokeriaat", [
            ("Objective 1 (AI Governance Framework)", "Integrated Arab framework for AI governance at state level", "Material, logistical, scientific, infrastructure"),
            ("Objective 2 (AI Adoption)", "Healthcare, cybersecurity, education, agriculture, climate, digital services, accessibility", None),
            ("Objective 3 (Capacity Building)", "Unified framework for capacity building and public awareness", "Material, scientific, infrastructure, logistical"),
            ("Objective 4 (Entrepreneurship)", "Startup enablement", "Logistical"),
            ("Objective 5 (International Partnerships)", "Regional/international cooperation", "Accommodation, travel allowances for conferences"),
        ]) + "\nNotes: Additional research capabilities may be needed",
    },
    {
        "name": "Ministry of Communications & IT (Syria)",
        "type": "Government Agency",
        "country": "Syria",
        "description": build_description("Anas Dahabi", [
            ("Objective 1 (AI Governance Framework)", "Integrated AI governance framework", "Training in ISO 42001 and NIST frameworks"),
            ("Objective 2 (AI Adoption)", "Digital services, healthcare, education", "Policy drafting and consultation"),
            ("Objective 3 (Capacity Building)", "Unified capacity building framework", "AI courses in quantum, agents, generative systems, data governance"),
            ("Objective 4 (Entrepreneurship)", "Startup evaluation", "Scientific committee participation"),
            ("Objective 5 (International Partnerships)", None, None),
        ]),
    },
    {
        "name": "UN-ESCWA",
        "type": "NGO",
        "country": None,
        "description": build_description("Ayman ElSherbiny", [
            ("Objective 1 (AI Governance Framework)", "Integrated governance framework", "Development, convening, consensus building"),
            ("Objective 2 (AI Adoption)", None, None),
            ("Objective 3 (Capacity Building)", "Unified capacity framework", "Development and deployment"),
            ("Objective 4 (Entrepreneurship)", None, None),
            ("Objective 5 (International Partnerships)", "International partnerships", "Development and capacity building"),
        ]) + "\nNotes: Per Tunisia meeting recommendations",
    },
    {
        "name": "Ministry of Communications & IT (Egypt)",
        "type": "Government Agency",
        "country": "Egypt",
        "description": build_description("Yumna Omran", [
            ("Objective 3 (Capacity Building)", "UNESCO-based AI ethics program for 21 hours quarterly training", "Online ToT training"),
        ]),
    },
    {
        "name": "International Center for AI Research & Ethics",
        "type": "Research Lab",
        "country": None,
        "description": build_description("Abdulrahman Habib", [
            ("Objective 1 (AI Governance Framework)", "Framework development and promotion", "Framework authoring and dissemination"),
            ("Objective 2 (AI Adoption)", "Healthcare, Arabic NLP, digital services, accessibility, climate, education, agriculture, cybersecurity", "Seminars and expert lectures"),
            ("Objective 3 (Capacity Building)", "Framework development support", "Framework authoring and promotion"),
            ("Objective 4 (Entrepreneurship)", "Competition design", "Program design and implementation"),
            ("Objective 5 (International Partnerships)", "International cooperation", None),
        ]),
    },
    {
        "name": "Arab Academy for Science & Technology",
        "type": "University",
        "country": None,
        "description": build_description("Dr. Mustafa Rashid", [
            ("Objective 1 (AI Governance Framework)", "Framework implementation support", "Expert provision and workshops"),
            ("Objective 2 (AI Adoption)", "Education, climate, accessibility, agriculture, healthcare, Arabic NLP", "Technical support and specialist training"),
            ("Objective 3 (Capacity Building)", "Capacity building coordination", "Training courses and workshops"),
            ("Objective 4 (Entrepreneurship)", "Startup competitions", "Hackathon collaboration"),
            ("Objective 5 (International Partnerships)", "Regional partnerships", "Hosting coordination meetings"),
        ]),
    },
]


def run():
    db = SessionLocal()
    try:
        added = 0
        for data in stakeholders_data:
            exists = db.query(Stakeholder).filter(
                Stakeholder.name == data["name"],
                Stakeholder.country == data["country"],
            ).first()
            if exists:
                print(f"Skip (already exists): {data['name']}")
                continue
            db.add(Stakeholder(**data))
            added += 1
            print(f"Added: {data['name']}")
        db.commit()
        print(f"\nDone. {added} new stakeholder(s) added.")
    except Exception as e:
        db.rollback()
        print(f"Error: {e}")
        raise
    finally:
        db.close()


if __name__ == "__main__":
    run()
