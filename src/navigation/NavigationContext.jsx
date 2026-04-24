import { createContext, useCallback, useContext, useEffect, useState } from 'react';

function normalizePathname(pathname) {
  const p = pathname.replace(/\/+$/, '') || '/';
  if (p === '/expenses') return '/expenses';
  return '/';
}

const NavigationContext = createContext(null);

export function NavigationProvider({ children }) {
  const [path, setPath] = useState(() =>
    typeof window !== 'undefined'
      ? normalizePathname(window.location.pathname)
      : '/'
  );

  useEffect(() => {
    const onPop = () =>
      setPath(normalizePathname(window.location.pathname));
    window.addEventListener('popstate', onPop);
    return () => window.removeEventListener('popstate', onPop);
  }, []);

  const navigate = useCallback((to) => {
    const next = normalizePathname(to);
    if (typeof window !== 'undefined') {
      window.history.pushState(null, '', next === '/' ? '/' : next);
      setPath(next);
    }
  }, []);

  return (
    <NavigationContext.Provider value={{ path, navigate }}>
      {children}
    </NavigationContext.Provider>
  );
}

export function useNavigation() {
  const ctx = useContext(NavigationContext);
  if (!ctx) {
    throw new Error('useNavigation debe usarse dentro de NavigationProvider');
  }
  return ctx;
}
