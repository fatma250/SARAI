from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session, joinedload
from typing import List, Optional
import logging
from app.database import get_db
from app.models.stakeholder import Stakeholder
from app.models.country import Country
from app.schemas.stakeholder import StakeholderCreate, StakeholderUpdate, StakeholderResponse

logger = logging.getLogger(__name__)

router = APIRouter()

@router.get("/debug/raw")
def debug_raw_stakeholders(db: Session = Depends(get_db)):
    """Debug endpoint: returns raw stakeholder data bypassing Pydantic."""
    count = db.query(Stakeholder).count()
    sample = db.query(Stakeholder).limit(3).all()
    return {
        "total_count": count,
        "sample": [s.to_dict() for s in sample]
    }

@router.get("/", response_model=List[StakeholderResponse])
def get_all_stakeholders(
    country: Optional[str] = None,
    skip: int = 0,
    limit: int = 1000,
    db: Session = Depends(get_db)
):
    try:
        query = db.query(Stakeholder).options(
            joinedload(Stakeholder.country_rel)
        )

        if country:
            # First try filtering by the country string column
            # If that fails or we want to be thorough, we can join and filter by country name
            query = query.join(Stakeholder.country_rel).filter(Country.name == country)

        results = query.offset(skip).limit(limit).all()
        
        # Ensure the 'country' field is populated for the frontend grouping logic
        for s in results:
            if not s.country and s.country_rel:
                s.country = s.country_rel.name
                
        logger.info(f"GET /stakeholders returned {len(results)} stakeholders")
        return results
    except Exception as e:
        logger.error(f"Error fetching stakeholders: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/{id}", response_model=StakeholderResponse)
def get_stakeholder(id: int, db: Session = Depends(get_db)):
    stakeholder = db.query(Stakeholder).filter(Stakeholder.id == id).first()
    if not stakeholder:
        raise HTTPException(status_code=404, detail="Stakeholder not found")
    return stakeholder

@router.post("/", response_model=StakeholderResponse)
def create_stakeholder(stakeholder: StakeholderCreate, db: Session = Depends(get_db)):
    db_stakeholder = Stakeholder(**stakeholder.model_dump())
    db.add(db_stakeholder)
    db.commit()
    db.refresh(db_stakeholder)
    return db_stakeholder

@router.put("/{id}", response_model=StakeholderResponse)
def update_stakeholder(id: int, stakeholder: StakeholderUpdate, db: Session = Depends(get_db)):
    db_stakeholder = db.query(Stakeholder).filter(Stakeholder.id == id).first()
    if not db_stakeholder:
        raise HTTPException(status_code=404, detail="Stakeholder not found")
    
    update_data = stakeholder.model_dump(exclude_unset=True)
    for field, value in update_data.items():
        setattr(db_stakeholder, field, value)
    
    db.commit()
    db.refresh(db_stakeholder)
    return db_stakeholder

@router.delete("/{id}")
def delete_stakeholder(id: int, db: Session = Depends(get_db)):
    db_stakeholder = db.query(Stakeholder).filter(Stakeholder.id == id).first()
    if not db_stakeholder:
        raise HTTPException(status_code=404, detail="Stakeholder not found")
    
    db.delete(db_stakeholder)
    db.commit()
    return {"message": "Stakeholder deleted successfully"}

@router.get("/{id}/projects")
def get_stakeholder_projects(id: int, db: Session = Depends(get_db)):
    stakeholder = db.query(Stakeholder).filter(Stakeholder.id == id).first()
    if not stakeholder:
        raise HTTPException(status_code=404, detail="Stakeholder not found")
    
    results = []
    for assoc in stakeholder.project_associations:
        project_dict = assoc.project.to_dict()
        project_dict["collaboration_role"] = assoc.role
        results.append(project_dict)
    
    return results
