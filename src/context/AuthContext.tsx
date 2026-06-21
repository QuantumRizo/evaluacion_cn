import {
  createContext,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from 'react';
import type { Models } from 'appwrite';
import { account, databases, Query } from '../lib/appwrite';
import { DB_ID, COLLECTIONS } from '../lib/constants';
import type { Employee } from '../types';

interface AuthContextType {
  user: Models.User<Models.Preferences> | null;
  employee: Employee | null;
  isLoading: boolean;
  isAdmin: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<Models.User<Models.Preferences> | null>(null);
  const [employee, setEmployee] = useState<Employee | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    checkAuth();
  }, []);

  async function checkAuth() {
    try {
      const currentUser = await account.get();
      setUser(currentUser);

      const result = await databases.listDocuments(
        DB_ID,
        COLLECTIONS.EMPLOYEES,
        [Query.equal('auth_user_id', currentUser.$id)]
      );

      if (result.documents.length > 0) {
        setEmployee(result.documents[0] as unknown as Employee);
      } else {
        setEmployee(null);
      }
    } catch {
      setUser(null);
      setEmployee(null);
    } finally {
      setIsLoading(false);
    }
  }

  async function login(email: string, password: string) {
    await account.createEmailPasswordSession(email, password);
    await checkAuth();
  }

  async function logout() {
    await account.deleteSession('current');
    setUser(null);
    setEmployee(null);
  }

  return (
    <AuthContext.Provider
      value={{
        user,
        employee,
        isLoading,
        isAdmin: employee?.role === 'admin',
        login,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
