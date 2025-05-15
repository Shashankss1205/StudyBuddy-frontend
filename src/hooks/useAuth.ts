import { useState, useEffect, useCallback } from 'react';
import { User, LoginFormData, RegisterFormData, AuthState } from '../types';
import axios from 'axios';

// API URL
const API_URL = process.env.REACT_APP_API_URL || 'https://studybuddy-backend-h2b4.onrender.com/';

// Local storage keys
const TOKEN_KEY = 'studybuddy_token';
const USER_KEY = 'studybuddy_user';

export const useAuth = () => {
  const [authState, setAuthState] = useState<AuthState>({
    user: null,
    isAuthenticated: false,
    isLoading: true,
    error: null,
  });

  // Load user from local storage on component mount
  useEffect(() => {
    const loadUser = () => {
      try {
        const token = localStorage.getItem(TOKEN_KEY);
        const userString = localStorage.getItem(USER_KEY);

        if (token && userString) {
          const user = JSON.parse(userString) as User;
          
          // Set the default Authorization header for all requests
          axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
          console.log("Auth header set from localStorage during initialization:", 
            axios.defaults.headers.common['Authorization']);
          
          // Make a test request to verify the token is valid
          axios.get(`${API_URL}/existing-pdfs`, {
            headers: { 'Authorization': `Bearer ${token}` }
          })
          .then(() => {
            console.log("Token validation successful");
          })
          .catch(err => {
            console.warn("Token validation failed:", err);
            // If token is invalid (401), clear auth state and localStorage
            if (err.response && err.response.status === 401) {
              console.log("Token expired or invalid, clearing auth state");
              localStorage.removeItem(TOKEN_KEY);
              localStorage.removeItem(USER_KEY);
              delete axios.defaults.headers.common['Authorization'];
              
              setAuthState({
                user: null,
                isAuthenticated: false,
                isLoading: false,
                error: 'Your session has expired. Please log in again.'
              });
              return;
            }
          });
          
          setAuthState({
            user,
            isAuthenticated: true,
            isLoading: false,
            error: null,
          });
        } else {
          setAuthState({
            user: null,
            isAuthenticated: false,
            isLoading: false,
            error: null,
          });
        }
      } catch (error) {
        console.error('Error loading user from localStorage:', error);
        setAuthState({
          user: null,
          isAuthenticated: false,
          isLoading: false,
          error: 'Failed to load user session',
        });
      }
    };

    loadUser();
  }, []);

  // Helper function to force app re-rendering when authentication state changes
  const forceRefresh = () => {
    // Force a refresh of the page to ensure all components recognize the auth state
    window.location.reload();
  };

  // Helper to ensure axios has the proper authorization header
  const ensureAuthHeader = useCallback((token: string) => {
    // Set the default Authorization header for all requests
    axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
    console.log("Auth header set:", axios.defaults.headers.common['Authorization']);
  }, []);

  // Register new user
  const register = useCallback(async (formData: RegisterFormData) => {
    setAuthState(prev => ({ ...prev, isLoading: true, error: null }));

    try {
      const response = await axios.post(`${API_URL}/auth/register`, {
        username: formData.username,
        email: formData.email,
        password: formData.password,
      });

      // After successful registration, log in the user automatically
      const loginResponse = await axios.post(`${API_URL}/auth/login`, {
        username: formData.username,
        password: formData.password,
      });

      const { user_id, username, session_token } = loginResponse.data;
      const user: User = { user_id, username, session_token };

      // Save to local storage
      localStorage.setItem(TOKEN_KEY, session_token);
      localStorage.setItem(USER_KEY, JSON.stringify(user));

      // Set auth header
      ensureAuthHeader(session_token);

      setAuthState({
        user,
        isAuthenticated: true,
        isLoading: false,
        error: null,
      });

      // Force refresh to ensure app recognizes authentication state
      setTimeout(forceRefresh, 100);

      return { success: true, message: response.data.message, autoLoggedIn: true };
    } catch (error: any) {
      const errorMessage = error.response?.data?.error || 'Registration failed';
      setAuthState(prev => ({
        ...prev,
        isLoading: false,
        error: errorMessage,
      }));
      return { success: false, message: errorMessage };
    }
  }, [ensureAuthHeader]);

  // Login user
  const login = useCallback(async (formData: LoginFormData) => {
    setAuthState(prev => ({ ...prev, isLoading: true, error: null }));

    try {
      const response = await axios.post(`${API_URL}/auth/login`, {
        username: formData.username,
        password: formData.password,
      });

      const { user_id, username, session_token } = response.data;
      const user: User = { user_id, username, session_token };

      // Save to local storage
      localStorage.setItem(TOKEN_KEY, session_token);
      localStorage.setItem(USER_KEY, JSON.stringify(user));

      // Set auth header
      ensureAuthHeader(session_token);

      // Important: Update the state immediately to trigger a re-render
      setAuthState({
        user,
        isAuthenticated: true,
        isLoading: false,
        error: null,
      });

      // Force refresh to ensure app recognizes authentication state
      setTimeout(forceRefresh, 100);

      return { success: true };
    } catch (error: any) {
      const errorMessage = error.response?.data?.error || 'Login failed';
      setAuthState(prev => ({
        ...prev,
        isLoading: false,
        error: errorMessage,
      }));
      return { success: false, message: errorMessage };
    }
  }, [ensureAuthHeader]);

  // Logout user
  const logout = useCallback(async () => {
    setAuthState(prev => ({ ...prev, isLoading: true }));

    try {
      // Get the token from local storage
      const token = localStorage.getItem(TOKEN_KEY);

      if (token) {
        // Call the logout endpoint
        await axios.post(
          `${API_URL}/auth/logout`,
          {},
          {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }
        );
      }
    } catch (error) {
      console.error('Error during logout:', error);
    } finally {
      // Clear local storage and state regardless of API response
      localStorage.removeItem(TOKEN_KEY);
      localStorage.removeItem(USER_KEY);

      // Remove the Authorization header
      delete axios.defaults.headers.common['Authorization'];

      setAuthState({
        user: null,
        isAuthenticated: false,
        isLoading: false,
        error: null,
      });
    }
  }, []);

  return {
    ...authState,
    register,
    login,
    logout,
  };
}; 