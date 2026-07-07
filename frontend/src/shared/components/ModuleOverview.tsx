import {
  getRouteEndpointsForRole,
  routeStatusLabels,
  type AppRoute,
  type UserRole,
} from "../../app/routes/appRoutes";

type ModuleOverviewProps = {
  routes: AppRoute[];
  activePath: string;
  role: UserRole | null;
  roleLabel: string;
  onNavigate: (path: string) => void;
};

export function ModuleOverview({ routes, activePath, role, roleLabel, onNavigate }: ModuleOverviewProps) {
  const moduleRoutes = routes.filter((route) => route.id !== "inicio");

  return (
    <article className="panel">
      <div className="panel-title">
        <div>
          <h2>Navegacion visible</h2>
          <p>{roleLabel}</p>
        </div>
        <span className="badge">Layout</span>
      </div>

      <div className="module-grid">
        {moduleRoutes.map((route) => {
          const Icon = route.icon;
          const isActive = route.path === activePath;
          const endpoints = getRouteEndpointsForRole(route, role);
          return (
            <button
              className={`metric-card route-card-button ${isActive ? "active" : ""}`}
              key={route.path}
              type="button"
              onClick={() => onNavigate(route.path)}
              aria-current={isActive ? "page" : undefined}
            >
              <div className="metric-icon">
                <Icon size={19} strokeWidth={2.2} />
              </div>
              <div>
                <h3>{route.label}</h3>
                <span>{routeStatusLabels[route.status]}</span>
              </div>
              <p>{endpoints[0]}</p>
            </button>
          );
        })}
      </div>
    </article>
  );
}
