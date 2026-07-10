import { CheckCircle2, ClipboardList, Pencil, Plus, ReceiptText, RefreshCw, Save, UsersRound, X, XCircle } from "lucide-react";
import { type FormEvent, useCallback, useEffect, useState } from "react";
import type { UserRole } from "../../../app/routes/appRoutes";
import { ApiClientError } from "../../../shared/services/apiClient";
import { normalizeMoneyInput } from "../../../shared/utils/moneyInput";
import {
  anularGastoCaja,
  confirmarPagoTrabajadores,
  editarGastoCaja,
  listarGastosCajaAbierta,
  obtenerPagoTrabajadoresCajaAbierta,
  registrarGastoCaja,
  registrarPagoTrabajadores,
} from "../services/gastosService";
import type { GastoCaja, PagoTrabajadoresDiario } from "../types";

type LoadState = "loading" | "success" | "no-cash-box" | "error";
type SubmitAction = "gasto" | "pago" | "confirmar-pago" | "editar-gasto" | "anular-gasto" | null;
type GastoAction = { mode: "editar" | "anular"; gasto: GastoCaja } | null;

type GastosPanelProps = {
  token: string;
  role: UserRole | null;
};

function formatCurrency(value: number | null | undefined) {
  return new Intl.NumberFormat("es-CO", {
    currency: "COP",
    maximumFractionDigits: 0,
    style: "currency",
  }).format(Number(value ?? 0));
}

function formatDateTime(value: string | null | undefined) {
  if (!value) {
    return "Sin registrar";
  }

  return new Intl.DateTimeFormat("es-CO", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(value));
}

function messageFor(error: unknown) {
  if (error instanceof ApiClientError) {
    return error.message;
  }

  return error instanceof Error ? error.message : "No fue posible operar los gastos de caja";
}

function gastoStateClass(estado: GastoCaja["estadoGasto"]) {
  return estado === "anulado" ? "warning" : estado === "editado" ? "success" : "";
}

async function obtenerPagoTrabajadoresOpcional(token: string): Promise<PagoTrabajadoresDiario | null> {
  try {
    return await obtenerPagoTrabajadoresCajaAbierta(token);
  } catch (error) {
    if (error instanceof ApiClientError && error.status === 404) {
      return null;
    }

    throw error;
  }
}

export function GastosPanel({ token, role }: GastosPanelProps) {
  const [gastos, setGastos] = useState<GastoCaja[]>([]);
  const [loadState, setLoadState] = useState<LoadState>("loading");
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [actionMessage, setActionMessage] = useState<string | null>(null);
  const [submittingAction, setSubmittingAction] = useState<SubmitAction>(null);
  const [valorGasto, setValorGasto] = useState("");
  const [descripcionGasto, setDescripcionGasto] = useState("");
  const [pagoTrabajadores, setPagoTrabajadores] = useState<PagoTrabajadoresDiario | null>(null);
  const [valorPagoTrabajadores, setValorPagoTrabajadores] = useState("0");
  const [descripcionPagoTrabajadores, setDescripcionPagoTrabajadores] = useState("");
  const [confirmadoParaCierre, setConfirmadoParaCierre] = useState(false);
  const [gastoAction, setGastoAction] = useState<GastoAction>(null);
  const [valorGastoEdicion, setValorGastoEdicion] = useState("");
  const [descripcionGastoEdicion, setDescripcionGastoEdicion] = useState("");
  const [motivoGastoAction, setMotivoGastoAction] = useState("");

  const canManageGastos = role === "administrador" || role === "gerente";
  const isCashBoxOpen = loadState === "success";

  const loadGastos = useCallback(async () => {
    setLoadState("loading");
    setErrorMessage(null);

    try {
      const [gastosResponse, pagoResponse] = await Promise.all([
        listarGastosCajaAbierta(token),
        canManageGastos ? obtenerPagoTrabajadoresOpcional(token) : Promise.resolve(null),
      ]);
      setGastos(gastosResponse);
      setPagoTrabajadores(pagoResponse);
      setLoadState("success");
    } catch (error) {
      setGastos([]);
      setPagoTrabajadores(null);

      if (error instanceof ApiClientError && error.status === 409) {
        setLoadState("no-cash-box");
        setErrorMessage(error.message);
        return;
      }

      setLoadState("error");
      setErrorMessage(messageFor(error));
    }
  }, [canManageGastos, token]);

  useEffect(() => {
    void loadGastos();
  }, [loadGastos]);

  useEffect(() => {
    if (!pagoTrabajadores) {
      setValorPagoTrabajadores("0");
      setDescripcionPagoTrabajadores("");
      setConfirmadoParaCierre(false);
      return;
    }

    setValorPagoTrabajadores(String(pagoTrabajadores.valorTotalPagado));
    setDescripcionPagoTrabajadores(pagoTrabajadores.descripcion ?? "");
    setConfirmadoParaCierre(pagoTrabajadores.confirmadoParaCierre);
  }, [pagoTrabajadores]);

  function beginGastoAction(mode: "editar" | "anular", gasto: GastoCaja) {
    setActionMessage(null);
    setMotivoGastoAction("");
    setValorGastoEdicion(String(gasto.valorGasto));
    setDescripcionGastoEdicion(gasto.descripcion);
    setGastoAction({ mode, gasto });
  }

  function cancelGastoAction() {
    setGastoAction(null);
    setMotivoGastoAction("");
  }

  async function handleGastoSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const value = Number(valorGasto);
    const descripcion = descripcionGasto.trim();

    if (!Number.isFinite(value) || value <= 0 || !descripcion) {
      setActionMessage("Ingresa un valor de gasto mayor a cero y una descripcion.");
      return;
    }

    setSubmittingAction("gasto");
    setActionMessage(null);

    try {
      await registrarGastoCaja(token, { descripcion, valorGasto: value });
      await loadGastos();
      setValorGasto("");
      setDescripcionGasto("");
      setActionMessage("Gasto de caja registrado.");
    } catch (error) {
      setActionMessage(messageFor(error));
    } finally {
      setSubmittingAction(null);
    }
  }

  async function handlePagoTrabajadoresSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const value = Number(valorPagoTrabajadores);
    const descripcion = descripcionPagoTrabajadores.trim();

    if (!Number.isFinite(value) || value < 0) {
      setActionMessage("El pago diario a trabajadores debe ser un valor valido igual o mayor a cero.");
      return;
    }

    if (value === 0 && !confirmadoParaCierre) {
      setActionMessage("Un pago a trabajadores en cero requiere la confirmacion explicita para cierre.");
      return;
    }

    setSubmittingAction("pago");
    setActionMessage(null);

    try {
      const pago = await registrarPagoTrabajadores(token, {
        confirmadoParaCierre,
        descripcion: descripcion || undefined,
        valorTotalPagado: value,
      });
      await loadGastos();
      if (pago.confirmadoParaCierre) {
        setActionMessage(pagoTrabajadores ? "Pago diario actualizado y confirmado para cierre." : "Pago diario guardado y confirmado para cierre.");
      } else {
        setActionMessage(pagoTrabajadores ? "Pago diario actualizado; falta confirmarlo para el cierre." : "Pago diario guardado.");
      }
    } catch (error) {
      setActionMessage(messageFor(error));
    } finally {
      setSubmittingAction(null);
    }
  }

  async function handleConfirmarPago() {
    if (!pagoTrabajadores) {
      return;
    }

    setSubmittingAction("confirmar-pago");
    setActionMessage(null);

    try {
      await confirmarPagoTrabajadores(token, pagoTrabajadores.idPagoTrabajadoresDiario);
      await loadGastos();
      setConfirmadoParaCierre(true);
      setActionMessage("Pago diario confirmado para cierre.");
    } catch (error) {
      setActionMessage(messageFor(error));
    } finally {
      setSubmittingAction(null);
    }
  }

  async function handleGastoActionSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!gastoAction) {
      return;
    }

    const motivo = motivoGastoAction.trim();
    if (!motivo) {
      setActionMessage(gastoAction.mode === "editar" ? "El motivo de edicion es obligatorio." : "El motivo de anulacion es obligatorio.");
      return;
    }

    if (gastoAction.mode === "editar") {
      const value = Number(valorGastoEdicion);
      const descripcion = descripcionGastoEdicion.trim();

      if (!Number.isFinite(value) || value <= 0 || !descripcion) {
        setActionMessage("Ingresa un valor mayor a cero y una descripcion para editar el gasto.");
        return;
      }

      setSubmittingAction("editar-gasto");

      try {
        await editarGastoCaja(token, gastoAction.gasto.idGastoCaja, {
          descripcion,
          motivoEdicion: motivo,
          valorGasto: value,
        });
        await loadGastos();
        setActionMessage("Gasto de caja editado y auditado.");
        cancelGastoAction();
      } catch (error) {
        setActionMessage(messageFor(error));
      } finally {
        setSubmittingAction(null);
      }

      return;
    }

    setSubmittingAction("anular-gasto");

    try {
      await anularGastoCaja(token, gastoAction.gasto.idGastoCaja, { motivoAnulacion: motivo });
      await loadGastos();
      setActionMessage("Gasto de caja anulado y auditado.");
      cancelGastoAction();
    } catch (error) {
      setActionMessage(messageFor(error));
    } finally {
      setSubmittingAction(null);
    }
  }

  return (
    <>
      <section className="section-heading" aria-labelledby="gastos-title">
        <div>
          <p className="eyebrow">Gastos de caja</p>
          <h1 id="gastos-title">Gastos y pago diario</h1>
          <p className="lead">Registra gastos y administra el pago diario a trabajadores de la jornada abierta.</p>
        </div>
        <button className="ghost-button" type="button" onClick={loadGastos} disabled={loadState === "loading"}>
          <RefreshCw size={17} strokeWidth={2.2} />
          Actualizar
        </button>
      </section>

      {errorMessage ? (
        <div className="form-alert" role="status">
          <ReceiptText size={18} strokeWidth={2.2} />
          <span>{errorMessage}</span>
        </div>
      ) : null}

      <section className="gastos-actions-grid" aria-label="Registro y control de gastos">
        <form className="panel gastos-form-panel" onSubmit={handleGastoSubmit}>
          <div className="panel-title">
            <div>
              <h2>Registrar gasto</h2>
              <p>Disponible para vendedor, administrador y gerente.</p>
            </div>
            <ReceiptText size={22} strokeWidth={2.2} />
          </div>

          <label className="field-label">
            Valor del gasto
            <div className="field-control plain">
              <input
                inputMode="decimal"
                type="text"
                value={valorGasto}
                onChange={(event) => setValorGasto(normalizeMoneyInput(event.target.value))}
                disabled={!isCashBoxOpen}
                required
              />
            </div>
          </label>

          <label className="field-label">
            Descripcion
            <div className="field-control plain">
              <input
                maxLength={1000}
                type="text"
                value={descripcionGasto}
                onChange={(event) => setDescripcionGasto(event.target.value)}
                disabled={!isCashBoxOpen}
                placeholder="Ejemplo: compra de hielo"
                required
              />
            </div>
          </label>

          <button className="primary-button full" type="submit" disabled={!isCashBoxOpen || submittingAction === "gasto"}>
            <Plus size={18} strokeWidth={2.2} />
            {submittingAction === "gasto" ? "Registrando" : "Registrar gasto"}
          </button>
        </form>

        {canManageGastos ? (
          <form className="panel gastos-form-panel" onSubmit={handlePagoTrabajadoresSubmit}>
            <div className="panel-title">
              <div>
                <h2>Pago a trabajadores</h2>
                <p>
                  {pagoTrabajadores?.confirmadoParaCierre
                    ? "Confirmado para cierre; se puede actualizar mientras la caja siga abierta."
                    : "Obligatorio antes del cierre de caja."}
                </p>
              </div>
              {pagoTrabajadores?.confirmadoParaCierre ? <CheckCircle2 size={22} strokeWidth={2.2} /> : <UsersRound size={22} strokeWidth={2.2} />}
            </div>

            <label className="field-label">
              Valor total pagado
              <div className="field-control plain">
                <input
                  inputMode="decimal"
                  type="text"
                  value={valorPagoTrabajadores}
                  onChange={(event) => setValorPagoTrabajadores(normalizeMoneyInput(event.target.value))}
                  disabled={!isCashBoxOpen}
                  required
                />
              </div>
            </label>

            <label className="field-label">
              Descripcion
              <div className="field-control plain">
                <input
                  maxLength={1000}
                  type="text"
                  value={descripcionPagoTrabajadores}
                  onChange={(event) => setDescripcionPagoTrabajadores(event.target.value)}
                  disabled={!isCashBoxOpen}
                  placeholder="Opcional"
                />
              </div>
            </label>

            <label className="check-control">
              <input
                type="checkbox"
                checked={confirmadoParaCierre}
                onChange={(event) => setConfirmadoParaCierre(event.target.checked)}
                disabled={!isCashBoxOpen}
              />
              <span>Confirmar para cierre de caja</span>
            </label>

            <button className="primary-button full" type="submit" disabled={!isCashBoxOpen || submittingAction === "pago"}>
              <Save size={18} strokeWidth={2.2} />
              {submittingAction === "pago"
                ? "Guardando"
                : pagoTrabajadores
                  ? confirmadoParaCierre
                    ? "Actualizar pago confirmado"
                    : "Actualizar pago"
                  : confirmadoParaCierre
                    ? "Guardar y confirmar"
                    : "Guardar pago"}
            </button>

            {pagoTrabajadores && !pagoTrabajadores.confirmadoParaCierre ? (
              <button
                className="ghost-button full"
                type="button"
                disabled={!isCashBoxOpen || submittingAction === "confirmar-pago"}
                onClick={() => void handleConfirmarPago()}
              >
                <CheckCircle2 size={18} strokeWidth={2.2} />
                {submittingAction === "confirmar-pago" ? "Confirmando" : "Confirmar pago existente"}
              </button>
            ) : null}
          </form>
        ) : null}

        {gastoAction ? (
          <form className="panel gastos-form-panel gastos-action-panel" onSubmit={handleGastoActionSubmit}>
            <div className="panel-title">
              <div>
                <h2>{gastoAction.mode === "editar" ? "Editar gasto" : "Anular gasto"}</h2>
                <p>{gastoAction.gasto.descripcion}</p>
              </div>
              <button className="icon-only-button" type="button" onClick={cancelGastoAction} aria-label="Cerrar accion de gasto" title="Cerrar">
                <X size={18} strokeWidth={2.2} />
              </button>
            </div>

            {gastoAction.mode === "editar" ? (
              <>
                <label className="field-label">
                  Valor del gasto
                  <div className="field-control plain">
                    <input
                      inputMode="decimal"
                      type="text"
                      value={valorGastoEdicion}
                      onChange={(event) => setValorGastoEdicion(normalizeMoneyInput(event.target.value))}
                      required
                    />
                  </div>
                </label>
                <label className="field-label">
                  Descripcion
                  <div className="field-control plain">
                    <input
                      maxLength={1000}
                      type="text"
                      value={descripcionGastoEdicion}
                      onChange={(event) => setDescripcionGastoEdicion(event.target.value)}
                      required
                    />
                  </div>
                </label>
              </>
            ) : (
              <p className="empty-copy">La anulacion mantiene la trazabilidad del gasto y lo excluye de los totales activos.</p>
            )}

            <label className="field-label">
              {gastoAction.mode === "editar" ? "Motivo de edicion" : "Motivo de anulacion"}
              <div className="field-control plain">
                <input
                  maxLength={1000}
                  type="text"
                  value={motivoGastoAction}
                  onChange={(event) => setMotivoGastoAction(event.target.value)}
                  required
                />
              </div>
            </label>

            <button
              className={gastoAction.mode === "anular" ? "danger-button full" : "primary-button full"}
              type="submit"
              disabled={submittingAction === "editar-gasto" || submittingAction === "anular-gasto"}
            >
              {gastoAction.mode === "editar" ? <Save size={18} strokeWidth={2.2} /> : <XCircle size={18} strokeWidth={2.2} />}
              {submittingAction === "editar-gasto" || submittingAction === "anular-gasto"
                ? "Guardando"
                : gastoAction.mode === "editar"
                  ? "Guardar edicion"
                  : "Anular gasto"}
            </button>
          </form>
        ) : null}
      </section>

      {actionMessage ? (
        <div className="form-alert" role="status">
          <ClipboardList size={18} strokeWidth={2.2} />
          <span>{actionMessage}</span>
        </div>
      ) : null}

      <article className="panel gastos-history-panel">
        <div className="panel-title">
          <div>
            <h2>Gastos de la caja abierta</h2>
            <p>Historial de gastos registrados para la jornada actual.</p>
          </div>
          <span className="badge">{loadState === "loading" ? "Cargando" : `${gastos.length}`}</span>
        </div>

        <ul className="gastos-list">
          {gastos.length > 0 ? (
            gastos.map((gasto) => (
              <li className="gasto-row" key={gasto.idGastoCaja}>
                <div className="gasto-row-icon">
                  <ReceiptText size={18} strokeWidth={2.2} />
                </div>
                <div className="gasto-row-main">
                  <strong>{gasto.descripcion}</strong>
                  <small>
                    Registrado por {gasto.nombreUsuarioRegistro} el {formatDateTime(gasto.fechaRegistro)}
                  </small>
                  {gasto.estadoGasto === "editado" && gasto.motivoEdicion ? <em>Edicion: {gasto.motivoEdicion}</em> : null}
                  {gasto.estadoGasto === "anulado" && gasto.motivoAnulacion ? <em>Anulacion: {gasto.motivoAnulacion}</em> : null}
                </div>
                <strong className="gasto-row-value">{formatCurrency(gasto.valorGasto)}</strong>
                <span className={`badge ${gastoStateClass(gasto.estadoGasto)}`}>{gasto.estadoGasto}</span>
                {canManageGastos && gasto.estadoGasto !== "anulado" ? (
                  <div className="gasto-row-actions">
                    <button
                      className="icon-only-button"
                      type="button"
                      onClick={() => beginGastoAction("editar", gasto)}
                      aria-label={`Editar gasto ${gasto.descripcion}`}
                      title="Editar gasto"
                    >
                      <Pencil size={17} strokeWidth={2.2} />
                    </button>
                    <button
                      className="icon-only-button danger"
                      type="button"
                      onClick={() => beginGastoAction("anular", gasto)}
                      aria-label={`Anular gasto ${gasto.descripcion}`}
                      title="Anular gasto"
                    >
                      <XCircle size={17} strokeWidth={2.2} />
                    </button>
                  </div>
                ) : null}
              </li>
            ))
          ) : (
            <li className="inventory-empty">No hay gastos registrados para la caja abierta.</li>
          )}
        </ul>
      </article>
    </>
  );
}
