import { beforeEach, describe, expect, it, vi } from "vitest";
import { createTask, updateTask } from "../src/services/taskService";

const mocks = vi.hoisted(() => ({ addDoc: vi.fn(), updateDoc: vi.fn(), timestamp: { pending: true } }));
vi.mock("../src/services/firebase", () => ({ db: {} }));
vi.mock("firebase/firestore", () => ({
    collection: vi.fn(() => "tasks-collection"),
    doc: vi.fn(() => "task-reference"),
    addDoc: mocks.addDoc,
    updateDoc: mocks.updateDoc,
    serverTimestamp: vi.fn(() => mocks.timestamp),
    query: vi.fn(), where: vi.fn(), onSnapshot: vi.fn(), deleteDoc: vi.fn(),
}));
beforeEach(() => {
    mocks.addDoc.mockResolvedValue({ id: "new-task" });
    mocks.updateDoc.mockResolvedValue(undefined);
});

describe("validaciones del servicio de tareas", () => {
    it.each(["", "   ", "x".repeat(121)])("rechaza título inválido al crear: %s", async title => {
        await expect(createTask("user-a", { title, description: "" })).rejects.toThrow(/título/);
        expect(mocks.addDoc).not.toHaveBeenCalled();
    });
    it("rechaza descripción demasiado larga al crear", async () => {
        await expect(createTask("user-a", { title: "Estudiar", description: "x".repeat(2001) })).rejects.toThrow(/descripción/);
        expect(mocks.addDoc).not.toHaveBeenCalled();
    });
    it("crea una tarea pendiente con el dueño y fecha del servidor", async () => {
        expect(await createTask("user-a", { title: " Estudiar ", description: " React " })).toBe("new-task");
        expect(mocks.addDoc).toHaveBeenCalledWith("tasks-collection", {
            title: "Estudiar", description: "React", userId: "user-a", completed: false, createdAt: mocks.timestamp,
        });
    });
    it("admite los límites máximos válidos", async () => {
        await expect(createTask("user-a", { title: "x".repeat(120), description: "x".repeat(2000) })).resolves.toBe("new-task");
    });
    it.each(["", "   ", "x".repeat(121)])("rechaza título inválido al editar: %s", async title => {
        await expect(updateTask("task-a", { title })).rejects.toThrow(/título/);
        expect(mocks.updateDoc).not.toHaveBeenCalled();
    });
    it("rechaza descripción demasiado larga al editar", async () => {
        await expect(updateTask("task-a", { description: "x".repeat(2001) })).rejects.toThrow(/descripción/);
        expect(mocks.updateDoc).not.toHaveBeenCalled();
    });
    it("edita campos permitidos y recorta los textos", async () => {
        await updateTask("task-a", { title: " Repasar ", description: " React ", completed: true });
        expect(mocks.updateDoc).toHaveBeenCalledWith("task-reference", { title: "Repasar", description: "React", completed: true });
    });
});
