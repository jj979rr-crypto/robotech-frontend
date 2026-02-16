// src/App.tsx
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';

import { StaffSelection } from './pages/auth/StaffSelection';
import { LoginPage } from './pages/auth/LoginPage';
import { RegisterCompetitor } from './pages/auth/RegisterCompetitor';
import { RegisterClubOwner } from './pages/auth/RegisterClubOwner';
import { ForgotPasswordPage } from './pages/auth/ForgotPasswordPage';
import { ResetPasswordPage } from './pages/auth/ResetPasswordPage';

import { DashboardAdmin } from './pages/admin/DashboardAdmin';
import { CreateTournament } from './pages/admin/CreateTournament';
import { CreateLocation } from './pages/admin/CreateLocation';

import { DashboardClub } from './pages/staff/DashboardClub';
import { DashboardJudge } from './pages/staff/DashboardJudge';

import { DashboardCompetitor } from './pages/competitor/DashboardCompetitor';
import { TournamentMarketplace } from './pages/competitor/TournamentMarketplace';

import { TournamentBracketPage } from './pages/public/TournamentBracketPage';
import { PublicHome } from './pages/public/PublicHome';
import { RankingPage } from './pages/public/RankingPage'; // 🆕 RANKING PÚBLICO
import { TournamentParticipantsPage } from './pages/public/TournamentParticipantsPage';

import { ProtectedRoute } from './routes/ProtectedRoute';

function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* ============ ZONA PÚBLICA / LANDING ============ */}
        <Route path="/" element={<PublicHome />} />

        {/* Ranking público (visible sin login) */}
        <Route path="/ranking" element={<RankingPage />} />

        {/* Login Competidor directo */}
        <Route
          path="/login"
          element={
            <LoginPage
              title="Acceso Competidores"
              role="competitor"
              color="blue"
            />
          }
        />

        {/* Registro Competidor */}
        <Route path="/registro" element={<RegisterCompetitor />} />

        {/* Registro Club Owner */}
        <Route path="/registro-club" element={<RegisterClubOwner />} />

        {/* Recuperación de contraseña */}
        <Route path="/forgot-password" element={<ForgotPasswordPage />} />
        <Route path="/reset-password" element={<ResetPasswordPage />} />

        {/* ============ STAFF SELECTION (DUEÑO/JUEZ) ============ */}
        <Route path="/internal" element={<StaffSelection />} />

        {/* Login Dueño */}
        <Route
          path="/internal/login-owner"
          element={
            <LoginPage
              title="Acceso Dueños de Club"
              role="club_owner"
              color="blue"
            />
          }
        />

        {/* Login Juez */}
        <Route
          path="/internal/login-judge"
          element={
            <LoginPage
              title="Acceso Jueces"
              role="judge"
              color="red"
            />
          }
        />

        {/* ============ ADMIN ============ */}
        <Route
          path="/admin-secret-access"
          element={
            <LoginPage
              title="Administrador Maestro"
              role="admin"
              color="slate"
            />
          }
        />

        <Route
          path="/admin/dashboard"
          element={
            <ProtectedRoute requiredRole="admin">
              <DashboardAdmin />
            </ProtectedRoute>
          }
        />
        <Route
          path="/admin/create-tournament"
          element={
            <ProtectedRoute requiredRole="admin">
              <CreateTournament />
            </ProtectedRoute>
          }
        />
        <Route
          path="/admin/create-location"
          element={
            <ProtectedRoute requiredRole="admin">
              <CreateLocation />
            </ProtectedRoute>
          }
        />

        {/* ============ DASHBOARDS PRIVADOS ============ */}
        <Route
          path="/club/dashboard"
          element={
            <ProtectedRoute requiredRole="club_owner">
              <DashboardClub />
            </ProtectedRoute>
          }
        />

        <Route
          path="/perfil"
          element={
            <ProtectedRoute requiredRole="competitor">
              <DashboardCompetitor />
            </ProtectedRoute>
          }
        />

        <Route
          path="/juez/dashboard"
          element={
            <ProtectedRoute requiredRole="judge">
              <DashboardJudge />
            </ProtectedRoute>
          }
        />

        {/* ============ TORNEOS COMPETIDOR ============ */}
        <Route
          path="/torneos-disponibles"
          element={
            <ProtectedRoute requiredRole="competitor">
              <TournamentMarketplace />
            </ProtectedRoute>
          }
        />

        {/* ============ FIXTURE PÚBLICO ============ */}
        <Route path="/torneos/:id/inscritos" element={<TournamentParticipantsPage />} />
        
        <Route path="/torneos/:id" element={<TournamentBracketPage />} />

        {/* Fallback */}
        <Route path="*" element={<Navigate to="/" />} />
      </Routes>
    </BrowserRouter>
    
  );
}

export default App;
