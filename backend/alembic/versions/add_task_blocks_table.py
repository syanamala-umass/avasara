"""Add task_blocks table

Revision ID: add_task_blocks_table
Revises: add_skill_review_requirements
Create Date: 2024-01-15 10:00:00.000000

"""
from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

# revision identifiers, used by Alembic.
revision = 'add_task_blocks_table'
down_revision = 'add_skill_review_requirements'
branch_labels = None
depends_on = None


def upgrade():
    # Create task_blocks table
    op.create_table('task_blocks',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('task_id', sa.Integer(), nullable=False),
        sa.Column('user_id', sa.Integer(), nullable=False),
        sa.Column('blocked_until', sa.DateTime(), nullable=False),
        sa.Column('reason', sa.String(), nullable=True),
        sa.Column('created_at', sa.DateTime(), server_default=sa.text('now()'), nullable=False),
        sa.Column('updated_at', sa.DateTime(), server_default=sa.text('now()'), nullable=False),
        sa.ForeignKeyConstraint(['task_id'], ['tasks.id'], ondelete='CASCADE'),
        sa.ForeignKeyConstraint(['user_id'], ['users.id'], ondelete='CASCADE'),
        sa.PrimaryKeyConstraint('id'),
        sa.UniqueConstraint('task_id', 'user_id', name='uq_task_user_block')
    )
    
    # Create index for efficient queries
    op.create_index('idx_task_blocks_task_user', 'task_blocks', ['task_id', 'user_id'])
    op.create_index('idx_task_blocks_blocked_until', 'task_blocks', ['blocked_until'])


def downgrade():
    # Drop indexes
    op.drop_index('idx_task_blocks_blocked_until', table_name='task_blocks')
    op.drop_index('idx_task_blocks_task_user', table_name='task_blocks')
    
    # Drop table
    op.drop_table('task_blocks') 