"""Add task duration field

Revision ID: add_task_duration_fields
Revises: 54d90de52c73
Create Date: 2024-01-01 12:00:00.000000

"""
from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision = 'add_task_duration_fields'
down_revision = '54d90de52c73'
branch_labels = None
depends_on = None


def upgrade() -> None:
    # Add task_duration field to tasks table
    op.add_column('tasks', sa.Column('task_duration', sa.Integer(), nullable=True))
    
    # Add penalty_applied field to task_assignments table
    op.add_column('task_assignments', sa.Column('penalty_applied', sa.Float(), nullable=True, server_default='0.0'))


def downgrade() -> None:
    # Remove field from task_assignments table
    op.drop_column('task_assignments', 'penalty_applied')
    
    # Remove field from tasks table
    op.drop_column('tasks', 'task_duration') 