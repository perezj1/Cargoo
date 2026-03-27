import { useEffect, useRef, useState } from "react";
import { Camera, ChevronRight, EyeOff, Globe, LogOut, MapPin, MessageSquare, Package, Settings, Star } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import { toast } from "sonner";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Switch } from "@/components/ui/switch";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import {
  getCurrentUser,
  getFriendlyErrorMessage,
  getTravelerRatingSummary,
  getTrips,
  getTripStats,
  logoutUser,
  updateCurrentUser,
  uploadCurrentUserAvatar,
  type CargooTrip,
  type CargooUser,
  type TravelerRatingSummary,
} from "@/lib/cargoo-store";
import { getNotificationPermissionState, removePushSubscription, syncPushSubscription } from "@/lib/push-notifications";

const ProfilePage = () => {
  const navigate = useNavigate();
  const { refreshProfile } = useAuth();
  const [user, setUser] = useState<CargooUser | null>(null);
  const [trips, setTrips] = useState<CargooTrip[]>([]);
  const [savingVisibility, setSavingVisibility] = useState(false);
  const [uploadingAvatar, setUploadingAvatar] = useState(false);
  const [savingNotifications, setSavingNotifications] = useState(false);
  const [notificationsEnabled, setNotificationsEnabled] = useState(true);
  const [notificationPermission, setNotificationPermission] = useState(getNotificationPermissionState());
  const [ratingSummary, setRatingSummary] = useState<TravelerRatingSummary>({
    averageRating: null,
    reviewsCount: 0,
  });
  const [loading, setLoading] = useState(true);
  const avatarInputRef = useRef<HTMLInputElement | null>(null);

  useEffect(() => {
    const loadData = async () => {
      try {
        const profile = await getCurrentUser();
        setUser(profile);

        const { data: preferences, error: preferencesError } = await supabase
          .from("preferences")
          .select("notifications_enabled")
          .eq("user_id", profile.userId)
          .maybeSingle();

        if (preferencesError) {
          throw preferencesError;
        }

        const pushEnabled = preferences?.notifications_enabled ?? true;
        setNotificationsEnabled(pushEnabled);
        setNotificationPermission(getNotificationPermissionState());

        if (pushEnabled && getNotificationPermissionState() === "granted") {
          void syncPushSubscription(profile.userId, { requestPermission: false }).catch(() => {
            // Silent sync only keeps the subscription stored remotely.
          });
        }

        if (profile.isTraveler) {
          const userTrips = await getTrips();
          setTrips(userTrips);
          setRatingSummary(await getTravelerRatingSummary(profile.userId));
        } else {
          setTrips([]);
          setRatingSummary({
            averageRating: null,
            reviewsCount: 0,
          });
        }
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

  const handleNotificationsChange = async (enabled: boolean) => {
    if (!user) {
      return;
    }

    setSavingNotifications(true);

    try {
      if (enabled) {
        await syncPushSubscription(user.userId, { requestPermission: true, forceRefresh: true });
      } else {
        await removePushSubscription();
      }

      const { error } = await supabase
        .from("preferences")
        .update({ notifications_enabled: enabled })
        .eq("user_id", user.userId);

      if (error) {
        throw error;
      }

      setNotificationsEnabled(enabled);
      setNotificationPermission(getNotificationPermissionState());
      toast.success(enabled ? "Notificaciones push activadas." : "Notificaciones push desactivadas.");
    } catch (error) {
      setNotificationPermission(getNotificationPermissionState());
      toast.error(getFriendlyErrorMessage(error));
    } finally {
      setSavingNotifications(false);
    }
  };

  const handleOpenAvatarPicker = () => {
    avatarInputRef.current?.click();
  };

  const handleAvatarChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) {
      return;
    }

    setUploadingAvatar(true);

    try {
      const updatedUser = await uploadCurrentUserAvatar(file);
      setUser(updatedUser);
      await refreshProfile();
      toast.success("Foto de perfil actualizada.");
    } catch (error) {
      toast.error(getFriendlyErrorMessage(error));
    } finally {
      event.target.value = "";
      setUploadingAvatar(false);
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

  const menuItems = user.isTraveler
    ? [
        { label: "Editar perfil", to: "/app/profile/edit", icon: Settings },
        { label: "Mensajes", to: "/app/messages", icon: MessageSquare },
        { label: "Mis viajes", to: "/app/trips", icon: Package },
      ]
    : [{ label: "Editar perfil", to: "/app/profile/edit", icon: Settings }];
  const ratingLabel =
    ratingSummary.averageRating !== null ? String(ratingSummary.averageRating.toFixed(1)).replace(".", ",") : "Nueva";
  const ratingCaption =
    ratingSummary.averageRating !== null
      ? `${ratingSummary.reviewsCount} valoracion(es)`
      : "Sin valoraciones";

  return (
    <div className="mx-auto max-w-lg px-4 pt-6">
      <div className="mb-6 text-center">
        <div className="relative mb-3 inline-block">
          <Avatar className="h-24 w-24 border-4 border-primary/20">
            <AvatarImage src={user.avatarUrl} alt={user.name} />
            <AvatarFallback className="bg-primary/10 text-2xl font-bold text-primary">{initials}</AvatarFallback>
          </Avatar>
          <button
            type="button"
            className="absolute bottom-0 right-0 flex h-8 w-8 items-center justify-center rounded-full bg-primary shadow-lg"
            onClick={handleOpenAvatarPicker}
            disabled={uploadingAvatar}
            aria-label="Cambiar foto de perfil"
          >
            <Camera className="h-4 w-4 text-primary-foreground" />
          </button>
          <input
            ref={avatarInputRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={handleAvatarChange}
            disabled={uploadingAvatar}
          />
        </div>
        <h1 className="text-xl font-display font-bold">{user.name}</h1>
        <p className="mt-1 flex items-center justify-center gap-1 text-sm text-muted-foreground">
          <MapPin className="h-3 w-3" /> {user.location}
        </p>
        {user.isTraveler ? (
          <div className="mt-3 flex items-center justify-center gap-4">
            <div className="text-center">
              <p className="text-lg font-bold">{stats.totalTrips}</p>
              <p className="text-[10px] text-muted-foreground">Viajes</p>
            </div>
            <Separator orientation="vertical" className="h-8" />
            <div className="text-center">
              <p className="flex items-center gap-1 text-lg font-bold">
                {ratingLabel} <Star className="h-3 w-3 fill-warning text-warning" />
              </p>
              <p className="text-[10px] text-muted-foreground">{ratingCaption}</p>
            </div>
            <Separator orientation="vertical" className="h-8" />
            <div className="text-center">
              <p className="text-lg font-bold">{stats.pendingRequests}</p>
              <p className="text-[10px] text-muted-foreground">Solicitudes</p>
            </div>
          </div>
        ) : null}
      </div>

      {user.isTraveler ? (
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
      ) : (
        <div className="mb-4 rounded-xl bg-card p-4 shadow-card">
          <div className="flex items-center gap-3">
            <Settings className="h-5 w-5 text-primary" />
            <div>
              <p className="text-sm font-medium">Ajustes de cuenta</p>
              <p className="text-xs text-muted-foreground">
                Aqui puedes cambiar tu foto de perfil y editar la informacion de tu cuenta.
              </p>
            </div>
          </div>
        </div>
      )}

      <div className="mb-4 flex items-center gap-3 rounded-xl bg-card p-4 shadow-card">
        <div className="flex h-10 w-10 items-center justify-center rounded-full bg-success/10">
          <Badge className="bg-success px-2 text-[10px] text-success-foreground">OK</Badge>
        </div>
        <div>
          <p className="text-sm font-medium">{user.isTraveler ? "Identidad verificada" : "Cuenta activa"}</p>
          <p className="text-xs text-muted-foreground">
            {user.isTraveler
              ? "Cuenta conectada a Supabase y datos guardados en la base"
              : "Tu cuenta esta conectada y lista para usar la app con normalidad."}
          </p>
        </div>
      </div>

      <div className="mb-4 rounded-xl bg-card p-4 shadow-card">
        <div className="flex items-center justify-between gap-3">
          <div>
            <p className="text-sm font-medium">Notificaciones push</p>
            <p className="text-xs text-muted-foreground">
              {notificationPermission === "granted"
                ? "Recibe avisos de mensajes, checkpoints y entregas."
                : notificationPermission === "denied"
                  ? "El navegador ha bloqueado los permisos. Tienes que reactivarlos en la configuracion del sitio."
                  : "Recibe avisos de mensajes, checkpoints y entregas al activar esta opcion."}
            </p>
          </div>
          <Switch checked={notificationsEnabled} onCheckedChange={handleNotificationsChange} disabled={savingNotifications} />
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
