export interface User {
    id: number;
    email: string;
    username: string;
    full_name: string;
    user_type: 'student' | 'parent' | 'supervisor' | 'admin';
    grade_level?: string;
    school_type?: string;
    is_active: boolean;
    created_at: string;
    preferences?: Record<string, any>;
  }

export interface Guardian {
id: number;
student_id: number;
parent_id: number;
relationship: string;
can_view: boolean;
can_edit: boolean;
created_at: string;
student?: User;
parent?: User;
}
