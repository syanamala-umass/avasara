"""Add accept_reject boolean to review_task_assignments

Revision ID: add_accept_reject_to_review_assignments
Revises: add_skill_review_requirements
Create Date: 2024-01-01 12:00:00.000000

"""
from alembic import op
import sqlalchemy as sa

# revision identifiers, used by Alembic.
revision = 'add_accept_reject_to_review_assignments'
down_revision = 'add_skill_review_requirements'
branch_labels = None
depends_on = None

def upgrade():
    # Add accept_reject boolean column to review_task_assignments table
    op.add_column('review_task_assignments', 
                  sa.Column('accept_reject', sa.Boolean(), nullable=True))

def downgrade():
    # Remove accept_reject column from review_task_assignments table
    op.drop_column('review_task_assignments', 'accept_reject') 