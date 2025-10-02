import React from 'react';
import { Link, Route, Routes, Navigate, useLocation } from 'react-router-dom';
import { AppShell, Burger, Center, Group, Loader, NavLink, ScrollArea, Title } from '@mantine/core';
import { IconLayoutDashboard, IconTable } from '@tabler/icons-react';
import { Login } from './pages/Login';
import { Dashboard } from './pages/Dashboard';
import { Treatments } from './pages/Treatments';
import { AuthProvider, useAuth } from './auth/AuthContext';
import type { ReactNode } from 'react';

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

export default function App() {
  const [mobileOpened, setMobileOpened] = React.useState(false);
  const [desktopOpened, setDesktopOpened] = React.useState(true);
  const location = useLocation();

  return (
    <AuthProvider>
      <AppShell
        header={{ height: 56 }}
        navbar={{ width: 260, breakpoint: 'sm', collapsed: { mobile: !mobileOpened, desktop: !desktopOpened } }}
        padding="md"
      >
        <AppShell.Header>
          <Group h="100%" px="md" justify="space-between">
            <Group gap="sm">
              <Burger opened={mobileOpened} onClick={() => setMobileOpened((open) => !open)} hiddenFrom="sm" size="sm" />
              <Burger opened={desktopOpened} onClick={() => setDesktopOpened((open) => !open)} visibleFrom="sm" size="sm" />
              <Title order={3}>kalimere:vet</Title>
            </Group>
          </Group>
        </AppShell.Header>

        <AppShell.Navbar p="md">
          <ScrollArea style={{ height: '100%' }}>
            <NavLink
              component={Link}
              to="/"
              label="Dashboard"
              leftSection={<IconLayoutDashboard size={16} />}
              active={location.pathname === '/'}
              onClick={() => setMobileOpened(false)}
            />
            <NavLink
              component={Link}
              to="/treatments"
              label="Treatments"
              leftSection={<IconTable size={16} />}
              active={location.pathname.startsWith('/treatments')}
              onClick={() => setMobileOpened(false)}
            />
          </ScrollArea>
        </AppShell.Navbar>

        <AppShell.Main>
          <Routes>
            <Route path="/login" element={<Login />} />
            <Route
              path="/"
              element={
                <ProtectedRoute>
                  <Dashboard />
                </ProtectedRoute>
              }
            />
            <Route
              path="/treatments"
              element={
                <ProtectedRoute>
                  <Treatments />
                </ProtectedRoute>
              }
            />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </AppShell.Main>
      </AppShell>
    </AuthProvider>
  );
}
