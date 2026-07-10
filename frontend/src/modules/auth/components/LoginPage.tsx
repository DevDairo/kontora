import { AlertCircle, CheckCircle2, KeyRound, LogIn, Server, UserRound } from "lucide-react";
import { FormEvent, useState } from "react";
import type { HealthStatus } from "../../../shared/hooks/useHealthCheck";
import { API_BASE_URL } from "../../../shared/utils/env";
import { useAuth } from "../hooks/useAuth";

type LoginPageProps = {
  healthStatus: HealthStatus;
};

const healthLabels: Record<HealthStatus, string> = {
  idle: "Sin validar",
  loading: "Validando API",
  online: "API disponible",
  offline: "API no disponible",
};

export function LoginPage({ healthStatus }: LoginPageProps) {
  const auth = useAuth();
  const [nombreUsuario, setNombreUsuario] = useState("");
  const [contrasena, setContrasena] = useState("");
  const [validationError, setValidationError] = useState<string | null>(null);

  const displayedError = validationError ?? auth.errorMessage;

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    auth.clearError();

    if (!nombreUsuario.trim() || !contrasena) {
      setValidationError("Ingresa usuario y contrasena.");
      return;
    }

    setValidationError(null);

    try {
      await auth.login({ nombreUsuario, contrasena });
    } catch {
      // El provider conserva el mensaje real entregado por la API.
    }
  }

  return (
    <main className="login-page" aria-labelledby="login-title">
      <section className="login-card">
        <div className="brand brand-centered">
          <span className="brand-mark">K</span>
          <span>Kontora POS</span>
        </div>

        <div>
          <p className="eyebrow">Acceso seguro</p>
          <h1 id="login-title">Iniciar sesion</h1>
          <p className="lead">
            Ingresa al sistema para gestionar la operacion diaria del punto de venta.
          </p>
        </div>

        <form className="form-grid" onSubmit={handleSubmit}>
          <label className="field-label" htmlFor="nombreUsuario">
            Usuario
            <span className="field-control">
              <UserRound size={18} strokeWidth={2.2} />
              <input
                id="nombreUsuario"
                autoComplete="username"
                type="text"
                value={nombreUsuario}
                onChange={(event) => setNombreUsuario(event.target.value)}
                placeholder="Nombre de usuario"
              />
            </span>
          </label>

          <label className="field-label" htmlFor="contrasena">
            Contrasena
            <span className="field-control">
              <KeyRound size={18} strokeWidth={2.2} />
              <input
                id="contrasena"
                autoComplete="current-password"
                type="password"
                value={contrasena}
                onChange={(event) => setContrasena(event.target.value)}
                placeholder="Contrasena"
              />
            </span>
          </label>

          {displayedError ? (
            <div className="form-alert" role="alert">
              <AlertCircle size={18} strokeWidth={2.2} />
              <span>{displayedError}</span>
            </div>
          ) : null}

          <button className="primary-button full" type="submit" disabled={auth.isSubmitting}>
            <LogIn size={18} strokeWidth={2.2} />
            {auth.isSubmitting ? "Ingresando" : "Ingresar"}
          </button>
        </form>

        <div className={`login-api-status ${healthStatus}`}>
          <Server size={18} strokeWidth={2.2} />
          <span>{healthLabels[healthStatus]}</span>
          <small>{API_BASE_URL}</small>
        </div>
      </section>

      <section className="login-preview" aria-label="Vista previa del sistema">
        <div className="preview-window">
          <div className="preview-sidebar" />
          <div className="preview-content">
            <div className="preview-top" />
            <div className="preview-metrics">
              <span />
              <span />
              <span />
            </div>
            <div className="preview-table">
              <span />
              <span />
              <span />
              <span />
            </div>
          </div>
        </div>

        <div className="login-proof">
          <CheckCircle2 size={20} strokeWidth={2.2} />
          <span>API real</span>
        </div>
      </section>
    </main>
  );
}
