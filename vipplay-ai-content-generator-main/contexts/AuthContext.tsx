"use client";

import {
  createContext,
  useContext,
  useState,
  ReactNode,
  useEffect,
} from "react";
import {
  authAPI,
  getAuthToken,
  getCurrentUser,
  setCurrentUser,
  clearAuth,
} from "../api/api.service";

export type UserRole = "super_admin" | "org_admin" | "admin" | "user";
export type AccountType = "individual" | "organization";

export interface User {
  _id: string;
  fullName: string;
  email: string;
  role: UserRole;
  accountType: AccountType;
  organizationId?: string;
  isActive: boolean;
  onboardingCompleted: boolean;
  lastLogin?: string;
  createdAt: string;
  updatedAt: string;
}

interface AuthContextType {
  user: User | null;
  loading: boolean;
  login: (
    email: string,
    password: string,
  ) => Promise<{ success: boolean; error?: string }>;
  register: (
    fullName: string,
    email: string,
    password: string,
    accountType?: AccountType,
  ) => Promise<{ success: boolean; error?: string }>;
  logout: () => void;
  updateUser: (data: Partial<User>) => void;
  refreshUser: () => Promise<void>;
  isSuperAdmin: () => boolean;
  isOrgAdmin: () => boolean;
  isUser: () => boolean;
  isIndividual: () => boolean;
  isOrganization: () => boolean;
}

const defaultAuthState: AuthContextType = {
  user: null,
  loading: false,
  login: async () => ({ success: false, error: "Auth not ready" }),
  register: async () => ({ success: false, error: "Auth not ready" }),
  logout: () => {},
  updateUser: () => {},
  refreshUser: async () => {},
  isSuperAdmin: () => false,
  isOrgAdmin: () => false,
  isUser: () => false,
  isIndividual: () => false,
  isOrganization: () => false,
};

const AuthContext = createContext<AuthContextType>(defaultAuthState);

// ==================== HELPERS ====================
const normalizeUser = (u: any): User => ({
  ...u,
  _id: u._id || u.id,
});

// ==================== PROVIDER ====================
export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  // Listen for session expiry (401 from API)
  useEffect(() => {
    const handleSessionExpired = () => {
      if (typeof window !== "undefined") {
        requestAnimationFrame(() => {
          clearAuth();
          setUser(null);
        });
      }
    };
    window.addEventListener("auth:sessionExpired", handleSessionExpired);
    return () =>
      window.removeEventListener("auth:sessionExpired", handleSessionExpired);
  }, []);

  // 🔐 Bootstrap auth on app start
  useEffect(() => {
    const bootstrapAuth = async () => {
      const token = getAuthToken();

      if (!token) {
        clearAuth();
        setLoading(false);
        return;
      }

      // Set cached user immediately so UI doesn't flash
      const cachedUser = getCurrentUser();
      if (cachedUser) {
        setUser(normalizeUser(cachedUser));
      }

      try {
        const response = await authAPI.getMe();
        if (response?.user) {
          const u = normalizeUser(response.user);
          setCurrentUser(u); // ✅ keep localStorage in sync
          setUser(u);
        } else if (!cachedUser) {
          clearAuth();
        }
      } catch {
        // Token invalid — if no cache, clear everything
        if (!cachedUser) clearAuth();
      } finally {
        setLoading(false);
      }
    };

    bootstrapAuth();
  }, []);

  // ==================== AUTH ACTIONS ====================
  const login = async (email: string, password: string) => {
    try {
      const response = await authAPI.login(email, password);

      if (response.success && response.user) {
        const u = normalizeUser(response.user);
        setCurrentUser(u); // ✅ sync localStorage
        setUser(u);
        return { success: true };
      }

      return { success: false, error: response.message || "Login failed" };
    } catch (error: any) {
      return { success: false, error: error.message || "Login failed" };
    }
  };

  const register = async (
    fullName: string,
    email: string,
    password: string,
    accountType: AccountType = "individual",
  ) => {
    try {
      const response = await authAPI.register(
        fullName,
        email,
        password,
        accountType,
      );

      if (response.success && response.user) {
        const u = normalizeUser(response.user);
        setCurrentUser(u); // ✅ sync localStorage
        setUser(u);
        return { success: true };
      }

      return {
        success: false,
        error: response.message || "Registration failed",
      };
    } catch (error: any) {
      return { success: false, error: error.message || "Registration failed" };
    }
  };

  const logout = () => {
    clearAuth();
    setUser(null);
  };

  const updateUser = (data: Partial<User>) => {
    setUser((prev) => {
      if (!prev) return prev;
      const updated = { ...prev, ...data };
      setCurrentUser(updated); // ✅ sync localStorage on every partial update
      return updated;
    });
  };

  // ✅ Fixed: now syncs localStorage AND React state
  const refreshUser = async () => {
    try {
      const token = getAuthToken();
      if (!token) return; // no point refreshing without a token

      const response = await authAPI.getMe();
      if (response?.user) {
        const u = normalizeUser(response.user);
        setCurrentUser(u); // ✅ update localStorage so next page load is fresh
        setUser(u);
      }
    } catch (error) {
      console.error("Failed to refresh user:", error);
    }
  };

  // ==================== ROLE HELPERS ====================
  const isSuperAdmin = () => user?.role === "super_admin";
  const isOrgAdmin = () => user?.role === "org_admin" || user?.role === "admin";
  const isUser = () => user?.role === "user";
  const isIndividual = () => user?.accountType === "individual";
  const isOrganization = () => user?.accountType === "organization";

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        login,
        register,
        logout,
        updateUser,
        refreshUser,
        isSuperAdmin,
        isOrgAdmin,
        isUser,
        isIndividual,
        isOrganization,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

// ==================== HOOK ====================
export const useAuth = () => useContext(AuthContext);
