import { useState } from "react";
import { Link } from "react-router-dom";
import { createUserWithEmailAndPassword } from "firebase/auth";
import { auth } from "../services/firebase";
import { FirebaseError } from "firebase/app";

function Register() {
    const [email, setEmail] = useState<string>("");
    const [password, setPassword] = useState<string>("");

    const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
        event.preventDefault();

        try {
            const userCredential = await createUserWithEmailAndPassword(
                auth,
                email,
                password
            );

            console.log("Usuario registrado:", userCredential.user.uid);
            alert("¡Usuario registrado correctamente!");
        } catch (error) {
            if (error instanceof FirebaseError) {
                if (error.code === "auth/email-already-in-use") {
                    alert("Este correo electrónico ya está registrado.");
                } else if (error.code === "auth/weak-password") {
                    alert("La contraseña es demasiado débil.");
                } else if (error.code === "auth/invalid-email") {
                    alert("El correo electrónico no es válido.");
                } else {
                    alert("Ocurrió un error al registrar el usuario.");
                }
            } else {
                alert("Ocurrió un error inesperado.");
            }
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
                        minLength={6}
                        required
                    />
                </div>

                <button type="submit">Registrarse</button>
            </form>

            <p style={{ marginTop: "16px" }}>
                ¿Ya tenés cuenta?{" "}
                <Link to="/login">Iniciá sesión acá</Link>
            </p>
        </div>
    );
}

export default Register;
