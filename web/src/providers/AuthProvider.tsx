"use client";

import { createContext, useContext, useEffect, useState, useCallback } from "react";
import { useRouter, useParams } from "next/navigation";
import { User } from "@/types/user";
import { API_BASE_URL } from "@/lib/config";

type AuthContextType = {
  user: User | null;
  loading: boolean;
  login: (email: string, password: string, userType: string) => Promise<boolean>;
  register: (userData: RegisterData) => Promise<boolean>;
  logout: () => void;
  error: string | null;
  setError: (error: string | null) => void;
};

type RegisterData = {
  email: string;
  username: string;
  password: string;
  full_name: string;
  user_type: string;
  grade_level?: string;
  school_type?: string;
};

const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Helper to safely parse JSON from localStorage
const safeJSONParse = (key: string) => {
  try {
    const item = localStorage.getItem(key);
    return item ? JSON.parse(item) : null;
  } catch (e) {
    console.error(`Error parsing ${key} from localStorage:`, e);
    return null;
  }
};

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [tokens, setTokens] = useState({
    accessToken: "",
    refreshToken: ""
  });
  const [tokensLoaded, setTokensLoaded] = useState(false);
  const router = useRouter();
  const params = useParams();
  const locale = params?.locale as string || "en";

  // Create a fetch API wrapper with authorization header
  const authFetch = useCallback(async (url: string, options: RequestInit = {}) => {
    const headers = new Headers(options.headers || {});

    // Get the latest token directly from localStorage to avoid stale state
    const currentAccessToken = localStorage.getItem("access_token");

    // Add Authorization header if we have an access token
    if (currentAccessToken) {
      headers.set('Authorization', `Bearer ${currentAccessToken}`);
      console.log("Using access token in request:", currentAccessToken.substring(0, 20) + "...");
    } else {
      console.log("No access token available for request");
    }

    // Ensure we're sending credentials to include cookies
    return fetch(url, {
      ...options,
      headers,
      credentials: 'include'
    });
  }, []);

  // Function to refresh token
  const refreshToken = useCallback(async () => {
    // Get the latest refresh token from localStorage
    const currentRefreshToken = localStorage.getItem("refresh_token");

    if (!currentRefreshToken) {
      console.log("No refresh token available");
      return false;
    }

    try {
      console.log("Attempting to refresh token...");
      const response = await fetch(`${API_BASE_URL}/api/v1/auth/refresh`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ refresh_token: currentRefreshToken }),
        credentials: "include",
      });

      if (response.ok) {
        const data = await response.json();
        const newAccessToken = data.access_token;

        console.log("Token refreshed successfully");

        // Update in state
        setTokens(prev => ({
          ...prev,
          accessToken: newAccessToken
        }));

        // Update in localStorage
        localStorage.setItem("access_token", newAccessToken);
        return true;
      }

      console.log("Token refresh failed with status:", response.status);
      return false;
    } catch (err) {
      console.error("Token refresh failed:", err);
      return false;
    }
  }, []);

  // Load stored auth data on initial mount
  useEffect(() => {
    const loadStoredTokens = () => {
      const storedUser = safeJSONParse("auth_user");
      const storedAccessToken = localStorage.getItem("access_token");
      const storedRefreshToken = localStorage.getItem("refresh_token");

      console.log("Loading stored tokens:");
      console.log("- Access token exists:", !!storedAccessToken);
      console.log("- Refresh token exists:", !!storedRefreshToken);

      if (storedAccessToken || storedRefreshToken) {
        setTokens({
          accessToken: storedAccessToken || "",
          refreshToken: storedRefreshToken || ""
        });
      }

      if (storedUser) {
        setUser(storedUser);
      }

      setTokensLoaded(true);
    };

    loadStoredTokens();
  }, []);

  // Check for existing session AFTER tokens are loaded
  useEffect(() => {
    if (tokensLoaded) {
      checkAuth();
    }
  }, [tokensLoaded]);

  // Check for existing session
  const checkAuth = useCallback(async () => {
    setLoading(true);
    try {
      console.log("Checking authentication status...");

      // Try using the wrapper with both cookie and authorization header
      let response = await authFetch(`${API_BASE_URL}/api/v1/auth/me`);

      // Log the response status to debug
      console.log(`/api/v1/auth/me response status: ${response.status}`);

      // If auth check failed but we have a refresh token in localStorage, try refreshing
      if (!response.ok && localStorage.getItem("refresh_token")) {
        console.log("Auth check failed, attempting token refresh");
        const refreshed = await refreshToken();

        if (refreshed) {
          // Try again with the new token
          console.log("Retrying auth check with refreshed token");
          response = await authFetch(`${API_BASE_URL}/api/v1/auth/me`);
          console.log(`Retry response status: ${response.status}`);
        }
      }

      if (response.ok) {
        const userData = await response.json();
        console.log("Auth check successful");
        setUser(userData);
        localStorage.setItem("auth_user", JSON.stringify(userData));
      } else {
        console.log("Auth check failed with status:", response.status);

        // Try to get more error details
        try {
          const errorData = await response.json();
          console.log("Error details:", errorData);
        } catch (e) {
          // Ignore if we can't parse the error
        }

        // Only clear user if response is 401 Unauthorized
        if (response.status === 401) {
          console.log("Clearing auth state due to 401 Unauthorized");
          setUser(null);
          localStorage.removeItem("auth_user");
        }
      }
    } catch (err) {
      console.error("Authentication check failed:", err);
    } finally {
      setLoading(false);
    }
  }, [authFetch, refreshToken]);

  const login = async (email: string, password: string, userType: string) => {
    setLoading(true);
    setError(null);

    try {
      console.log("Attempting login...");
      const response = await fetch(`${API_BASE_URL}/api/v1/auth/login`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ email, password, user_type: userType }),
        credentials: "include",
      });

      const data = await response.json();

      if (!response.ok) {
        setError(data.detail || "Login failed");
        return false;
      }

      console.log("Login successful");
      console.log("Received tokens:", {
        accessToken: data.access_token ? (data.access_token.substring(0, 20) + "...") : "None",
        refreshToken: data.refresh_token ? (data.refresh_token.substring(0, 20) + "...") : "None"
      });

      // Store user data and tokens
      setUser(data.user);
      setTokens({
        accessToken: data.access_token,
        refreshToken: data.refresh_token
      });

      // Store in localStorage
      localStorage.setItem("auth_user", JSON.stringify(data.user));
      localStorage.setItem("access_token", data.access_token);
      localStorage.setItem("refresh_token", data.refresh_token);

      // Redirect based on user type
      router.push(`/${locale}/dashboard`);
      return true;
    } catch (err) {
      console.error("Login error:", err);
      setError("An error occurred during login. Please try again.");
      return false;
    } finally {
      setLoading(false);
    }
  };

  const register = async (userData: RegisterData) => {
    setLoading(true);
    setError(null);

    try {
      // Transform the frontend data to match backend expectations
      const transformedData = {
        email: userData.email,
        username: userData.username,
        password: userData.password,
        full_name: userData.full_name,
        user_type: userData.user_type,
        grade_level: userData.grade_level
          ? parseInt(userData.grade_level, 10)
          : null,
        school_type: userData.school_type || null,
      };

      console.log("Sending registration data...");

      const response = await fetch(`${API_BASE_URL}/api/v1/auth/register`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(transformedData),
        credentials: "include",
      });

      const data = await response.json();

      if (!response.ok) {
        const errorMsg = data.detail || "Registration failed";
        setError(errorMsg);
        console.error("Registration error:", errorMsg);
        return false;
      }

      console.log("Registration successful, proceeding to login");

      // Automatically log in after registration
      return await login(userData.email, userData.password, userData.user_type);
    } catch (err) {
      console.error("Registration error:", err);
      setError("An error occurred during registration. Please try again.");
      return false;
    } finally {
      setLoading(false);
    }
  };

  const logout = async () => {
    try {
      console.log("Logging out...");
      await authFetch(`${API_BASE_URL}/api/v1/auth/logout`, {
        method: "POST"
      });
    } catch (err) {
      console.error("Logout error:", err);
    } finally {
      // Clear auth state
      setUser(null);
      setTokens({ accessToken: "", refreshToken: "" });

      // Clear stored auth data
      localStorage.removeItem("auth_user");
      localStorage.removeItem("access_token");
      localStorage.removeItem("refresh_token");

      router.push(`/${locale}`);
    }
  };

  // Set up token refresh interval
  useEffect(() => {
    if (localStorage.getItem("refresh_token")) {
      // Calculate refresh interval - refresh at 80% of token lifetime
      // Assuming ACCESS_TOKEN_EXPIRE_MINUTES is 30 minutes
      const refreshInterval = 1000 * 60 * 24; // 24 minutes (80% of 30)

      console.log("Setting up token refresh interval");
      const interval = setInterval(() => {
        console.log("Auto-refresh token triggered");
        refreshToken();
      }, refreshInterval);

      return () => clearInterval(interval);
    }
  }, [refreshToken]);

  // Use the authFetch for all API requests
  useEffect(() => {
    // Export the authFetch to window for use in other modules if needed
    // @ts-ignore
    window.authFetch = authFetch;
  }, [authFetch]);

  // Helper function for debugging
  const debugAuth = useCallback(async () => {
    console.log("--- AUTH DEBUG INFO ---");
    console.log("User:", user);
    console.log("Tokens state:", tokens);
    console.log("localStorage tokens:", {
      accessToken: localStorage.getItem("access_token"),
      refreshToken: localStorage.getItem("refresh_token")
    });

    // Test a simple fetch to see what's happening
    try {
      const response = await fetch(`${API_BASE_URL}/api/v1/auth/me`, {
        headers: {
          "Authorization": `Bearer ${localStorage.getItem("access_token")}`
        },
        credentials: "include"
      });

      console.log("Debug API call status:", response.status);
      if (response.ok) {
        const data = await response.json();
        console.log("API response data:", data);
      } else {
        console.log("API call failed");
      }
    } catch (e) {
      console.error("Debug API call error:", e);
    }
    console.log("--- END DEBUG INFO ---");
  }, [user, tokens]);

  // Make debug function available globally
  useEffect(() => {
    // @ts-ignore
    window.debugAuth = debugAuth;
  }, [debugAuth]);

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        login,
        register,
        logout,
        error,
        setError,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
