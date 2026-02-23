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

const fetchWithAuth = async (url: string, options: RequestInit = {}) => {
  const token = getAuthToken();
  const headers = {
    ...options.headers,
    "Content-Type": "application/json",
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  };
  const response = await fetch(url, { ...options, headers });
  return response;
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
    const response = await fetchWithAuth("/api/auth/verify", {
      method: "POST",
    });
    if (response.ok) {
      return await response.json();
    }
    return null;
  },
  updateAccountType: async (type: "individual" | "organization") => {
    const response = await fetchWithAuth("/api/auth/update-account-type", {
      method: "POST",
      body: JSON.stringify({ accountType: type }),
    });
    const data = await response.json();
    return { success: response.ok, message: data.message };
  },
  setRoleSelection: async (role: string) => {
    const response = await fetchWithAuth("/api/auth/set-role", {
      method: "POST",
      body: JSON.stringify({ role }),
    });
    const data = await response.json();
    return { success: response.ok, message: data.message };
  },
};

export const organizationAPI = {
  create: async (orgData: { name: string; domain?: string; plan?: string }) => {
    const response = await fetchWithAuth("/api/organization", {
      method: "POST",
      body: JSON.stringify(orgData),
    });
    return await response.json();
  },
  saveProfile: async (profileData: any) => {
    const response = await fetchWithAuth("/api/organization/profile", {
      method: "POST",
      body: JSON.stringify(profileData),
    });
    return await response.json();
  },
  getMembers: async (orgId: string) => {
    const response = await fetchWithAuth(`/api/organization/${orgId}/members`);
    return await response.json();
  },
  addMember: async (orgId: string, memberData: any) => {
    const response = await fetchWithAuth(`/api/organization/${orgId}/members`, {
      method: "POST",
      body: JSON.stringify(memberData),
    });
    return await response.json();
  },
  updateMemberRole: async (memberId: string, role: string) => {
    const response = await fetchWithAuth(
      `/api/organization/members/${memberId}/role`,
      {
        method: "PATCH",
        body: JSON.stringify({ role }),
      },
    );
    return await response.json();
  },
  removeMember: async (memberId: string) => {
    const response = await fetchWithAuth(
      `/api/organization/members/${memberId}`,
      {
        method: "DELETE",
      },
    );
    return await response.json();
  },
};

export const individualAPI = {
  save: async (profileData: any) => {
    const response = await fetchWithAuth("/api/user/profile", {
      method: "POST",
      body: JSON.stringify(profileData),
    });
    return await response.json();
  },
};

export const dashboardAPI = {
  getDashboard: async () => {
    const response = await fetchWithAuth("/api/content/analytics");
    if (response.ok) {
      return { success: true, data: await response.json() };
    }
    return { success: false };
  },
  getTeamAnalytics: async () => {
    const response = await fetchWithAuth("/api/admin/analytics/team");
    return await response.json();
  },
  updateUserStatus: async (userId: string, isActive: boolean) => {
    const response = await fetchWithAuth(`/api/admin/users/${userId}/status`, {
      method: "PATCH",
      body: JSON.stringify({ isActive }),
    });
    return await response.json();
  },
};

export const contentAPI = {
  getContent: async () => {
    const response = await fetchWithAuth("/api/content");
    if (response.ok) {
      return await response.json();
    }
    return { success: false, content: [] };
  },
};

export const generationAPI = {
  generate: async (data: any) => {
    const response = await fetchWithAuth("/api/content/generate", {
      method: "POST",
      body: JSON.stringify(data),
    });
    if (!response.ok) {
      const error = await response.json().catch(() => ({}));
      throw new Error(error.error || "Generation failed");
    }
    return response.json();
  },
  bulkGenerate: async (data: any) => {
    const response = await fetchWithAuth("/api/content/bulk-generate", {
      method: "POST",
      body: JSON.stringify(data),
    });
    if (!response.ok) {
      const error = await response.json().catch(() => ({}));
      throw new Error(error.error || "Bulk generation failed");
    }
    return response.json();
  },
  getJobs: async () => {
    const response = await fetchWithAuth("/api/content/jobs");
    if (response.ok) {
      return await response.json();
    }
    return { success: false, jobs: [] };
  },
  cancelJob: async (jobId: string) => {
    const response = await fetchWithAuth(`/api/content/jobs/${jobId}/cancel`, {
      method: "POST",
    });
    return response.json();
  },
};

export const mediaAPI = {
  generate: async (data: any) => {
    const response = await fetchWithAuth("/api/media/generate", {
      method: "POST",
      body: JSON.stringify(data),
    });
    if (!response.ok) {
      const error = await response.json().catch(() => ({}));
      throw new Error(error.error || "Media generation failed");
    }
    return response.json();
  },
  getAssets: async () => {
    const response = await fetchWithAuth("/api/media");
    if (response.ok) {
      return await response.json();
    }
    return { success: false, assets: [] };
  },
  getQueue: async () => {
    const response = await fetchWithAuth("/api/media/queue");
    if (response.ok) {
      return await response.json();
    }
    return { success: false, queue: [] };
  },
};
