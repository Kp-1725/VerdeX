import { createContext, useEffect, useMemo, useState } from "react";
import { STORAGE_KEY } from "../utils/constants";
import { fetchMe } from "../utils/api";

export const AuthContext = createContext(null);

function readStoredAuth() {
  const saved = localStorage.getItem(STORAGE_KEY);
  if (!saved) {
    return { token: "", user: null };
  }

  try {
    const parsed = JSON.parse(saved);
    return {
      token: parsed?.token || "",
      user: parsed?.user || null,
    };
  } catch (error) {
    localStorage.removeItem(STORAGE_KEY);
    return { token: "", user: null };
  }
}

export function AuthProvider({ children }) {
  const [authState, setAuthState] = useState(readStoredAuth);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(authState));
  }, [authState]);

  useEffect(() => {
    let isActive = true;

    async function syncUserFromServer() {
      if (!authState.token) {
        return;
      }

      try {
        const response = await fetchMe();
        const serverUser = response?.user
          ? {
              id: response.user._id || response.user.id || "",
              name: response.user.name || "",
              role: response.user.role || "",
              identifier: response.user.identifier || "",
            }
          : null;

        if (!isActive || !serverUser) {
          return;
        }

        const currentUser = authState.user || {};
        const hasMismatch =
          currentUser.id !== serverUser.id ||
          currentUser.name !== serverUser.name ||
          currentUser.role !== serverUser.role ||
          currentUser.identifier !== serverUser.identifier;

        if (hasMismatch) {
          setAuthState((prev) => ({
            ...prev,
            user: serverUser,
          }));
        }
      } catch (error) {
        if (!isActive) {
          return;
        }

        setAuthState({ token: "", user: null });
        localStorage.removeItem(STORAGE_KEY);
      }
    }

    syncUserFromServer();

    return () => {
      isActive = false;
    };
  }, [authState.token]);

  const value = useMemo(
    () => ({
      user: authState.user,
      token: authState.token,
      isLoggedIn: Boolean(authState.token && authState.user),
      login: (payload) => {
        setAuthState({
          token: payload.token,
          user: payload.user,
        });
      },
      logout: () => {
        setAuthState({ token: "", user: null });
        localStorage.removeItem(STORAGE_KEY);
      },
    }),
    [authState],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
