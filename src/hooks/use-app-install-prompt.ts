import { useEffect, useMemo, useState } from "react";

export interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{
    outcome: "accepted" | "dismissed";
    platform: string;
  }>;
}

const OPEN_INSTALL_PROMPT_EVENT = "cargoo:open-install-prompt";
const INSTALL_PROMPT_AFTER_LOGIN_KEY = "cargoo:install-prompt-after-login";
const INSTALL_PROMPT_INSTALLED_KEY = "cargoo:install-prompt-installed";

type InstallPromptSnapshot = {
  deferredPrompt: BeforeInstallPromptEvent | null;
  isIos: boolean;
  isAndroid: boolean;
  isStandalone: boolean;
  isInstalled: boolean;
  shouldPromptAfterLogin: boolean;
};

const listeners = new Set<(snapshot: InstallPromptSnapshot) => void>();

const getPlatformSnapshot = () => {
  if (typeof window === "undefined") {
    return { isIos: false, isAndroid: false, isStandalone: false };
  }

  const userAgent = window.navigator.userAgent.toLowerCase();
  const navigatorWithStandalone = window.navigator as Navigator & { standalone?: boolean };

  return {
    isIos: /iphone|ipad|ipod/.test(userAgent),
    isAndroid: /android/.test(userAgent),
    isStandalone: window.matchMedia("(display-mode: standalone)").matches || navigatorWithStandalone.standalone === true,
  };
};

const getStoredInstallPromptState = () => {
  if (typeof window === "undefined") {
    return {
      isInstalled: false,
      shouldPromptAfterLogin: false,
    };
  }

  return {
    isInstalled: window.localStorage.getItem(INSTALL_PROMPT_INSTALLED_KEY) === "1",
    shouldPromptAfterLogin: window.sessionStorage.getItem(INSTALL_PROMPT_AFTER_LOGIN_KEY) === "1",
  };
};

const persistInstalledState = () => {
  if (typeof window === "undefined") {
    return;
  }

  window.localStorage.setItem(INSTALL_PROMPT_INSTALLED_KEY, "1");
  window.sessionStorage.removeItem(INSTALL_PROMPT_AFTER_LOGIN_KEY);
};

const clearLoginPromptState = () => {
  if (typeof window === "undefined") {
    return;
  }

  window.sessionStorage.removeItem(INSTALL_PROMPT_AFTER_LOGIN_KEY);
};

const createSnapshot = (deferredPrompt: BeforeInstallPromptEvent | null): InstallPromptSnapshot => {
  const platform = getPlatformSnapshot();
  const storedState = getStoredInstallPromptState();
  const isInstalled = platform.isStandalone || storedState.isInstalled;

  return {
    deferredPrompt: isInstalled ? null : deferredPrompt,
    ...platform,
    isInstalled,
    shouldPromptAfterLogin: !isInstalled && storedState.shouldPromptAfterLogin,
  };
};

let sharedSnapshot: InstallPromptSnapshot = {
  ...createSnapshot(null),
};
let initialized = false;

const emitSnapshot = () => {
  listeners.forEach((listener) => listener(sharedSnapshot));
};

const setSharedSnapshot = (nextSnapshot: InstallPromptSnapshot) => {
  sharedSnapshot = nextSnapshot;
  emitSnapshot();
};

const initializeInstallPromptStore = () => {
  if (initialized || typeof window === "undefined") {
    return;
  }

  initialized = true;
  if (getPlatformSnapshot().isStandalone) {
    persistInstalledState();
  }
  sharedSnapshot = createSnapshot(null);

  const handleBeforeInstallPrompt = (event: Event) => {
    const installEvent = event as BeforeInstallPromptEvent;
    installEvent.preventDefault();
    setSharedSnapshot(createSnapshot(installEvent));
  };

  const handleInstalled = () => {
    persistInstalledState();
    setSharedSnapshot(createSnapshot(null));
  };

  const handlePlatformChange = () => {
    if (getPlatformSnapshot().isStandalone) {
      persistInstalledState();
    }

    setSharedSnapshot(createSnapshot(sharedSnapshot.deferredPrompt));
  };

  window.addEventListener("beforeinstallprompt", handleBeforeInstallPrompt);
  window.addEventListener("appinstalled", handleInstalled);
  window.addEventListener("focus", handlePlatformChange);

  const mediaQuery = window.matchMedia("(display-mode: standalone)");
  if ("addEventListener" in mediaQuery) {
    mediaQuery.addEventListener("change", handlePlatformChange);
  } else if ("addListener" in mediaQuery) {
    mediaQuery.addListener(handlePlatformChange);
  }
};

const subscribeToInstallPrompt = (listener: (snapshot: InstallPromptSnapshot) => void) => {
  initializeInstallPromptStore();
  listeners.add(listener);
  listener(sharedSnapshot);

  return () => {
    listeners.delete(listener);
  };
};

export const initializeAppInstallPrompt = () => {
  initializeInstallPromptStore();
};

export const markInstallPromptPendingAfterLogin = () => {
  if (typeof window === "undefined" || window.localStorage.getItem(INSTALL_PROMPT_INSTALLED_KEY) === "1") {
    return;
  }

  window.sessionStorage.setItem(INSTALL_PROMPT_AFTER_LOGIN_KEY, "1");
  setSharedSnapshot(createSnapshot(sharedSnapshot.deferredPrompt));
};

export const requestGlobalInstallPrompt = () => {
  if (typeof window !== "undefined") {
    window.dispatchEvent(new Event(OPEN_INSTALL_PROMPT_EVENT));
  }
};

export const useAppInstallPrompt = ({ enabled = true }: { enabled?: boolean } = {}) => {
  const [snapshot, setSnapshot] = useState<InstallPromptSnapshot>(sharedSnapshot);
  const [open, setOpen] = useState(false);
  const [installing, setInstalling] = useState(false);

  useEffect(() => subscribeToInstallPrompt(setSnapshot), []);

  const canRenderInstallEntry = useMemo(
    () => enabled && !snapshot.isInstalled && !snapshot.isStandalone && (snapshot.isIos || snapshot.isAndroid),
    [enabled, snapshot.isAndroid, snapshot.isInstalled, snapshot.isIos, snapshot.isStandalone],
  );

  const canShowInstallEntry = useMemo(
    () => enabled && snapshot.shouldPromptAfterLogin && !snapshot.isInstalled && !snapshot.isStandalone && (snapshot.isIos || (snapshot.isAndroid && Boolean(snapshot.deferredPrompt))),
    [enabled, snapshot.deferredPrompt, snapshot.isAndroid, snapshot.isInstalled, snapshot.isIos, snapshot.isStandalone, snapshot.shouldPromptAfterLogin],
  );

  useEffect(() => {
    if (!enabled || snapshot.isStandalone || snapshot.isInstalled) {
      setOpen(false);
    }
  }, [enabled, snapshot.isInstalled, snapshot.isStandalone]);

  useEffect(() => {
    if (typeof window === "undefined") {
      return;
    }

    const handleOpenRequest = () => {
      if (canRenderInstallEntry) {
        setOpen(true);
      }
    };

    window.addEventListener(OPEN_INSTALL_PROMPT_EVENT, handleOpenRequest);

    return () => {
      window.removeEventListener(OPEN_INSTALL_PROMPT_EVENT, handleOpenRequest);
    };
  }, [canRenderInstallEntry]);

  const closePrompt = () => {
    clearLoginPromptState();
    setSharedSnapshot(createSnapshot(sharedSnapshot.deferredPrompt));
    setOpen(false);
  };

  const handleInstall = async () => {
    if (!snapshot.deferredPrompt) {
      closePrompt();
      return;
    }

    setInstalling(true);

    try {
      await snapshot.deferredPrompt.prompt();
      const { outcome } = await snapshot.deferredPrompt.userChoice;

      if (outcome === "accepted") {
        persistInstalledState();
      }

      setSharedSnapshot(createSnapshot(null));
      closePrompt();
    } finally {
      setInstalling(false);
    }
  };

  return {
    ...snapshot,
    open,
    setOpen,
    installing,
    canRenderInstallEntry,
    canShowInstallEntry,
    closePrompt,
    handleInstall,
  };
};
