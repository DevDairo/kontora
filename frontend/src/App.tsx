import { AppProviders } from "./app/providers/AppProviders";
import { appRoutes } from "./app/routes/appRoutes";
import { AppShell } from "./shared/components/AppShell";
import { HealthCheckPanel } from "./shared/components/HealthCheckPanel";
import { ModuleOverview } from "./shared/components/ModuleOverview";
import { useHealthCheck } from "./shared/hooks/useHealthCheck";

function AppContent() {
  const health = useHealthCheck();

  return (
    <AppShell routes={appRoutes} healthStatus={health.status}>
      <section className="section-heading" aria-labelledby="home-title">
        <div>
          <p className="eyebrow">Fase 4 - PR 1</p>
          <h1 id="home-title">Inicializacion frontend</h1>
          <p className="lead">
            Base React preparada para consumir la API real de Kontora POS.
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
