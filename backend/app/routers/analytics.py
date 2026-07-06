from fastapi import APIRouter, Depends, HTTPException
from fastapi.responses import StreamingResponse, HTMLResponse
from sqlalchemy.orm import Session
from sqlalchemy import func, case
from app.database import get_db
from app.models.stakeholder import Stakeholder
from app.models.project import Project
from app.models.country import Country
from datetime import datetime, timezone
import io

router = APIRouter()

@router.get("/overview")
def get_overview(db: Session = Depends(get_db)):
    now = datetime.now(timezone.utc)
    total_projects = db.query(Project).count()
    total_stakeholders = db.query(Stakeholder).count()
    total_countries_active = db.query(Project.country_id).distinct().filter(Project.country_id.isnot(None)).count()
    
    ongoing_count = db.query(Project).filter(Project.status.notin_(['pending', 'rejected'])).filter(
        (Project.end_date.is_(None)) | (Project.end_date > now)
    ).count()
    
    completed_count = db.query(Project).filter(Project.status.notin_(['pending', 'rejected'])).filter(
        (Project.end_date.isnot(None)) & (Project.end_date <= now)
    ).count()
    
    return {
        "total_projects": total_projects,
        "total_stakeholders": total_stakeholders,
        "total_countries_active": total_countries_active,
        "ongoing_projects_count": ongoing_count,
        "completed_projects_count": completed_count
    }

@router.get("/map-data")
def get_map_data(db: Session = Depends(get_db)):
    now = datetime.now(timezone.utc)
    
    # 1. Basic counts per country
    basic_stats = db.query(
        Country.name,
        Country.code_alpha2,
        func.count(Project.id).label('project_count'),
        func.count(case(( (Project.end_date.is_(None)) | (Project.end_date > now), 1 ))).label('ongoing'),
        func.count(case(( (Project.end_date.isnot(None)) & (Project.end_date <= now), 1 ))).label('completed')
    ).outerjoin(Project, Project.country_id == Country.id)\
     .group_by(Country.name, Country.code_alpha2)\
     .all()

    # 2. Distinct stakeholders per country
    stakeholder_stats = db.query(
        Country.name,
        func.count(func.distinct(Stakeholder.id))
    ).join(Stakeholder, Stakeholder.country_id == Country.id)\
     .group_by(Country.name)\
     .all()
    stakeholder_map = {name: count for name, count in stakeholder_stats}

    # 3. Top sector per country
    sector_stats = db.query(
        Country.name,
        Project.sector,
        func.count(Project.id)
    ).join(Project, Project.country_id == Country.id)\
     .group_by(Country.name, Project.sector)\
     .order_by(Country.name, func.count(Project.id).desc())\
     .all()
    
    top_sector_map = {}
    for name, sector, _ in sector_stats:
        if name not in top_sector_map:
            top_sector_map[name] = sector

    # 4. Top AI technology per country
    tech_stats = db.query(
        Country.name,
        Project.ai_technology,
        func.count(Project.id)
    ).join(Project, Project.country_id == Country.id)\
     .group_by(Country.name, Project.ai_technology)\
     .order_by(Country.name, func.count(Project.id).desc())\
     .all()
    
    top_tech_map = {}
    for name, tech, _ in tech_stats:
        if name not in top_tech_map:
            top_tech_map[name] = tech

    # 5. Sector distribution for charts
    sector_dist = db.query(
        Country.name,
        Project.sector,
        func.count(Project.id)
    ).join(Project, Project.country_id == Country.id)\
     .group_by(Country.name, Project.sector)\
     .all()
    
    country_sector_dist = {}
    for name, sector, count in sector_dist:
        if name not in country_sector_dist: country_sector_dist[name] = []
        country_sector_dist[name].append({"sector": sector, "count": count})

    # Combine everything
    results = []
    for name, code, p_count, ongoing, completed in basic_stats:
        results.append({
            "country": name,
            "code": code,
            "project_count": p_count,
            "stakeholder_count": stakeholder_map.get(name, 0),
            "ongoing_projects": ongoing,
            "completed_projects": completed,
            "top_sector": top_sector_map.get(name, "N/A"),
            "top_ai_technology": top_tech_map.get(name, "N/A"),
            "sector_distribution": country_sector_dist.get(name, [])
        })
    
    return results

@router.get("/projects-by-country")
def get_projects_by_country(db: Session = Depends(get_db)):
    results = db.query(Country.name, func.count(Project.id))\
        .join(Project, Project.country_id == Country.id)\
        .filter(Project.status.notin_(['pending', 'rejected']))\
        .group_by(Country.name)\
        .order_by(func.count(Project.id).desc())\
        .all()
    return [{"country": r[0], "projects": r[1]} for r in results]

@router.get("/projects-by-sector")
def get_projects_by_sector(db: Session = Depends(get_db)):
    results = db.query(Project.sector, func.count(Project.id))\
        .filter(Project.status.notin_(['pending', 'rejected']), Project.sector.isnot(None))\
        .group_by(Project.sector)\
        .order_by(func.count(Project.id).desc())\
        .all()
    return [{"sector": r[0], "count": r[1]} for r in results]

@router.get("/ai-technologies")
def get_ai_technologies(db: Session = Depends(get_db)):
    results = db.query(Project.ai_technology, func.count(Project.id))\
        .filter(Project.status.notin_(['pending', 'rejected']), Project.ai_technology.isnot(None))\
        .group_by(Project.ai_technology)\
        .order_by(func.count(Project.id).desc())\
        .all()
    return [{"technology": r[0], "count": r[1]} for r in results]

@router.get("/stakeholders-by-type")
def get_stakeholders_by_type(db: Session = Depends(get_db)):
    results = db.query(Stakeholder.type, func.count(Stakeholder.id))\
        .filter(Stakeholder.type.isnot(None))\
        .group_by(Stakeholder.type)\
        .order_by(func.count(Stakeholder.id).desc())\
        .all()
    return [{"type": r[0], "count": r[1]} for r in results]

@router.get("/projects-timeline")
def get_projects_timeline(db: Session = Depends(get_db)):
    results = db.query(
        func.extract('year', Project.start_date).label('year'),
        func.count(Project.id)
    ).filter(Project.start_date.isnot(None))\
     .group_by('year')\
     .order_by('year')\
     .all()
    return [{"year": int(r[0]), "projects": r[1]} for r in results]


@router.get("/stakeholders-by-country")
def get_stakeholders_by_country(db: Session = Depends(get_db)):
    results = db.query(Stakeholder.country, func.count(Stakeholder.id))\
        .filter(Stakeholder.country.isnot(None))\
        .group_by(Stakeholder.country)\
        .order_by(func.count(Stakeholder.id).desc())\
        .limit(12).all()
    return [{"country": r[0], "stakeholders": r[1]} for r in results]


@router.get("/sector-technology-matrix")
def get_sector_technology_matrix(db: Session = Depends(get_db)):
    results = db.query(Project.sector, Project.ai_technology, func.count(Project.id))\
        .filter(
            Project.status.notin_(["pending", "rejected"]),
            Project.sector.isnot(None),
            Project.ai_technology.isnot(None)
        )\
        .group_by(Project.sector, Project.ai_technology)\
        .order_by(func.count(Project.id).desc())\
        .all()
    return [{"sector": r[0], "technology": r[1], "count": r[2]} for r in results]


@router.get("/report", response_class=HTMLResponse)
def get_analytics_report(db: Session = Depends(get_db)):
    """Return a print-ready HTML report (browser prints to PDF via Ctrl+P)."""
    now = datetime.now(timezone.utc)

    total_projects     = db.query(Project).filter(Project.status.notin_(["pending", "rejected"])).count()
    total_stakeholders = db.query(Stakeholder).count()
    total_countries    = db.query(Project.country_id).distinct().filter(Project.country_id.isnot(None)).count()
    ongoing            = db.query(Project).filter(
        Project.status.notin_(["pending", "rejected"]), Project.end_date.is_(None)
    ).count()

    sectors = db.query(Project.sector, func.count(Project.id))\
        .filter(Project.status.notin_(["pending", "rejected"]), Project.sector.isnot(None))\
        .group_by(Project.sector).order_by(func.count(Project.id).desc()).limit(10).all()

    countries = db.query(Country.name, func.count(Project.id))\
        .join(Project, Project.country_id == Country.id)\
        .filter(Project.status.notin_(["pending", "rejected"]))\
        .group_by(Country.name).order_by(func.count(Project.id).desc()).limit(10).all()

    techs = db.query(Project.ai_technology, func.count(Project.id))\
        .filter(Project.status.notin_(["pending", "rejected"]), Project.ai_technology.isnot(None))\
        .group_by(Project.ai_technology).order_by(func.count(Project.id).desc()).limit(10).all()

    stypes = db.query(Stakeholder.type, func.count(Stakeholder.id))\
        .filter(Stakeholder.type.isnot(None))\
        .group_by(Stakeholder.type).order_by(func.count(Stakeholder.id).desc()).all()

    # ── Build HTML ───────────────────────────────────────────────────────────
    COLORS = ["#2563eb", "#7c3aed", "#059669", "#d97706", "#db2777", "#0891b2", "#ea580c", "#4f46e5"]

    def bar_html(count, max_count, color):
        pct = int(count / (max_count or 1) * 100)
        return (
            "<div style='background:#e2e8f0;border-radius:4px;height:10px;width:100%;'>"
            "<div style='background:" + color + ";height:10px;border-radius:4px;width:" + str(pct) + "%;'></div>"
            "</div>"
        )

    def table_rows(data, color_fixed=None):
        max_c = data[0][1] if data else 1
        rows = ""
        for i, (name, count) in enumerate(data):
            color = color_fixed or COLORS[i % len(COLORS)]
            bg = "#f8fafc" if i % 2 == 0 else "#ffffff"
            dot = "<span style='display:inline-block;width:10px;height:10px;background:" + color + ";border-radius:50%;margin-right:8px;vertical-align:middle;'></span>"
            rows += (
                "<tr style='background:" + bg + ";'>"
                "<td style='padding:9px 14px;border-bottom:1px solid #f1f5f9;font-size:12px;font-weight:600;'>" + dot + str(name) + "</td>"
                "<td style='padding:9px 14px;border-bottom:1px solid #f1f5f9;text-align:center;font-weight:800;font-size:13px;color:" + color + ";'>" + str(count) + "</td>"
                "<td style='padding:9px 14px;border-bottom:1px solid #f1f5f9;width:40%;'>" + bar_html(count, max_c, color) + "</td>"
                "</tr>"
            )
        return rows

    def card(title, value, subtitle, color):
        return (
            "<div style='background:#fff;border:1px solid #e2e8f0;border-radius:16px;"
            "padding:20px 24px;border-top:4px solid " + color + ";text-align:center;'>"
            "<div style='font-size:36px;font-weight:900;color:" + color + ";line-height:1;'>" + str(value) + "</div>"
            "<div style='font-size:11px;font-weight:700;color:#1e293b;margin-top:6px;text-transform:uppercase;letter-spacing:0.06em;'>" + title + "</div>"
            "<div style='font-size:10px;color:#94a3b8;margin-top:3px;'>" + subtitle + "</div>"
            "</div>"
        )

    leading_sector = sectors[0][0] if sectors else "N/A"
    leading_tech   = techs[0][0]   if techs   else "N/A"

    def table_block(title, color, data, color_fixed=None):
        if not data:
            return "<p style='color:#94a3b8;font-style:italic;'>No data available.</p>"
        header = (
            "<thead><tr>"
            "<th style='background:" + color + ";color:#fff;padding:10px 14px;text-align:left;font-size:10px;text-transform:uppercase;letter-spacing:0.08em;'>Name</th>"
            "<th style='background:" + color + ";color:#fff;padding:10px 14px;text-align:center;font-size:10px;text-transform:uppercase;letter-spacing:0.08em;'>Count</th>"
            "<th style='background:" + color + ";color:#fff;padding:10px 14px;font-size:10px;text-transform:uppercase;letter-spacing:0.08em;width:40%;'>Distribution</th>"
            "</tr></thead>"
        )
        return (
            "<div class='section'>"
            "<div class='section-title' style='border-left:4px solid " + color + ";'>" + title + "</div>"
            "<table style='width:100%;border-collapse:collapse;border-radius:12px;overflow:hidden;border:1px solid #e2e8f0;'>"
            + header +
            "<tbody>" + table_rows(data, color_fixed) + "</tbody>"
            "</table></div>"
        )

    # ── Render HTML ───────────────────────────────────────────────────────────
    s_rows = table_rows(sectors)
    c_rows = table_rows(countries, "#7c3aed")
    t_rows = table_rows(techs,    "#059669")
    y_rows = table_rows(stypes,   "#d97706")

    html = (
        "<!DOCTYPE html><html><head><meta charset='UTF-8'/>"
        "<title>SARAI Analytics Report</title>"
        "<style>"
        "*, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }"
        "body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Arial, sans-serif;"
        "       color: #1e293b; background: #f8fafc; }"
        ".page { max-width: 960px; margin: 0 auto; padding: 40px 32px 60px; }"
        ".no-print { display: flex; gap: 12px; justify-content: flex-end; margin-bottom: 28px; }"
        ".btn-print { background: #1e3a8a; color: #fff; border: none; padding: 10px 22px;"
        "             border-radius: 10px; font-size: 14px; font-weight: 700; cursor: pointer;"
        "             display: flex; align-items: center; gap: 8px; }"
        ".btn-print:hover { background: #1e40af; }"
        ".cover { background: linear-gradient(135deg,#1e3a8a,#065f46);"
        "         border-radius: 20px; padding: 40px 44px 36px; color: #fff; margin-bottom: 28px; }"
        ".cover-sub { font-size: 11px; font-weight: 700; color: #93c5fd;"
        "             text-transform: uppercase; letter-spacing: .15em; margin-bottom: 8px; }"
        ".cover h1 { font-size: 34px; font-weight: 900; letter-spacing: -.03em;"
        "            line-height: 1.1; margin-bottom: 6px; }"
        ".cover-desc { font-size: 14px; color: #bfdbfe; margin-bottom: 28px; }"
        ".kpi-row { display: grid; grid-template-columns: repeat(3,1fr); gap: 14px; }"
        ".kpi { background: rgba(255,255,255,.12); border: 1px solid rgba(255,255,255,.2);"
        "       border-radius: 14px; padding: 18px 20px; text-align: center; }"
        ".kpi-num { font-size: 38px; font-weight: 900; line-height: 1; color: #fff; }"
        ".kpi-sub { font-size: 10px; font-weight: 700; color: #93c5fd;"
        "           text-transform: uppercase; letter-spacing: .1em; margin-top: 5px; }"
        ".summary { background: #f0fdf4; border: 1px solid #bbf7d0; border-radius: 14px;"
        "           padding: 18px 22px; margin-bottom: 28px; }"
        ".summary-label { font-size: 10px; font-weight: 800; color: #166534;"
        "                 text-transform: uppercase; letter-spacing: .08em; margin-bottom: 6px; }"
        ".summary p { font-size: 13px; color: #14532d; line-height: 1.65; }"
        ".grid2 { display: grid; grid-template-columns: 1fr 1fr; gap: 20px; margin-bottom: 20px; }"
        ".section { background: #fff; border: 1px solid #e2e8f0; border-radius: 16px;"
        "           overflow: hidden; }"
        ".section-title { font-size: 13px; font-weight: 800; padding: 14px 18px;"
        "                 border-bottom: 1px solid #f1f5f9; }"
        "table.dt { width: 100%; border-collapse: collapse; }"
        "table.dt thead th { padding: 10px 14px; text-align: left; font-size: 10px;"
        "                    text-transform: uppercase; letter-spacing: .07em; color: #fff; }"
        "table.dt tbody td { padding: 9px 14px; border-bottom: 1px solid #f8fafc;"
        "                    font-size: 12px; vertical-align: middle; }"
        "table.dt tbody tr:last-child td { border-bottom: none; }"
        "table.dt tbody tr:nth-child(even) td { background: #f8fafc; }"
        ".footer { text-align: center; margin-top: 40px; padding-top: 20px;"
        "          border-top: 1px solid #e2e8f0; font-size: 11px; color: #94a3b8; line-height: 1.8; }"
        "@media print {"
        "  .no-print { display: none !important; }"
        "  body { background: #fff; }"
        "  .page { padding: 0; }"
        "  .section { break-inside: avoid; }"
        "  .grid2 { break-inside: avoid; }"
        "}"
        "</style></head><body>"
        "<div class='page'>"

        # Print button
        "<div class='no-print'>"
        "<button class='btn-print' onclick='window.print()'>&#128438; Save as PDF</button>"
        "</div>"

        # Cover
        "<div class='cover'>"
        "<div class='cover-sub'>Stocktaking of Arab Regional AI Initiatives</div>"
        "<h1>SARAI Analytics Report</h1>"
        "<div class='cover-desc'>Arab AI Repository &nbsp;&bull;&nbsp; Platform Intelligence Dashboard &nbsp;&bull;&nbsp; " + now.strftime('%B %d, %Y') + "</div>"
        "<div class='kpi-row'>"
        "<div class='kpi'><div class='kpi-num'>" + str(total_projects) + "</div><div class='kpi-sub'>AI Projects</div></div>"
        "<div class='kpi'><div class='kpi-num'>" + str(total_stakeholders) + "</div><div class='kpi-sub'>Organizations</div></div>"
        "<div class='kpi'><div class='kpi-num'>" + str(total_countries) + "<span style='font-size:18px;opacity:.7;'>/22</span></div><div class='kpi-sub'>Arab Nations</div></div>"
        "</div></div>"

        # Summary
        "<div class='summary'>"
        "<div class='summary-label'>Executive Summary</div>"
        "<p>The SARAI platform currently tracks <strong>" + str(total_projects) + " AI projects</strong> across "
        "<strong>" + str(total_countries) + " Arab countries</strong>, involving <strong>" + str(total_stakeholders) + " organizations</strong>. "
        + str(ongoing) + " projects are active. "
        + ("Leading sector: <strong>" + leading_sector + "</strong>. " if leading_sector != "N/A" else "")
        + ("Most used technology: <strong>" + leading_tech + "</strong>." if leading_tech != "N/A" else "")
        + "</p></div>"

        # Grid row 1
        "<div class='grid2'>"
        + table_block("Projects by Sector", "#2563eb", sectors) +
        table_block("Projects by Country", "#7c3aed", countries, "#7c3aed") +
        "</div>"

        # Grid row 2
        "<div class='grid2'>"
        + table_block("AI Technologies", "#059669", techs, "#059669") +
        table_block("Organizations by Type", "#d97706", stypes, "#d97706") +
        "</div>"

        # Footer
        "<div class='footer'>"
        "<strong style='color:#475569;'>SARAI</strong> &mdash; Stocktaking of Arab Regional AI Initiatives<br/>"
        "Generated on " + now.strftime('%B %d, %Y at %H:%M UTC') + " &mdash; Data reflects approved and active projects only."
        "</div>"

        "</div></body></html>"
    )

    return HTMLResponse(content=html)
