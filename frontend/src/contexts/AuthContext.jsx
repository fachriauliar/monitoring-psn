import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";

import { authApi } from "../services/api";

const AuthContext = createContext(null);

const TOKEN_KEY = "token";
const USER_KEY = "user";

function saveSession(token, user) {
  localStorage.setItem(TOKEN_KEY, token);
  localStorage.setItem(USER_KEY, JSON.stringify(user));
}

function clearSession() {
  localStorage.removeItem(TOKEN_KEY);
  localStorage.removeItem(USER_KEY);
}

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(null);
  const [loading, setLoading] = useState(true);

  // =======================================================
  // MEMERIKSA SESI SAAT APLIKASI DIBUKA
  // =======================================================

  useEffect(() => {
    let isMounted = true;

    async function checkSession() {
      const savedToken = localStorage.getItem(TOKEN_KEY);

      if (!savedToken) {
        if (isMounted) {
          setLoading(false);
        }
        return;
      }

      try {
        const result = await authApi.me();

        const currentUser = result.data;

        if (!currentUser?.id_pengguna) {
          throw new Error("Data sesi pengguna tidak valid.");
        }

        if (!["admin", "superadmin"].includes(currentUser.role)) {
          throw new Error("Role pengguna tidak valid.");
        }

        if (isMounted) {
          setToken(savedToken);
          setUser(currentUser);

          localStorage.setItem(USER_KEY, JSON.stringify(currentUser));
        }
      } catch (error) {
        clearSession();

        if (isMounted) {
          setToken(null);
          setUser(null);
        }

        console.error("Pemeriksaan sesi gagal:", error.message);
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    }

    checkSession();

    return () => {
      isMounted = false;
    };
  }, []);

  // =======================================================
  // LOGIN
  // =======================================================

  const login = useCallback(async (email, password) => {
    const result = await authApi.login(email, password);

    const receivedUser = result.data?.user;
    const receivedToken = result.data?.token;

    if (!receivedUser || !receivedToken) {
      throw new Error("Respons login dari server tidak lengkap.");
    }

    if (!["admin", "superadmin"].includes(receivedUser.role)) {
      throw new Error("Role akun tidak memiliki akses.");
    }

    saveSession(receivedToken, receivedUser);

    setToken(receivedToken);
    setUser(receivedUser);

    return {
      user: receivedUser,
      token: receivedToken,
      wajib_ubah_password: receivedUser.wajib_ubah_password,
    };
  }, []);

  // =======================================================
  // LOGOUT
  // =======================================================

  const logout = useCallback(() => {
    clearSession();
    setToken(null);
    setUser(null);
  }, []);

  // =======================================================
  // MEMPERBARUI DATA PENGGUNA
  // =======================================================

  const refreshUser = useCallback(async () => {
    const result = await authApi.me();

    const currentUser = result.data;

    if (!currentUser?.id_pengguna) {
      throw new Error("Data pengguna tidak valid.");
    }

    setUser(currentUser);

    localStorage.setItem(USER_KEY, JSON.stringify(currentUser));

    return currentUser;
  }, []);

  // =======================================================
  // MENGUBAH PASSWORD
  // =======================================================

  const changePassword = useCallback(
    async (data) => {
      const result = await authApi.changePassword(data);

      const updatedUser = {
        ...user,
        wajib_ubah_password: false,
      };

      setUser(updatedUser);

      localStorage.setItem(USER_KEY, JSON.stringify(updatedUser));

      return result;
    },
    [user],
  );

  const value = useMemo(
    () => ({
      user,
      token,
      loading,
      isAuthenticated: Boolean(user && token),
      login,
      logout,
      refreshUser,
      changePassword,
    }),
    [user, token, loading, login, logout, refreshUser, changePassword],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

// =========================================================
// CUSTOM HOOK
// =========================================================

export function useAuth() {
  const context = useContext(AuthContext);

  if (!context) {
    throw new Error("useAuth harus digunakan di dalam AuthProvider.");
  }

  return context;
}
