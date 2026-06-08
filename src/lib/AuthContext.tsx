import React, { createContext, useContext, useEffect, useState } from 'react';

// Define a minimal MockUser type
interface MockUser {
  uid: string;
  email: string | null;
  displayName: string | null;
  photoURL: string | null;
}

interface AuthContextType {
  user: MockUser | null;
  loading: boolean;
  signInWithGoogle: () => Promise<void>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  loading: true,
  signInWithGoogle: async () => {},
  logout: async () => {},
});

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<MockUser | null>(null);
  const [loading, setLoading] = useState(true);

  const safeGetItem = (key: string): string | null => {
    try {
      return localStorage.getItem(key);
    } catch (e) {
      console.warn("localStorage is blocked or unavailable:", e);
      return null;
    }
  };

  const safeSetItem = (key: string, value: string): void => {
    try {
      localStorage.setItem(key, value);
    } catch (e) {
      console.warn("localStorage setItem is blocked or unavailable:", e);
    }
  };

  const safeRemoveItem = (key: string): void => {
    try {
      localStorage.removeItem(key);
    } catch (e) {
      console.warn("localStorage removeItem is blocked or unavailable:", e);
    }
  };

  useEffect(() => {
    // Simulate initial loading time
    const timer = setTimeout(() => {
      // Check if user was saved in localStorage for persistence
      const savedUser = safeGetItem('mockUser');
      if (savedUser) {
        try {
          setUser(JSON.parse(savedUser));
        } catch (e) {
          console.error("Failed to parse mock user", e);
        }
      }
      setLoading(false);
    }, 500);

    return () => clearTimeout(timer);
  }, []);

  const signInWithGoogle = async () => {
    // Simulate network latency
    setLoading(true);
    return new Promise<void>((resolve) => {
      setTimeout(() => {
        const mockUser: MockUser = {
          uid: 'mock-user-id-1234',
          email: 'admin@teraflowsdn.local',
          displayName: 'Admin User',
          photoURL: null,
        };
        setUser(mockUser);
        safeSetItem('mockUser', JSON.stringify(mockUser));
        setLoading(false);
        resolve();
      }, 600);
    });
  };

  const logout = async () => {
    setUser(null);
    safeRemoveItem('mockUser');
  };

  return (
    <AuthContext.Provider value={{ user, loading, signInWithGoogle, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
