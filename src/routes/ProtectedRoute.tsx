import type { ReactNode } from "react";
import { Navigate, Outlet } from "react-router-dom";
import { useAuth } from "../hooks/useAuth";

interface ProtectedRouteProps {
    children?: ReactNode;
}

function ProtectedRoute({ children }: ProtectedRouteProps) {
    const { user, loading } = useAuth();

    if (loading) {
        return (
            <div style={{ padding: "32px", textAlign: "center" }}>
                <p>Cargando sesión...</p>
            </div>
        );
    }

    if (!user) {
        return <Navigate to="/login" replace />;
    }

    return children ? <>{children}</> : <Outlet />;
}

export default ProtectedRoute;
