"""remove penalty_applied column

Revision ID: remove_penalty_applied_column
Revises: ad1086b22cfe
Create Date: 2024-01-01 00:00:00.000000

"""
from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision = 'remove_penalty_applied_column'
down_revision = 'ad1086b22cfe'
branch_labels = None
depends_on = None


def upgrade():
    # Remove penalty_applied field from task_assignments table
    op.drop_column('task_assignments', 'penalty_applied')


def downgrade():
    # Add penalty_applied field back to task_assignments table
    op.add_column('task_assignments', sa.Column('penalty_applied', sa.Float(), nullable=True, server_default='0.0')) 