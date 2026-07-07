import { useEffect } from "react";
import { AppProviders } from "./app/providers/AppProviders";
import { appRoutes } from "./app/routes/appRoutes";
import { LoginPage, useAuth } from "./modules/auth";
import { AppShell } from "./shared/components/AppShell";
import { HealthCheckPanel } from "./shared/components/HealthCheckPanel";
import { ModuleOverview } from "./shared/components/ModuleOverview";
import { useHealthCheck } from "./shared/hooks/useHealthCheck";

function replacePath(path: string) {
  if (window.location.pathname !== path) {
    window.history.replaceState(null, "", path);
  }
}

function SessionLoading() {
  return (
    <main className="session-loading" aria-live="polite">
      <div className="brand brand-centered">
        <span className="brand-mark">K</span>
        <span>Kontora POS</span>
      </div>
      <div className="loading-bar" aria-hidden="true" />
      <span>Validando sesion</span>
    </main>
  );
}

function AppContent() {
  const health = useHealthCheck();
  const auth = useAuth();

  useEffect(() => {
    if (auth.status === "authenticated") {
      replacePath("/");
    }

    if (auth.status === "unauthenticated") {
      replacePath("/login");
    }
  }, [auth.status]);

  if (auth.status === "checking" && !auth.user) {
    return <SessionLoading />;
  }

  if (auth.status !== "authenticated" || !auth.user) {
    return <LoginPage healthStatus={health.status} />;
  }

  return (
    <AppShell
      routes={appRoutes}
      healthStatus={health.status}
      user={auth.user}
      onLogout={auth.logout}
      isLoggingOut={auth.isLoggingOut}
    >
      <section className="section-heading" aria-labelledby="home-title">
        <div>
          <p className="eyebrow">Fase 4 - Autenticacion</p>
          <h1 id="home-title">Sesion activa</h1>
          <p className="lead">
            Frontend conectado a la API real con rutas protegidas por sesion.
          </p>
        </div>
      </section>

      <div className="dashboard-grid">
        <HealthCheckPanel health={health} />
        <ModuleOverview />
      </div>
    </AppShell>
  );
}

export default function App() {
  return (
    <AppProviders>
      <AppContent />
    </AppProviders>
  );
}
