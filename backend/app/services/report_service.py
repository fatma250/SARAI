import os
from pathlib import Path
from jinja2 import Environment, FileSystemLoader
from datetime import datetime
from xhtml2pdf import pisa
from io import BytesIO
import logging

logger = logging.getLogger(__name__)


class ReportService:
    def __init__(self):
        template_dir = os.path.join(os.path.dirname(os.path.dirname(__file__)), "templates")
        self.jinja_env = Environment(loader=FileSystemLoader(template_dir))

    def _format_date(self, dt, lang="fr") -> str:
        if not dt:
            return "En cours" if lang == "fr" else "Ongoing"
        try:
            months_fr = ["", "Janvier", "Février", "Mars", "Avril", "Mai", "Juin",
                         "Juillet", "Août", "Septembre", "Octobre", "Novembre", "Décembre"]
            months_en = ["", "January", "February", "March", "April", "May", "June",
                         "July", "August", "September", "October", "November", "December"]
            months = months_fr if lang == "fr" else months_en
            return f"{months[dt.month]} {dt.year}"
        except Exception:
            return str(dt)[:7]

    def generate_project_report(self, project, ai_summary: str = None, lang: str = "fr") -> BytesIO:
        try:
            # Image paths — must be file:// URIs for xhtml2pdf to resolve them correctly on all OS
            # Use the frontend/public/images directory which contains both logos (.jpg/.jpeg only)
            base_dir = Path(__file__).resolve().parent.parent.parent.parent
            img_dir = base_dir / "frontend" / "public" / "images"
            logo1_uri = (img_dir / "aicto_logo.jpg").as_uri()
            logo2_uri = (img_dir / "sarai_logo.jpeg").as_uri()

            # Derived data
            country_name = project.country.name if project.country else "N/A"
            start_date_str = self._format_date(project.start_date, lang)
            end_date_str = self._format_date(project.end_date, lang)

            # SDG list (names only)
            sdg_list = []
            if hasattr(project, "sdg_associations") and project.sdg_associations:
                for assoc in project.sdg_associations:
                    if hasattr(assoc, "sdg") and assoc.sdg and assoc.sdg.name:
                        sdg_list.append(assoc.sdg.name)

            # Task stats
            tasks = project.tasks if project.tasks else []
            total_tasks = len(tasks)
            completed_tasks = len([t for t in tasks if t.status in ("DONE", "done", "completed", "Completed")])
            completion_rate = round((completed_tasks / total_tasks * 100), 1) if total_tasks > 0 else 0

            stats = {
                "total": total_tasks,
                "completed": completed_tasks,
                "completion_rate": completion_rate,
            }

            template = self.jinja_env.get_template("report.html")

            html_content = template.render(
                project=project,
                stats=stats,
                ai_summary=ai_summary or "",
                date=datetime.now().strftime("%d/%m/%Y"),
                logo1_path=logo1_uri,
                logo2_path=logo2_uri,
                country_name=country_name,
                start_date_str=start_date_str,
                end_date_str=end_date_str,
                sdg_list=sdg_list,
                lang=lang,
            )

            pdf_buffer = BytesIO()
            pisa_status = pisa.CreatePDF(html_content, dest=pdf_buffer)

            if pisa_status.err:
                logger.error(f"PDF generation error code: {pisa_status.err}")
                raise Exception(f"Failed to generate PDF report (error code: {pisa_status.err})")

            pdf_buffer.seek(0)
            return pdf_buffer

        except Exception as e:
            logger.error(f"Report generation error: {str(e)}", exc_info=True)
            raise

    def generate_ai_summary(self, project) -> str:
        tasks = project.tasks if project.tasks else []
        completed = len([t for t in tasks if t.status in ("DONE", "done", "completed", "Completed")])
        total = len(tasks)
        country = project.country.name if project.country else "la région arabe"

        if total == 0:
            sector_label = project.sector or "l'intelligence artificielle"
            return (
                f"Le projet « {project.title} » est actuellement en phase initiale dans le domaine "
                f"de {sector_label} en {country}. "
                "L'équipe se concentre sur la mise en place de la structure et l'alignement des parties prenantes."
            )

        rate = (completed / total) * 100

        if rate == 100:
            return (
                f"Le projet « {project.title} » a été mené à bien avec succès en {country}. "
                "L'ensemble des jalons ont été atteints et le projet est désormais en phase de livraison finale ou de maintenance."
            )
        elif rate > 75:
            return (
                f"Le projet « {project.title} » est dans ses phases finales avec un taux de complétion de {rate:.0f}%. "
                f"En {country}, la plupart des tâches critiques sont achevées et l'équipe finalise les derniers livrables."
            )
        elif rate > 40:
            sector_label = project.sector or "l'IA"
            return (
                f"Le projet « {project.title} » progresse de manière régulière avec {completed} tâches complétées sur {total}. "
                f"Basé en {country} et axé sur {sector_label}, ce projet est sur la bonne trajectoire."
            )
        else:
            sector_label = project.sector or "l'intelligence artificielle"
            return (
                f"Le projet « {project.title} » est en phase d'exécution initiale en {country}. "
                f"Les fondations sont en cours de construction dans le domaine de {sector_label}, "
                "avec des tâches prioritaires orientées vers le développement central."
            )


report_service = ReportService()
