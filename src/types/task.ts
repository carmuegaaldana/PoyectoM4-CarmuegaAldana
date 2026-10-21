import type { Timestamp } from "firebase/firestore";

export interface Task {
    id: string;
    title: string;
    description: string;
    completed: boolean;
    userId: string;
    createdAt: Timestamp | null;
}

export interface CreateTaskDTO {
    title: string;
    description: string;
}

export interface UpdateTaskDTO {
    title?: string;
    description?: string;
    completed?: boolean;
}
