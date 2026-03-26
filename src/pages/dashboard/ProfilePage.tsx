import { useEffect, useState } from "react";
import { Camera, ChevronRight, EyeOff, Globe, LogOut, MapPin, MessageSquare, Package, Settings, Star } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import { toast } from "sonner";

import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Switch } from "@/components/ui/switch";
import { useAuth } from "@/contexts/AuthContext";
import { getCurrentUser, getFriendlyErrorMessage, getTrips, getTripStats, logoutUser, updateCurrentUser, type CargooTrip, type CargooUser } from "@/lib/cargoo-store";

const ProfilePage = () => {
  const navigate = useNavigate();
  const { refreshProfile } = useAuth();
  const [user, setUser] = useState<CargooUser | null>(null);
  const [trips, setTrips] = useState<CargooTrip[]>([]);
  const [savingVisibility, setSavingVisibility] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadData = async () => {
      try {
        const [profile, userTrips] = await Promise.all([getCurrentUser(), getTrips()]);
        setUser(profile);
        setTrips(userTrips);
      } catch (error) {
        toast.error(getFriendlyErrorMessage(error));
      } finally {
        setLoading(false);
      }
    };

    void loadData();
  }, []);

  const handleVisibilityChange = async (value: boolean) => {
    if (!user) {
      return;
    }

    setSavingVisibility(true);
    try {
      const updatedUser = await updateCurrentUser({ isPublic: value });
      setUser(updatedUser);
      await refreshProfile();
      toast.success("Visibilidad actualizada.");
    } catch (error) {
      toast.error(getFriendlyErrorMessage(error));
    } finally {
      setSavingVisibility(false);
    }
  };

  const handleLogout = async () => {
    try {
      await logoutUser();
      navigate("/login");
    } catch (error) {
      toast.error(getFriendlyErrorMessage(error));
    }
  };

  if (loading) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <div className="h-10 w-10 animate-spin rounded-full border-b-2 border-primary" />
      </div>
    );
  }

  if (!user) {
    return null;
  }

  const stats = getTripStats(trips);
  const initials = user.name
    .split(" ")
    .map((part) => part[0])
    .join("")
    .slice(0, 2);

  const menuItems = [
    { label: "Editar perfil", to: "/app/profile/edit", icon: Settings },
    { label: "Mensajes", to: "/app/messages", icon: MessageSquare },
    { label: user.isTraveler ? "Mis viajes" : "Buscar transportistas", to: user.isTraveler ? "/app/trips" : "/app/search", icon: Package },
  ];

  return (
    <div className="mx-auto max-w-lg px-4 pt-6">
      <div className="mb-6 text-center">
        <div className="relative mb-3 inline-block">
          <Avatar className="h-24 w-24 border-4 border-primary/20">
            <AvatarFallback className="bg-primary/10 text-2xl font-bold text-primary">{initials}</AvatarFallback>
          </Avatar>
          <button className="absolute bottom-0 right-0 flex h-8 w-8 items-center justify-center rounded-full bg-primary shadow-lg">
            <Camera className="h-4 w-4 text-primary-foreground" />
          </button>
        </div>
        <h1 className="text-xl font-display font-bold">{user.name}</h1>
        <p className="mt-1 flex items-center justify-center gap-1 text-sm text-muted-foreground">
          <MapPin className="h-3 w-3" /> {user.location}
        </p>
        <div className="mt-3 flex items-center justify-center gap-4">
          <div className="text-center">
            <p className="text-lg font-bold">{stats.totalTrips}</p>
            <p className="text-[10px] text-muted-foreground">Viajes</p>
          </div>
          <Separator orientation="vertical" className="h-8" />
          <div className="text-center">
            <p className="flex items-center gap-1 text-lg font-bold">
              4.8 <Star className="h-3 w-3 fill-warning text-warning" />
            </p>
            <p className="text-[10px] text-muted-foreground">Valoracion</p>
          </div>
          <Separator orientation="vertical" className="h-8" />
          <div className="text-center">
            <p className="text-lg font-bold">{stats.pendingRequests}</p>
            <p className="text-[10px] text-muted-foreground">Solicitudes</p>
          </div>
        </div>
      </div>

      <div className="mb-4 rounded-xl bg-card p-4 shadow-card">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            {user.isPublic ? <Globe className="h-5 w-5 text-primary" /> : <EyeOff className="h-5 w-5 text-muted-foreground" />}
            <div>
              <p className="text-sm font-medium">Perfil {user.isPublic ? "publico" : "privado"}</p>
              <p className="text-xs text-muted-foreground">{user.isPublic ? "Visible para todos" : "Solo usuarios registrados"}</p>
            </div>
          </div>
          <Switch checked={user.isPublic} onCheckedChange={handleVisibilityChange} disabled={savingVisibility} />
        </div>
      </div>

      <div className="mb-4 flex items-center gap-3 rounded-xl bg-card p-4 shadow-card">
        <div className="flex h-10 w-10 items-center justify-center rounded-full bg-success/10">
          <Badge className="bg-success px-2 text-[10px] text-success-foreground">OK</Badge>
        </div>
        <div>
          <p className="text-sm font-medium">Identidad verificada</p>
          <p className="text-xs text-muted-foreground">Cuenta conectada a Supabase y datos guardados en la base</p>
        </div>
      </div>

      <div className="mb-4 overflow-hidden rounded-xl bg-card shadow-card">
        {menuItems.map((item, index) => (
          <Link
            key={item.to}
            to={item.to}
            className={`flex items-center justify-between p-4 transition-colors hover:bg-secondary ${index < menuItems.length - 1 ? "border-b border-border" : ""}`}
          >
            <div className="flex items-center gap-3">
              <item.icon className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm font-medium">{item.label}</span>
            </div>
            <ChevronRight className="h-4 w-4 text-muted-foreground" />
          </Link>
        ))}
      </div>

      <Button
        variant="ghost"
        className="w-full gap-2 text-destructive hover:bg-destructive/10 hover:text-destructive"
        onClick={handleLogout}
      >
        <LogOut className="h-4 w-4" />
        Cerrar sesion
      </Button>
    </div>
  );
};

export default ProfilePage;
