import { useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { createUserWithEmailAndPassword } from "firebase/auth";
import { auth } from "../services/firebase";
import { FirebaseError } from "firebase/app";

function Register() {
    const [email, setEmail] = useState<string>("");
    const [password, setPassword] = useState<string>("");

    const [isLoading, setIsLoading] = useState(false);
    const [errorMessage, setErrorMessage] = useState("");
    const isMounted = useRef(true);

    useEffect(() => {
        isMounted.current = true;
        return () => { isMounted.current = false; };
    }, []);

    const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
        event.preventDefault();
        if (isLoading) return;
        setIsLoading(true);
        setErrorMessage("");

        try {
            await createUserWithEmailAndPassword(
                auth,
                email,
                password
            );

            // AuthProvider detecta la sesión y PublicRoute muestra /tasks.
        } catch (error) {
            if (!isMounted.current) return;
            if (error instanceof FirebaseError) {
                if (error.code === "auth/email-already-in-use") {
                    setErrorMessage("Este correo electrónico ya está registrado.");
                } else if (error.code === "auth/weak-password") {
                    setErrorMessage("La contraseña es demasiado débil.");
                } else if (error.code === "auth/invalid-email") {
                    setErrorMessage("El correo electrónico no es válido.");
                } else if (error.code === "auth/network-request-failed") {
                    setErrorMessage("No se pudo conectar con el servidor. Verificá tu conexión.");
                } else if (error.code === "auth/too-many-requests") {
                    setErrorMessage("Demasiados intentos. Intentá nuevamente más tarde.");
                } else {
                    setErrorMessage("Ocurrió un error al registrar el usuario.");
                }
            } else {
                setErrorMessage("Ocurrió un error inesperado.");
            }
        } finally {
            if (isMounted.current) setIsLoading(false);
        }
    };

    return (
        <div className="auth-page">
            <h2>Crear cuenta</h2>

            <form onSubmit={handleSubmit}>
                <div>
                    <label htmlFor="email">Correo electrónico</label>
                    <input
                        type="email"
                        id="email"
                        autoComplete="email"
                        disabled={isLoading}
                        value={email}
                        onChange={(event) => setEmail(event.target.value)}
                        required
                    />
                </div>

                <div>
                    <label htmlFor="password">Contraseña</label>
                    <input
                        type="password"
                        id="password"
                        autoComplete="new-password"
                        disabled={isLoading}
                        value={password}
                        onChange={(event) => setPassword(event.target.value)}
                        minLength={6}
                        required
                    />
                </div>

                <button type="submit" disabled={isLoading}>
                    {isLoading ? "Creando cuenta..." : "Registrarse"}
                </button>
            </form>

            {errorMessage && (
                <p role="alert" style={{ color: "#f87171", marginTop: "12px" }}>
                    {errorMessage}
                </p>
            )}

            <p style={{ marginTop: "16px" }}>
                ¿Ya tenés cuenta?{" "}
                <Link to="/login">Iniciá sesión acá</Link>
            </p>
        </div>
    );
}

export default Register;
