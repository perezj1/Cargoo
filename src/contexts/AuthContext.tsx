import { createContext, type ReactNode, useContext, useEffect, useMemo, useState } from "react";
import type { Session, User } from "@supabase/supabase-js";

import { supabase } from "@/integrations/supabase/client";
import { getCurrentUser, type CargooUser } from "@/lib/cargoo-store";

interface AuthContextValue {
  user: User | null;
  session: Session | null;
  profile: CargooUser | null;
  loading: boolean;
  profileLoading: boolean;
  refreshSession: () => Promise<void>;
  refreshProfile: () => Promise<void>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [profile, setProfile] = useState<CargooUser | null>(null);
  const [loading, setLoading] = useState(true);
  const [profileLoading, setProfileLoading] = useState(true);

  const refreshProfile = async () => {
    const {
      data: { session: activeSession },
    } = await supabase.auth.getSession();

    if (!activeSession?.user) {
      setProfile(null);
      setProfileLoading(false);
      return;
    }

    setProfileLoading(true);
    try {
      setProfile(await getCurrentUser());
    } catch {
      setProfile(null);
    } finally {
      setProfileLoading(false);
    }
  };

  const refreshSession = async () => {
    try {
      const {
        data: { session: nextSession },
      } = await supabase.auth.getSession();

      setSession(nextSession);
      setUser(nextSession?.user ?? null);
      if (nextSession?.user) {
        void refreshProfile();
      } else {
        setProfile(null);
        setProfileLoading(false);
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void refreshSession();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (_event, nextSession) => {
      try {
        setSession(nextSession);
        setUser(nextSession?.user ?? null);
        if (nextSession?.user) {
          void refreshProfile();
        } else {
          setProfile(null);
          setProfileLoading(false);
        }
      } finally {
        setLoading(false);
      }
    });

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  const signOut = async () => {
    const { error } = await supabase.auth.signOut();

    if (error) {
      throw error;
    }

    setProfile(null);
  };

  const value = useMemo(
    () => ({
      user,
      session,
      profile,
      loading,
      profileLoading,
      refreshSession,
      refreshProfile,
      signOut,
    }),
    [loading, profile, profileLoading, session, user],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  const context = useContext(AuthContext);

  if (!context) {
    throw new Error("useAuth debe usarse dentro de AuthProvider.");
  }

  return context;
};
