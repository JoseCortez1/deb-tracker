import App from './App.jsx';
import { LoginScreen } from './components/LoginScreen.jsx';
import { AuthProvider, useAuth } from './auth/AuthContext.jsx';
import { NavigationProvider } from './navigation/NavigationContext.jsx';

function RootInner() {
  const { user, loading, logout } = useAuth();

  if (loading) {
    return (
      <div className="login-page login-page--bare">
        <p className="login-loading-text">Verificando sesi\u00f3n\u2026</p>
      </div>
    );
  }

  if (!user) {
    return <LoginScreen />;
  }

  return (
    <NavigationProvider>
      <App onLogout={logout} />
    </NavigationProvider>
  );
}

export function Root() {
  return (
    <AuthProvider>
      <RootInner />
    </AuthProvider>
  );
}
