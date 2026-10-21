import { act, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";
import SendSummaryButton from "../src/components/SendSummaryButton";
import { sendTaskSummaryEmail } from "../src/services/emailService";

const mocks = vi.hoisted(() => ({ getIdToken: vi.fn() }));
vi.mock("../src/hooks/useAuth", () => ({ useAuth: () => ({ user: { getIdToken: mocks.getIdToken } }) }));
beforeEach(() => { mocks.getIdToken.mockResolvedValue("test-token"); });

function mockFetch() {
    const fetchMock = vi.fn<typeof fetch>();
    vi.stubGlobal("fetch", fetchMock);
    return fetchMock;
}

describe("emailService", () => {
    it("envía el token sin mandar tareas ni destinatarios", async () => {
        const fetchMock = mockFetch();
        fetchMock.mockResolvedValue(new Response(JSON.stringify({ message: "Enviado" }), { status: 200 }));
        expect(await sendTaskSummaryEmail("test-token")).toEqual({ message: "Enviado" });
        expect(fetchMock).toHaveBeenCalledWith("/api/send-email", {
            method: "POST", headers: { "Content-Type": "application/json", Authorization: "Bearer test-token" },
        });
    });
    it("propaga el mensaje de una respuesta HTTP fallida", async () => {
        mockFetch().mockResolvedValue(new Response(JSON.stringify({ error: "Sesión inválida" }), { status: 401 }));
        await expect(sendTaskSummaryEmail("bad-token")).rejects.toThrow("Sesión inválida");
    });
    it("maneja errores del servidor sin cuerpo JSON", async () => {
        mockFetch().mockResolvedValue(new Response("Unavailable", { status: 503 }));
        await expect(sendTaskSummaryEmail("test-token")).rejects.toThrow("Error 503");
    });
    it("traduce fallos de red al español", async () => {
        mockFetch().mockRejectedValue(new TypeError("Failed to fetch"));
        await expect(sendTaskSummaryEmail("test-token")).rejects.toThrow("No se pudo conectar con el servidor");
    });
});

describe("SendSummaryButton", () => {
    it("obtiene el token y muestra la confirmación del servidor", async () => {
        const fetchMock = mockFetch().mockResolvedValue(new Response(JSON.stringify({ message: "Resumen enviado" }), { status: 200 }));
        render(<SendSummaryButton />);
        await userEvent.setup().click(screen.getByRole("button", { name: "Enviar resumen por email" }));
        expect(mocks.getIdToken).toHaveBeenCalledTimes(1);
        expect(fetchMock).toHaveBeenCalledWith("/api/send-email", expect.objectContaining({ headers: expect.objectContaining({ Authorization: "Bearer test-token" }) }));
        expect(screen.getByRole("status")).toHaveTextContent("Resumen enviado");
    });
    it("muestra el error de envío y permite reintentar", async () => {
        mockFetch().mockResolvedValue(new Response(JSON.stringify({ error: "No se pudo enviar" }), { status: 500 }));
        render(<SendSummaryButton />);
        await userEvent.setup().click(screen.getByRole("button", { name: "Enviar resumen por email" }));
        expect(screen.getByRole("alert")).toHaveTextContent("No se pudo enviar");
        expect(screen.getByRole("button")).toBeEnabled();
    });
    it("bloquea otro clic mientras espera al servidor", async () => {
        let finish!: (value: Response) => void;
        const fetchMock = mockFetch().mockImplementation(() => new Promise<Response>(resolve => { finish = resolve; }));
        const user = userEvent.setup();
        render(<SendSummaryButton />);
        await user.click(screen.getByRole("button"));
        expect(screen.getByRole("button", { name: "Enviando resumen..." })).toBeDisabled();
        await user.click(screen.getByRole("button"));
        expect(fetchMock).toHaveBeenCalledTimes(1);
        await act(async () => { finish(new Response(JSON.stringify({ message: "Enviado" }), { status: 200 })); });
        expect(screen.getByRole("button")).toBeEnabled();
    });
});
