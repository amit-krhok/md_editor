"""folders and articles

Revision ID: 0004
Revises: 0003
Create Date: 2026-03-28

"""

from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa

revision: str = "0004"
down_revision: Union[str, None] = "0003"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.create_table(
        "folders",
        sa.Column("id", sa.Uuid(as_uuid=True), nullable=False),
        sa.Column("user_id", sa.Uuid(as_uuid=True), nullable=False),
        sa.Column("name", sa.String(length=255), nullable=False),
        sa.Column(
            "created_at",
            sa.DateTime(timezone=True),
            server_default=sa.text("now()"),
            nullable=False,
        ),
        sa.Column(
            "modified_at",
            sa.DateTime(timezone=True),
            server_default=sa.text("now()"),
            nullable=False,
        ),
        sa.ForeignKeyConstraint(["user_id"], ["users.id"], ondelete="CASCADE"),
        sa.PrimaryKeyConstraint("id"),
        sa.UniqueConstraint("user_id", "name", name="uq_folders_user_name"),
    )
    op.create_index(op.f("ix_folders_user_id"), "folders", ["user_id"], unique=False)

    op.create_table(
        "articles",
        sa.Column("id", sa.Uuid(as_uuid=True), nullable=False),
        sa.Column("user_id", sa.Uuid(as_uuid=True), nullable=False),
        sa.Column("folder_id", sa.Uuid(as_uuid=True), nullable=True),
        sa.Column("title", sa.String(length=500), nullable=False),
        sa.Column("content", sa.Text(), nullable=False),
        sa.Column(
            "role",
            sa.String(length=32),
            nullable=False,
            server_default=sa.text("'owner'"),
        ),
        sa.Column(
            "created_at",
            sa.DateTime(timezone=True),
            server_default=sa.text("now()"),
            nullable=False,
        ),
        sa.Column(
            "modified_at",
            sa.DateTime(timezone=True),
            server_default=sa.text("now()"),
            nullable=False,
        ),
        sa.ForeignKeyConstraint(["folder_id"], ["folders.id"], ondelete="SET NULL"),
        sa.ForeignKeyConstraint(["user_id"], ["users.id"], ondelete="CASCADE"),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index(op.f("ix_articles_user_id"), "articles", ["user_id"], unique=False)
    op.create_index(
        op.f("ix_articles_folder_id"), "articles", ["folder_id"], unique=False
    )


def downgrade() -> None:
    op.drop_index(op.f("ix_articles_folder_id"), table_name="articles")
    op.drop_index(op.f("ix_articles_user_id"), table_name="articles")
    op.drop_table("articles")
    op.drop_index(op.f("ix_folders_user_id"), table_name="folders")
    op.drop_table("folders")
