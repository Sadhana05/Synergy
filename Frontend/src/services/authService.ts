import { API_BASE_URL } from '@/config/env';

export interface User {
  id: string;
  email: string;
  username: string;
  first_name?: string;
  last_name?: string;
  is_verified: boolean;
  created_at: string;
}

export interface AuthResponse {
  success: boolean;
  data: {
    user: User;
    token: string;
  };
}

export interface LoginCredentials {
  email: string;
  password: string;
}

export interface RegisterData {
  email: string;
  username: string;
  password: string;
  first_name?: string;
  last_name?: string;
}

export interface ForgotPasswordData {
  email: string;
}

export interface ResetPasswordData {
  email: string;
  newPassword: string;
  confirmPassword: string;
}

class AuthService {
  private token: string | null = null;

  constructor() {
    this.token = localStorage.getItem('auth_token');
  }

  private setToken(token: string): void {
    this.token = token;
    localStorage.setItem('auth_token', token);
    console.log('Token set in localStorage:', token.substring(0, 20) + '...');
  }

  private clearToken(): void {
    this.token = null;
    localStorage.removeItem('auth_token');
    console.log('Token cleared from localStorage');
  }

  async login(credentials: LoginCredentials): Promise<AuthResponse> {
    console.log('Attempting login with:', credentials.email);

    const response = await fetch(`${API_BASE_URL}/auth/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(credentials),
    });

    if (!response.ok) {
      const error = await response.json();
      console.error('Login failed:', error);
      throw new Error(error.error?.message || 'Login failed');
    }

    const data: AuthResponse = await response.json();
    this.setToken(data.data.token);
    console.log('Login successful for user:', data.data.user.email);
    return data;
  }

  async register(userData: RegisterData): Promise<AuthResponse> {
    console.log('Attempting registration with:', userData.email);

    const response = await fetch(`${API_BASE_URL}/auth/register`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(userData),
    });

    if (!response.ok) {
      const error = await response.json();
      console.error('Registration failed:', error);
      throw new Error(error.error?.message || 'Registration failed');
    }

    const data: AuthResponse = await response.json();
    this.setToken(data.data.token);
    console.log('Registration successful for user:', data.data.user.email);
    return data;
  }

  async resetPassword(data: ResetPasswordData): Promise<{ success: boolean; message: string }> {
    console.log('Resetting password for:', data.email);

    const response = await fetch(`${API_BASE_URL}/auth/reset-password`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        email: data.email,
        newPassword: data.newPassword
      }),
    });

    if (!response.ok) {
      const error = await response.json();
      console.error('Reset password failed:', error);
      throw new Error(error.message || error.error?.message || 'Failed to reset password');
    }

    const result = await response.json();
    console.log('Password reset successful');
    return result;
  }

  async verifyToken(): Promise<{ success: boolean; data: { user: User } }> {
    const headers = {
      'Content-Type': 'application/json',
      ...this.getAuthHeader(),
    };

    const primary = await fetch(`${API_BASE_URL}/auth/verify`, { headers });
    if (primary.ok) {
      return primary.json();
    }

    // Backward-compat path for older backend revisions.
    if (primary.status === 404) {
      const fallback = await fetch(`${API_BASE_URL}/users/profile`, { headers });
      if (fallback.ok) {
        const data = await fallback.json();
        return { success: true, data: { user: data.data } };
      }
    }

    throw new Error('Token verification failed');
  }

  logout(): void {
    console.log('Logging out user');
    this.clearToken();
  }

  getToken(): string | null {
    return this.token || localStorage.getItem('auth_token');
  }

  isAuthenticated(): boolean {
    return !!this.getToken();
  }

  getAuthHeader(): { Authorization: string } | {} {
    const token = this.getToken();
    return token ? { Authorization: `Bearer ${token}` } : {};
  }

  async loginWithGoogle(googleToken: string): Promise<AuthResponse> {
    console.log('Attempting Google login');

    const response = await fetch(`${API_BASE_URL}/auth/google`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ token: googleToken }),
    });

    if (!response.ok) {
      const error = await response.json();
      console.error('Google login failed:', error);
      throw new Error(error.message || 'Google login failed');
    }

    const data: AuthResponse = await response.json();
    this.setToken(data.data.token);
    console.log('Google login successful for user:', data.data.user.email);
    return data;
  }

  async loginWithGitHub(githubCode: string): Promise<AuthResponse> {
    console.log('Attempting GitHub login');

    const response = await fetch(`${API_BASE_URL}/auth/github`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ code: githubCode }),
    });

    if (!response.ok) {
      const error = await response.json();
      console.error('GitHub login failed:', error);
      throw new Error(error.message || 'GitHub login failed');
    }

    const data: AuthResponse = await response.json();
    this.setToken(data.data.token);
    console.log('GitHub login successful for user:', data.data.user.email);
    return data;
  }
}

export const authService = new AuthService();


//Changes made//