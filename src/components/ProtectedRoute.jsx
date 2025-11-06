import { Navigate, Outlet } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";

export default function ProtectedRoute() {
  const { user, loading } = useAuth();

  if (loading) return <div>Loading...</div>;

  // if logged in, render nested route; if not, go to /login
  return user ? <Outlet /> : <Navigate to="/login" replace />;
}