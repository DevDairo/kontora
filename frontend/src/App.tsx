import { useCallback, useEffect, useMemo, useState } from "react";
import { ClipboardList, PackageOpen } from "lucide-react";
import { AppProviders } from "./app/providers/AppProviders";
import {
  findRouteByPath,
  getVisibleRoutes,
  normalizeRole,
  roleLabels,
  type UserRole,
} from "./app/routes/appRoutes";
import { LoginPage, useAuth } from "./modules/auth";
import { CajaAbiertaPanel } from "./modules/caja";
import { CatalogosPanel } from "./modules/catalogos";
import { CierreCajaPanel } from "./modules/cierre";
import { DepositoPanel } from "./modules/deposito";
import { EvidenciasPanel } from "./modules/evidencias";
import { GastosPanel } from "./modules/gastos";
import { InventarioPanel } from "./modules/inventario";
import { VentasPanel } from "./modules/ventas";
import { AppShell } from "./shared/components/AppShell";
import { HealthCheckPanel } from "./shared/components/HealthCheckPanel";
import { ModuleOverview } from "./shared/components/ModuleOverview";
import { RouteWorkspace } from "./shared/components/RouteWorkspace";
import { useHealthCheck } from "./shared/hooks/useHealthCheck";

const roleHomeContent: Record<
  UserRole,
  {
    eyebrow: string;
    title: string;
    lead: string;
    highlights: Array<{ label: string; value: string; detail: string }>;
  }
> = {
  vendedor: {
    eyebrow: "Operacion de mostrador",
    title: "Panel de vendedor",
    lead: "Acceso operativo a ventas, caja abierta, registro de gastos y transferencias propias.",
    highlights: [
      { label: "Sesion", value: "Activa", detail: "Confirmada con /api/auth/me" },
      { label: "Caja", value: "Consulta", detail: "GET /api/cajas-diarias/abierta" },
      { label: "Ventas", value: "Registro", detail: "POST /api/ventas" },
    ],
  },
  administrador: {
    eyebrow: "Gestion operativa",
    title: "Panel de administrador",
    lead: "Vista para caja, catalogos, inventario, gastos, cierre, deposito y consultas operativas.",
    highlights: [
      { label: "Sesion", value: "Activa", detail: "Confirmada con /api/auth/me" },
      { label: "Caja", value: "Apertura", detail: "POST /api/cajas-diarias" },
      { label: "Cierre", value: "Disponible", detail: "POST /api/cajas-diarias/{id}/cerrar" },
    ],
  },
  gerente: {
    eyebrow: "Control gerencial",
    title: "Panel de gerente",
    lead: "Visibilidad gerencial sobre operacion, transferencias, cierres, deposito, consultas y auditoria completa.",
    highlights: [
      { label: "Sesion", value: "Activa", detail: "Confirmada con /api/auth/me" },
      { label: "Auditoria", value: "Completa", detail: "GET /api/consultas/auditoria" },
      { label: "Deposito", value: "Historial", detail: "GET /api/consultas/deposito/movimientos" },
    ],
  },
};

function setBrowserPath(path: string, replace = false) {
  if (window.location.pathname === path) {
    return;
  }

  if (replace) {
    window.history.replaceState(null, "", path);
    return;
  }

  window.history.pushState(null, "", path);
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

type RoleHomeProps = {
  role: UserRole | null;
  health: ReturnType<typeof useHealthCheck>;
  routes: ReturnType<typeof getVisibleRoutes>;
  activePath: string;
  onNavigate: (path: string) => void;
};

function RoleHome({ role, health, routes, activePath, onNavigate }: RoleHomeProps) {
  const content = role ? roleHomeContent[role] : roleHomeContent.vendedor;
  const roleLabel = role ? roleLabels[role] : "Rol no reconocido";
  const inventoryRoute = routes.find((route) => route.id === "inventario");
  const canManageInventory = role === "administrador" || role === "gerente";

  return (
    <>
      <section className="section-heading" aria-labelledby="home-title">
        <div>
          <p className="eyebrow">{content.eyebrow}</p>
          <h1 id="home-title">{content.title}</h1>
          <p className="lead">{content.lead}</p>
        </div>
      </section>

      <div className="role-highlight-grid">
        {content.highlights.map((item) => (
          <article className="role-highlight" key={item.label}>
            <span>{item.label}</span>
            <strong>{item.value}</strong>
            <small>{item.detail}</small>
          </article>
        ))}
      </div>

      {canManageInventory && inventoryRoute ? (
        <section className="inventory-shortcut-band" aria-labelledby="inventory-actions-title">
          <div>
            <p className="eyebrow">Inventario operativo</p>
            <h2 id="inventory-actions-title">Acciones de jornada</h2>
          </div>
          <div className="inventory-shortcut-actions">
            <button className="primary-button" type="button" onClick={() => onNavigate(inventoryRoute.path)}>
              <PackageOpen size={18} strokeWidth={2.2} />
              Abrir paquetes de vasos
            </button>
            <button className="ghost-button" type="button" onClick={() => onNavigate(inventoryRoute.path)}>
              <ClipboardList size={18} strokeWidth={2.2} />
              Registrar consumo diario
            </button>
          </div>
        </section>
      ) : null}

      <div className="dashboard-grid">
        <HealthCheckPanel health={health} />
        <ModuleOverview
          routes={routes}
          activePath={activePath}
          role={role}
          roleLabel={roleLabel}
          onNavigate={onNavigate}
        />
      </div>
    </>
  );
}

function AppContent() {
  const health = useHealthCheck();
  const auth = useAuth();
  const [activePath, setActivePath] = useState(() => window.location.pathname);

  const role = useMemo(() => normalizeRole(auth.user?.nombreRol ?? ""), [auth.user?.nombreRol]);
  const visibleRoutes = useMemo(() => getVisibleRoutes(auth.user?.nombreRol ?? ""), [auth.user?.nombreRol]);
  const activeRoute = findRouteByPath(visibleRoutes, activePath) ?? visibleRoutes[0];

  const navigate = useCallback((path: string, replace = false) => {
    setBrowserPath(path, replace);
    setActivePath(path);
  }, []);

  useEffect(() => {
    const handlePopState = () => {
      setActivePath(window.location.pathname);
    };

    window.addEventListener("popstate", handlePopState);
    return () => window.removeEventListener("popstate", handlePopState);
  }, []);

  useEffect(() => {
    if (auth.status === "authenticated") {
      if (activePath === "/login" || !findRouteByPath(visibleRoutes, activePath)) {
        navigate("/", true);
      }
    }

    if (auth.status === "unauthenticated") {
      navigate("/login", true);
    }
  }, [activePath, auth.status, navigate, visibleRoutes]);

  if (auth.status === "checking" && !auth.user) {
    return <SessionLoading />;
  }

  if (auth.status !== "authenticated" || !auth.user) {
    return <LoginPage healthStatus={health.status} />;
  }

  return (
    <AppShell
      routes={visibleRoutes}
      activePath={activeRoute.path}
      healthStatus={health.status}
      user={auth.user}
      onNavigate={navigate}
      onLogout={auth.logout}
      isLoggingOut={auth.isLoggingOut}
    >
      {activeRoute.id === "inicio" ? (
        <RoleHome
          role={role}
          health={health}
          routes={visibleRoutes}
          activePath={activeRoute.path}
          onNavigate={navigate}
        />
      ) : activeRoute.id === "caja" ? (
        <CajaAbiertaPanel token={auth.token ?? ""} role={role} />
      ) : activeRoute.id === "ventas" ? (
        <VentasPanel token={auth.token ?? ""} usuario={auth.user} />
      ) : activeRoute.id === "inventario" ? (
        <InventarioPanel token={auth.token ?? ""} role={role} />
      ) : activeRoute.id === "gastos" ? (
        <GastosPanel token={auth.token ?? ""} role={role} />
      ) : activeRoute.id === "cierre" ? (
        <CierreCajaPanel token={auth.token ?? ""} />
      ) : activeRoute.id === "deposito" ? (
        <DepositoPanel token={auth.token ?? ""} />
      ) : activeRoute.id === "evidencias" ? (
        <EvidenciasPanel token={auth.token ?? ""} />
      ) : activeRoute.id === "catalogos" ? (
        <CatalogosPanel token={auth.token ?? ""} />
      ) : (
        <RouteWorkspace route={activeRoute} role={role} />
      )}
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
