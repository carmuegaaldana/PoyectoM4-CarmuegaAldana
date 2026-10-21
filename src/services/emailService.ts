export const sendTaskSummaryEmail = async (idToken: string): Promise<{ message: string }> => {
    let response: Response;

    try {
        response = await fetch("/api/send-email", {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                Authorization: `Bearer ${idToken}`,
            },
        });
    } catch {
        throw new Error("No se pudo conectar con el servidor. Verificá tu conexión e intentá nuevamente.");
    }

    const data = (await response.json().catch(() => null)) as { message?: string; error?: string } | null;

    if (!response.ok) {
        const errorMessage = data?.error || `Error ${response.status}: no se pudo enviar el resumen.`;
        throw new Error(errorMessage);
    }

    return { message: data?.message || "Resumen enviado con éxito." };
};
