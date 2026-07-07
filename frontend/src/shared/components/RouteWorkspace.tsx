import { CheckCircle2 } from "lucide-react";
import {
  getRouteDescriptionForRole,
  getRouteEndpointsForRole,
  roleLabels,
  routeStatusLabels,
  type AppRoute,
  type UserRole,
} from "../../app/routes/appRoutes";

type RouteWorkspaceProps = {
  route: AppRoute;
  role: UserRole | null;
};

export function RouteWorkspace({ route, role }: RouteWorkspaceProps) {
  const Icon = route.icon;
  const roleLabel = role ? roleLabels[role] : "Rol no reconocido";
  const description = getRouteDescriptionForRole(route, role);
  const endpoints = getRouteEndpointsForRole(route, role);

  return (
    <>
      <section className="section-heading" aria-labelledby={`${route.id}-title`}>
        <div>
          <p className="eyebrow">{roleLabel}</p>
          <h1 id={`${route.id}-title`}>{route.label}</h1>
          <p className="lead">{description}</p>
        </div>
        <span className={`badge ${route.status === "base" ? "success" : "warning"}`}>
          {routeStatusLabels[route.status]}
        </span>
      </section>

      <div className="route-workspace-grid">
        <article className="panel route-focus-panel">
          <div className="route-focus-icon">
            <Icon size={28} strokeWidth={2.1} />
          </div>
          <div>
            <h2>{route.label}</h2>
            <p>{description}</p>
          </div>
        </article>

        <article className="panel">
          <div className="panel-title">
            <div>
              <h2>Endpoints documentados</h2>
              <p>Contrato backend real</p>
            </div>
            <CheckCircle2 size={20} strokeWidth={2.2} aria-hidden="true" />
          </div>
          <ul className="endpoint-list">
            {endpoints.map((endpoint) => (
              <li key={endpoint}>{endpoint}</li>
            ))}
          </ul>
        </article>

        <article className="panel">
          <div className="panel-title">
            <div>
              <h2>Roles visibles</h2>
              <p>Filtro de experiencia</p>
            </div>
          </div>
          <div className="role-chip-list">
            {route.roles.map((routeRole) => (
              <span className={routeRole === role ? "role-chip active" : "role-chip"} key={routeRole}>
                {roleLabels[routeRole]}
              </span>
            ))}
          </div>
        </article>
      </div>
    </>
  );
}
