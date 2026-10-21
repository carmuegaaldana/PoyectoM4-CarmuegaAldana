import type { Task } from "../types/task";
import TodoItem from "./TodoItem";

interface TodoListProps {
    tasks: Task[];
    loading: boolean;
    error: string | null;
    onToggle: (id: string, currentCompleted: boolean) => Promise<void>;
    onEdit: (id: string, title: string, description: string) => Promise<boolean>;
    onDelete: (id: string) => Promise<void>;
}

export function TodoList({
    tasks,
    loading,
    error,
    onToggle,
    onEdit,
    onDelete,
}: TodoListProps) {
    if (loading) {
        return (
            <div style={{ padding: "24px", textAlign: "center" }}>
                <p>Cargando tareas...</p>
            </div>
        );
    }

    if (error) {
        return (
            <div style={{ padding: "16px", textAlign: "center" }}>
                <p role="alert" style={{ color: "#d9534f" }}>
                    {error}
                </p>
            </div>
        );
    }

    if (tasks.length === 0) {
        return (
            <div
                style={{
                    padding: "32px",
                    textAlign: "center",
                    border: "1px dashed var(--border)",
                    borderRadius: "8px",
                    margin: "16px 0",
                }}
            >
                <p>No tenés tareas registradas todavía. ¡Creá una nueva arriba!</p>
            </div>
        );
    }

    return (
        <section aria-label="Lista de tareas" style={{ margin: "24px 0" }}>
            <h2 style={{ textAlign: "left", marginBottom: "16px" }}>
                Mis Tareas ({tasks.length})
            </h2>
            <div style={{ display: "flex", flexDirection: "column" }}>
                {tasks.map((task) => (
                    <TodoItem
                        key={task.id}
                        task={task}
                        onToggle={onToggle}
                        onEdit={onEdit}
                        onDelete={onDelete}
                    />
                ))}
            </div>
        </section>
    );
}

export default TodoList;
