// services/CommunityService.ts
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
  subject_id?: number;
  subject?: string;
  is_pinned: boolean;
  is_answered?: boolean;
};

export type ForumReply = {
  id: number;
  post_id: number;
  author: {
    id: number;
    full_name: string;
    avatar?: string;
    role?: string;
  };
  content: string;
  created_at: string;
  upvote_count: number;
  is_verified?: boolean;
  is_best_answer?: boolean;
};

export type Subject = {
  id: number;
  name: string;
  icon?: string;
  color?: string;
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

  static async getForumPost(postId: number) {
    // @ts-ignore
    const response = await window.authFetch(`${API_BASE_URL}/api/v1/community/forum-posts/${postId}`, {
      method: "GET",
    });

    if (!response.ok) {
      throw new Error("Failed to fetch forum post");
    }

    return await response.json();
  }

  static async getForumReplies(postId: number) {
    // @ts-ignore
    const response = await window.authFetch(`${API_BASE_URL}/api/v1/community/forum-posts/${postId}/replies`, {
      method: "GET",
    });

    if (!response.ok) {
      throw new Error("Failed to fetch forum replies");
    }

    return await response.json();
  }

  static async createForumPost(postData: {title: string, content: string, subject_id?: string, tags?: string[]}) {
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

  static async createForumReply(postId: number, content: string) {
    // @ts-ignore
    const response = await window.authFetch(`${API_BASE_URL}/api/v1/community/forum-posts/${postId}/replies`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ content }),
    });

    if (!response.ok) {
      throw new Error("Failed to create reply");
    }

    return await response.json();
  }

  static async upvoteForumPost(postId: number) {
    // @ts-ignore
    const response = await window.authFetch(`${API_BASE_URL}/api/v1/community/forum-posts/${postId}/upvote`, {
      method: "POST",
    });

    if (!response.ok) {
      throw new Error("Failed to upvote post");
    }

    return await response.json();
  }

  static async upvoteForumReply(replyId: number) {
    // @ts-ignore
    const response = await window.authFetch(`${API_BASE_URL}/api/v1/community/forum-replies/${replyId}/upvote`, {
      method: "POST",
    });

    if (!response.ok) {
      throw new Error("Failed to upvote reply");
    }

    return await response.json();
  }

  static async markAsBestAnswer(postId: number, replyId: number) {
    // @ts-ignore
    const response = await window.authFetch(`${API_BASE_URL}/api/v1/community/forum-posts/${postId}/best-answer`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ reply_id: replyId }),
    });

    if (!response.ok) {
      throw new Error("Failed to mark as best answer");
    }

    return await response.json();
  }

  static async getSubjects() {
    // @ts-ignore
    const response = await window.authFetch(`${API_BASE_URL}/api/v1/subjects`, {
      method: "GET",
    });

    if (!response.ok) {
      throw new Error("Failed to fetch subjects");
    }

    return await response.json();
  }

  static async getStudyGroups(filters = {}) {
    // @ts-ignore
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

  static async createStudyGroup(groupData: {
    name: string;
    description: string;
    is_private: boolean;
    subject_id?: string;
    grade_level?: string;
  }) {
    // @ts-ignore
    const response = await window.authFetch(`${API_BASE_URL}/api/v1/community/study-groups`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(groupData),
    });

    if (!response.ok) {
      throw new Error("Failed to create study group");
    }

    return await response.json();
  }

  // WebSocket methods
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
