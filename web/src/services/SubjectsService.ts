import { API_BASE_URL } from "@/lib/config";

export interface Subject {
  id: number;
  name: string;
  code: string;
  description: string;
  education_level: string;
  academic_track?: string;
  teaching_language?: string;
  students_count?: number;
  topics?: Topic[];
  icon?: string;
  color_scheme?: string;
  grade_level?: number;
}

export interface Topic {
  id: number;
  name: string;
  description: string;
  order: number;
  difficulty: number;
  estimated_duration_minutes?: number;
  lessons?: Lesson[];
}

export interface Lesson {
  id: number;
  title: string;
  content_type: string;
  order: number;
  duration_minutes?: number;
  difficulty?: number;
  meta_data?: Record<string, any>;
}

export interface CourseSubject {
  course_id: number;
  subject_id: number;
  is_primary: boolean;
  subject: Subject;
}

export class SubjectsService {
  /**
   * Get the authentication fetch function
   */
  private static getAuthFetch() {
    if (typeof window !== 'undefined' && window.authFetch) {
      return window.authFetch;
    }

    // Fallback to regular fetch with credentials if authFetch not available
    return (url: string, options: RequestInit = {}) => {
      const headers = new Headers(options.headers || {});
      headers.set('Content-Type', 'application/json');

      return fetch(url, {
        ...options,
        headers,
        credentials: 'include'
      });
    };
  }

  /**
   * Fetch all subjects
   * @param gradeLevelFilter Optional grade level to filter by
   */
  static async fetchAllSubjects(gradeLevelFilter?: number) {
    try {
      let url = `${API_BASE_URL}/api/v1/subjects`;

      // Add grade level filter if provided
      if (gradeLevelFilter !== undefined) {
        url += `?grade_level=${gradeLevelFilter}`;
      }

      const authFetch = this.getAuthFetch();
      const response = await authFetch(url);

      if (!response.ok) {
        throw new Error(`API error: ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      console.error("Error fetching all subjects:", error);
      throw error;
    }
  }

  /**
   * Fetch subjects the user is enrolled in
   */
  static async fetchEnrolledSubjects() {
    try {
      const authFetch = this.getAuthFetch();
      const response = await authFetch(`${API_BASE_URL}/api/v1/subjects/enrolled`);

      if (!response.ok) {
        // Handle 404 specially - it might just mean no subjects enrolled
        if (response.status === 404) {
          return { subjects: [] };
        }
        throw new Error(`API error: ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      console.error("Error fetching enrolled subjects:", error);
      // Return empty array rather than throwing to handle gracefully
      return { subjects: [] };
    }
  }

  /**
   * Fetch detailed information about a specific subject
   * @param subjectId ID of the subject to fetch
   */
  static async fetchSubjectDetails(subjectId: number | string) {
    try {
      const authFetch = this.getAuthFetch();
      const response = await authFetch(`${API_BASE_URL}/api/v1/subjects/${subjectId}`);

      if (!response.ok) {
        throw new Error(`API error: ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      console.error(`Error fetching subject ${subjectId} details:`, error);
      throw error;
    }
  }

  /**
   * Enroll the user in a subject
   * @param subjectId ID of the subject to enroll in
   */
  static async enrollInSubject(subjectId: number) {
    try {
      const authFetch = this.getAuthFetch();
      const response = await authFetch(`${API_BASE_URL}/api/v1/subjects/${subjectId}/enroll`, {
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
      console.error(`Error enrolling in subject ${subjectId}:`, error);
      throw error;
    }
  }

  /**
   * Unenroll the user from a subject
   * @param subjectId ID of the subject to unenroll from
   */
  static async unenrollFromSubject(subjectId: number) {
    try {
      const authFetch = this.getAuthFetch();
      const response = await authFetch(`${API_BASE_URL}/api/v1/subjects/${subjectId}/unenroll`, {
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
      console.error(`Error unenrolling from subject ${subjectId}:`, error);
      throw error;
    }
  }

  /**
   * Fetch courses for a specific subject
   * @param subjectId ID of the subject
   * @param limit Number of courses to fetch (default: 10)
   * @param offset Pagination offset (default: 0)
   */
  static async fetchSubjectCourses(subjectId: number, limit: number = 10, offset: number = 0) {
    try {
      const authFetch = this.getAuthFetch();
      const response = await authFetch(
        `${API_BASE_URL}/api/v1/courses?subject_id=${subjectId}&limit=${limit}&offset=${offset}`
      );

      if (!response.ok) {
        if (response.status === 404) {
          return { courses: [], total: 0, limit, offset };
        }
        throw new Error(`API error: ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      console.error(`Error fetching courses for subject ${subjectId}:`, error);
      // Return empty result rather than throwing
      return { courses: [], total: 0, limit, offset };
    }
  }

  /**
   * Get the color class for a subject based on its name
   * @param subjectName Name of the subject
   */
  static getSubjectColorClass(subjectName: string): string {
    const nameLower = subjectName.toLowerCase();

    if (this.matchesAny(nameLower, ["math", "mathématique", "algebra", "calcul", "géométrie"])) {
      return "bg-blue-100 text-blue-600 dark:bg-blue-900/40 dark:text-blue-400";
    } else if (this.matchesAny(nameLower, ["literature", "littérature", "français", "french", "langue", "poésie"])) {
      return "bg-purple-100 text-purple-600 dark:bg-purple-900/40 dark:text-purple-400";
    } else if (this.matchesAny(nameLower, ["science", "physique", "chimie", "biology", "biologie"])) {
      return "bg-green-100 text-green-600 dark:bg-green-900/40 dark:text-green-400";
    } else if (this.matchesAny(nameLower, ["geography", "géographie", "earth", "terre"])) {
      return "bg-cyan-100 text-cyan-600 dark:bg-cyan-900/40 dark:text-cyan-400";
    } else if (this.matchesAny(nameLower, ["history", "histoire", "historique"])) {
      return "bg-amber-100 text-amber-600 dark:bg-amber-900/40 dark:text-amber-400";
    } else if (this.matchesAny(nameLower, ["language", "langue", "arabic", "arabe", "english", "anglais"])) {
      return "bg-rose-100 text-rose-600 dark:bg-rose-900/40 dark:text-rose-400";
    } else {
      return "bg-slate-100 text-slate-600 dark:bg-slate-900/40 dark:text-slate-400"; // Default color
    }
  }

  /**
   * Get the icon name for a subject based on its name
   * @param subjectName Name of the subject
   */
  static getSubjectIcon(subjectName: string): string {
    const nameLower = subjectName.toLowerCase();

    if (this.matchesAny(nameLower, ["math", "mathématique", "algebra", "calcul", "géométrie"])) {
      return "math";
    } else if (this.matchesAny(nameLower, ["literature", "littérature", "français", "french", "langue", "poésie"])) {
      return "literature";
    } else if (this.matchesAny(nameLower, ["science", "physique", "chimie", "biology", "biologie"])) {
      return "science";
    } else if (this.matchesAny(nameLower, ["geography", "géographie", "earth", "terre"])) {
      return "geography";
    } else if (this.matchesAny(nameLower, ["history", "histoire", "historique"])) {
      return "history";
    } else if (this.matchesAny(nameLower, ["language", "langue", "arabic", "arabe", "english", "anglais"])) {
      return "language";
    } else {
      return "science"; // Default icon
    }
  }

  /**
   * Utility method to check if a string contains any of the terms
   * @param str String to check
   * @param terms Array of terms to match against
   */
  private static matchesAny(str: string, terms: string[]): boolean {
    return terms.some(term => str.includes(term));
  }

  /**
   * Get the artwork for a subject based on its name
   * @param subjectName Name of the subject
   */
  static getSubjectArtwork(subjectName: string): {img: string, attribution: string} {
    // Map of subject types to classical art images
    const subjectArtworks: Record<string, {img: string, attribution: string}> = {
      'math': {
        img: 'https://www.pexels.com/photo/the-school-of-athens-painting-in-apostolic-palace-vatican-city-27063871/',
        attribution: 'The School of Athens by Raphael, depicting Plato and Aristotle among ancient philosophers and mathematicians'
      },
      'algebra': {
        img: 'https://upload.wikimedia.org/wikipedia/commons/7/7d/Madrid_-_Ciudad_Universitaria%2C_Monumento_a_Muhammad_al-Juarismi_%28cropped%29.jpg',
        attribution: 'Portrait of Al-Khwarizmi, the father of algebra'
      },
      'geometry': {
        img: 'https://upload.wikimedia.org/wikipedia/commons/thumb/c/cf/Title_page_of_Sir_Henry_Billingsley%27s_first_English_version_of_Euclid%27s_Elements%2C_1570_%28560x900%29.jpg/1024px-Title_page_of_Sir_Henry_Billingsley%27s_first_English_version_of_Euclid%27s_Elements%2C_1570_%28560x900%29.jpg',
        attribution: 'Euclid\'s Elements - Medieval manuscript depicting geometric principles'
      },
      'physics': {
        img: 'https://npr.brightspotcdn.com/dims4/default/4be1220/2147483647/strip/true/crop/398x514+0+0/resize/1760x2272!/format/webp/quality/90/?url=http%3A%2F%2Fnpr-brightspot.s3.amazonaws.com%2Flegacy%2Fsites%2Fkwmu%2Ffiles%2F201708%2FAntoine_Caron_Astronomers_Studying_an_Eclipse_0.jpg',
        attribution: 'Astronomers Studying an Eclipse by Antoine Caron, 1571'
      },
      'chemistry': {
        img: 'https://d3d00swyhr67nd.cloudfront.net/w1200h1200/collection/DBY/DEMAG/DBY_DEMAG_1883_152-001.jpg',
        attribution: 'The Alchemist by Joseph Wright, 1771'
      },
      'biology': {
        img: 'https://upload.wikimedia.org/wikipedia/commons/thumb/d/de/Haeckel_Discomedusae_8.jpg/1024px-Haeckel_Discomedusae_8.jpg',
        attribution: 'Ernst Haeckel\'s detailed illustrations of natural forms from Kunstformen der Natur, 1904'
      },
      'astronomy': {
        img: 'https://the-public-domain-review.imgix.net/collections/the-celestial-atlas-of-andreas-cellarius-1660/cellarius-seasons-banner.jpeg?fit=max&w=1200&h=850&auto=format,compress',
        attribution: 'Celestial Map of the Night Sky from Harmonia Macrocosmica by Andreas Cellarius, 1661'
      },
      'literature': {
        img: 'https://upload.wikimedia.org/wikipedia/commons/thumb/9/99/Carl_Spitzweg_-_%22The_Bookworm%22.jpg/800px-Carl_Spitzweg_-_%22The_Bookworm%22.jpg',
        attribution: 'The Bookworm by Carl Spitzweg, 1850'
      },
      'poetry': {
        img: "https://en.wikipedia.org/wiki/Nicolas_Poussin#/media/File:Nicolas_Poussin_-_L'Inspiration_du_po%C3%A8te_(1629).jpg",
        attribution: 'Inspiration of the Poet by Nicolas Poussin, 1630'
      },
      'history': {
        img: 'https://upload.wikimedia.org/wikipedia/commons/thumb/5/5b/Cole_Thomas_The_Course_of_Empire_The_Savage_State_1836.jpg/2560px-Cole_Thomas_The_Course_of_Empire_The_Savage_State_1836.jpg',
        attribution: 'The Course of Empire - Destruction by Thomas Cole, 1836'
      },
      'philosophy': {
        img: 'https://upload.wikimedia.org/wikipedia/commons/thumb/8/8c/David_-_The_Death_of_Socrates.jpg/2560px-David_-_The_Death_of_Socrates.jpg',
        attribution: 'The Death of Socrates by Jacques-Louis David, 1787'
      },
      'language': {
        img: 'https://upload.wikimedia.org/wikipedia/commons/thumb/f/fc/Pieter_Bruegel_the_Elder_-_The_Tower_of_Babel_%28Vienna%29_-_Google_Art_Project_-_edited.jpg/1920px-Pieter_Bruegel_the_Elder_-_The_Tower_of_Babel_%28Vienna%29_-_Google_Art_Project_-_edited.jpg',
        attribution: 'The Tower of Babel by Pieter Bruegel the Elder, 1563'
      },
      'computer': {
        img: 'https://upload.wikimedia.org/wikipedia/commons/thumb/1/1a/Ada_Lovelace_%28cropped%29.jpg/1280px-Ada_Lovelace_%28cropped%29.jpg',
        attribution: 'Ada Lovelace, the first computer programmer, illustrated in Connections to Charles Babbage\'s Analytical Engine'
      },
      'default': {
        img: 'https://upload.wikimedia.org/wikipedia/commons/thumb/a/af/Caspar_David_Friedrich_-_Wanderer_above_the_Sea_of_Fog.jpeg/1280px-Caspar_David_Friedrich_-_Wanderer_above_the_Sea_of_Fog.jpeg',
        attribution: 'Wanderer above the Sea of Fog by Caspar David Friedrich, 1818'
      },
    };

    const lowerName = subjectName.toLowerCase();
    for (const [key, value] of Object.entries(subjectArtworks)) {
      if (lowerName.includes(key)) {
        return value;
      }
    }
    return subjectArtworks.default;
  }

  /**
   * Get all subjects available in the system
   * @param educationLevel Optional filter by education level
   */
  static async getAllSubjects(educationLevel?: string): Promise<Subject[]> {
    try {
      const result = await this.fetchAllSubjects();
      return result.subjects || [];
    } catch (error) {
      console.error('Error getting all subjects:', error);
      return [];
    }
  }

  /**
   * Get subjects available to assign to a course
   * @param educationLevel Education level to filter subjects
   */
  static async getAvailableSubjects(educationLevel?: string): Promise<Subject[]> {
    try {
      return this.getAllSubjects(educationLevel);
    } catch (error) {
      console.error('Error fetching available subjects:', error);
      throw error;
    }
  }

  /**
   * Get subjects assigned to a specific course
   * @param courseId Course ID to fetch subjects for
   */
  static async getCourseSubjects(courseId: string | number): Promise<CourseSubject[]> {
    try {
      const authFetch = this.getAuthFetch();
      const response = await authFetch(`${API_BASE_URL}/api/v1/courses/${courseId}/subjects`);

      if (!response.ok) {
        throw new Error('Failed to fetch course subjects');
      }

      const data = await response.json();
      return data.course_subjects || [];
    } catch (error) {
      console.error('Error fetching course subjects:', error);
      throw error;
    }
  }

  /**
   * Get detailed information about a specific subject
   * @param subjectId Subject ID to fetch details for
   */
  static async getSubjectDetails(subjectId: string | number): Promise<Subject> {
    return this.fetchSubjectDetails(subjectId);
  }

  /**
   * Get topics for a specific subject
   * @param subjectId Subject ID to fetch topics for
   */
  static async getSubjectTopics(subjectId: string | number): Promise<Topic[]> {
    try {
      const authFetch = this.getAuthFetch();
      const response = await authFetch(`${API_BASE_URL}/api/v1/subjects/${subjectId}/topics`);

      if (!response.ok) {
        throw new Error('Failed to fetch subject topics');
      }

      const data = await response.json();
      return data.topics || [];
    } catch (error) {
      console.error('Error fetching subject topics:', error);
      throw error;
    }
  }

  /**
   * Get lessons for a specific topic
   * @param topicId Topic ID to fetch lessons for
   */
  static async getTopicLessons(topicId: string | number): Promise<Lesson[]> {
    try {
      const authFetch = this.getAuthFetch();
      const response = await authFetch(`${API_BASE_URL}/api/v1/topics/${topicId}/lessons`);

      if (!response.ok) {
        throw new Error('Failed to fetch topic lessons');
      }

      const data = await response.json();
      return data.lessons || [];
    } catch (error) {
      console.error('Error fetching topic lessons:', error);
      throw error;
    }
  }

  /**
   * Assign a subject to a course
   * @param courseId Course ID to assign subject to
   * @param subjectId Subject ID to assign
   * @param isPrimary Whether this subject should be the primary subject for the course
   */
  static async assignSubjectToCourse(
    courseId: string | number,
    subjectId: string | number,
    isPrimary: boolean = false
  ): Promise<void> {
    try {
      const authFetch = this.getAuthFetch();
      const response = await authFetch(`${API_BASE_URL}/api/v1/courses/${courseId}/subjects`, {
        method: 'POST',
        body: JSON.stringify({
          subject_id: subjectId,
          is_primary: isPrimary
        })
      });

      if (!response.ok) {
        throw new Error('Failed to assign subject to course');
      }
    } catch (error) {
      console.error('Error assigning subject to course:', error);
      throw error;
    }
  }

  /**
   * Remove a subject from a course
   * @param courseId Course ID to remove subject from
   * @param subjectId Subject ID to remove
   */
  static async removeSubjectFromCourse(courseId: string | number, subjectId: string | number): Promise<void> {
    try {
      const authFetch = this.getAuthFetch();
      const response = await authFetch(`${API_BASE_URL}/api/v1/courses/${courseId}/subjects/${subjectId}`, {
        method: 'DELETE'
      });

      if (!response.ok) {
        throw new Error('Failed to remove subject from course');
      }
    } catch (error) {
      console.error('Error removing subject from course:', error);
      throw error;
    }
  }

  /**
   * Set a subject as the primary subject for a course
   * @param courseId Course ID to update
   * @param subjectId Subject ID to set as primary
   */
  static async setPrimarySubject(courseId: string | number, subjectId: string | number): Promise<void> {
    try {
      const authFetch = this.getAuthFetch();
      const response = await authFetch(`${API_BASE_URL}/api/v1/courses/${courseId}/subjects/primary`, {
        method: 'PUT',
        body: JSON.stringify({
          subject_id: subjectId
        })
      });

      if (!response.ok) {
        throw new Error('Failed to set primary subject');
      }
    } catch (error) {
      console.error('Error setting primary subject:', error);
      throw error;
    }
  }

  /**
   * Get curriculum alignment information for a subject in a course
   * @param courseId Course ID
   * @param subjectId Subject ID
   */
  static async getCurriculumAlignment(
    courseId: string | number,
    subjectId: string | number
  ): Promise<Record<string, any>> {
    try {
      const authFetch = this.getAuthFetch();
      const response = await authFetch(
        `${API_BASE_URL}/api/v1/courses/${courseId}/subjects/${subjectId}/alignment`
      );

      if (!response.ok) {
        throw new Error('Failed to fetch curriculum alignment');
      }

      return await response.json();
    } catch (error) {
      console.error('Error fetching curriculum alignment:', error);
      throw error;
    }
  }

  /**
   * Get students enrolled in a subject for a course
   * @param courseId Course ID
   * @param subjectId Subject ID
   */
  static async getSubjectStudents(
    courseId: string | number,
    subjectId: string | number
  ): Promise<any[]> {
    try {
      const authFetch = this.getAuthFetch();
      const response = await authFetch(
        `${API_BASE_URL}/api/v1/courses/${courseId}/subjects/${subjectId}/students`
      );

      if (!response.ok) {
        throw new Error('Failed to fetch subject students');
      }

      const data = await response.json();
      return data.students || [];
    } catch (error) {
      console.error('Error fetching subject students:', error);
      throw error;
    }
  }

  /**
   * Get progress statistics for a subject in a course
   * @param courseId Course ID
   * @param subjectId Subject ID
   */
  static async getSubjectProgress(
    courseId: string | number,
    subjectId: string | number
  ): Promise<Record<string, any>> {
    try {
      const authFetch = this.getAuthFetch();
      const response = await authFetch(
        `${API_BASE_URL}/api/v1/courses/${courseId}/subjects/${subjectId}/progress`
      );

      if (!response.ok) {
        throw new Error('Failed to fetch subject progress');
      }

      return await response.json();
    } catch (error) {
      console.error('Error fetching subject progress:', error);
      throw error;
    }
  }

  /**
   * Search for subjects matching criteria
   * @param query Search query term
   * @param filters Optional filters object
   */
  static async searchSubjects(
    query: string,
    filters: {
      educationLevel?: string;
      academicTrack?: string;
      teachingLanguage?: string;
    } = {}
  ): Promise<Subject[]> {
    try {
      const authFetch = this.getAuthFetch();

      // Build query parameters
      const params = new URLSearchParams();
      params.append('q', query);

      if (filters.educationLevel) {
        params.append('education_level', filters.educationLevel);
      }

      if (filters.academicTrack) {
        params.append('academic_track', filters.academicTrack);
      }

      if (filters.teachingLanguage) {
        params.append('teaching_language', filters.teachingLanguage);
      }

      const response = await authFetch(`${API_BASE_URL}/api/v1/subjects/search?${params.toString()}`);

      if (!response.ok) {
        throw new Error('Failed to search subjects');
      }

      const data = await response.json();
      return data.subjects || [];
    } catch (error) {
      console.error('Error searching subjects:', error);
      throw error;
    }
  }

  /**
   * Get recommended subjects based on a course
   * @param courseId Course ID to get recommendations for
   */
  static async getRecommendedSubjects(courseId: string | number): Promise<Subject[]> {
    try {
      const authFetch = this.getAuthFetch();
      const response = await authFetch(`${API_BASE_URL}/api/v1/courses/${courseId}/recommended-subjects`);

      if (!response.ok) {
        throw new Error('Failed to fetch recommended subjects');
      }

      const data = await response.json();
      return data.subjects || [];
    } catch (error) {
      console.error('Error fetching recommended subjects:', error);
      throw error;
    }
  }
}

export default SubjectsService;
