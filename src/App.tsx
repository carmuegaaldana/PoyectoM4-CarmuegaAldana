import { useState } from "react";
import { useAuth } from "./hooks/useAuth";
import Login from "./pages/Login";
import Register from "./pages/Register";
import Home from "./pages/Home";

function App() {
  const { user, loading } = useAuth();
  const [currentView, setCurrentView] = useState<"login" | "register">("login");

  if (loading) {
    return (
      <div style={{ padding: "32px", textAlign: "center" }}>
        <p>Cargando sesión...</p>
      </div>
    );
  }

  if (user) {
    return <Home />;
  }

  return (
    <div>
      <nav style={{ padding: "16px", display: "flex", gap: "8px", justifyContent: "center" }}>
        <button
          type="button"
          onClick={() => setCurrentView("login")}
          disabled={currentView === "login"}
        >
          Iniciar sesión
        </button>
        <button
          type="button"
          onClick={() => setCurrentView("register")}
          disabled={currentView === "register"}
        >
          Registrarse
        </button>
      </nav>

      {currentView === "login" ? (
        <Login onSwitchToRegister={() => setCurrentView("register")} />
      ) : (
        <div>
          <Register />
          <p style={{ marginTop: "16px" }}>
            ¿Ya tenés cuenta?{" "}
            <button type="button" onClick={() => setCurrentView("login")}>
              Iniciá sesión acá
            </button>
          </p>
        </div>
      )}
    </div>
  );
}

export default App;

