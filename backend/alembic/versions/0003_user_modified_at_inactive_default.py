"""user modified_at; new users inactive by default

Revision ID: 0003
Revises: 0002
Create Date: 2026-03-28

"""

from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa

revision: str = "0003"
down_revision: Union[str, None] = "0002"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.add_column(
        "users",
        sa.Column("modified_at", sa.DateTime(timezone=True), nullable=True),
    )
    op.execute(sa.text("UPDATE users SET modified_at = created_at"))
    op.alter_column(
        "users",
        "modified_at",
        existing_type=sa.DateTime(timezone=True),
        existing_nullable=True,
        nullable=False,
        server_default=sa.text("now()"),
    )
    op.alter_column(
        "users",
        "is_active",
        existing_type=sa.Boolean(),
        existing_nullable=False,
        server_default=sa.text("false"),
    )


def downgrade() -> None:
    op.alter_column(
        "users",
        "is_active",
        existing_type=sa.Boolean(),
        existing_nullable=False,
        server_default=sa.text("true"),
    )
    op.drop_column("users", "modified_at")
