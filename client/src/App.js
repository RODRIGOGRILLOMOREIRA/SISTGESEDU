import React, { Suspense, lazy } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

import { ThemeProvider } from './context/ThemeContext';
import { AuthProvider } from './context/AuthContext';
import { SchoolProvider } from './context/SchoolContext';
import PrivateRoute from './components/PrivateRoute';
import Layout from './components/Layout';

// Páginas de autenticação (carregadas imediatamente)
import Login from './pages/Login';
import Register from './pages/Register';

// Páginas principais com lazy loading (carregadas sob demanda)
const Home = lazy(() => import('./pages/Home'));
const Professores = lazy(() => import('./pages/Professores'));
const Disciplinas = lazy(() => import('./pages/Disciplinas'));
const Turmas = lazy(() => import('./pages/Turmas'));
const Alunos = lazy(() => import('./pages/Alunos'));
const Avaliacoes = lazy(() => import('./pages/Avaliacoes'));
const Habilidades = lazy(() => import('./pages/Habilidades'));
const Dashboard = lazy(() => import('./pages/Dashboard'));
const Relatorios = lazy(() => import('./pages/Relatorios'));
const Frequencias = lazy(() => import('./pages/Frequencias'));
const Configuracoes = lazy(() => import('./pages/Configuracoes'));

function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <SchoolProvider>
          <Router>
            <Suspense fallback={<div style={{ display: 'none' }} />}>
              <Routes>
                <Route path="/login" element={<Login />} />
                <Route path="/register" element={<Register />} />
                
                <Route element={<PrivateRoute><Layout /></PrivateRoute>}>
                  <Route path="/" element={<Home />} />
                  <Route path="/professores" element={<Professores />} />
                  <Route path="/disciplinas" element={<Disciplinas />} />
                  <Route path="/turmas" element={<Turmas />} />
                  <Route path="/alunos" element={<Alunos />} />
                  <Route path="/avaliacoes" element={<Avaliacoes />} />
                  <Route path="/habilidades" element={<Habilidades />} />
                  <Route path="/frequencias" element={<Frequencias />} />
                  <Route path="/dashboard" element={<Dashboard />} />
                  <Route path="/relatorios" element={<Relatorios />} />
                  <Route path="/configuracoes" element={<Configuracoes />} />
                </Route>
                
                <Route path="*" element={<Navigate to="/" replace />} />
              </Routes>
            </Suspense>
          </Router>
          <ToastContainer position="top-right" autoClose={3000} />
        </SchoolProvider>
      </AuthProvider>
    </ThemeProvider>
  );
}

export default App;
