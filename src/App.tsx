import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { ThemeProvider } from './contexts/ThemeContext';
import Layout from './components/Layout';
import LoadingState from './components/LoadingState';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import Usuarios from './pages/Usuarios';
import Pessoas from './pages/Pessoas';
import Setores from './pages/Setores';
import Cargos from './pages/Cargos';
import Atribuicoes from './pages/Atribuicoes';
// Catalog
import CatalogoCategorias from './pages/CatalogoCategorias';
import Produtos from './pages/Produtos';
import Servicos from './pages/Servicos';
import PatrimonioItens from './pages/PatrimonioItens';
import Moedas from './pages/Moedas';
import Cotacoes from './pages/Cotacoes';
// Stock & Assets
import Armazens from './pages/Armazens';
import EstoqueSaldos from './pages/EstoqueSaldos';
import EstoqueMovimentos from './pages/EstoqueMovimentos';
import CategoriaArmazens from './pages/CategoriaArmazens';
import Patrimonio from './pages/Patrimonio';
// Registrations
import Paises from './pages/Paises';
import Departamentos from './pages/Departamentos';
import Cidades from './pages/Cidades';
// Commercial
import ClientesFornecedores from './pages/ClientesFornecedores';
import Oportunidades from './pages/Oportunidades';
import ContratosComercial from './pages/ContratosComercial';
import ModelosContrato from './pages/ModelosContrato';
import Propostas from './pages/PropostaEditor';
import ModeloContratoEditor from './pages/ModeloContratoEditor';
import ContratoDocumentoViewer from './pages/ContratoDocumentoViewer';

function PrivateRoute({ children }: { children: React.ReactNode }) {
  const { usuario, loading } = useAuth();

  if (loading) {
    return <LoadingState variant="fullscreen" />;
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
            {/* Catalog Routes */}
            <Route path="/admin/catalogo/produtos" element={<PrivateRoute><Layout><Produtos /></Layout></PrivateRoute>} />
            <Route path="/admin/catalogo/servicos" element={<PrivateRoute><Layout><Servicos /></Layout></PrivateRoute>} />
            <Route path="/admin/catalogo/categorias" element={<PrivateRoute><Layout><CatalogoCategorias /></Layout></PrivateRoute>} />
            <Route path="/admin/catalogo/moedas" element={<PrivateRoute><Layout><Moedas /></Layout></PrivateRoute>} />
            <Route path="/admin/catalogo/cotacoes" element={<PrivateRoute><Layout><Cotacoes /></Layout></PrivateRoute>} />
            {/* Stock Routes */}
            <Route path="/admin/estoque/armazens" element={<PrivateRoute><Layout><Armazens /></Layout></PrivateRoute>} />
            <Route path="/admin/estoque/categorias-armazem" element={<PrivateRoute><Layout><CategoriaArmazens /></Layout></PrivateRoute>} />
            <Route path="/admin/estoque/saldos" element={<PrivateRoute><Layout><EstoqueSaldos /></Layout></PrivateRoute>} />
            <Route path="/admin/estoque/movimentos" element={<PrivateRoute><Layout><EstoqueMovimentos /></Layout></PrivateRoute>} />
            <Route path="/admin/patrimonio/ativos" element={<PrivateRoute><Layout><Patrimonio /></Layout></PrivateRoute>} />
            {/* Assets Routes */}
            <Route path="/admin/patrimonio/itens" element={<PrivateRoute><Layout><PatrimonioItens /></Layout></PrivateRoute>} />
            {/* Registration Routes */}
            <Route path="/admin/cadastros/paises" element={<PrivateRoute><Layout><Paises /></Layout></PrivateRoute>} />
            <Route path="/admin/cadastros/departamentos" element={<PrivateRoute><Layout><Departamentos /></Layout></PrivateRoute>} />
            <Route path="/admin/cadastros/cidades" element={<PrivateRoute><Layout><Cidades /></Layout></PrivateRoute>} />
            {/* Commercial Routes */}
            <Route path="/admin/comercial/clientes" element={<PrivateRoute><Layout><ClientesFornecedores /></Layout></PrivateRoute>} />
            <Route path="/admin/comercial/oportunidades" element={<PrivateRoute><Layout><Oportunidades /></Layout></PrivateRoute>} />
            <Route path="/admin/comercial/contratos" element={<PrivateRoute><Layout><ContratosComercial /></Layout></PrivateRoute>} />
            <Route path="/admin/comercial/modelos-contrato" element={<PrivateRoute><Layout><ModelosContrato /></Layout></PrivateRoute>} />
            <Route path="/admin/comercial/propostas" element={<PrivateRoute><Layout><Propostas /></Layout></PrivateRoute>} />
            <Route path="/admin/comercial/modelos-contrato/editor" element={<PrivateRoute><Layout><ModeloContratoEditor /></Layout></PrivateRoute>} />
            <Route path="/admin/comercial/documentos" element={<PrivateRoute><Layout><ContratoDocumentoViewer /></Layout></PrivateRoute>} />
            <Route path="/" element={<Navigate to="/admin" />} />
          </Routes>
        </AuthProvider>
      </BrowserRouter>
    </ThemeProvider>
  );
}

export default App;
