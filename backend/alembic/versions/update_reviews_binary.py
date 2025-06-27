"""Update reviews table to use binary decisions

Revision ID: update_reviews_binary
Revises: 
Create Date: 2024-01-01 00:00:00.000000

"""
from alembic import op
import sqlalchemy as sa

# revision identifiers, used by Alembic.
revision = 'update_reviews_binary'
down_revision = None
branch_labels = None
depends_on = None

def upgrade():
    # Add new columns
    op.add_column('reviews', sa.Column('is_approved', sa.Boolean(), nullable=True))
    op.add_column('reviews', sa.Column('feedback', sa.Text(), nullable=True))
    
    # Set default values for existing reviews
    # Convert rating >= 3 to approved, < 3 to rejected
    op.execute("""
        UPDATE reviews 
        SET is_approved = CASE 
            WHEN rating >= 3 THEN true 
            ELSE false 
        END
    """)
    
    # Copy comment to feedback for rejected reviews
    op.execute("""
        UPDATE reviews 
        SET feedback = comment 
        WHERE is_approved = false AND comment IS NOT NULL
    """)
    
    # Make is_approved not nullable
    op.alter_column('reviews', 'is_approved', nullable=False)
    
    # Set default value for compensation_amount
    op.alter_column('reviews', 'compensation_amount', nullable=True, server_default='0.0')
    
    # Drop old columns
    op.drop_column('reviews', 'rating')
    op.drop_column('reviews', 'comment')

def downgrade():
    # Add back old columns
    op.add_column('reviews', sa.Column('rating', sa.Float(), nullable=True))
    op.add_column('reviews', sa.Column('comment', sa.Text(), nullable=True))
    
    # Convert back: approved = 5, rejected = 1
    op.execute("""
        UPDATE reviews 
        SET rating = CASE 
            WHEN is_approved = true THEN 5.0 
            ELSE 1.0 
        END
    """)
    
    # Copy feedback back to comment
    op.execute("""
        UPDATE reviews 
        SET comment = feedback 
        WHERE feedback IS NOT NULL
    """)
    
    # Drop new columns
    op.drop_column('reviews', 'is_approved')
    op.drop_column('reviews', 'feedback') 