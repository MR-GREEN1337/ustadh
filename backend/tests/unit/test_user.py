# backend/tests/unit/test_user.py
from sqlmodel import Session, select

from src.db.models.user import User


def test_create_user(session: Session):
    """Test creating a user."""
    # Create a test user
    user = User(
        email="user1@example.com",
        username="user1",
        full_name="User One",
        hashed_password="hashed_password",  # In real code, this would be hashed
        user_type="student",
        grade_level="10th Grade",
        school_type="high_school",
    )

    # Add to the session and commit
    session.add(user)
    session.commit()

    # Refresh to get the ID
    session.refresh(user)

    # Verify the user was created with an ID
    assert user.id is not None

    # Retrieve the user from the database
    db_user = session.exec(select(User).where(User.username == "user1")).first()

    # Verify the user was retrieved correctly
    assert db_user is not None
    assert db_user.id == user.id
    assert db_user.email == "user1@example.com"
    assert db_user.full_name == "User One"
    assert db_user.user_type == "student"
    assert db_user.grade_level == "10th Grade"
    assert db_user.school_type == "high_school"
    assert db_user.hashed_password == "hashed_password"
