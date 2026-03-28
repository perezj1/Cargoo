import { useEffect } from "react";
import { useLocation } from "react-router-dom";

const FALLBACK_THEME_COLOR = "#FCFAF8";

const ThemeColorSync = () => {
  const location = useLocation();

  useEffect(() => {
    if (typeof document === "undefined") {
      return;
    }

    const themeColorMeta = document.querySelector('meta[name="theme-color"]');
    if (!themeColorMeta) {
      return;
    }

    const frameId = window.requestAnimationFrame(() => {
      const bodyBackground = window.getComputedStyle(document.body).backgroundColor;
      themeColorMeta.setAttribute("content", bodyBackground || FALLBACK_THEME_COLOR);
    });

    return () => {
      window.cancelAnimationFrame(frameId);
    };
  }, [location.pathname, location.search]);

  return null;
};

export default ThemeColorSync;
