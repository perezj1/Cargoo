import { useEffect } from "react";
import { useLocation } from "react-router-dom";

const ScrollToTop = () => {
  const { pathname, hash } = useLocation();

  useEffect(() => {
    if (typeof window === "undefined") {
      return;
    }

    window.history.scrollRestoration = "manual";

    if (hash) {
      let frame = 0;

      const scrollToHash = () => {
        const target = document.getElementById(hash.slice(1));
        if (target) {
          target.scrollIntoView({ behavior: "auto", block: "start" });
          return;
        }

        frame += 1;
        if (frame < 10) {
          window.requestAnimationFrame(scrollToHash);
        }
      };

      window.requestAnimationFrame(scrollToHash);
      return;
    }

    window.scrollTo({ top: 0, left: 0, behavior: "auto" });
  }, [pathname, hash]);

  return null;
};

export default ScrollToTop;
