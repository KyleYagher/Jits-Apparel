import { AuthContext } from './AuthContext';
import { useState, ReactNode, useEffect } from 'react';
import { apiClient } from '../src/services/api';

export interface User {
    id: string;
    email: string;
    name: string;
    avatar?: string;
    roles?: string[];
}

  
export function AuthProvider({ children }: { children: ReactNode }) {
    // Initialize user state from localStorage using lazy initialization
    const [user, setUser] = useState<User | null>(() => {
      const savedUser = localStorage.getItem('jits-user');
      if (savedUser) {
        try {
          return JSON.parse(savedUser);
        } catch (error) {
          console.error('Failed to parse saved user', error);
          localStorage.removeItem('jits-user');
        }
      }
      return null;
    });
    const [isLoading, setIsLoading] = useState(true); // Start as true for initial session verification

    // Login function - calls the .NET Core Identity API
    const login = async (email: string, password: string): Promise<{ success: boolean; error?: string }> => {
      try {
        const response = await apiClient.login({ email, password });

        // Store tokens
        localStorage.setItem('jits-access-token', response.accessToken);
        localStorage.setItem('jits-refresh-token', response.refreshToken);

        // Map API user to our User interface
        const user: User = {
          id: String(response.user.id),
          email: response.user.email,
          name: `${response.user.firstName} ${response.user.lastName}`,
          avatar: undefined,
          roles: response.user.roles || []
        };

        setUser(user);
        localStorage.setItem('jits-user', JSON.stringify(user));

        return { success: true };
      } catch (error) {
        console.error('Login error:', error);
        return {
          success: false,
          error: error instanceof Error ? error.message : 'Invalid email or password'
        };
      }
    };

    // Register function - calls the .NET Core Identity API
    const register = async (name: string, email: string, password: string): Promise<{ success: boolean; error?: string }> => {
      try {
        // Split name into firstName and lastName
        const nameParts = name.trim().split(' ');
        const firstName = nameParts[0] || '';
        const lastName = nameParts.slice(1).join(' ') || nameParts[0];

        const response = await apiClient.register({
          email,
          password,
          firstName,
          lastName
        });

        // Store tokens
        localStorage.setItem('jits-access-token', response.accessToken);
        localStorage.setItem('jits-refresh-token', response.refreshToken);

        // Map API user to our User interface
        const user: User = {
          id: String(response.user.id),
          email: response.user.email,
          name: `${response.user.firstName} ${response.user.lastName}`,
          avatar: undefined,
          roles: response.user.roles || []
        };

        setUser(user);
        localStorage.setItem('jits-user', JSON.stringify(user));

        return { success: true };
      } catch (error) {
        console.error('Registration error:', error);
        return {
          success: false,
          error: error instanceof Error ? error.message : 'Registration failed. Please try again.'
        };
      }
    };

    const logout = () => {
      setUser(null);
      localStorage.removeItem('jits-user');
      localStorage.removeItem('jits-access-token');
      localStorage.removeItem('jits-refresh-token');
    };

    const updateProfile = (updates: Partial<User>) => {
      if (!user) return;

      const updatedUser = { ...user, ...updates };
      setUser(updatedUser);
      localStorage.setItem('jits-user', JSON.stringify(updatedUser));
    };

    // Verify token on mount and restore session if valid
    useEffect(() => {
      const verifySession = async () => {
        const token = localStorage.getItem('jits-access-token');
        const savedUser = localStorage.getItem('jits-user');

        if (token && savedUser) {
          try {
            // Verify token is still valid by fetching current user
            await apiClient.getCurrentUser();
            // Token is valid, user state already set from localStorage
          } catch {
            // Token is invalid, clear everything
            logout();
          }
        }
        setIsLoading(false);
      };

      verifySession();
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    return (
      <AuthContext.Provider value={{
        user,
        isAuthenticated: !!user,
        isLoading,
        login,
        register,
        logout,
        updateProfile
      }}>
        {children}
      </AuthContext.Provider>
    );
  }