import React from 'react';
import { Link, Route, Routes, Navigate, useLocation } from 'react-router-dom';
import { AppShell, Burger, Center, Group, Loader, NavLink, ScrollArea, Title, Button } from '@mantine/core';
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

function SidebarFooter() {
  const { user, logout } = useAuth();
  if (!user) return null;
  return (
    <div style={{ paddingTop: 12 }}>
      <Button size="xs" variant="light" fullWidth onClick={logout}>
        Logout
      </Button>
    </div>
  );
}

function Sidebar() {
  const { user } = useAuth();
  const location = useLocation();
  if (!user) return null;
  return (
    <AppShell.Navbar p="md">
      <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
        <ScrollArea style={{ flex: 1 }}>
          <NavLink
            component={Link}
            to="/"
            label="Dashboard"
            leftSection={<IconLayoutDashboard size={16} />}
            active={location.pathname === '/'}
          />
          <NavLink
            component={Link}
            to="/treatments"
            label="Treatments"
            leftSection={<IconTable size={16} />}
            active={location.pathname.startsWith('/treatments')}
          />
        </ScrollArea>
        <SidebarFooter />
      </div>
    </AppShell.Navbar>
  );
}

function HeaderBurgerControls({
  mobileOpened,
  setMobileOpened,
  desktopOpened,
  setDesktopOpened,
}: {
  mobileOpened: boolean;
  setMobileOpened: React.Dispatch<React.SetStateAction<boolean>>;
  desktopOpened: boolean;
  setDesktopOpened: React.Dispatch<React.SetStateAction<boolean>>;
}) {
  const { user } = useAuth();
  if (!user) return null;
  return (
    <>
      <Burger opened={mobileOpened} onClick={() => setMobileOpened((open) => !open)} hiddenFrom="sm" size="sm" />
      <Burger opened={desktopOpened} onClick={() => setDesktopOpened((open) => !open)} visibleFrom="sm" size="sm" />
    </>
  );
}

export default function App() {
  const [mobileOpened, setMobileOpened] = React.useState(false);
  const [desktopOpened, setDesktopOpened] = React.useState(true);

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
              <HeaderBurgerControls
                mobileOpened={mobileOpened}
                setMobileOpened={setMobileOpened}
                desktopOpened={desktopOpened}
                setDesktopOpened={setDesktopOpened}
              />
              <Title order={3}>kalimere:vet</Title>
            </Group>
          </Group>
        </AppShell.Header>

        <Sidebar />

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
