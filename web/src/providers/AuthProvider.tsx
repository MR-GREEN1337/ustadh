"use client";

import { createContext, useContext, useEffect, useState, useCallback } from "react";
import { useRouter, useParams } from "next/navigation";
import { User } from "@/types/user";
import { API_BASE_URL } from "@/lib/config";

// Import or define locales
import { locales } from "@/i18n/config"; // Make sure to import from your i18n config

type AuthContextType = {
  user: User | null;
  loading: boolean;
  login: (email: string, password: string, userType: string) => Promise<boolean>;
  loginSchool: (schoolCode: string, identifier: string, password: string, userType: string) => Promise<boolean>;
  register: (userData: RegisterData) => Promise<boolean>;
  logout: () => void;
  error: string | null;
  setError: (error: string | null) => void;
  updateUserOnboarding: (onboardingData: OnboardingData) => Promise<boolean>;
  needsOnboarding: () => boolean;
};

type RegisterData = {
  email: string;
  username: string;
  password: string;
  full_name: string;
  user_type: string;
  has_onboarded?: boolean;
};

type OnboardingData = {
  education_level: string;
  school_type: string;
  region: string;
  academic_track?: string;
  learning_style: string;
  study_habits: string[];
  academic_goals: string[];
  data_consent: boolean;
  subjects?: string[];
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

  // Check if we're on the landing page
  const isLandingPage = useCallback(() => {
    if (typeof window === 'undefined') return false;

    const pathname = window.location.pathname;
    const segments = pathname.split('/');

    // Check if the path is just the locale (e.g., /en, /fr)
    if (segments.length === 2 && locales.includes(segments[1])) {
      return true;
    }

    return false;
  }, []);

  // Check if we're on a public route
  const isPublicRoute = useCallback(() => {
    if (typeof window === 'undefined') return false;

    const pathname = window.location.pathname;

    // Landing pages are always public
    if (isLandingPage()) return true;

    // Add more public routes as needed
    const publicPaths = ['/login', '/register', '/forgot-password'];

    // Extract path without locale
    const segments = pathname.split('/');
    if (segments.length > 2) {
      const pathWithoutLocale = '/' + segments.slice(2).join('/');
      return publicPaths.some(path => pathWithoutLocale === path || pathWithoutLocale.startsWith(`${path}/`));
    }

    return false;
  }, [isLandingPage]);

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

        // Check if we have a saved user in localStorage and maintain that
        const savedUser = localStorage.getItem("auth_user");
        if (savedUser) {
          const parsedUser = JSON.parse(savedUser);
          setUser(parsedUser);
        }

        return true;
      }

      console.log("Token refresh failed with status:", response.status);
      return false;
    } catch (err) {
      console.error("Token refresh failed:", err);
      return false;
    }
  }, []);

  // Helper function to handle failed refresh
  const handleFailedRefresh = useCallback(async () => {
    console.log("Token refresh failed, redirecting to login");

    // Clear auth state
    setUser(null);
    setTokens({ accessToken: "", refreshToken: "" });

    // Clear stored auth data
    localStorage.removeItem("auth_user");
    localStorage.removeItem("access_token");
    localStorage.removeItem("refresh_token");

    // Save the current URL for redirect after login
    localStorage.setItem("redirect_after_login", window.location.pathname);

    router.push(`/${locale}/login?returnUrl=${encodeURIComponent(window.location.pathname)}`);
  }, [locale, router]);

  // Create a fetch API wrapper with authorization header
  const authFetch = useCallback(async (url: string, options: RequestInit = {}) => {
    // Skip auth headers on public routes like landing page
    const currentIsPublicRoute = isPublicRoute();

    const headers = new Headers(options.headers || {});

    if (!currentIsPublicRoute) {
      // Get the latest token directly from localStorage to avoid stale state
      const currentAccessToken = localStorage.getItem("access_token");

      // Add Authorization header if we have an access token
      if (currentAccessToken) {
        headers.set('Authorization', `Bearer ${currentAccessToken}`);
        console.log("Using access token in request:", currentAccessToken.substring(0, 20) + "...");
      } else {
        console.log("No access token available for request");
      }
    }

    // Ensure we're sending credentials to include cookies
    let response = await fetch(url, {
      ...options,
      headers,
      credentials: 'include'
    });

    // If we get a 401 Unauthorized and we're not on a public route, try to refresh the token
    if (response.status === 401 && !currentIsPublicRoute) {
      console.log("Received 401, attempting token refresh");
      const refreshed = await refreshToken();

      if (refreshed) {
        // Try again with the new token
        console.log("Retrying request with refreshed token");
        const newAccessToken = localStorage.getItem("access_token");

        if (newAccessToken) {
          headers.set('Authorization', `Bearer ${newAccessToken}`);
        }

        // Make the request again with the new token
        response = await fetch(url, {
          ...options,
          headers,
          credentials: 'include'
        });
      } else {
        // Only handle failed refresh token if not already on login/public page
        const isLoginPage = window.location.pathname.includes('/login');

        if (!isLoginPage && !currentIsPublicRoute) {
          await handleFailedRefresh();
        }
      }
    }

    return response;
  }, [refreshToken, isPublicRoute, handleFailedRefresh]);

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

  // Check for existing session
  const checkAuth = useCallback(async () => {
    // Skip auth check on landing page to avoid unnecessary API calls
    if (isLandingPage()) {
      console.log("Skipping auth check on landing page");
      setLoading(false);
      return;
    }

    setLoading(true);
    try {
      console.log("Checking authentication status...");

      // Try using the wrapper with both cookie and authorization header
      let response = await authFetch(`${API_BASE_URL}/api/v1/auth/me`);

      // Log the response status to debug
      console.log(`/api/v1/auth/me response status: ${response.status}`);

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
      }
    } catch (err) {
      console.error("Authentication check failed:", err);
    } finally {
      setLoading(false);
    }
  }, [authFetch, isLandingPage]);

  // Check for existing session AFTER tokens are loaded
  useEffect(() => {
    if (tokensLoaded) {
      // Only run checkAuth if we're not on the landing page
      if (!isLandingPage()) {
        checkAuth();
      } else {
        setLoading(false); // Set loading to false on landing page
      }
    }
  }, [tokensLoaded, checkAuth, isLandingPage]);

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

      // Handle redirect after login
      const redirectAfterLogin = () => {
        const savedRedirect = localStorage.getItem("redirect_after_login");
        if (savedRedirect) {
          localStorage.removeItem("redirect_after_login");
          router.push(savedRedirect);
        } else if (data.user && !data.user.has_onboarded) {
          router.push(`/${locale}/onboarding`);
        } else {
          router.push(`/${locale}/dashboard`);
        }
      };

      // Execute the redirect
      redirectAfterLogin();

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
        has_onboarded: userData.has_onboarded || false,
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

  // New function to update user profile with onboarding data
  const updateUserOnboarding = async (onboardingData: OnboardingData) => {
    if (!user || !user.id) {
      console.error("Cannot update onboarding: No user logged in");
      return false;
    }

    setLoading(true);
    try {
      console.log("Updating user with onboarding data...");

      // Prepare the data for the API
      const updateData = {
        education_level: onboardingData.education_level,
        school_type: onboardingData.school_type,
        region: onboardingData.region,
        academic_track: onboardingData.academic_track || null,
        learning_style: onboardingData.learning_style,
        study_habits: onboardingData.study_habits,
        academic_goals: onboardingData.academic_goals,
        has_onboarded: true,
        data_consent: onboardingData.data_consent,
      };

      // First update the user profile
      const userResponse = await authFetch(`${API_BASE_URL}/api/v1/users/${user.id}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(updateData),
      });

      if (!userResponse.ok) {
        const errorData = await userResponse.json();
        setError(errorData.detail || "Failed to update user profile");
        return false;
      }

      // Now create subject interests if subjects were provided
      if (onboardingData.subjects && onboardingData.subjects.length > 0) {
        const subjectPromises = onboardingData.subjects.map(subjectId =>
          authFetch(`${API_BASE_URL}/api/v1/subjects/interest`, {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              user_id: user.id,
              subject_id: subjectId,
              interest_level: 5, // Default high interest level
            }),
          })
        );

        await Promise.all(subjectPromises);
      }

      // Update local user data
      const updatedUser = { ...user, ...updateData };
      setUser(updatedUser as User);
      localStorage.setItem("auth_user", JSON.stringify(updatedUser));

      console.log("Onboarding data saved successfully");
      return true;
    } catch (err) {
      console.error("Error updating onboarding data:", err);
      setError("Failed to save your preferences. Please try again.");
      return false;
    } finally {
      setLoading(false);
    }
  };

  // Function to check if user needs to complete onboarding
  const needsOnboarding = () => {
    return !!user && !user.has_onboarded;
  };

  // School login function
  const loginSchool = async (schoolCode: string, identifier: string, password: string, userType: string) => {
    setLoading(true);
    setError(null);

    try {
      console.log("Attempting school login...");
      const response = await fetch(`${API_BASE_URL}/api/v1/auth/school-login`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          school_code: schoolCode,
          identifier,
          password,
          user_type: userType
        }),
        credentials: "include",
      });

      const data = await response.json();

      if (!response.ok) {
        setError(data.detail || "School login failed");
        return false;
      }

      console.log("School login successful");
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
      localStorage.setItem("auth_type", "school");

      // Store school info specifically
      if (data.user && data.user.school) {
        localStorage.setItem("school_info", JSON.stringify(data.user.school));
      }

      // Handle redirect after login - similar to regular login
      const redirectAfterLogin = () => {
        const savedRedirect = localStorage.getItem("redirect_after_login");
        if (savedRedirect) {
          localStorage.removeItem("redirect_after_login");
          router.push(savedRedirect);
        } else {
          // School users don't need onboarding, go straight to dashboard
          router.push(`/${locale}/dashboard`);
        }
      };

      // Execute the redirect
      redirectAfterLogin();

      return true;
    } catch (err) {
      console.error("School login error:", err);
      setError("An error occurred during login. Please try again.");
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
      localStorage.removeItem("redirect_after_login");
      localStorage.removeItem("auth_type");
      localStorage.removeItem("school_info");

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
        // Skip refresh on landing page
        if (!isLandingPage()) {
          console.log("Auto-refresh token triggered");
          refreshToken();
        }
      }, refreshInterval);

      return () => clearInterval(interval);
    }
  }, [refreshToken, isLandingPage]);

  // Route protection for onboarding
  useEffect(() => {
    // Check if user is logged in and hasn't completed onboarding
    if (user && !user.has_onboarded) {
      const currentPath = window.location.pathname;
      // Allow access to onboarding and logout paths
      const allowedPaths = [`/${locale}/onboarding`, `/${locale}/logout`];

      // If not on an allowed path, redirect to onboarding
      if (!allowedPaths.some(path => currentPath.startsWith(path)) &&
          !currentPath.includes('/auth/') &&
          !currentPath.includes('/api/') &&
          !isLandingPage()) {
        console.log("User needs to complete onboarding, redirecting...");
        router.push(`/${locale}/onboarding`);
      }
    }
  }, [user, locale, router, isLandingPage]);

  // Use the authFetch for all API requests
  useEffect(() => {
    // Export the authFetch to window for use in other modules if needed
    // @ts-ignore
    window.authFetch = authFetch;
  }, [authFetch]);

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        login,
        loginSchool,
        register,
        logout,
        error,
        setError,
        updateUserOnboarding,
        needsOnboarding,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

// Export the useAuth hook correctly
export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
