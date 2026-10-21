import { useState } from "react";
import { FirebaseError } from "firebase/app";
import { useAuth } from "../hooks/useAuth";

function Home() {
    const { user, logout } = useAuth();
    const [isLoggingOut, setIsLoggingOut] = useState<boolean>(false);
    const [errorMessage, setErrorMessage] = useState<string>("");

    const handleLogout = async () => {
        setIsLoggingOut(true);
        setErrorMessage("");

        try {
            await logout();
        } catch (error) {
            if (error instanceof FirebaseError) {
                if (error.code === "auth/network-request-failed") {
                    setErrorMessage("Error de conexión al intentar cerrar sesión. Verificá tu acceso a internet.");
                } else {
                    setErrorMessage("Ocurrió un error al cerrar sesión. Por favor, intentá nuevamente.");
                }
            } else {
                setErrorMessage("Ocurrió un error inesperado al cerrar sesión.");
            }
            setIsLoggingOut(false);
        }
    };

    return (
        <div>
            <h1>¡Bienvenido/a!</h1>
            <p>
                Sesión iniciada con: <strong>{user?.email}</strong>
            </p>

            <div style={{ marginTop: "24px" }}>
                <button
                    type="button"
                    onClick={handleLogout}
                    disabled={isLoggingOut}
                >
                    {isLoggingOut ? "Cerrando sesión..." : "Cerrar sesión"}
                </button>
            </div>

            {errorMessage && (
                <p role="alert" style={{ color: "#d9534f", marginTop: "12px" }}>
                    {errorMessage}
                </p>
            )}
        </div>
    );
}

export default Home;
