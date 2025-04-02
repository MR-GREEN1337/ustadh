import pytest
from typing import Dict, List, Any, Callable
from fastapi.testclient import TestClient


@pytest.fixture
def registered_student(client: TestClient) -> Dict[str, Any]:
    """Register a student user and return the user data."""
    user_data = {
        "email": "student@example.com",
        "username": "studentuser",
        "full_name": "Student User",
        "password": "testpassword123",
        "user_type": "student",
        "grade_level": "9th Grade",
        "school_type": "high_school",
    }
    response = client.post("/api/v1/auth/register", json=user_data)
    assert response.status_code == 200

    # Return the user data with the password for login purposes
    return user_data


@pytest.fixture
def registered_parent(client: TestClient) -> Dict[str, Any]:
    """Register a parent user and return the user data."""
    user_data = {
        "email": "parent@example.com",
        "username": "parentuser",
        "full_name": "Parent User",
        "password": "testpassword123",
        "user_type": "parent",
    }
    response = client.post("/api/v1/auth/register", json=user_data)
    assert response.status_code == 200

    # Return the user data with the password for login purposes
    return user_data


@pytest.fixture
def student_token(client: TestClient, registered_student: Dict[str, Any]) -> str:
    """Get auth token for the registered student."""
    login_data = {
        "username": registered_student["username"],
        "password": registered_student["password"],
    }
    response = client.post("/api/v1/auth/token", data=login_data)
    assert response.status_code == 200

    return response.json()["access_token"]


@pytest.fixture
def parent_token(client: TestClient, registered_parent: Dict[str, Any]) -> str:
    """Get auth token for the registered parent."""
    login_data = {
        "username": registered_parent["username"],
        "password": registered_parent["password"],
    }
    response = client.post("/api/v1/auth/token", data=login_data)
    assert response.status_code == 200

    return response.json()["access_token"]


@pytest.fixture
def student_auth_headers(student_token: str) -> Dict[str, str]:
    """Create authorization headers for the student."""
    return {"Authorization": f"Bearer {student_token}"}


@pytest.fixture
def parent_auth_headers(parent_token: str) -> Dict[str, str]:
    """Create authorization headers for the parent."""
    return {"Authorization": f"Bearer {parent_token}"}


@pytest.fixture
def create_subjects(
    client: TestClient, student_auth_headers: Dict[str, str]
) -> Callable[[int], List[Dict[str, Any]]]:
    """
    Create a specified number of subjects through the API.
    Returns a function that creates subjects when called.
    """

    def _create_subjects(count: int = 3) -> List[Dict[str, Any]]:
        """Create multiple test subjects and return their data."""
        subject_names = ["Mathematics", "Physics", "Chemistry", "Biology", "History"]
        grade_levels = ["9th Grade", "10th Grade", "11th Grade"]

        created_subjects = []

        for i in range(min(count, len(subject_names))):
            subject_data = {
                "name": subject_names[i],
                "grade_level": grade_levels[0],
                "description": f"Study of {subject_names[i].lower()}",
                "metadata": {
                    "icon": f"icon_{subject_names[i].lower()}",
                    "color": ["blue", "green", "red", "purple", "orange"][i % 5],
                },
            }

            # Use the admin API to create a subject (in a real test, this would be a proper endpoint)
            # For now, we'll mock this by adding directly to the database via a session fixture
            # response = client.post("/api/v1/admin/subjects", json=subject_data, headers=admin_auth_headers)
            # assert response.status_code == 200
            # created_subjects.append(response.json())

            # Instead, directly create subjects via the API if it exists
            # or mock for this test
            created_subjects.append({"id": i + 1, **subject_data})

        return created_subjects

    return _create_subjects


@pytest.fixture
def create_enrollment(
    client: TestClient, student_auth_headers: Dict[str, str], create_subjects: Callable
) -> Dict[str, Any]:
    """Create a student enrollment through the API."""
    subjects = create_subjects(1)  # Create one subject
    subject_id = subjects[0]["id"]

    enrollment_data = {  # noqa: F841
        "user_id": 1,  # Assuming this is the student ID
        "subject_id": subject_id,
    }

    # In a real test with working API endpoints:
    # response = client.post("/api/v1/progress/enroll", json=enrollment_data, headers=student_auth_headers)
    # assert response.status_code == 200
    # return response.json()

    # For now, return mock data
    return {
        "id": 1,
        "user_id": 1,
        "subject_id": subject_id,
        "enrolled_at": "2023-05-01T10:00:00",
        "active": True,
        "completed": False,
        "completed_at": None,
        "progress_data": {},
    }


@pytest.fixture
def create_guardian_connection(
    client: TestClient,
    parent_auth_headers: Dict[str, str],
    registered_student: Dict[str, Any],
) -> Dict[str, Any]:
    """Create a guardian connection between parent and student."""
    # Find student ID (in a real application, there would be a user lookup endpoint)
    student_id = 1  # Assume the first registered user has ID 1

    guardian_data = {
        "student_id": student_id,
        "parent_id": 2,  # Assume the second registered user (parent) has ID 2
        "relationship": "parent",
        "can_view": True,
        "can_edit": True,
    }

    # In a real test with working API endpoints:
    # response = client.post("/api/v1/users/guardian", json=guardian_data, headers=parent_auth_headers)
    # assert response.status_code == 200
    # return response.json()

    # For now, return mock data
    return {"id": 1, **guardian_data, "created_at": "2023-05-01T10:00:00"}


@pytest.fixture
def create_tutoring_session(
    client: TestClient, student_auth_headers: Dict[str, str], create_subjects: Callable
) -> Dict[str, Any]:
    """Create a tutoring session through the API."""
    subjects = create_subjects(1)  # Create one subject # noqa: F841

    # Create a topic for the subject
    topic_id = 1  # In a real test, we'd create a topic and get its ID

    session_data = {
        "user_id": 1,  # Assuming this is the student ID
        "topic_id": topic_id,
        "session_type": "math",
        "interaction_mode": "text-only",
        "initial_query": "Help me understand factoring polynomials",
        "difficulty": 3,
        "config": {"interface": "standard"},
    }

    # In a real test with working API endpoints:
    # response = client.post("/api/v1/tutoring/sessions", json=session_data, headers=student_auth_headers)
    # assert response.status_code == 200
    # return response.json()

    # For now, return mock data
    return {
        "id": 1,
        **session_data,
        "start_time": "2023-05-01T10:00:00",
        "end_time": None,
        "duration_seconds": None,
        "status": "active",
    }
