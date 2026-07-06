from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from sqlalchemy import func
from app.database import get_db
from app.models.sdg import SDG as SDGModel
from app.models.project import Project as ProjectModel
from app.models.country import Country as CountryModel
from app.schemas import sdg as sdg_schema
from typing import List
import re

router = APIRouter()

EXCLUDED_STATUSES = ['pending', 'rejected']

@router.get("/", response_model=List[sdg_schema.SDG])
def get_sdgs(db: Session = Depends(get_db)):
    return db.query(SDGModel).order_by(SDGModel.goal_number).all()


@router.get("/dashboard")
def get_sdg_dashboard(db: Session = Depends(get_db)):
    """
    Single endpoint returning SDG metadata + per-SDG stats + global stats.
    Uses two bulk queries instead of N+1 to avoid per-project DB round-trips.
    """
    from app.models.project_stakeholder import ProjectStakeholder
    from app.models.stakeholder import Stakeholder as StakeholderModel

    # ── 1. All active projects with SDG alignment ──────────────────────────
    projects = (
        db.query(
            ProjectModel.id,
            ProjectModel.sdg_alignment,
            ProjectModel.country_id,
            ProjectModel.sector,
            CountryModel.name.label("country_name"),
        )
        .outerjoin(CountryModel, CountryModel.id == ProjectModel.country_id)
        .filter(
            ProjectModel.sdg_alignment.isnot(None),
            ProjectModel.status.notin_(EXCLUDED_STATUSES),
        )
        .all()
    )

    # ── 2. All stakeholder links for those projects (one query) ───────────
    project_ids = [p.id for p in projects]
    stakeholder_links = []
    if project_ids:
        stakeholder_links = (
            db.query(
                ProjectStakeholder.project_id,
                ProjectStakeholder.stakeholder_id,
            )
            .filter(ProjectStakeholder.project_id.in_(project_ids))
            .all()
        )

    # Build project_id → set(stakeholder_ids) map
    project_stakeholders: dict[int, set] = {}
    for proj_id, stkh_id in stakeholder_links:
        project_stakeholders.setdefault(proj_id, set()).add(stkh_id)

    # ── 3. Aggregate per SDG ──────────────────────────────────────────────
    sdg_projects:     dict[int, set] = {i: set() for i in range(1, 18)}
    sdg_stakeholders: dict[int, set] = {i: set() for i in range(1, 18)}
    sdg_countries:    dict[int, set] = {i: set() for i in range(1, 18)}
    sdg_country_names: dict[int, set] = {i: set() for i in range(1, 18)}
    sdg_sectors:      dict[int, dict] = {i: {} for i in range(1, 18)}

    global_projects:     set = set()
    global_stakeholders: set = set()
    global_countries:    set = set()
    global_covered:      set = set()

    for p in projects:
        if not p.sdg_alignment:
            continue
        numbers = re.findall(r'SDG\s*(\d+)', p.sdg_alignment)
        if not numbers:
            continue

        stkh_ids = project_stakeholders.get(p.id, set())

        global_projects.add(p.id)
        global_stakeholders.update(stkh_ids)
        if p.country_id:
            global_countries.add(p.country_id)

        for num_str in numbers:
            num = int(num_str)
            if num < 1 or num > 17:
                continue
            global_covered.add(num)
            sdg_projects[num].add(p.id)
            sdg_stakeholders[num].update(stkh_ids)
            if p.country_id:
                sdg_countries[num].add(p.country_id)
            if p.country_name:
                sdg_country_names[num].add(p.country_name)
            if p.sector:
                sdg_sectors[num][p.sector] = sdg_sectors[num].get(p.sector, 0) + 1

    # ── 4. SDG metadata from DB ───────────────────────────────────────────
    sdg_rows = db.query(SDGModel).order_by(SDGModel.goal_number).all()

    sdgs_out = []
    for sdg in sdg_rows:
        n = sdg.goal_number
        top_sector = None
        if sdg_sectors[n]:
            top_sector = max(sdg_sectors[n], key=sdg_sectors[n].get)
        sdgs_out.append({
            "id": sdg.id,
            "goal_number": n,
            "name": sdg.name,
            "description": sdg.description,
            "icon_url": sdg.icon_url,
            "color_code": sdg.color_code,
            "project_count": len(sdg_projects[n]),
            "stakeholder_count": len(sdg_stakeholders[n]),
            "countries_count": len(sdg_countries[n]),
            "country_names": sorted(sdg_country_names[n]),
            "top_sector": top_sector,
        })

    # ── 5. Global stats (real totals, no double-counting) ─────────────────
    total_stakeholders = db.query(func.count(StakeholderModel.id)).scalar() or 0

    return {
        "sdgs": sdgs_out,
        "global": {
            "covered_sdgs": len(global_covered),
            "total_projects": len(global_projects),
            "total_stakeholders": total_stakeholders,
            "total_countries": len(global_countries),
        },
    }


@router.get("/stats", response_model=List[sdg_schema.SDGStats])
def get_sdg_stats(db: Session = Depends(get_db)):
    from app.models.project_stakeholder import ProjectStakeholder

    stats = {
        i: {"goal_number": i, "project_count": 0, "stakeholder_count": 0, "countries_count": 0, "top_sector": None}
        for i in range(1, 18)
    }
    sdg_stakeholders = {i: set() for i in range(1, 18)}
    sdg_countries   = {i: set() for i in range(1, 18)}
    sdg_sectors     = {i: {} for i in range(1, 18)}

    projects = (
        db.query(ProjectModel.id, ProjectModel.sdg_alignment, ProjectModel.country_id, ProjectModel.sector)
        .filter(ProjectModel.sdg_alignment.isnot(None), ProjectModel.status.notin_(EXCLUDED_STATUSES))
        .all()
    )
    project_ids = [p.id for p in projects]

    # Single bulk query for all stakeholder links
    links = (
        db.query(ProjectStakeholder.project_id, ProjectStakeholder.stakeholder_id)
        .filter(ProjectStakeholder.project_id.in_(project_ids))
        .all()
    ) if project_ids else []

    proj_stkh: dict[int, set] = {}
    for proj_id, stkh_id in links:
        proj_stkh.setdefault(proj_id, set()).add(stkh_id)

    for p_id, alignment, country_id, sector in projects:
        if not alignment:
            continue
        numbers = re.findall(r'SDG\s*(\d+)', alignment)
        stkh_ids = proj_stkh.get(p_id, set())
        for num_str in numbers:
            num = int(num_str)
            if num not in stats:
                continue
            stats[num]["project_count"] += 1
            sdg_stakeholders[num].update(stkh_ids)
            if country_id:
                sdg_countries[num].add(country_id)
            if sector:
                sdg_sectors[num][sector] = sdg_sectors[num].get(sector, 0) + 1

    for num in stats:
        stats[num]["stakeholder_count"] = len(sdg_stakeholders[num])
        stats[num]["countries_count"]   = len(sdg_countries[num])
        if sdg_sectors[num]:
            stats[num]["top_sector"] = max(sdg_sectors[num], key=sdg_sectors[num].get)

    return list(stats.values())


@router.get("/global-stats")
def get_sdg_global_stats(db: Session = Depends(get_db)):
    from app.models.stakeholder import Stakeholder as StakeholderModel

    projects = (
        db.query(ProjectModel.id, ProjectModel.sdg_alignment, ProjectModel.country_id)
        .filter(ProjectModel.sdg_alignment.isnot(None), ProjectModel.status.notin_(EXCLUDED_STATUSES))
        .all()
    )

    project_ids = set()
    covered_sdgs = set()
    country_ids = set()

    for p_id, alignment, country_id in projects:
        if not alignment:
            continue
        numbers = re.findall(r'SDG\s*(\d+)', alignment)
        if not numbers:
            continue
        project_ids.add(p_id)
        for num_str in numbers:
            covered_sdgs.add(int(num_str))
        if country_id:
            country_ids.add(country_id)

    total_stakeholders = db.query(func.count(StakeholderModel.id)).scalar() or 0

    return {
        "covered_sdgs": len(covered_sdgs),
        "total_projects": len(project_ids),
        "total_stakeholders": total_stakeholders,
        "total_countries": len(country_ids),
    }
