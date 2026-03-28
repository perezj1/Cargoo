import { useEffect, useMemo, useState } from "react";

export interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{
    outcome: "accepted" | "dismissed";
    platform: string;
  }>;
}

const OPEN_INSTALL_PROMPT_EVENT = "cargoo:open-install-prompt";

type InstallPromptSnapshot = {
  deferredPrompt: BeforeInstallPromptEvent | null;
  isIos: boolean;
  isAndroid: boolean;
  isStandalone: boolean;
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

let sharedSnapshot: InstallPromptSnapshot = {
  deferredPrompt: null,
  ...getPlatformSnapshot(),
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
  sharedSnapshot = {
    deferredPrompt: null,
    ...getPlatformSnapshot(),
  };

  const handleBeforeInstallPrompt = (event: Event) => {
    const installEvent = event as BeforeInstallPromptEvent;
    installEvent.preventDefault();
    setSharedSnapshot({
      deferredPrompt: installEvent,
      ...getPlatformSnapshot(),
    });
  };

  const handleInstalled = () => {
    setSharedSnapshot({
      deferredPrompt: null,
      ...getPlatformSnapshot(),
    });
  };

  const handlePlatformChange = () => {
    const nextPlatform = getPlatformSnapshot();

    setSharedSnapshot({
      deferredPrompt: nextPlatform.isStandalone ? null : sharedSnapshot.deferredPrompt,
      ...nextPlatform,
    });
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

  const canShowInstallEntry = useMemo(
    () => enabled && !snapshot.isStandalone && (snapshot.isIos || (snapshot.isAndroid && Boolean(snapshot.deferredPrompt))),
    [enabled, snapshot.deferredPrompt, snapshot.isAndroid, snapshot.isIos, snapshot.isStandalone],
  );

  useEffect(() => {
    if (!enabled || snapshot.isStandalone) {
      setOpen(false);
    }
  }, [enabled, snapshot.isStandalone]);

  useEffect(() => {
    if (typeof window === "undefined") {
      return;
    }

    const handleOpenRequest = () => {
      if (canShowInstallEntry) {
        setOpen(true);
      }
    };

    window.addEventListener(OPEN_INSTALL_PROMPT_EVENT, handleOpenRequest);

    return () => {
      window.removeEventListener(OPEN_INSTALL_PROMPT_EVENT, handleOpenRequest);
    };
  }, [canShowInstallEntry]);

  const closePrompt = () => {
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
      await snapshot.deferredPrompt.userChoice;
      setSharedSnapshot({
        deferredPrompt: null,
        ...getPlatformSnapshot(),
      });
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
    canShowInstallEntry,
    closePrompt,
    handleInstall,
  };
};
