import { useLayoutEffect, useRef } from "react";
import { useLocation, useNavigationType } from "react-router-dom";

const STORAGE_KEY = "exchange-scroll-positions";

type ScrollPositions = Record<string, number>;

function readPositions(): ScrollPositions {
  try {
    const saved = sessionStorage.getItem(STORAGE_KEY);
    return saved ? (JSON.parse(saved) as ScrollPositions) : {};
  } catch {
    return {};
  }
}

function savePosition(key: string, value: number): void {
  const positions = readPositions();
  positions[key] = Math.max(0, value);
  sessionStorage.setItem(STORAGE_KEY, JSON.stringify(positions));
}

function getPosition(key: string): number {
  return readPositions()[key] ?? 0;
}

export default function ScrollRestoration() {
  const location = useLocation();
  const navigationType = useNavigationType();
  const previousKey = useRef(location.key);

  useLayoutEffect(() => {
    if ("scrollRestoration" in window.history) {
      window.history.scrollRestoration = "manual";
    }

    if (previousKey.current !== location.key) {
      savePosition(previousKey.current, window.scrollY);
      previousKey.current = location.key;
    }

    const target = navigationType === "POP" ? getPosition(location.key) : 0;
    let cancelled = false;
    let retryTimer: number | undefined;
    let attempts = 0;

    const restore = () => {
      if (cancelled) return;
      const maxScroll = Math.max(0, document.documentElement.scrollHeight - window.innerHeight);
      window.scrollTo({ top: Math.min(target, maxScroll), left: 0, behavior: "auto" });

      if (target > maxScroll && attempts < 20) {
        attempts += 1;
        retryTimer = window.setTimeout(restore, 50);
      }
    };

    window.requestAnimationFrame(restore);

    const handlePageHide = () => savePosition(location.key, window.scrollY);
    window.addEventListener("pagehide", handlePageHide);

    return () => {
      cancelled = true;
      if (retryTimer !== undefined) window.clearTimeout(retryTimer);
      window.removeEventListener("pagehide", handlePageHide);
    };
  }, [location.key, navigationType]);

  return null;
}
