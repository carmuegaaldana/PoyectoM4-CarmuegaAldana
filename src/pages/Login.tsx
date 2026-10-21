import { useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { signInWithEmailAndPassword } from "firebase/auth";
import { FirebaseError } from "firebase/app";
import { auth } from "../services/firebase";

function Login() {
    const [email, setEmail] = useState<string>("");
    const [password, setPassword] = useState<string>("");
    const [errorMessage, setErrorMessage] = useState<string>("");
    const [successMessage, setSuccessMessage] = useState<string>("");
    const [isLoading, setIsLoading] = useState<boolean>(false);
    const isMounted = useRef<boolean>(true);

    useEffect(() => {
        isMounted.current = true;
        return () => {
            isMounted.current = false;
        };
    }, []);

    const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
        event.preventDefault();

        setIsLoading(true);
        setErrorMessage("");
        setSuccessMessage("");

        try {
            const userCredential = await signInWithEmailAndPassword(
                auth,
                email,
                password
            );

            console.log("Usuario autenticado:", userCredential.user.uid);
            if (isMounted.current) {
                setSuccessMessage("¡Inicio de sesión exitoso! Bienvenido/a.");
                setPassword("");
            }
        } catch (error) {
            if (isMounted.current) {
                if (error instanceof FirebaseError) {
                    switch (error.code) {
                        case "auth/invalid-credential":
                        case "auth/user-not-found":
                        case "auth/wrong-password":
                        case "auth/invalid-email":
                            setErrorMessage("El correo electrónico o la contraseña son incorrectos.");
                            break;
                        case "auth/too-many-requests":
                            setErrorMessage("Demasiados intentos fallidos. Por favor, intentá nuevamente más tarde.");
                            break;
                        case "auth/network-request-failed":
                            setErrorMessage("Error de conexión. Verificá tu acceso a internet e intentá nuevamente.");
                            break;
                        default:
                            setErrorMessage("Ocurrió un error al iniciar sesión. Por favor, intentá nuevamente.");
                            break;
                    }
                } else {
                    setErrorMessage("Ocurrió un error inesperado.");
                }
            }
        } finally {
            if (isMounted.current) {
                setIsLoading(false);
            }
        }
    };

    return (
        <div className="auth-page">
            <h1>Iniciar sesión</h1>

            <form onSubmit={handleSubmit}>
                <div>
                    <label htmlFor="email">Correo electrónico</label>
                    <input
                        type="email"
                        id="email"
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
                        value={password}
                        onChange={(event) => setPassword(event.target.value)}
                        required
                    />
                </div>

                <button type="submit" disabled={isLoading}>
                    {isLoading ? "Iniciando sesión..." : "Iniciar sesión"}
                </button>
            </form>

            {errorMessage && (
                <p role="alert" style={{ color: "#d9534f", marginTop: "12px" }}>
                    {errorMessage}
                </p>
            )}

            {successMessage && (
                <p role="status" style={{ color: "#5cb85c", marginTop: "12px" }}>
                    {successMessage}
                </p>
            )}

            <p style={{ marginTop: "16px" }}>
                ¿No tenés una cuenta?{" "}
                <Link to="/register">Registrate acá</Link>
            </p>
        </div>
    );
}

export default Login;
