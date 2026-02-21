"use client";

// Client-side API service to match user's custom AuthContext requirements
export const getAuthToken = () => {
  if (typeof window !== "undefined") {
    return localStorage.getItem("auth_token");
  }
  return null;
};

export const getCurrentUser = () => {
  if (typeof window !== "undefined") {
    const user = localStorage.getItem("user_data");
    return user ? JSON.parse(user) : null;
  }
  return null;
};

export const setCurrentUser = (user: any) => {
  if (typeof window !== "undefined") {
    localStorage.setItem("user_data", JSON.stringify(user));
  }
};

export const setAuthToken = (token: string) => {
  if (typeof window !== "undefined") {
    localStorage.setItem("auth_token", token);
  }
};

export const clearAuth = () => {
  if (typeof window !== "undefined") {
    localStorage.removeItem("auth_token");
    localStorage.removeItem("user_data");
  }
};

export const authAPI = {
  login: async (email: string, password: string) => {
    const response = await fetch("/api/auth/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password }),
    });

    const text = await response.text();
    let data;
    try {
      data = JSON.parse(text);
    } catch (e) {
      console.error("Failed to parse JSON response:", text);
      throw new Error(`Invalid server response: ${text.substring(0, 100)}...`);
    }

    if (response.ok && data.token) {
      setAuthToken(data.token);
      return { success: true, user: data.user };
    }
    return { success: false, message: data.message || "Login failed" };
  },
  register: async (
    fullName: string,
    email: string,
    password: string,
    accountType: string,
  ) => {
    const response = await fetch("/api/auth/register", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ fullName, email, password, accountType }),
    });

    const text = await response.text();
    let data;
    try {
      data = JSON.parse(text);
    } catch (e) {
      console.error("Failed to parse JSON response:", text);
      throw new Error(`Invalid server response: ${text.substring(0, 100)}...`);
    }

    if (response.ok && data.token) {
      setAuthToken(data.token);
      return { success: true, user: data.user };
    }
    return { success: false, message: data.message || "Registration failed" };
  },
  getMe: async () => {
    const token = getAuthToken();
    if (!token) return null;
    const response = await fetch("/api/auth/verify", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ token }),
    });
    if (response.ok) {
      return await response.json();
    }
    return null;
  },
  updateAccountType: async (type: "individual" | "organization") => {
    const token = getAuthToken();
    const response = await fetch("/api/auth/update-account-type", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ accountType: type }),
    });
    const data = await response.json();
    return { success: response.ok, message: data.message };
  },
  setRoleSelection: async (role: string) => {
    const token = getAuthToken();
    const response = await fetch("/api/auth/set-role", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ role }),
    });
    const data = await response.json();
    return { success: response.ok, message: data.message };
  },
};

export const organizationAPI = {
  create: async (orgData: { name: string; domain?: string; plan?: string }) => {
    const token = getAuthToken();
    const response = await fetch("/api/organization", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(orgData),
    });
    const data = await response.json();
    return data; // Returns { success, organization, message }
  },
  saveProfile: async (profileData: any) => {
    const token = getAuthToken();
    const response = await fetch("/api/organization/profile", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(profileData),
    });
    return await response.json();
  },
};

export const individualAPI = {
  save: async (profileData: any) => {
    const token = getAuthToken();
    const response = await fetch("/api/user/profile", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(profileData),
    });
    return await response.json();
  },
};

export const dashboardAPI = {
  getDashboard: async () => {
    const token = getAuthToken();
    const response = await fetch("/api/content/analytics", {
      headers: { Authorization: `Bearer ${token}` },
    });
    if (response.ok) {
      return { success: true, data: await response.json() };
    }
    return { success: false };
  },
};
