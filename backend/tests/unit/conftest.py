import pytest
from datetime import datetime, timedelta
from typing import List

from sqlmodel import Session
from passlib.context import CryptContext

from src.db.models.user import User, Guardian
from src.db.models.content import Subject, Topic, Lesson
from src.db.models.progress import Enrollment, Activity, TutoringSession
from src.db.models.tutoring import TutoringExchange
from src.db.models.recommendations import Recommendation

# Setup password handling
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")


def get_password_hash(password: str) -> str:
    """Generate password hash."""
    return pwd_context.hash(password)


@pytest.fixture
def create_test_user(session: Session) -> User:
    """Create and return a test user."""
    user = User(
        email="test@example.com",
        username="testuser",
        full_name="Test User",
        hashed_password=get_password_hash("testpassword123"),
        user_type="student",
        grade_level="9th Grade",
        school_type="high_school",
        preferences={"theme": "light", "language": "en"},
    )
    session.add(user)
    session.commit()
    session.refresh(user)
    return user


@pytest.fixture
def create_test_parent(session: Session) -> User:
    """Create and return a test parent user."""
    parent = User(
        email="parent@example.com",
        username="parentuser",
        full_name="Parent User",
        hashed_password=get_password_hash("testpassword123"),
        user_type="parent",
    )
    session.add(parent)
    session.commit()
    session.refresh(parent)
    return parent


@pytest.fixture
def create_guardian_relationship(
    session: Session, create_test_user: User, create_test_parent: User
) -> Guardian:
    """Create and return a guardian relationship between parent and student."""
    guardian = Guardian(
        student_id=create_test_user.id,
        parent_id=create_test_parent.id,
        relationship="parent",
        can_view=True,
        can_edit=True,
    )
    session.add(guardian)
    session.commit()
    session.refresh(guardian)
    return guardian


@pytest.fixture
def create_test_subject(session: Session) -> Subject:
    """Create and return a test subject."""
    subject = Subject(
        name="Mathematics",
        grade_level="9th Grade",
        description="High school mathematics curriculum",
        metadata={"icon": "calculator", "color": "blue"},
    )
    session.add(subject)
    session.commit()
    session.refresh(subject)
    return subject


@pytest.fixture
def create_test_topics(session: Session, create_test_subject: Subject) -> List[Topic]:
    """Create and return test topics for a subject."""
    topics = [
        Topic(
            name="Algebra Basics",
            subject_id=create_test_subject.id,
            description="Introduction to algebraic expressions",
            order=1,
            metadata={"duration_weeks": 3},
        ),
        Topic(
            name="Linear Equations",
            subject_id=create_test_subject.id,
            description="Solving linear equations and inequalities",
            order=2,
            metadata={"duration_weeks": 4},
        ),
        Topic(
            name="Quadratic Equations",
            subject_id=create_test_subject.id,
            description="Solving quadratic equations",
            order=3,
            metadata={"duration_weeks": 5},
        ),
    ]

    for topic in topics:
        session.add(topic)

    session.commit()

    # Refresh all topics to get their IDs
    for i in range(len(topics)):
        session.refresh(topics[i])

    return topics


@pytest.fixture
def create_test_lessons(
    session: Session, create_test_topics: List[Topic]
) -> List[Lesson]:
    """Create and return test lessons for topics."""
    topic = create_test_topics[0]  # Use the first topic

    lessons = [
        Lesson(
            title="Variables and Expressions",
            topic_id=topic.id,
            content_type="text",
            content={"text": "Lesson content here..."},
            order=1,
            metadata={"duration_minutes": 30},
        ),
        Lesson(
            title="Simplifying Expressions",
            topic_id=topic.id,
            content_type="video",
            content={"video_url": "https://example.com/video1"},
            order=2,
            metadata={"duration_minutes": 45},
        ),
        Lesson(
            title="Evaluating Expressions",
            topic_id=topic.id,
            content_type="interactive",
            content={"interactive_type": "practice", "problems": [...]},
            order=3,
            metadata={"duration_minutes": 40},
        ),
    ]

    for lesson in lessons:
        session.add(lesson)

    session.commit()

    # Refresh all lessons to get their IDs
    for i in range(len(lessons)):
        session.refresh(lessons[i])

    return lessons


@pytest.fixture
def create_test_enrollment(
    session: Session, create_test_user: User, create_test_subject: Subject
) -> Enrollment:
    """Create and return a test enrollment."""
    enrollment = Enrollment(
        user_id=create_test_user.id,
        subject_id=create_test_subject.id,
        progress_data={
            "completed_topics": [],
            "current_position": {"topic_id": None, "lesson_id": None},
        },
    )
    session.add(enrollment)
    session.commit()
    session.refresh(enrollment)
    return enrollment


@pytest.fixture
def create_test_activity(
    session: Session, create_test_user: User, create_test_lessons: List[Lesson]
) -> Activity:
    """Create and return a test learning activity."""
    lesson = create_test_lessons[0]  # Use the first lesson

    activity = Activity(
        user_id=create_test_user.id,
        lesson_id=lesson.id,
        type="lesson",
        status="completed",
        start_time=datetime.utcnow() - timedelta(hours=1),
        end_time=datetime.utcnow(),
        duration_seconds=3600,
        data={"pages_read": 5},
        results={"quiz_score": 85},
    )
    session.add(activity)
    session.commit()
    session.refresh(activity)
    return activity


@pytest.fixture
def create_test_tutoring_session(
    session: Session, create_test_user: User, create_test_topics: List[Topic]
) -> TutoringSession:
    """Create and return a test tutoring session."""
    topic = create_test_topics[0]  # Use the first topic

    tutoring_session = TutoringSession(
        user_id=create_test_user.id,
        topic_id=topic.id,
        session_type="math",
        interaction_mode="text-only",
        initial_query="Help me understand factoring polynomials",
        difficulty=3,
        status="active",
        config={"interface": "standard"},
    )
    session.add(tutoring_session)
    session.commit()
    session.refresh(tutoring_session)
    return tutoring_session


@pytest.fixture
def create_test_tutoring_exchanges(
    session: Session, create_test_tutoring_session: TutoringSession
) -> List[TutoringExchange]:
    """Create and return test tutoring exchanges."""
    tutoring_session = create_test_tutoring_session

    exchanges = [
        TutoringExchange(
            session_id=tutoring_session.id,
            sequence=1,
            student_input_type="text",
            student_input={"text": "How do I factor x² + 5x + 6?"},
            ai_response_type="text",
            ai_response={
                "text": "To factor x² + 5x + 6, you need to find two numbers that multiply to give 6 and add up to 5."
            },
        ),
        TutoringExchange(
            session_id=tutoring_session.id,
            sequence=2,
            student_input_type="text",
            student_input={"text": "How do I find these numbers?"},
            ai_response_type="text",
            ai_response={
                "text": "You can list the factors of 6: 1 and 6, 2 and 3. Since 2 + 3 = 5, these are the numbers we need."
            },
        ),
    ]

    for exchange in exchanges:
        session.add(exchange)

    session.commit()

    # Refresh all exchanges to get their IDs
    for i in range(len(exchanges)):
        session.refresh(exchanges[i])

    return exchanges


@pytest.fixture
def create_test_recommendation(
    session: Session, create_test_user: User, create_test_topics: List[Topic]
) -> Recommendation:
    """Create and return a test recommendation."""
    topic = create_test_topics[1]  # Use the second topic

    recommendation = Recommendation(
        user_id=create_test_user.id,
        type="topic",
        title="Explore Linear Equations",
        description="Based on your progress, we recommend studying Linear Equations next.",
        priority=2,
        topic_id=topic.id,
        data={"reason": "prerequisite_for_next_topic", "strength": 0.85},
    )
    session.add(recommendation)
    session.commit()
    session.refresh(recommendation)
    return recommendation
