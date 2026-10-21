import { act, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter } from "react-router-dom";
import { FirebaseError } from "firebase/app";
import { describe, expect, it, vi } from "vitest";
import Register from "../src/pages/Register";

const mocks = vi.hoisted(() => ({ createUser: vi.fn() }));
vi.mock("firebase/auth", () => ({ createUserWithEmailAndPassword: mocks.createUser }));
vi.mock("../src/services/firebase", () => ({ auth: {} }));

async function fillForm() {
    const user = userEvent.setup();
    render(<MemoryRouter><Register /></MemoryRouter>);
    await user.type(screen.getByLabelText("Correo electrónico"), "demo@example.com");
    await user.type(screen.getByLabelText("Contraseña"), "test-password");
    return user;
}

describe("Register", () => {
    it("bloquea el formulario y evita otro envío mientras se registra", async () => {
        let finish!: (value: unknown) => void;
        mocks.createUser.mockImplementationOnce(() => new Promise(resolve => { finish = resolve; }));
        const user = await fillForm();
        await user.click(screen.getByRole("button", { name: "Registrarse" }));
        expect(screen.getByRole("button", { name: "Creando cuenta..." })).toBeDisabled();
        expect(screen.getByLabelText("Correo electrónico")).toBeDisabled();
        expect(screen.getByLabelText("Contraseña")).toBeDisabled();
        await user.click(screen.getByRole("button"));
        expect(mocks.createUser).toHaveBeenCalledTimes(1);
        await act(async () => { finish({}); });
        expect(screen.getByRole("button", { name: "Registrarse" })).toBeEnabled();
    });
    it("muestra errores en la página y conserva los datos para reintentar", async () => {
        mocks.createUser.mockRejectedValueOnce(new FirebaseError("auth/email-already-in-use", "technical"));
        const user = await fillForm();
        await user.click(screen.getByRole("button", { name: "Registrarse" }));
        expect(screen.getByRole("alert")).toHaveTextContent("Este correo electrónico ya está registrado");
        expect(screen.getByLabelText("Correo electrónico")).toHaveValue("demo@example.com");
        expect(screen.getByLabelText("Contraseña")).toHaveValue("test-password");
        expect(screen.getByRole("button")).toBeEnabled();
    });
    it("permite reintentar después de un fallo de red y limpia el error anterior", async () => {
        mocks.createUser.mockRejectedValueOnce(new FirebaseError("auth/network-request-failed", "technical"));
        const user = await fillForm();
        await user.click(screen.getByRole("button", { name: "Registrarse" }));
        expect(screen.getByRole("alert")).toHaveTextContent("Verificá tu conexión");
        mocks.createUser.mockResolvedValueOnce({});
        await user.click(screen.getByRole("button", { name: "Registrarse" }));
        expect(screen.queryByRole("alert")).not.toBeInTheDocument();
        expect(mocks.createUser).toHaveBeenLastCalledWith({}, "demo@example.com", "test-password");
    });
});
