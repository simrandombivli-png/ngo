export type Role = 'Admin' | 'Project_Manager' | 'Coordinator';

export interface User {
  user_id: number;
  user_name: string;
  email: string;
  role: Role;
}

export type ProjectStatus = 'Planning' | 'Ongoing' | 'Completed';

export interface Coordinator {
  user_id: number;
  user_name: string;
}

export interface Project {
  pro_id: number;
  pro_title: string;
  pro_description: string;
  pro_domain: string;
  pro_status: ProjectStatus;
  start_date: string;
  end_date: string;
  pro_managed_by: number;
  manager_name: string;
  coordinators: Coordinator[];
}

export interface ProjectInput {
  pro_title?: string;
  pro_description?: string;
  pro_domain?: string;
  pro_status?: ProjectStatus;
  start_date?: string;
  end_date?: string;
  pro_managed_by?: number;
  coordinator_ids?: number[];
}

export type TaskStatus = 'Pending' | 'In_Progress' | 'Completed';
export type TaskPriority = 'Low' | 'Medium' | 'High';

export interface Task {
  task_id: number;
  project_id: number;
  pro_title: string;
  task_title: string;
  task_description: string;
  task_assigned_to: number | null;
  assigned_to_name: string | null;
  task_status: TaskStatus;
  task_priority: TaskPriority;
  deadline: string | null;
}

export interface TaskInput {
  project_id?: number;
  task_title?: string;
  task_description?: string;
  task_assigned_to?: number | null;
  task_priority?: TaskPriority;
  deadline?: string | null;
  task_status?: TaskStatus;
}

export interface ApiError {
  message: string;
  errors?: Record<string, string> | string[];
}
