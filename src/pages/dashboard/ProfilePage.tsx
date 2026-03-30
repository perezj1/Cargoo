import { useEffect, useRef, useState } from "react";
import { Camera, ChevronRight, Download, EyeOff, Globe, LogOut, Mail, MapPin, MessageSquare, Package, Phone, Star, User } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import { toast } from "sonner";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import LanguageSwitcher from "@/components/LanguageSwitcher";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { useAuth } from "@/contexts/AuthContext";
import { useLocale } from "@/contexts/LocaleContext";
import { requestGlobalInstallPrompt, useAppInstallPrompt } from "@/hooks/use-app-install-prompt";
import { supabase } from "@/integrations/supabase/client";
import {
  getCurrentUser,
  getFriendlyErrorMessage,
  getProfileRatingSummary,
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

const NAV_REFRESH_EVENT = "cargoo:nav-refresh";
type ProfileFormState = {
  name: string;
  email: string;
  phone: string;
  location: string;
  bio: string;
};

const ProfilePage = () => {
  const navigate = useNavigate();
  const { refreshProfile } = useAuth();
  const { intlLocale, messages } = useLocale();
  const [user, setUser] = useState<CargooUser | null>(null);
  const [trips, setTrips] = useState<CargooTrip[]>([]);
  const [savingVisibility, setSavingVisibility] = useState(false);
  const [uploadingAvatar, setUploadingAvatar] = useState(false);
  const [savingProfile, setSavingProfile] = useState(false);
  const [savingNotifications, setSavingNotifications] = useState(false);
  const [notificationsEnabled, setNotificationsEnabled] = useState(false);
  const [notificationPermission, setNotificationPermission] = useState(getNotificationPermissionState());
  const [focusedField, setFocusedField] = useState<keyof ProfileFormState | null>(null);
  const [ratingSummary, setRatingSummary] = useState<TravelerRatingSummary>({
    averageRating: null,
    reviewsCount: 0,
  });
  const [loading, setLoading] = useState(true);
  const [profileForm, setProfileForm] = useState<ProfileFormState>({
    name: "",
    email: "",
    phone: "",
    location: "",
    bio: "",
  });
  const avatarInputRef = useRef<HTMLInputElement | null>(null);
  const { canRenderInstallEntry, isStandalone } = useAppInstallPrompt({ enabled: true });

  useEffect(() => {
    const loadData = async () => {
      try {
        const profile = await getCurrentUser();
        setUser(profile);
        setProfileForm({
          name: profile.name,
          email: profile.email,
          phone: profile.phone,
          location: profile.location,
          bio: profile.bio,
        });

        const { data: preferences, error: preferencesError } = await supabase
          .from("preferences")
          .select("notifications_enabled")
          .eq("user_id", profile.userId)
          .maybeSingle();

        if (preferencesError) {
          throw preferencesError;
        }

        const pushEnabled = preferences?.notifications_enabled ?? false;
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
          setRatingSummary(await getProfileRatingSummary(profile.userId, true));
        } else {
          setTrips([]);
          setRatingSummary(await getProfileRatingSummary(profile.userId, false));
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
      toast.success(messages.appProfile.visibilityUpdated);
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

  const updateProfileField = (field: keyof ProfileFormState, value: string) => {
    setProfileForm((prev) => ({ ...prev, [field]: value }));
  };

  const handleSaveProfile = async () => {
    if (!user) {
      return;
    }

    setSavingProfile(true);

    try {
      const updatedUser = await updateCurrentUser(profileForm);
      setUser(updatedUser);
      setProfileForm({
        name: updatedUser.name,
        email: updatedUser.email,
        phone: updatedUser.phone,
        location: updatedUser.location,
        bio: updatedUser.bio,
      });
      await refreshProfile();
      window.dispatchEvent(new Event(NAV_REFRESH_EVENT));
      toast.success(messages.editProfilePage.updatedSuccess);
    } catch (error) {
      toast.error(getFriendlyErrorMessage(error));
    } finally {
      setSavingProfile(false);
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
        .upsert({ user_id: user.userId, notifications_enabled: enabled }, { onConflict: "user_id" });

      if (error) {
        throw error;
      }

      setNotificationsEnabled(enabled);
      setNotificationPermission(getNotificationPermissionState());
      window.dispatchEvent(new Event(NAV_REFRESH_EVENT));
      toast.success(enabled ? messages.appProfile.notificationsEnabledToast : messages.appProfile.notificationsDisabledToast);
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
      toast.success(messages.appProfile.avatarUpdated);
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
        { label: messages.appProfile.reviews, to: "/app/profile/reviews", icon: Star },
        { label: messages.appProfile.messages, to: "/app/messages", icon: MessageSquare },
        { label: messages.appProfile.myTrips, to: "/app/trips", icon: Package },
      ]
    : [{ label: messages.appProfile.reviews, to: "/app/profile/reviews", icon: Star }];
  const ratingLabel =
    ratingSummary.averageRating !== null
      ? new Intl.NumberFormat(intlLocale, { minimumFractionDigits: 1, maximumFractionDigits: 1 }).format(ratingSummary.averageRating)
      : messages.common.newLabel;
  const ratingCaption =
    ratingSummary.averageRating !== null ? messages.appProfile.reviewsCount(ratingSummary.reviewsCount) : messages.common.noReviewsYet;
  const needsPhoneAttention = Boolean(user.isTraveler && !profileForm.phone.trim());
  const needsNotificationsAttention = !notificationsEnabled;
  const getFieldPlaceholder = (field: keyof ProfileFormState) => {
    if (focusedField === field || profileForm[field].trim()) {
      return "";
    }

    return messages.editProfilePage.tapToEditPlaceholder;
  };
  const handleOpenInstallPrompt = () => {
    if (isStandalone) {
      toast.success(messages.appProfile.installAppAlreadyInstalled);
      return;
    }

    requestGlobalInstallPrompt();
  };

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
            aria-label={messages.appProfile.changeAvatar}
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
        {user.location.trim() ? (
          <p className="mt-1 flex items-center justify-center gap-1 text-sm text-muted-foreground">
            <MapPin className="h-3 w-3" /> {user.location}
          </p>
        ) : null}
        {user.isTraveler || ratingSummary.averageRating !== null || ratingSummary.reviewsCount > 0 ? (
          <div className="mt-3 flex items-center justify-center gap-5">
            {user.isTraveler ? (
              <>
                <div className="text-center">
                  <p className="text-lg font-bold">{stats.totalTrips}</p>
                  <p className="text-[10px] text-muted-foreground">{messages.appProfile.trips}</p>
                </div>
                <Separator orientation="vertical" className="h-8" />
              </>
            ) : null}
            <div className="text-center">
              <p className="flex items-center gap-1 text-lg font-bold">
                {ratingLabel} <Star className="h-3 w-3 fill-warning text-warning" />
              </p>
              <p className="text-[10px] text-muted-foreground">{ratingCaption}</p>
            </div>
          </div>
        ) : null}
      </div>

      {user.isTraveler && (
        <div className="mb-4 rounded-xl bg-card p-4 shadow-card">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              {user.isPublic ? <Globe className="h-5 w-5 text-primary" /> : <EyeOff className="h-5 w-5 text-muted-foreground" />}
              <div>
                <p className="text-sm font-medium">{user.isPublic ? messages.appProfile.profilePublic : messages.appProfile.profilePrivate}</p>
                <p className="text-xs text-muted-foreground">{user.isPublic ? messages.appProfile.visibleToAll : messages.appProfile.visibleToRegistered}</p>
              </div>
            </div>
            <Switch checked={user.isPublic} onCheckedChange={handleVisibilityChange} disabled={savingVisibility} />
          </div>
        </div>
      )}

      <div className="mb-4 rounded-xl bg-card p-4 shadow-card">
        <p className="text-sm font-medium">{messages.appProfile.profileDetailsTitle}</p>
        <div className="mt-3 space-y-3">
          <div className="rounded-xl bg-secondary/70 p-3">
            <div className="flex items-start gap-3">
              <User className="mt-0.5 h-4 w-4 shrink-0 text-muted-foreground" />
              <div className="min-w-0 flex-1">
                <p className="text-[11px] font-medium uppercase tracking-wide text-muted-foreground">{messages.editProfilePage.fullName}</p>
                <Input
                  value={profileForm.name}
                  onChange={(event) => updateProfileField("name", event.target.value)}
                  onFocus={() => setFocusedField("name")}
                  onBlur={() => setFocusedField(null)}
                  placeholder={getFieldPlaceholder("name")}
                  className="mt-1 h-auto border-0 bg-transparent px-0.5 py-0 text-sm text-foreground shadow-none focus-visible:ring-0 focus-visible:ring-offset-0"
                />
              </div>
            </div>
          </div>
          <div className="rounded-xl bg-secondary/70 p-3">
            <div className="flex items-start gap-3">
              <Mail className="mt-0.5 h-4 w-4 shrink-0 text-muted-foreground" />
              <div className="min-w-0 flex-1">
                <p className="text-[11px] font-medium uppercase tracking-wide text-muted-foreground">{messages.editProfilePage.email}</p>
                <Input
                  type="email"
                  value={profileForm.email}
                  onChange={(event) => updateProfileField("email", event.target.value)}
                  onFocus={() => setFocusedField("email")}
                  onBlur={() => setFocusedField(null)}
                  placeholder={getFieldPlaceholder("email")}
                  className="mt-1 h-auto border-0 bg-transparent px-0.5 py-0 text-sm text-foreground shadow-none focus-visible:ring-0 focus-visible:ring-offset-0"
                />
              </div>
            </div>
          </div>
          {user.isTraveler ? (
            <>
              <div className="space-y-2">
                <div className="rounded-xl bg-secondary/70 p-3">
                  <div className="flex items-start gap-3">
                    <Phone className="mt-0.5 h-4 w-4 shrink-0 text-muted-foreground" />
                    <div className="min-w-0 flex-1">
                      <p className="text-[11px] font-medium uppercase tracking-wide text-muted-foreground">{messages.editProfilePage.phone}</p>
                      <Input
                        type="tel"
                        value={profileForm.phone}
                        onChange={(event) => updateProfileField("phone", event.target.value)}
                        onFocus={() => setFocusedField("phone")}
                        onBlur={() => setFocusedField(null)}
                        placeholder={getFieldPlaceholder("phone")}
                        className={`mt-1 h-auto border-0 bg-transparent px-0.5 py-0 text-sm text-foreground shadow-none focus-visible:ring-0 focus-visible:ring-offset-0 ${needsPhoneAttention ? "placeholder:text-destructive" : ""}`}
                      />
                    </div>
                  </div>
                </div>
                {needsPhoneAttention ? <p className="px-1 text-xs text-destructive">{messages.appProfile.phoneMissingHint}</p> : null}
              </div>
            </>
          ) : null}
          <div className="rounded-xl bg-secondary/70 p-3">
            <div className="flex items-start gap-3">
              <MapPin className="mt-0.5 h-4 w-4 shrink-0 text-muted-foreground" />
              <div className="min-w-0 flex-1">
                <p className="text-[11px] font-medium uppercase tracking-wide text-muted-foreground">{messages.editProfilePage.location}</p>
                <Input
                  value={profileForm.location}
                  onChange={(event) => updateProfileField("location", event.target.value)}
                  onFocus={() => setFocusedField("location")}
                  onBlur={() => setFocusedField(null)}
                  placeholder={getFieldPlaceholder("location")}
                  className="mt-1 h-auto border-0 bg-transparent px-0.5 py-0 text-sm text-foreground shadow-none focus-visible:ring-0 focus-visible:ring-offset-0"
                />
              </div>
            </div>
          </div>
          <div className="rounded-xl bg-secondary/70 p-3">
            <div className="flex items-start gap-3">
              <MessageSquare className="mt-0.5 h-4 w-4 shrink-0 text-muted-foreground" />
              <div className="min-w-0 flex-1">
                <p className="text-[11px] font-medium uppercase tracking-wide text-muted-foreground">{messages.editProfilePage.bio}</p>
                <Textarea
                  rows={3}
                  value={profileForm.bio}
                  onChange={(event) => updateProfileField("bio", event.target.value)}
                  onFocus={() => setFocusedField("bio")}
                  onBlur={() => setFocusedField(null)}
                  placeholder={getFieldPlaceholder("bio")}
                  className="mt-1 block min-h-0 w-full resize-none border-0 bg-transparent px-0.5 py-0 text-sm leading-relaxed text-foreground shadow-none focus-visible:ring-0 focus-visible:ring-offset-0"
                />
              </div>
            </div>
          </div>
        </div>
        <Button className="mt-4 w-full" size="lg" onClick={() => void handleSaveProfile()} disabled={savingProfile}>
          {savingProfile ? messages.common.saving : messages.editProfilePage.saveChanges}
        </Button>
      </div>

      <div className="mb-4 rounded-xl bg-card p-4 shadow-card">
        <p className="text-sm font-medium">{messages.appProfile.languageTitle}</p>
        <p className="mt-1 text-xs text-muted-foreground">{messages.appProfile.languageDescription}</p>
        <LanguageSwitcher compact className="mt-3 w-full" />
      </div>

      <div className={`mb-4 rounded-xl bg-card p-4 shadow-card ${needsNotificationsAttention ? "border border-destructive/30" : ""}`}>
        <div className="flex items-center justify-between gap-3">
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2">
              {needsNotificationsAttention ? <span className="h-2.5 w-2.5 shrink-0 rounded-full bg-destructive" /> : null}
              <p className="text-sm font-medium">{messages.appProfile.notificationsTitle}</p>
            </div>
            <p className="text-xs text-muted-foreground">
              {notificationsEnabled
                ? messages.appProfile.notificationsEnabledDescription
                : notificationPermission === "denied"
                  ? messages.appProfile.notificationsDeniedDescription
                  : messages.appProfile.notificationsDefaultDescription}
            </p>
          </div>
          <Switch checked={notificationsEnabled} onCheckedChange={handleNotificationsChange} disabled={savingNotifications} />
        </div>
        {needsNotificationsAttention ? <p className="mt-3 text-xs text-destructive">{messages.appProfile.notificationsMissingHint}</p> : null}
      </div>

      {canRenderInstallEntry ? (
        <div className="mb-4 rounded-xl bg-card p-4 shadow-card">
          <p className="text-sm font-medium">{messages.appProfile.installAppTitle}</p>
          <p className="mt-1 text-xs text-muted-foreground">
            {user.isTraveler ? messages.appProfile.installAppDescriptionTraveler : messages.appProfile.installAppDescriptionSender}
          </p>
          <Button className="mt-3 w-full gap-2" onClick={handleOpenInstallPrompt}>
            <Download className="h-4 w-4" />
            {messages.appProfile.installAppButton}
          </Button>
        </div>
      ) : null}

      {menuItems.length > 0 ? (
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
      ) : null}

      <Button
        variant="ghost"
        className="w-full gap-2 text-destructive hover:bg-destructive/10 hover:text-destructive"
        onClick={handleLogout}
      >
        <LogOut className="h-4 w-4" />
        {messages.appProfile.logout}
      </Button>
    </div>
  );
};

export default ProfilePage;
