import { API_BASE_URL } from "@/lib/config";

export class CoursesService {
  /**
   * Fetch all courses
   * @param subjectId Optional subject ID to filter by
   * @param level Optional level to filter by
   * @param limit Number of courses to fetch (default: 100)
   * @param offset Pagination offset (default: 0)
   */
  static async fetchAllCourses(subjectId?: number, level?: string, limit: number = 100, offset: number = 0) {
    try {
      let url = `${API_BASE_URL}/api/v1/courses?limit=${limit}&offset=${offset}`;

      // Add subject filter if provided
      if (subjectId !== undefined) {
        url += `&subject_id=${subjectId}`;
      }

      // Add level filter if provided
      if (level) {
        url += `&level=${encodeURIComponent(level)}`;
      }

      // @ts-ignore - using the global authFetch
      const response = await window.authFetch(url);
      if (!response.ok) {
        throw new Error(`API error: ${response.status}`);
      }
      return await response.json();
    } catch (error) {
      console.error("Error fetching all courses:", error);
      throw error;
    }
  }

  /**
   * Fetch courses the user is enrolled in
   * @param limit Number of courses to fetch (default: 10)
   * @param offset Pagination offset (default: 0)
   */
  static async fetchEnrolledCourses(limit: number = 10, offset: number = 0) {
    try {
      // @ts-ignore - using the global authFetch
      const response = await window.authFetch(
        `${API_BASE_URL}/api/v1/courses/enrolled?limit=${limit}&offset=${offset}`
      );
      if (!response.ok) {
        // Handle 404 specially - it might just mean no courses enrolled
        if (response.status === 404) {
          return { courses: [], total: 0, limit, offset };
        }
        throw new Error(`API error: ${response.status}`);
      }
      return await response.json();
    } catch (error) {
      console.error("Error fetching enrolled courses:", error);
      // Return empty array rather than throwing to handle gracefully
      return { courses: [], total: 0, limit, offset };
    }
  }

  /**
   * Fetch detailed information about a specific course
   * @param courseId ID of the course to fetch
   */
  static async fetchCourseDetails(courseId: number) {
    try {
      // @ts-ignore - using the global authFetch
      const response = await window.authFetch(`${API_BASE_URL}/api/v1/courses/${courseId}`);
      if (!response.ok) {
        throw new Error(`API error: ${response.status}`);
      }
      return await response.json();
    } catch (error) {
      console.error(`Error fetching course ${courseId} details:`, error);
      throw error;
    }
  }

  /**
   * Enroll the user in a course
   * @param courseId ID of the course to enroll in
   */
  static async enrollInCourse(courseId: number) {
    try {
      // @ts-ignore - using the global authFetch
      const response = await window.authFetch(`${API_BASE_URL}/api/v1/courses/${courseId}/enroll`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        throw new Error(`API error: ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      console.error(`Error enrolling in course ${courseId}:`, error);
      throw error;
    }
  }

  /**
   * Unenroll the user from a course
   * @param courseId ID of the course to unenroll from
   */
  static async unenrollFromCourse(courseId: number) {
    try {
      // @ts-ignore - using the global authFetch
      const response = await window.authFetch(`${API_BASE_URL}/api/v1/courses/${courseId}/unenroll`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        throw new Error(`API error: ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      console.error(`Error unenrolling from course ${courseId}:`, error);
      throw error;
    }
  }

  /**
   * Track progress in a course
   * @param courseId ID of the course
   * @param lessonId ID of the lesson completed
   * @param completionData Additional completion data
   */
  static async trackCourseProgress(courseId: number, lessonId: number, completionData: any = {}) {
    try {
      // @ts-ignore - using the global authFetch
      const response = await window.authFetch(`${API_BASE_URL}/api/v1/courses/${courseId}/progress`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          lesson_id: lessonId,
          ...completionData
        })
      });

      if (!response.ok) {
        throw new Error(`API error: ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      console.error(`Error tracking progress for course ${courseId}:`, error);
      throw error;
    }
  }

  /**
   * Get course progress for the current user
   * @param courseId ID of the course
   */
  static async getCourseProgress(courseId: number) {
    try {
      // @ts-ignore - using the global authFetch
      const response = await window.authFetch(`${API_BASE_URL}/api/v1/courses/${courseId}/progress`);
      if (!response.ok) {
        if (response.status === 404) {
          // No progress yet
          return { completed_lessons: [], completion_percentage: 0 };
        }
        throw new Error(`API error: ${response.status}`);
      }
      return await response.json();
    } catch (error) {
      console.error(`Error fetching progress for course ${courseId}:`, error);
      // Return empty progress rather than throwing
      return { completed_lessons: [], completion_percentage: 0 };
    }
  }

  /**
   * Fetch lessons for a specific course
   * @param courseId ID of the course
   */
  static async fetchCourseLessons(courseId: number) {
    try {
      // @ts-ignore - using the global authFetch
      const response = await window.authFetch(`${API_BASE_URL}/api/v1/courses/${courseId}/lessons`);
      if (!response.ok) {
        if (response.status === 404) {
          return { lessons: [] };
        }
        throw new Error(`API error: ${response.status}`);
      }
      return await response.json();
    } catch (error) {
      console.error(`Error fetching lessons for course ${courseId}:`, error);
      // Return empty result rather than throwing
      return { lessons: [] };
    }
  }

  /**
   * Get a thumbnail image for a course based on its title/content
   * Similar to the subject artwork function in SubjectsService
   * @param courseTitle Title of the course
   */
  static getCourseThumbnail(courseTitle: string): string {
    // Map of course types to images
    const courseThumbnails: Record<string, string> = {
      'math': '/courses/mathematics.jpg',
      'algebra': '/courses/algebra.jpg',
      'calculus': '/courses/calculus.jpg',
      'geometry': '/courses/geometry.jpg',
      'physics': '/courses/physics.jpg',
      'chemistry': '/courses/chemistry.jpg',
      'biology': '/courses/biology.jpg',
      'science': '/courses/science.jpg',
      'astronomy': '/courses/astronomy.jpg',
      'literature': '/courses/literature.jpg',
      'poetry': '/courses/poetry.jpg',
      'history': '/courses/history.jpg',
      'art': '/courses/art.jpg',
      'music': '/courses/music.jpg',
      'philosophy': '/courses/philosophy.jpg',
      'language': '/courses/language.jpg',
      'programming': '/courses/programming.jpg',
      'computer': '/courses/computer-science.jpg',
      'ai': '/courses/ai.jpg',
      'machine learning': '/courses/machine-learning.jpg',
      'data': '/courses/data-science.jpg',
      'english': '/courses/english.jpg',
      'french': '/courses/french.jpg',
      'arabic': '/courses/arabic.jpg',
      'spanish': '/courses/spanish.jpg',
      'default': '/courses/default.jpg',
    };

    const lowerTitle = courseTitle.toLowerCase();
    for (const [key, value] of Object.entries(courseThumbnails)) {
      if (lowerTitle.includes(key)) {
        return value;
      }
    }
    return courseThumbnails.default;
  }

  /**
   * Get course difficulty color class
   * @param level Course difficulty level
   */
  static getCourseLevelColorClass(level: string): string {
    const lowerLevel = level.toLowerCase();

    if (lowerLevel.includes('beginner') || lowerLevel.includes('easy')) {
      return "bg-green-100 text-green-600 dark:bg-green-900/40 dark:text-green-400";
    } else if (lowerLevel.includes('intermediate') || lowerLevel.includes('medium')) {
      return "bg-amber-100 text-amber-600 dark:bg-amber-900/40 dark:text-amber-400";
    } else if (lowerLevel.includes('advanced') || lowerLevel.includes('hard')) {
      return "bg-red-100 text-red-600 dark:bg-red-900/40 dark:text-red-400";
    } else {
      return "bg-blue-100 text-blue-600 dark:bg-blue-900/40 dark:text-blue-400"; // Default
    }
  }
}

export default CoursesService;
