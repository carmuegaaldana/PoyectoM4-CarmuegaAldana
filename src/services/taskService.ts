import {
    collection,
    query,
    where,
    onSnapshot,
    addDoc,
    doc,
    updateDoc,
    deleteDoc,
    serverTimestamp,
    type Timestamp,
} from "firebase/firestore";
import { db } from "./firebase";
import type { Task, CreateTaskDTO, UpdateTaskDTO } from "../types/task";

const TASKS_COLLECTION = "tasks";

export const subscribeUserTasks = (
    userId: string,
    onSuccess: (tasks: Task[]) => void,
    onError: (error: Error) => void
): (() => void) => {
    // Filtro por userId en la consulta para cumplir con las reglas y recuperar únicamente las tareas del usuario
    const q = query(
        collection(db, TASKS_COLLECTION),
        where("userId", "==", userId)
    );

    const unsubscribe = onSnapshot(
        q,
        (snapshot) => {
            const tasks: Task[] = snapshot.docs.map((document) => {
                const data = document.data();
                return {
                    id: document.id,
                    title: (data.title as string) ?? "",
                    description: (data.description as string) ?? "",
                    completed: Boolean(data.completed),
                    userId: (data.userId as string) ?? "",
                    createdAt: (data.createdAt as Timestamp | null) ?? null,
                };
            });

            // Ordenamiento por fecha en el cliente para no requerir índice compuesto.
            // Si createdAt es null (escritura pendiente local con serverTimestamp), usamos Date.now()
            tasks.sort((a, b) => {
                const timeA = a.createdAt ? a.createdAt.toMillis() : Date.now();
                const timeB = b.createdAt ? b.createdAt.toMillis() : Date.now();
                return timeB - timeA; // Tareas más recientes primero
            });

            onSuccess(tasks);
        },
        (error) => {
            onError(error);
        }
    );

    return unsubscribe;
};

export const createTask = async (
    userId: string,
    data: CreateTaskDTO
): Promise<string> => {
    const trimmedTitle = data.title.trim();
    if (!trimmedTitle || trimmedTitle.length > 120) {
        throw new Error("El título es obligatorio y debe tener entre 1 y 120 caracteres.");
    }

    const trimmedDescription = data.description.trim();
    if (trimmedDescription.length > 2000) {
        throw new Error("La descripción no puede superar los 2000 caracteres.");
    }

    // No guardamos el id como campo; Firestore genera el ID del documento
    const docRef = await addDoc(collection(db, TASKS_COLLECTION), {
        title: trimmedTitle,
        description: trimmedDescription,
        completed: false,
        userId,
        createdAt: serverTimestamp(),
    });

    return docRef.id;
};

export const updateTask = async (
    taskId: string,
    data: UpdateTaskDTO
): Promise<void> => {
    const taskDocRef = doc(db, TASKS_COLLECTION, taskId);
    const updates: Partial<{ title: string; description: string; completed: boolean }> = {};

    if (data.title !== undefined) {
        const trimmedTitle = data.title.trim();
        if (!trimmedTitle || trimmedTitle.length > 120) {
            throw new Error("El título debe tener entre 1 y 120 caracteres.");
        }
        updates.title = trimmedTitle;
    }

    if (data.description !== undefined) {
        const trimmedDescription = data.description.trim();
        if (trimmedDescription.length > 2000) {
            throw new Error("La descripción no puede superar los 2000 caracteres.");
        }
        updates.description = trimmedDescription;
    }

    if (data.completed !== undefined) {
        updates.completed = data.completed;
    }

    // No permitimos actualizar userId ni createdAt
    await updateDoc(taskDocRef, updates);
};

export const deleteTask = async (taskId: string): Promise<void> => {
    const taskDocRef = doc(db, TASKS_COLLECTION, taskId);
    await deleteDoc(taskDocRef);
};
