import { createContext, useEffect, useMemo, useState } from "react";
import { STORAGE_KEY } from "../utils/constants";

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
