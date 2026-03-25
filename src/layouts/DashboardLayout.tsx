import { Navigate, Outlet } from "react-router-dom";

import BottomNav from "@/components/BottomNav";
import { useAuth } from "@/contexts/AuthContext";

const DashboardLayout = () => {
  const { loading, user } = useAuth();

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <div className="h-12 w-12 animate-spin rounded-full border-b-2 border-primary" />
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  return (
    <div className="min-h-screen bg-background pb-20">
      <Outlet />
      <BottomNav />
    </div>
  );
};

export default DashboardLayout;
