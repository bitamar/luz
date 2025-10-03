import { type ReactNode, useState } from 'react';
import 'dayjs/locale/he';
import { AppShell, Center, Loader, ScrollArea } from '@mantine/core';
import Header from './Header';
import Navbar from './Navbar';
import { Navigate, Outlet, Route, Routes } from 'react-router-dom';
import { Login } from './pages/Login';
import { AuthProvider, useAuth } from './auth/AuthContext';
import { Dashboard } from './pages/Dashboard';
import { Treatments } from './pages/Treatments';
import { Settings } from './pages/Settings';

function ProtectedRoute({ children }: { children: ReactNode }) {
  const { user, isHydrated } = useAuth();
  if (!isHydrated) {
    return (
      <Center h="100%">
        <Loader size="sm" />
      </Center>
    );
  }
  if (!user) return <Navigate to="/login" replace />;
  return children;
}

function PlainLayout() {
  return <Outlet />;
}

function ProtectedLayout() {
  const [opened, setOpened] = useState(false);

  return (
    <AppShell
      header={{ height: 64 }}
      navbar={{ width: 280, breakpoint: 'sm', collapsed: { mobile: !opened } }}
      padding="md"
    >
      <AppShell.Header>
        <Header opened={opened} setOpened={setOpened} />
      </AppShell.Header>

      <AppShell.Navbar>
        <Navbar />
      </AppShell.Navbar>

      <AppShell.Main>
        <ScrollArea type="auto" style={{ height: 'calc(100dvh - 64px)' }}>
          <Outlet />
        </ScrollArea>
      </AppShell.Main>
    </AppShell>
  );
}

export default function AppRoutes() {
  return (
    <AuthProvider>
      <Routes>
        <Route element={<PlainLayout />}>
          <Route path="/login" element={<Login />} />
        </Route>

        <Route
          element={
            <ProtectedRoute>
              <ProtectedLayout />
            </ProtectedRoute>
          }
        >
          <Route path="/" element={<Dashboard />} />
          <Route path="/treatments" element={<Treatments />} />
          <Route path="/settings" element={<Settings />} />
        </Route>

        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </AuthProvider>
  );
}
