import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { userSettingsService } from '@/services/userSettings';
import { DEFAULT_PREFERENCES, type UserPreferences } from '@/types/database';

interface UserSettingsContextType {
  preferences: UserPreferences;
  loading: boolean;
  updatePreferences: (partial: Partial<UserPreferences>) => Promise<void>;
}

const UserSettingsContext = createContext<UserSettingsContextType | undefined>(undefined);

export const UserSettingsProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user } = useAuth();
  const [preferences, setPreferences] = useState<UserPreferences>(DEFAULT_PREFERENCES);
  const [loading, setLoading] = useState(true);

  // Load on auth
  useEffect(() => {
    if (!user) {
      setPreferences(DEFAULT_PREFERENCES);
      setLoading(false);
      return;
    }
    let cancelled = false;
    setLoading(true);
    userSettingsService.get(user.id)
      .then(data => { if (!cancelled) setPreferences(data); })
      .catch(() => { if (!cancelled) setPreferences(DEFAULT_PREFERENCES); })
      .finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, [user]);

  // Apply theme to <html>
  useEffect(() => {
    const root = document.documentElement;
    if (preferences.theme === 'dark') {
      root.classList.add('dark');
    } else {
      root.classList.remove('dark');
    }
  }, [preferences.theme]);

  const updatePreferences = useCallback(async (partial: Partial<UserPreferences>) => {
    if (!user) return;
    const next = { ...preferences, ...partial };
    setPreferences(next);
    await userSettingsService.update(user.id, next);
  }, [user, preferences]);

  return (
    <UserSettingsContext.Provider value={{ preferences, loading, updatePreferences }}>
      {children}
    </UserSettingsContext.Provider>
  );
};

export function useUserSettings(): UserSettingsContextType {
  const ctx = useContext(UserSettingsContext);
  if (!ctx) throw new Error('useUserSettings must be used within UserSettingsProvider');
  return ctx;
}
