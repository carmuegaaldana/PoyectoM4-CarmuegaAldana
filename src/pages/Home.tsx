import { useState } from "react";
import { FirebaseError } from "firebase/app";
import { useAuth } from "../hooks/useAuth";
import { useTasks } from "../hooks/useTasks";
import TodoForm from "../components/TodoForm";
import TodoList from "../components/TodoList";
import SendSummaryButton from "../components/SendSummaryButton";

function Home() {
    const { user, logout } = useAuth();
    const { tasks, loading, error, addTask, editTask, toggleTask, removeTask } = useTasks();
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
        <div className="tasks-page">
            <header style={{ borderBottom: "1px solid var(--border)", paddingBottom: "16px", marginBottom: "20px" }}>
                <h2>¡Bienvenido/a!</h2>
                <div className="session-row">
                    <p>Sesión iniciada con: <strong>{user?.email}</strong></p>
                    <button
                        className="logout-button"
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

                <SendSummaryButton />
            </header>

            <section aria-label="Gestión de tareas">
                <TodoForm onSubmit={addTask} />
                <TodoList
                    tasks={tasks}
                    loading={loading}
                    error={error}
                    onToggle={toggleTask}
                    onEdit={editTask}
                    onDelete={removeTask}
                />
            </section>
        </div>
    );
}

export default Home;
