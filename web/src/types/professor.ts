/**
 * Types for the Professor AI Insights feature
 */

/**
 * Represents a class taught by the professor
 */
export interface ProfessorClass {
    id: number;
    name: string;
    education_level: string;
    academic_track: string;
    student_count: number;
  }

  /**
   * Student information for a class
   */
  export interface ClassStudentResponse {
    id: number;
    name: string;
    education_level: string;
    academic_track: string;
    activity_score: number;
    last_active: string | null;
  }

  /**
   * Activity data by day
   */
  export interface ActivityDataResponse {
    date: string;
    total: number;
    questions: number;
    practice: number;
  }

  /**
   * Subject-based activity metrics
   */
  export interface SubjectActivityResponse {
    subject: string;
    activity: number;
    strength: number;
    improvement: number;
  }

  /**
   * AI-generated insight or recommendation
   */
  export interface AIInsightResponse {
    id: string;
    title: string;
    description: string;
    recommendationType: 'strength' | 'improvement' | 'classroom';
    subjects: string[];
    relevance: number;
  }

  /**
   * Topic cluster information for visualization
   */
  export interface TopicClusterResponse {
    id: string;
    name: string;
    count: number;
    difficulty: number;
    color: string;
  }

  /**
   * Point in 3D space for visualization
   */
  export interface VisualizationPoint {
    id: string;
    cluster_id: string;
    x: number;
    y: number;
    z: number;
    label: string;
    color: string;
  }

  /**
   * Cluster center in 3D space
   */
  export interface ClusterCenter {
    id: string;
    name: string;
    x: number;
    y: number;
    z: number;
    color: string;
  }

  /**
   * Cluster information
   */
  export interface ClusterInfo {
    id: string;
    name: string;
    count: number;
    color: string;
  }

  /**
   * Visualization data for 3D plot
   */
  export interface VisualizationDataResponse {
    points: VisualizationPoint[];
    centers: ClusterCenter[];
    clusters: ClusterInfo[];
  }
