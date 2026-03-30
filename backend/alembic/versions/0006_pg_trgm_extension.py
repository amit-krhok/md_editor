"""enable pg_trgm for article search ranking

Revision ID: 0006
Revises: 0005
Create Date: 2026-03-30

"""

from typing import Sequence, Union

from alembic import op

revision: str = "0006"
down_revision: Union[str, None] = "0005"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.execute('CREATE EXTENSION IF NOT EXISTS pg_trgm')


def downgrade() -> None:
    op.execute("DROP EXTENSION IF EXISTS pg_trgm")
