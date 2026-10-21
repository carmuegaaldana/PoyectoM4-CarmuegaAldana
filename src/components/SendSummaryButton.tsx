import { useState } from "react";
import { FirebaseError } from "firebase/app";
import { useAuth } from "../hooks/useAuth";
import { sendTaskSummaryEmail } from "../services/emailService";

export function SendSummaryButton() {
    const { user } = useAuth();
    const [isSending, setIsSending] = useState<boolean>(false);
    const [successMessage, setSuccessMessage] = useState<string | null>(null);
    const [errorMessage, setErrorMessage] = useState<string | null>(null);

    const handleSendEmail = async () => {
        if (!user) {
            setErrorMessage("Debés iniciar sesión para enviar el resumen.");
            return;
        }

        setIsSending(true);
        setSuccessMessage(null);
        setErrorMessage(null);

        try {
            // Obtenemos el ID token actual desde Firebase Auth
            const idToken = await user.getIdToken();
            const result = await sendTaskSummaryEmail(idToken);
            setSuccessMessage(result.message);
        } catch (error) {
            if (error instanceof FirebaseError) {
                setErrorMessage(
                    error.code === "auth/network-request-failed"
                        ? "No se pudo verificar tu sesión. Revisá tu conexión e intentá nuevamente."
                        : "No se pudo verificar tu sesión. Volvé a iniciar sesión e intentá nuevamente."
                );
            } else if (error instanceof Error) {
                setErrorMessage(error.message);
            } else {
                setErrorMessage("No se pudo enviar el resumen por correo.");
            }
        } finally {
            setIsSending(false);
        }
    };

    return (
        <div style={{ margin: "16px 0", textAlign: "left" }}>
            <button
                type="button"
                onClick={handleSendEmail}
                disabled={isSending}
            >
                {isSending ? "Enviando resumen..." : "Enviar resumen por email"}
            </button>

            {successMessage && (
                <p role="status" style={{ color: "#5cb85c", marginTop: "8px", fontSize: "14px" }}>
                    {successMessage}
                </p>
            )}

            {errorMessage && (
                <p role="alert" style={{ color: "#d9534f", marginTop: "8px", fontSize: "14px" }}>
                    {errorMessage}
                </p>
            )}
        </div>
    );
}

export default SendSummaryButton;
