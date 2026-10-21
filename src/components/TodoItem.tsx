import { useState } from "react";
import { FirebaseError } from "firebase/app";
import type { Task } from "../types/task";
import TodoForm from "./TodoForm";

interface TodoItemProps {
    task: Task;
    onToggle: (id: string, currentCompleted: boolean) => Promise<void>;
    onEdit: (id: string, title: string, description: string) => Promise<boolean>;
    onDelete: (id: string) => Promise<void>;
}

export function TodoItem({ task, onToggle, onEdit, onDelete }: TodoItemProps) {
    const [isEditing, setIsEditing] = useState<boolean>(false);
    const [isToggling, setIsToggling] = useState<boolean>(false);
    const [isDeleting, setIsDeleting] = useState<boolean>(false);
    const [itemError, setItemError] = useState<string | null>(null);

    const handleToggle = async () => {
        setIsToggling(true);
        setItemError(null);
        try {
            await onToggle(task.id, task.completed);
        } catch (error) {
            console.error("Error al actualizar estado:", error);
            if (error instanceof FirebaseError) {
                switch (error.code) {
                    case "permission-denied":
                    case "firestore/permission-denied":
                        setItemError("No tenés permisos suficientes para actualizar esta tarea.");
                        break;
                    case "unavailable":
                    case "firestore/unavailable":
                    case "network-request-failed":
                        setItemError("El servicio no está disponible en este momento. Verificá tu conexión a internet.");
                        break;
                    default:
                        setItemError("Ocurrió un error al actualizar la tarea. Por favor, intentá nuevamente.");
                        break;
                }
            } else {
                setItemError("No se pudo actualizar el estado de la tarea.");
            }
        } finally {
            setIsToggling(false);
        }
    };

    const handleDelete = async () => {
        const confirmed = window.confirm(
            `¿Estás seguro de que deseás eliminar la tarea "${task.title}"?`
        );
        if (!confirmed) return;

        setIsDeleting(true);
        setItemError(null);
        try {
            await onDelete(task.id);
        } catch (error) {
            console.error("Error al eliminar la tarea:", error);
            if (error instanceof FirebaseError) {
                switch (error.code) {
                    case "permission-denied":
                    case "firestore/permission-denied":
                        setItemError("No tenés permisos suficientes para eliminar esta tarea.");
                        break;
                    case "unavailable":
                    case "firestore/unavailable":
                    case "network-request-failed":
                        setItemError("El servicio no está disponible en este momento. Verificá tu conexión a internet.");
                        break;
                    default:
                        setItemError("Ocurrió un error al eliminar la tarea. Por favor, intentá nuevamente.");
                        break;
                }
            } else {
                setItemError("No se pudo eliminar la tarea. Por favor, intentá nuevamente.");
            }
            setIsDeleting(false);
        }
    };

    const formattedDate = task.createdAt
        ? task.createdAt.toDate().toLocaleString()
        : "Sincronizando fecha...";

    if (isEditing) {
        return (
            <div style={{ marginBottom: "16px" }}>
                <TodoForm
                    initialTitle={task.title}
                    initialDescription={task.description}
                    isEditing
                    onCancel={() => setIsEditing(false)}
                    onSubmit={async (newTitle, newDescription) => {
                        const success = await onEdit(task.id, newTitle, newDescription);
                        if (success) {
                            setIsEditing(false);
                        }
                        return success;
                    }}
                />
            </div>
        );
    }

    return (
        <div
            style={{
                border: "1px solid var(--border)",
                borderRadius: "8px",
                padding: "16px",
                marginBottom: "12px",
                textAlign: "left",
                backgroundColor: task.completed ? "rgba(0,0,0,0.03)" : "var(--bg)",
                transition: "all 0.2s ease",
            }}
        >
            <div style={{ display: "flex", alignItems: "flex-start", gap: "12px" }}>
                <input
                    type="checkbox"
                    id={`task-check-${task.id}`}
                    checked={task.completed}
                    onChange={handleToggle}
                    disabled={isToggling || isDeleting}
                    style={{ marginTop: "4px", width: "18px", height: "18px", cursor: "pointer" }}
                />

                <div style={{ flex: 1 }}>
                    <label
                        htmlFor={`task-check-${task.id}`}
                        style={{
                            display: "block",
                            fontSize: "18px",
                            fontWeight: "bold",
                            cursor: "pointer",
                            textDecoration: task.completed ? "line-through" : "none",
                            color: task.completed ? "var(--text)" : "var(--text-h)",
                        }}
                    >
                        {task.title}
                    </label>

                    {task.description && (
                        <p
                            style={{
                                margin: "6px 0",
                                color: "var(--text)",
                                whiteSpace: "pre-wrap",
                                textDecoration: task.completed ? "line-through" : "none",
                            }}
                        >
                            {task.description}
                        </p>
                    )}

                    <div
                        style={{
                            display: "flex",
                            gap: "12px",
                            alignItems: "center",
                            fontSize: "13px",
                            color: "var(--text)",
                            marginTop: "8px",
                        }}
                    >
                        <span>
                            Estado:{" "}
                            <strong>{task.completed ? "Completada" : "Pendiente"}</strong>
                        </span>
                        <span>•</span>
                        <span>Creada: {formattedDate}</span>
                    </div>

                    {itemError && (
                        <p role="alert" style={{ color: "#d9534f", margin: "8px 0 0" }}>
                            {itemError}
                        </p>
                    )}
                </div>

                <div style={{ display: "flex", gap: "8px" }}>
                    <button
                        type="button"
                        onClick={() => setIsEditing(true)}
                        disabled={isToggling || isDeleting}
                    >
                        Editar
                    </button>
                    <button
                        type="button"
                        onClick={handleDelete}
                        disabled={isToggling || isDeleting}
                    >
                        {isDeleting ? "Eliminando..." : "Eliminar"}
                    </button>
                </div>
            </div>
        </div>
    );
}

export default TodoItem;
