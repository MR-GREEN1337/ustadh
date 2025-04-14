import { API_BASE_URL } from "@/lib/config";

export type ForumPost = {
  id: number;
  title: string;
  content: string;
  author: {
    id: number;
    full_name: string;
    avatar?: string;
  };
  created_at: string;
  updated_at?: string;
  view_count: number;
  upvote_count: number;
  reply_count: number;
  tags: string[];
  is_pinned: boolean;
};

export type StudyGroup = {
  id: number;
  name: string;
  description: string;
  member_count: number;
  is_private: boolean;
  subject?: {
    id: number;
    name: string;
  };
  created_by: {
    id: number;
    full_name: string;
  };
};

export class CommunityService {
  static async getForumPosts(filters = {}) {
    // @ts-ignore - using the global authFetch from AuthProvider
    const response = await window.authFetch(`${API_BASE_URL}/api/v1/community/forum-posts`, {
      method: "GET",
    });

    if (!response.ok) {
      throw new Error("Failed to fetch forum posts");
    }

    return await response.json();
  }

  static async getStudyGroups(filters = {}) {
    // @ts-ignore - using the global authFetch from AuthProvider
    const response = await window.authFetch(`${API_BASE_URL}/api/v1/community/study-groups`, {
      method: "GET",
    });

    if (!response.ok) {
      throw new Error("Failed to fetch study groups");
    }

    return await response.json();
  }

  static async joinStudyGroup(groupId: number) {
    // @ts-ignore
    const response = await window.authFetch(`${API_BASE_URL}/api/v1/community/study-groups/${groupId}/join`, {
      method: "POST",
    });

    if (!response.ok) {
      throw new Error("Failed to join study group");
    }

    return await response.json();
  }

  static async createForumPost(postData: {title: string, content: string, subject_id?: number, tags?: string[]}) {
    // @ts-ignore
    const response = await window.authFetch(`${API_BASE_URL}/api/v1/community/forum-posts`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(postData),
    });

    if (!response.ok) {
      throw new Error("Failed to create forum post");
    }

    return await response.json();
  }

  // Add WebSocket connection methods
  static getWebSocketURL(type: 'chat' | 'feed', entityId?: number) {
    const wsProtocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    const baseWsUrl = API_BASE_URL.replace(/^https?:/, wsProtocol);

    if (type === 'chat' && entityId) {
      return `${baseWsUrl}/ws/study-groups/${entityId}/chat`;
    } else if (type === 'feed') {
      return `${baseWsUrl}/ws/community-feed`;
    }

    throw new Error("Invalid WebSocket connection type");
  }
}
