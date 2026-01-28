import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { ThemeProvider } from './contexts/ThemeContext';
import Layout from './components/Layout';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import Usuarios from './pages/Usuarios';
import Pessoas from './pages/Pessoas';
import Setores from './pages/Setores';
import Cargos from './pages/Cargos';
import Atribuicoes from './pages/Atribuicoes';

function PrivateRoute({ children }: { children: React.ReactNode }) {
  const { usuario, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-gray-500">Carregando...</div>
      </div>
    );
  }

  return usuario ? <>{children}</> : <Navigate to="/login" />;
}

function App() {
  return (
    <ThemeProvider>
      <BrowserRouter>
        <AuthProvider>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route
            path="/admin"
            element={
              <PrivateRoute>
                <Layout>
                  <Dashboard />
                </Layout>
              </PrivateRoute>
            }
          />
          <Route
            path="/admin/usuarios"
            element={
              <PrivateRoute>
                <Layout>
                  <Usuarios />
                </Layout>
              </PrivateRoute>
            }
          />
          <Route
            path="/admin/pessoas"
            element={
              <PrivateRoute>
                <Layout>
                  <Pessoas />
                </Layout>
              </PrivateRoute>
            }
          />
          <Route
            path="/admin/setores"
            element={
              <PrivateRoute>
                <Layout>
                  <Setores />
                </Layout>
              </PrivateRoute>
            }
          />
          <Route
            path="/admin/cargos"
            element={
              <PrivateRoute>
                <Layout>
                  <Cargos />
                </Layout>
              </PrivateRoute>
            }
          />
          <Route
            path="/admin/atribuicoes"
            element={
              <PrivateRoute>
                <Layout>
                  <Atribuicoes />
                </Layout>
              </PrivateRoute>
            }
          />
          <Route path="/" element={<Navigate to="/admin" />} />
        </Routes>
      </AuthProvider>
    </BrowserRouter>
    </ThemeProvider>
  );
}

export default App;
