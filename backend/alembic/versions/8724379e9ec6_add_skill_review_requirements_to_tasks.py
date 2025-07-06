"""add_skill_review_requirements_to_tasks

Revision ID: 8724379e9ec6
Revises: update_reviews_binary
Create Date: 2025-07-05 12:25:14.826478

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = '8724379e9ec6'
down_revision: Union[str, None] = 'update_reviews_binary'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Upgrade schema."""
    # Add skill_review_requirements column to tasks table
    op.add_column('tasks', sa.Column('skill_review_requirements', sa.JSON(), nullable=True))


def downgrade() -> None:
    """Downgrade schema."""
    # Remove skill_review_requirements column from tasks table
    op.drop_column('tasks', 'skill_review_requirements')
