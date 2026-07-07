import { LogOut, Server, UserRound } from "lucide-react";
import type { PropsWithChildren } from "react";
import type { AppRoute } from "../../app/routes/appRoutes";
import type { HealthStatus } from "../hooks/useHealthCheck";

type AppShellProps = PropsWithChildren<{
  routes: AppRoute[];
  healthStatus: HealthStatus;
  user: {
    nombreCompleto: string;
    nombreUsuario: string;
    nombreRol: string;
  };
  onLogout: () => void;
  isLoggingOut?: boolean;
}>;

const healthLabels: Record<HealthStatus, string> = {
  idle: "Sin validar",
  loading: "Validando API",
  online: "API disponible",
  offline: "API no disponible",
};

export function AppShell({
  routes,
  healthStatus,
  user,
  onLogout,
  isLoggingOut = false,
  children,
}: AppShellProps) {
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

          <div className="topbar-actions">
            <div className={`status-pill ${healthStatus}`}>
              <span className="status-dot" aria-hidden="true" />
              <span>{healthLabels[healthStatus]}</span>
            </div>

            <div className="user-chip">
              <span className="avatar" aria-hidden="true">
                <UserRound size={17} strokeWidth={2.2} />
              </span>
              <span>
                <strong>{user.nombreCompleto}</strong>
                <small>
                  {user.nombreRol} · {user.nombreUsuario}
                </small>
              </span>
            </div>

            <button
              className="icon-button"
              type="button"
              onClick={onLogout}
              disabled={isLoggingOut}
              aria-label="Cerrar sesion"
              title="Cerrar sesion"
            >
              <LogOut size={18} strokeWidth={2.2} />
            </button>
          </div>
        </header>

        <main className="content">{children}</main>
      </div>
    </div>
  );
}
