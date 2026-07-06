"""
SQLAlchemy Models for SARAI Platform
All models must be imported here for proper relationship resolution
"""

# Core entities
from app.models.user import User
from app.models.verification_token import VerificationToken
from app.models.password_reset_token import PasswordResetToken
from app.models.task import Task
from app.models.stakeholder import Stakeholder
from app.models.project_stakeholder import ProjectStakeholder
from app.models.country import Country
from app.models.sector import Sector
from app.models.sdg import SDG
from app.models.ai_technology import AITechnology
from app.models.tag import Tag

# Project and relationships
from app.models.project import Project
from app.models.project_relationships import ProjectSDG, ProjectTechnology, ProjectTag

# Project attachments
from app.models.document import ProjectDocument
from app.models.image import ProjectImage

# Engagement and workflow
from app.models.comment import Comment
from app.models.approval import Approval
from app.models.notification import Notification

# Resources
from app.models.resource import Resource

# Legacy (deprecated) - Removed

__all__ = [
    # Core
    "User",
    "VerificationToken",
    "PasswordResetToken",
    "Task",
    "Stakeholder",
    "ProjectStakeholder",
    "Country",
    "Sector",
    "SDG",
    "AITechnology",
    "Tag",
    # Projects
    "Project",
    "ProjectSDG",
    "ProjectTechnology",
    "ProjectTag",
    # Attachments
    "ProjectDocument",
    "ProjectImage",
    # Engagement
    "Comment",
    "Approval",
    "Notification",
    # Resources
    "Resource",
    # Legacy
    "Stakeholder",
]
