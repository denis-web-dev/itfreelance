import { createContext, useContext, useState, useEffect } from 'react';

const AuthContext = createContext(null);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth должен использоваться внутри AuthProvider');
  }
  return context;
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadUser = async () => {
      try {
        // ========== СЕЙЧАС (localStorage) ==========
        const savedUser = localStorage.getItem('user');
        if (savedUser) {
          setUser(JSON.parse(savedUser));
        }

        // ========== ПОТОМ (запрос к бэкенду) ==========
        // Раскомментируешь и удалишь кусок выше:
        //
        // const response = await fetch('/api/auth/me', {
        //   credentials: 'include', // если используешь cookie
        // });
        //
        // if (response.ok) {
        //   const data = await response.json();
        //   setUser(data.user);
        // } else {
        //   setUser(null);
        //   localStorage.removeItem('user');
        // }
      } catch (e) {
        console.error('Ошибка загрузки пользователя:', e);
        setUser(null);
      } finally {
        setLoading(false);
      }
    };

    loadUser();
  }, []);

  const updateUser = (newData) => {
    setUser((prev) => {
      const updated = { ...prev, ...newData };
      localStorage.setItem('user', JSON.stringify(updated));
      return updated;
    });
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem('user');
    // потом здесь же можно вызывать POST /api/auth/logout
  };

  return (
    <AuthContext.Provider
      value={{ user, setUser, updateUser, logout, loading }}
    >
      {children}
    </AuthContext.Provider>
  );
};
