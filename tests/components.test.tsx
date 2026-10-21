import { act, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { FirebaseError } from "firebase/app";
import TodoForm from "../src/components/TodoForm";
import TodoList from "../src/components/TodoList";
import TodoItem from "../src/components/TodoItem";
import type { Task } from "../src/types/task";

const task: Task = { id: "task-a", title: "Estudiar", description: "React", completed: false, userId: "user-a", createdAt: null };
function actions() {
    return { onToggle: vi.fn().mockResolvedValue(undefined), onEdit: vi.fn().mockResolvedValue(true), onDelete: vi.fn().mockResolvedValue(undefined) };
}

describe("TodoForm", () => {
    it("envía datos recortados y limpia tras crear", async () => {
        const user = userEvent.setup();
        const submit = vi.fn().mockResolvedValue(true);
        render(<TodoForm onSubmit={submit} />);
        await user.type(screen.getByLabelText(/Título/), "  Estudiar  ");
        await user.type(screen.getByLabelText(/Descripción/), "  React  ");
        await user.click(screen.getByRole("button", { name: "Agregar tarea" }));
        expect(submit).toHaveBeenCalledWith("Estudiar", "React");
        expect(screen.getByLabelText(/Título/)).toHaveValue("");
        expect(screen.getByLabelText(/Descripción/)).toHaveValue("");
    });
    it("rechaza títulos de espacios sin llamar al guardado", async () => {
        const user = userEvent.setup(); const submit = vi.fn();
        render(<TodoForm onSubmit={submit} />);
        await user.type(screen.getByLabelText(/Título/), "   ");
        await user.click(screen.getByRole("button", { name: "Agregar tarea" }));
        expect(screen.getByRole("alert")).toHaveTextContent("El título es obligatorio");
        expect(submit).not.toHaveBeenCalled();
    });
    it("conserva lo escrito y traduce errores de Firebase", async () => {
        const user = userEvent.setup();
        render(<TodoForm onSubmit={vi.fn().mockRejectedValue(new FirebaseError("permission-denied", "technical details"))} />);
        await user.type(screen.getByLabelText(/Título/), "Estudiar");
        await user.type(screen.getByLabelText(/Descripción/), "React");
        await user.click(screen.getByRole("button", { name: "Agregar tarea" }));
        expect(screen.getByRole("alert")).toHaveTextContent("No tenés permisos");
        expect(screen.getByLabelText(/Título/)).toHaveValue("Estudiar");
        expect(screen.getByLabelText(/Descripción/)).toHaveValue("React");
    });
    it("deshabilita controles mientras espera y evita envíos duplicados", async () => {
        const user = userEvent.setup();
        let finish!: (value: boolean) => void;
        const submit = vi.fn(() => new Promise<boolean>(resolve => { finish = resolve; }));
        render(<TodoForm onSubmit={submit} initialTitle="Estudiar" />);
        await user.click(screen.getByRole("button", { name: "Agregar tarea" }));
        const button = screen.getByRole("button", { name: "Guardando..." });
        expect(button).toBeDisabled();
        expect(screen.getByLabelText(/Título/)).toBeDisabled();
        await user.click(button);
        expect(submit).toHaveBeenCalledTimes(1);
        await act(async () => { finish(true); });
        expect(screen.getByRole("button", { name: "Agregar tarea" })).toBeEnabled();
    });
});

describe("TodoList", () => {
    it("muestra la carga", () => {
        render(<TodoList tasks={[]} loading error={null} {...actions()} />);
        expect(screen.getByText("Cargando tareas...")).toBeInTheDocument();
    });
    it("muestra errores", () => {
        render(<TodoList tasks={[]} loading={false} error="No se pudo cargar" {...actions()} />);
        expect(screen.getByRole("alert")).toHaveTextContent("No se pudo cargar");
    });
    it("explica que la lista está vacía", () => {
        render(<TodoList tasks={[]} loading={false} error={null} {...actions()} />);
        expect(screen.getByText(/No tenés tareas registradas/)).toBeInTheDocument();
    });
    it("muestra título, descripción y estado de las tareas", () => {
        render(<TodoList tasks={[task]} loading={false} error={null} {...actions()} />);
        expect(screen.getByRole("checkbox", { name: "Estudiar" })).not.toBeChecked();
        expect(screen.getByText("React")).toBeInTheDocument();
        expect(screen.getByText("Pendiente")).toBeInTheDocument();
    });
});

describe("TodoItem", () => {
    it.each([false, true])("permite cambiar el estado desde completed=%s", async completed => {
        const user = userEvent.setup(); const handlers = actions();
        render(<TodoItem task={{ ...task, completed }} {...handlers} />);
        await user.click(screen.getByRole("checkbox"));
        expect(handlers.onToggle).toHaveBeenCalledWith(task.id, completed);
    });
    it("permite cancelar una edición sin guardar", async () => {
        const user = userEvent.setup(); const handlers = actions();
        render(<TodoItem task={task} {...handlers} />);
        await user.click(screen.getByRole("button", { name: "Editar" }));
        await user.clear(screen.getByLabelText(/Título/));
        await user.type(screen.getByLabelText(/Título/), "Otro título");
        await user.click(screen.getByRole("button", { name: "Cancelar" }));
        expect(handlers.onEdit).not.toHaveBeenCalled();
        expect(screen.getByText("Estudiar")).toBeInTheDocument();
    });
    it("guarda la edición con el ID correspondiente", async () => {
        const user = userEvent.setup(); const handlers = actions();
        render(<TodoItem task={task} {...handlers} />);
        await user.click(screen.getByRole("button", { name: "Editar" }));
        await user.clear(screen.getByLabelText(/Título/));
        await user.type(screen.getByLabelText(/Título/), "Repasar");
        await user.click(screen.getByRole("button", { name: "Guardar cambios" }));
        await waitFor(() => expect(handlers.onEdit).toHaveBeenCalledWith(task.id, "Repasar", "React"));
        expect(screen.queryByRole("button", { name: "Cancelar" })).not.toBeInTheDocument();
    });
    it.each([false, true])("respeta la confirmación de eliminación: %s", async confirmed => {
        const user = userEvent.setup(); const handlers = actions();
        vi.spyOn(window, "confirm").mockReturnValue(confirmed);
        render(<TodoItem task={task} {...handlers} />);
        await user.click(screen.getByRole("button", { name: "Eliminar" }));
        expect(window.confirm).toHaveBeenCalled();
        if (confirmed) expect(handlers.onDelete).toHaveBeenCalledWith(task.id);
        else expect(handlers.onDelete).not.toHaveBeenCalled();
    });
});
