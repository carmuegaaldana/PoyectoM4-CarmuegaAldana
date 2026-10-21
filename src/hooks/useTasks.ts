import { useEffect, useState } from "react";
import { useAuth } from "./useAuth";
import type { Task } from "../types/task";
import {
    subscribeUserTasks,
    createTask,
    updateTask,
    deleteTask,
} from "../services/taskService";

interface TasksState {
    userId: string | null;
    tasks: Task[];
    loading: boolean;
    error: string | null;
}

export function useTasks() {
    const { user } = useAuth();
    const [state, setState] = useState<TasksState>({
        userId: null,
        tasks: [],
        loading: true,
        error: null,
    });

    // Estado derivado para evitar renderizados en cascada y limpiar inmediatamente tareas del usuario anterior
    const isCurrent = Boolean(user && state.userId === user.uid);
    const tasks = isCurrent ? state.tasks : [];
    const loading = user ? (isCurrent ? state.loading : true) : false;
    const error = isCurrent ? state.error : null;

    useEffect(() => {
        if (!user) {
            return;
        }

        // Suscripción en tiempo real a las tareas de Firestore
        const unsubscribe = subscribeUserTasks(
            user.uid,
            (fetchedTasks) => {
                setState({
                    userId: user.uid,
                    tasks: fetchedTasks,
                    loading: false,
                    error: null,
                });
            },
            (err) => {
                console.error("Error al escuchar tareas del usuario:", err);
                setState({
                    userId: user.uid,
                    tasks: [],
                    loading: false,
                    error: "Ocurrió un error al cargar las tareas. Verificá tu conexión.",
                });
            }
        );

        // Cancelar suscripción al desmontar o al cambiar de usuario
        return () => {
            unsubscribe();
        };
    }, [user]);

    const addTask = async (title: string, description: string): Promise<boolean> => {
        if (!user) {
            throw new Error("No hay una sesión activa para crear tareas.");
        }
        await createTask(user.uid, { title, description });
        return true;
    };

    const editTask = async (
        id: string,
        title: string,
        description: string
    ): Promise<boolean> => {
        await updateTask(id, { title, description });
        return true;
    };

    const toggleTask = async (id: string, currentCompleted: boolean): Promise<void> => {
        await updateTask(id, { completed: !currentCompleted });
    };

    const removeTask = async (id: string): Promise<void> => {
        await deleteTask(id);
    };

    return {
        tasks,
        loading,
        error,
        addTask,
        editTask,
        toggleTask,
        removeTask,
    };
}
