import React, { createContext, useContext, useReducer, useEffect, ReactNode } from "react";
import { authService, User } from "@/services/authService";

interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;
}

type AuthAction =
  | { type: "AUTH_START" }
  | { type: "AUTH_SUCCESS"; payload: User }
  | { type: "AUTH_FAILURE"; payload: string }
  | { type: "LOGOUT" }
  | { type: "CLEAR_ERROR" };

const initialState: AuthState = {
  user: null,
  isAuthenticated: false,
  isLoading: false,
  error: null,
};

const authReducer = (state: AuthState, action: AuthAction): AuthState => {
  switch (action.type) {
    case "AUTH_START":
      return { ...state, isLoading: true, error: null };

    case "AUTH_SUCCESS":
      return {
        ...state,
        user: action.payload,
        isAuthenticated: true,
        isLoading: false,
        error: null,
      };

    case "AUTH_FAILURE":
      return {
        ...state,
        user: null,
        isAuthenticated: false,
        isLoading: false,
        error: action.payload,
      };

    case "LOGOUT":
      return { ...initialState };

    case "CLEAR_ERROR":
      return { ...state, error: null };

    default:
      return state;
  }
};

interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;
  login: (email: string, password: string) => Promise<void>;
  register: (
    email: string,
    username: string,
    password: string,
    firstName?: string,
    lastName?: string
  ) => Promise<void>;
  loginWithGoogle: (token: string) => Promise<void>;
  loginWithGitHub: (code: string) => Promise<void>;
  logout: () => void;
  clearError: () => void;
  verifyAuth: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | null>(null);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within AuthProvider");
  }
  return context;
};

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [state, dispatch] = useReducer(authReducer, initialState);

  const login = async (email: string, password: string) => {
    dispatch({ type: "AUTH_START" });

    try {
      const response = await authService.login({ email, password });

      dispatch({
        type: "AUTH_SUCCESS",
        payload: response.data.user,
      });
    } catch (error: any) {
      const message = error?.message || "Login failed";

      dispatch({
        type: "AUTH_FAILURE",
        payload: message,
      });
    }
  };

  const register = async (
    email: string,
    username: string,
    password: string,
    firstName?: string,
    lastName?: string
  ) => {
    dispatch({ type: "AUTH_START" });

    try {
      const response = await authService.register({
        email,
        username,
        password,
        first_name: firstName,
        last_name: lastName,
      });

      dispatch({
        type: "AUTH_SUCCESS",
        payload: response.data.user,
      });
    } catch (error: any) {
      const message = error?.message || "Registration failed";

      dispatch({
        type: "AUTH_FAILURE",
        payload: message,
      });

      throw error; // rethrow so SignUp page can also catch it
    }
  };

  const logout = () => {
    authService.logout();
    dispatch({ type: "LOGOUT" });
  };

  const loginWithGoogle = async (token: string) => {
    dispatch({ type: "AUTH_START" });

    try {
      const response = await authService.loginWithGoogle(token);

      dispatch({
        type: "AUTH_SUCCESS",
        payload: response.data.user,
      });
    } catch (error: any) {
      const message = error?.message || "Google login failed";

      dispatch({
        type: "AUTH_FAILURE",
        payload: message,
      });
    }
  };

  const loginWithGitHub = async (code: string) => {
    dispatch({ type: "AUTH_START" });

    try {
      const response = await authService.loginWithGitHub(code);

      dispatch({
        type: "AUTH_SUCCESS",
        payload: response.data.user,
      });
    } catch (error: any) {
      const message = error?.message || "GitHub login failed";

      dispatch({
        type: "AUTH_FAILURE",
        payload: message,
      });
    }
  };

  const clearError = () => {
    dispatch({ type: "CLEAR_ERROR" });
  };

  const verifyAuth = async () => {
    if (!authService.isAuthenticated()) return;

    dispatch({ type: "AUTH_START" });

    try {
      const response = await authService.verifyToken();

      dispatch({
        type: "AUTH_SUCCESS",
        payload: response.data.user,
      });
    } catch (error: any) {
      // Don't set error for automatic verification - just log out silently
      authService.logout();
    }
  };

  useEffect(() => {
    verifyAuth();
  }, []);

  const value: AuthContextType = {
    ...state,
    login,
    register,
    loginWithGoogle,
    loginWithGitHub,
    logout,
    clearError,
    verifyAuth,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};