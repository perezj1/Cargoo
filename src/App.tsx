import { ReactNode, Suspense, lazy } from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom";

import { useAuth } from "@/contexts/AuthContext";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AuthProvider } from "@/contexts/AuthContext";
import { getAppHomePath, getStoredAppRole } from "@/lib/app-role";

const Auth = lazy(() => import("./pages/Auth"));
const CarrierHub = lazy(() => import("./pages/CarrierHub"));
const Home = lazy(() => import("./pages/Home"));
const Marketplace = lazy(() => import("./pages/Marketplace"));
const NotFound = lazy(() => import("./pages/NotFound"));
const Safety = lazy(() => import("./pages/Safety"));
const SenderHub = lazy(() => import("./pages/SenderHub"));
const Tracking = lazy(() => import("./pages/Tracking"));

const queryClient = new QueryClient();

const AppLoading = () => (
  <div className="flex min-h-screen items-center justify-center px-4">
    <div className="soft-panel p-6 text-center">
      <p className="font-heading text-xl font-semibold">Cargando Cargoo...</p>
      <p className="mt-2 text-sm text-muted-foreground">Preparando transportistas, estados y paneles.</p>
    </div>
  </div>
);

const ProtectedRoute = ({ children }: { children: ReactNode }) => {
  const { user, loading } = useAuth();

  if (loading) return <AppLoading />;
  if (!user) return <Navigate to="/auth" replace />;

  return <>{children}</>;
};

const AppEntry = () => <Navigate to={getAppHomePath(getStoredAppRole())} replace />;

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
        <AuthProvider>
          <Suspense
            fallback={<AppLoading />}
          >
            <Routes>
              <Route path="/" element={<Home />} />
              <Route path="/home" element={<Home />} />
              <Route path="/Landing" element={<Navigate to="/home" replace />} />
              <Route path="/landing" element={<Navigate to="/home" replace />} />
              <Route path="/tracking" element={<Tracking />} />
              <Route path="/tracking/:code" element={<Tracking />} />
              <Route
                path="/app"
                element={
                  <ProtectedRoute>
                    <AppEntry />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/marketplace"
                element={
                  <ProtectedRoute>
                    <Marketplace />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/carrier"
                element={
                  <ProtectedRoute>
                    <CarrierHub />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/sender"
                element={
                  <ProtectedRoute>
                    <SenderHub />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/safety"
                element={
                  <ProtectedRoute>
                    <Safety />
                  </ProtectedRoute>
                }
              />
              <Route path="/auth" element={<Auth />} />
              <Route path="/onboarding" element={<Navigate to="/auth" replace />} />
              <Route path="/challenge" element={<Navigate to="/marketplace" replace />} />
              <Route path="/progress" element={<Navigate to="/tracking" replace />} />
              <Route path="/goals" element={<Navigate to="/carrier" replace />} />
              <Route path="/settings" element={<Navigate to="/safety" replace />} />
              <Route path="/profile" element={<Navigate to="/sender" replace />} />
              <Route path="*" element={<NotFound />} />
            </Routes>
          </Suspense>
        </AuthProvider>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
