import { Navigate, useLocation } from "react-router-dom";

import { useAuth } from "@/contexts/AuthContext";

const AuthEntryPage = () => {
  const location = useLocation();
  const { loading, user } = useAuth();

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <div className="h-12 w-12 animate-spin rounded-full border-b-2 border-primary" />
      </div>
    );
  }

  const searchParams = new URLSearchParams(location.search);
  const nextPath = searchParams.get("next");

  if (user) {
    return <Navigate to={nextPath || "/app"} replace />;
  }

  if (nextPath) {
    return <Navigate to={`/login?next=${encodeURIComponent(nextPath)}`} replace />;
  }

  return <Navigate to="/login" replace />;
};

export default AuthEntryPage;
