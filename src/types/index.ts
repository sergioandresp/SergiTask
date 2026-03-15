export interface Task {
    id: string;
    text: string;
    completed: boolean;
    notes?: string;
    dueDate?: number;
    plannedDate?: number;
    completedAt?: number;
    createdAt: number;
}

export interface MacroObjective {
    id: string;
    title: string;
    tasks: Task[];
    notes?: string;
    dueDate?: number;
    plannedDate?: number;
    completedAt?: number;
    createdAt: number;
}
