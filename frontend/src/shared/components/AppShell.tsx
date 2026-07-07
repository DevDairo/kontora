import { Server } from "lucide-react";
import type { PropsWithChildren } from "react";
import type { AppRoute } from "../../app/routes/appRoutes";
import type { HealthStatus } from "../hooks/useHealthCheck";

type AppShellProps = PropsWithChildren<{
  routes: AppRoute[];
  healthStatus: HealthStatus;
}>;

const healthLabels: Record<HealthStatus, string> = {
  idle: "Sin validar",
  loading: "Validando API",
  online: "API disponible",
  offline: "API no disponible",
};

export function AppShell({ routes, healthStatus, children }: AppShellProps) {
  return (
    <div className="app-shell">
      <aside className="sidebar">
        <div className="brand">
          <span className="brand-mark">K</span>
          <span>Kontora POS</span>
        </div>

        <nav className="menu" aria-label="Navegacion principal">
          {routes.map((route) => {
            const Icon = route.icon;
            return (
              <button
                key={route.path}
                className={route.status === "activo" ? "active" : undefined}
                type="button"
                aria-current={route.status === "activo" ? "page" : undefined}
                disabled={route.status !== "activo"}
              >
                <Icon size={18} strokeWidth={2.2} />
                <span>{route.label}</span>
                <span className="menu-status" aria-hidden="true" />
              </button>
            );
          })}
        </nav>

        <div className="sidebar-note">
          <strong>Contrato backend</strong>
          <span>Endpoints reales documentados en docs/modules.</span>
        </div>
      </aside>

      <div className="workspace">
        <header className="topbar">
          <div className="topbar-title">
            <Server size={20} strokeWidth={2.2} />
            <span>Integracion local</span>
          </div>
          <div className={`status-pill ${healthStatus}`}>
            <span className="status-dot" aria-hidden="true" />
            <span>{healthLabels[healthStatus]}</span>
          </div>
        </header>

        <main className="content">{children}</main>
      </div>
    </div>
  );
}
