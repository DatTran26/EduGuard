import { useEffect, useRef } from "react";
import { useLocation } from "react-router-dom";
import { useAuth } from "../../hooks/useAuth";
import { devLog } from "../../utils/devLogger";

export default function DevRouteLogger() {
  const location = useLocation();
  const { isAuthenticated, user } = useAuth();
  const previousPathRef = useRef("");

  useEffect(() => {
    if (!devLog.isEnabled) {
      return;
    }

    const path = `${location.pathname}${location.search}`;
    if (previousPathRef.current === path) {
      return;
    }

    previousPathRef.current = path;
    devLog.route(`Navigate → ${path}`, {
      role: user?.role ?? "guest",
      authenticated: isAuthenticated,
    });
  }, [isAuthenticated, location.pathname, location.search, user?.role]);

  return null;
}
