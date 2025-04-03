// types/dashboard.ts

/**
 * Subject type representing an academic subject
 */
export interface Subject {
    id: number;
    name: string;
    description: string;
    gradeLevel: string;
    color?: string; // For UI customization
    progress?: number; // User's progress in this subject (0-100)
    totalLessons?: number;
    completedLessons?: number;
    metaData?: {
      icon?: string;
      coverImage?: string;
      [key: string]: any;
    };
  }

  /**
   * Topic type representing a topic within a subject
   */
  export interface Topic {
    id: number;
    name: string;
    description: string;
    subjectId: number;
    order: number;
    progress?: number; // User's progress in this topic (0-100)
    metaData?: {
      prerequisites?: number[];
      estimatedDuration?: number; // in minutes
      [key: string]: any;
    };
  }

  /**
   * Lesson type representing a specific learning unit
   */
  export interface Lesson {
    id: number;
    title: string;
    topicId: number;
    contentType: string; // "video", "text", "interactive", "quiz"
    order: number;
    completed?: boolean;
    progress?: number; // User's progress in this lesson (0-100)
    metaData?: {
      duration?: number; // in minutes
      difficulty?: "beginner" | "intermediate" | "advanced";
      [key: string]: any;
    };
  }

  /**
   * Recommendation type for personalized learning suggestions
   */
  export interface Recommendation {
    id: number;
    title: string;
    description: string;
    type: "topic" | "lesson" | "practice" | "tutoring";
    priority: number; // 1-5 (1 = highest)
    subjectId?: number;
    topicId?: number;
    lessonId?: number;
    metaData?: {
      reason?: string;
      aiConfidence?: number; // 0-1
      [key: string]: any;
    };
  }

  /**
   * User progress information
   */
  export interface UserProgress {
    overall: number; // 0-100
    subjects: {
      id: number;
      name: string;
      progress: number; // 0-100
    }[];
    recentActivity?: {
      date: string;
      action: string;
      subjectName?: string;
      topicName?: string;
      lessonTitle?: string;
    }[];
    streak?: {
      current: number;
      longest: number;
      lastActive: string;
    };
  }

  /**
   * User data including profile and progress information
   */
  export interface UserData {
    id: number;
    username: string;
    email: string;
    fullName: string;
    avatarUrl?: string;
    userType: "student" | "teacher" | "admin";
    gradeLevel?: number;
    schoolType?: string;
    createdAt: string;
    lastLogin?: string;
    progress: UserProgress;
  }

  /**
   * Session type for learning interactions
   */
  export interface LearningSession {
    id: string;
    type: "chat" | "drawing" | "textbook" | "quiz" | "tutoring";
    startTime: string;
    endTime?: string;
    status: "active" | "completed" | "abandoned";
    subjectId?: number;
    topicId?: number;
    lessonId?: number;
    progress?: number;
    metaData?: {
      [key: string]: any;
    };
  }
