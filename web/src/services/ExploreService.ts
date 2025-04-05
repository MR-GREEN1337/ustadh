import { API_BASE_URL } from "@/lib/config";

export interface ExploreSubject {
  id: number;
  name: string;
  description: string;
  grade_level: string;
  icon: string;
  colorClass: string;
  enrollment_count: number;
  is_enrolled: boolean;
  interest_matches?: number;
  total_interests?: number;
}

export interface PaginationInfo {
  page: number;
  page_size: number;
  total_count: number;
  total_pages: number;
  has_next: boolean;
  has_prev: boolean;
}

export interface ExploreResponse {
  subjects: ExploreSubject[];
  pagination: PaginationInfo;
}

export interface SuggestionResponse {
  suggestions: {
    id: number;
    name: string;
    description: string;
    grade_level: string;
    icon: string;
    colorClass: string;
    enrollment_count: number;
    reason: string;
  }[];
}

export interface TrendingTopic {
  id: number;
  name: string;
  description: string;
  subject_name: string;
  subject_id: number;
  difficulty: number;
  icon: string;
  colorClass: string;
}

export interface TrendingTopicsResponse {
  trending_topics: TrendingTopic[];
}

export class ExploreService {
  /**
   * Fetch subjects for exploration, filtered by various criteria
   * @param gradeLevel Optional grade level to filter by
   * @param interests Optional list of interest tags to filter by
   * @param query Optional search query
   * @param page Page number for pagination (default: 1)
   * @param pageSize Number of items per page (default: 12)
   */
  static async fetchExploreSubjects(
    gradeLevel?: number,
    interests?: string[],
    query?: string,
    page: number = 1,
    pageSize: number = 12
  ): Promise<ExploreResponse> {
    try {
      // Build URL with query parameters
      let url = `${API_BASE_URL}/api/v1/explore?page=${page}&page_size=${pageSize}`;

      if (gradeLevel !== undefined) {
        url += `&grade_level=${gradeLevel}`;
      }

      if (interests && interests.length > 0) {
        interests.forEach(interest => {
          url += `&interests=${encodeURIComponent(interest)}`;
        });
      }

      if (query) {
        url += `&query=${encodeURIComponent(query)}`;
      }

      // @ts-ignore - using the global authFetch
      const response = await window.authFetch(url);
      if (!response.ok) {
        throw new Error(`API error: ${response.status}`);
      }
      return await response.json();
    } catch (error) {
      console.error("Error fetching explore subjects:", error);
      throw error;
    }
  }

  /**
   * Fetch personalized subject suggestions
   * @param limit Maximum number of suggestions to fetch (default: 5)
   */
  static async fetchSuggestedSubjects(limit: number = 5): Promise<SuggestionResponse> {
    try {
      // @ts-ignore - using the global authFetch
      const response = await window.authFetch(`${API_BASE_URL}/api/v1/explore/suggested-subjects?limit=${limit}`);
      if (!response.ok) {
        throw new Error(`API error: ${response.status}`);
      }
      return await response.json();
    } catch (error) {
      console.error("Error fetching suggested subjects:", error);
      throw error;
    }
  }

  /**
   * Fetch trending topics
   * @param limit Maximum number of trending topics to fetch (default: 5)
   */
  static async fetchTrendingTopics(limit: number = 5): Promise<TrendingTopicsResponse> {
    try {
      // @ts-ignore - using the global authFetch
      const response = await window.authFetch(`${API_BASE_URL}/api/v1/explore/trending-topics?limit=${limit}`);
      if (!response.ok) {
        throw new Error(`API error: ${response.status}`);
      }
      return await response.json();
    } catch (error) {
      console.error("Error fetching trending topics:", error);
      throw error;
    }
  }

  /**
   * Enroll in a subject (reusing the existing method from SubjectsService)
   * @param subjectId ID of the subject to enroll in
   */
  static async enrollInSubject(subjectId: number) {
    try {
      // @ts-ignore - using the global authFetch
      const response = await window.authFetch(`${API_BASE_URL}/api/v1/subjects/${subjectId}/enroll`, {
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
   * Convert difficulty level to a human-readable string
   * @param level Difficulty level (1-5)
   */
  static getDifficultyText(level: number): string {
    switch (level) {
      case 1:
        return "Beginner";
      case 2:
        return "Easy";
      case 3:
        return "Intermediate";
      case 4:
        return "Advanced";
      case 5:
        return "Expert";
      default:
        return "Intermediate";
    }
  }

  /**
   * Get a list of educational interest categories for filtering
   * This could come from an API in a real implementation
   */
  static getInterestCategories(): { id: string; name: string }[] {
    return [
      { id: "mathematics", name: "Mathematics" },
      { id: "sciences", name: "Sciences" },
      { id: "literature", name: "Literature" },
      { id: "languages", name: "Languages" },
      { id: "history", name: "History" },
      { id: "geography", name: "Geography" },
      { id: "art", name: "Art" },
      { id: "music", name: "Music" },
      { id: "technology", name: "Technology" },
      { id: "engineering", name: "Engineering" },
      { id: "biology", name: "Biology" },
      { id: "chemistry", name: "Chemistry" },
      { id: "physics", name: "Physics" },
      { id: "economics", name: "Economics" },
      { id: "computer_science", name: "Computer Science" }
    ];
  }

  /**
   * Get a list of all available grade levels (filière)
   * This could come from an API in a real implementation
   */
  static getGradeLevels(): { id: number; name: string }[] {
    return [
      { id: 1, name: "1ère année primaire" },
      { id: 2, name: "2ème année primaire" },
      { id: 3, name: "3ème année primaire" },
      { id: 4, name: "4ème année primaire" },
      { id: 5, name: "5ème année primaire" },
      { id: 6, name: "6ème année primaire" },
      { id: 7, name: "1ère année collège" },
      { id: 8, name: "2ème année collège" },
      { id: 9, name: "3ème année collège" },
      { id: 10, name: "Tronc Commun" },
      { id: 11, name: "1ère année Bac" },
      { id: 12, name: "2ème année Bac" }
    ];
  }
}

export default ExploreService;
