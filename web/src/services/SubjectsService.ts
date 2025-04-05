import { API_BASE_URL } from "@/lib/config";

export class SubjectsService {
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

      // @ts-ignore - using the global authFetch
      const response = await window.authFetch(url);
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
      // @ts-ignore - using the global authFetch
      const response = await window.authFetch(`${API_BASE_URL}/api/v1/subjects/enrolled`);
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
  static async fetchSubjectDetails(subjectId: number) {
    try {
      // @ts-ignore - using the global authFetch
      const response = await window.authFetch(`${API_BASE_URL}/api/v1/subjects/${subjectId}`);
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
   * Unenroll the user from a subject
   * @param subjectId ID of the subject to unenroll from
   */
  static async unenrollFromSubject(subjectId: number) {
    try {
      // @ts-ignore - using the global authFetch
      const response = await window.authFetch(`${API_BASE_URL}/api/v1/subjects/${subjectId}/unenroll`, {
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
      // @ts-ignore - using the global authFetch
      const response = await window.authFetch(
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
   * (Moved from backend logic to frontend for consistent styling)
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
   * (Moved from backend logic to frontend for consistent styling)
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
   * (Derived from the subjects page component)
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
}

export default SubjectsService;
