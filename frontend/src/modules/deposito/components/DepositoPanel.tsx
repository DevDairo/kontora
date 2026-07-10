import { AlertCircle, Building2, CheckCircle2, ClipboardList, FileUp, Landmark, RefreshCw, Save, ShieldCheck } from "lucide-react";
import { type FormEvent, useCallback, useEffect, useMemo, useRef, useState } from "react";
import { obtenerTiposServicio } from "../../catalogos/services/catalogosService";
import type { CatalogoBasico } from "../../catalogos/types";
import { cargarEvidenciaConsignacionBancaria, cargarEvidenciaPagoServicio } from "../../evidencias/services/evidenciasService";
import type { ArchivoEvidenciaResponse } from "../../evidencias/types";
import { ConfirmationDialog } from "../../../shared/components/ConfirmationDialog";
import { ApiClientError } from "../../../shared/services/apiClient";
import { normalizeMoneyInput } from "../../../shared/utils/moneyInput";
import {
  consultarMovimientosDeposito,
  obtenerSaldoDeposito,
  registrarConsignacionBancaria,
  registrarPagoServicio,
} from "../services/depositoService";
import type { FiltroMovimientosDeposito, MovimientoDeposito, SaldoDeposito } from "../types";

type LoadState = "loading" | "success" | "error";
type SubmitAction = "consignacion" | "servicio" | null;
type PendingAction =
  | { kind: "consignacion"; valor: number; observacion: string; evidencia: File }
  | { kind: "servicio"; valor: number; idTipoServicio: string; descripcion: string; evidencia: File }
  | null;
type PendingEvidence =
  | { kind: "consignacion"; idRegistro: string; archivo: File; label: string }
  | { kind: "servicio"; idRegistro: string; archivo: File; label: string }
  | null;

type DepositoPanelProps = {
  token: string;
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
    return "Sin registro";
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

  return error instanceof Error ? error.message : "No fue posible operar el deposito";
}

function movementLabel(type: string) {
  if (type === "entrada_cierre") {
    return "Entrada por cierre";
  }
  if (type === "salida_consignacion") {
    return "Consignacion bancaria";
  }
  if (type === "salida_pago_servicio") {
    return "Pago de servicio";
  }
  return type;
}

function isSalida(movimiento: MovimientoDeposito) {
  return movimiento.tipoMovimientoDeposito.startsWith("salida_");
}

export function DepositoPanel({ token }: DepositoPanelProps) {
  const [saldo, setSaldo] = useState<SaldoDeposito | null>(null);
  const [movimientos, setMovimientos] = useState<MovimientoDeposito[]>([]);
  const [tiposServicio, setTiposServicio] = useState<CatalogoBasico[]>([]);
  const [loadState, setLoadState] = useState<LoadState>("loading");
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [actionMessage, setActionMessage] = useState<string | null>(null);
  const [evidenceMessage, setEvidenceMessage] = useState<string | null>(null);
  const [lastEvidence, setLastEvidence] = useState<ArchivoEvidenciaResponse | null>(null);
  const [submittingAction, setSubmittingAction] = useState<SubmitAction>(null);
  const [isUploadingEvidence, setIsUploadingEvidence] = useState(false);
  const [pendingAction, setPendingAction] = useState<PendingAction>(null);
  const [pendingEvidence, setPendingEvidence] = useState<PendingEvidence>(null);
  const [fechaInicio, setFechaInicio] = useState("");
  const [fechaFin, setFechaFin] = useState("");
  const [valorConsignacion, setValorConsignacion] = useState("");
  const [observacionConsignacion, setObservacionConsignacion] = useState("");
  const [evidenciaConsignacion, setEvidenciaConsignacion] = useState<File | null>(null);
  const [idTipoServicio, setIdTipoServicio] = useState("");
  const [valorServicio, setValorServicio] = useState("");
  const [descripcionServicio, setDescripcionServicio] = useState("");
  const [evidenciaServicio, setEvidenciaServicio] = useState<File | null>(null);
  const evidenciaConsignacionRef = useRef<HTMLInputElement>(null);
  const evidenciaServicioRef = useRef<HTMLInputElement>(null);

  const cargarDatos = useCallback(
    async (filtro: FiltroMovimientosDeposito = {}) => {
      setLoadState("loading");
      setErrorMessage(null);

      try {
        const [saldoResponse, movimientosResponse, tiposServicioResponse] = await Promise.all([
          obtenerSaldoDeposito(token),
          consultarMovimientosDeposito(token, filtro),
          obtenerTiposServicio(token),
        ]);
        setSaldo(saldoResponse);
        setMovimientos(movimientosResponse);
        setTiposServicio(tiposServicioResponse);
        setLoadState("success");
      } catch (error) {
        setSaldo(null);
        setMovimientos([]);
        setLoadState("error");
        setErrorMessage(messageFor(error));
      }
    },
    [token],
  );

  useEffect(() => {
    void cargarDatos();
  }, [cargarDatos]);

  const resumen = useMemo(() => {
    const entradas = movimientos.filter((movimiento) => !isSalida(movimiento));
    const salidas = movimientos.filter(isSalida);

    return {
      entradas: entradas.reduce((total, movimiento) => total + movimiento.valorMovimiento, 0),
      salidas: salidas.reduce((total, movimiento) => total + movimiento.valorMovimiento, 0),
    };
  }, [movimientos]);

  function filtroActual(): FiltroMovimientosDeposito {
    return {
      fechaFin: fechaFin || undefined,
      fechaInicio: fechaInicio || undefined,
    };
  }

  function handleConsultarMovimientos(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (fechaInicio && fechaFin && fechaFin < fechaInicio) {
      setActionMessage("La fecha final no puede ser anterior a la fecha inicial.");
      return;
    }

    setActionMessage(null);
    void cargarDatos(filtroActual());
  }

  function handleHistorialCompleto() {
    setFechaInicio("");
    setFechaFin("");
    setActionMessage(null);
    void cargarDatos();
  }

  function handleConsignacionSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const valor = Number(valorConsignacion);
    const observacion = observacionConsignacion.trim();

    if (!Number.isFinite(valor) || valor <= 0) {
      setActionMessage("Ingresa un valor de consignacion mayor que cero.");
      return;
    }
    if (!evidenciaConsignacion) {
      setActionMessage("Adjunta la evidencia de la consignacion antes de registrarla.");
      return;
    }
    if (saldo && valor > saldo.saldoActual) {
      setActionMessage("El valor de la consignacion supera el saldo disponible en deposito.");
      return;
    }

    setActionMessage(null);
    setEvidenceMessage(null);
    setPendingAction({
      evidencia: evidenciaConsignacion,
      kind: "consignacion",
      observacion,
      valor,
    });
  }

  function handlePagoServicioSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const valor = Number(valorServicio);
    const descripcion = descripcionServicio.trim();

    if (!idTipoServicio) {
      setActionMessage("Selecciona el tipo de servicio pagado.");
      return;
    }
    if (!Number.isFinite(valor) || valor <= 0) {
      setActionMessage("Ingresa un valor de pago mayor que cero.");
      return;
    }
    if (!evidenciaServicio) {
      setActionMessage("Adjunta la evidencia del pago de servicio antes de registrarlo.");
      return;
    }
    if (saldo && valor > saldo.saldoActual) {
      setActionMessage("El valor del pago supera el saldo disponible en deposito.");
      return;
    }

    setActionMessage(null);
    setEvidenceMessage(null);
    setPendingAction({
      descripcion,
      evidencia: evidenciaServicio,
      idTipoServicio,
      kind: "servicio",
      valor,
    });
  }

  async function cargarEvidencia(pending: Exclude<PendingEvidence, null>) {
    setIsUploadingEvidence(true);

    try {
      const evidencia = pending.kind === "consignacion"
        ? await cargarEvidenciaConsignacionBancaria(token, pending.idRegistro, pending.archivo)
        : await cargarEvidenciaPagoServicio(token, pending.idRegistro, pending.archivo);
      setLastEvidence(evidencia);
      setPendingEvidence(null);
      setEvidenceMessage("Evidencia adjunta correctamente mediante el backend.");
      return true;
    } catch (error) {
      setPendingEvidence(pending);
      setEvidenceMessage(`${pending.label} registrada; evidencia pendiente: ${messageFor(error)}`);
      return false;
    } finally {
      setIsUploadingEvidence(false);
    }
  }

  async function confirmPendingAction() {
    if (!pendingAction) {
      return;
    }

    setSubmittingAction(pendingAction.kind);
    setActionMessage(null);

    try {
      if (pendingAction.kind === "consignacion") {
        const consignacion = await registrarConsignacionBancaria(token, {
          observacion: pendingAction.observacion || undefined,
          valorConsignado: pendingAction.valor,
        });
        setSaldo({ saldoActual: consignacion.movimientoDeposito.saldoPosterior });
        const evidenciaAdjuntada = await cargarEvidencia({
          archivo: pendingAction.evidencia,
          idRegistro: consignacion.idConsignacionBancaria,
          kind: "consignacion",
          label: "Consignacion bancaria",
        });
        setValorConsignacion("");
        setObservacionConsignacion("");
        if (evidenciaAdjuntada) {
          setEvidenciaConsignacion(null);
          if (evidenciaConsignacionRef.current) {
            evidenciaConsignacionRef.current.value = "";
          }
          setActionMessage("Consignacion registrada y saldo de deposito actualizado.");
        }
      } else {
        const pagoServicio = await registrarPagoServicio(token, {
          descripcion: pendingAction.descripcion || undefined,
          idTipoServicio: pendingAction.idTipoServicio,
          valorPagado: pendingAction.valor,
        });
        setSaldo({ saldoActual: pagoServicio.movimientoDeposito.saldoPosterior });
        const evidenciaAdjuntada = await cargarEvidencia({
          archivo: pendingAction.evidencia,
          idRegistro: pagoServicio.idPagoServicio,
          kind: "servicio",
          label: "Pago de servicio",
        });
        setValorServicio("");
        setDescripcionServicio("");
        if (evidenciaAdjuntada) {
          setEvidenciaServicio(null);
          if (evidenciaServicioRef.current) {
            evidenciaServicioRef.current.value = "";
          }
          setActionMessage("Pago de servicio registrado y saldo de deposito actualizado.");
        }
      }
    } catch (error) {
      setActionMessage(messageFor(error));
    } finally {
      setPendingAction(null);
      setSubmittingAction(null);
      void cargarDatos(filtroActual());
    }
  }

  async function retryEvidenceUpload() {
    if (!pendingEvidence) {
      return;
    }

    await cargarEvidencia(pendingEvidence);
  }

  const isSubmitting = submittingAction !== null || isUploadingEvidence;
  const confirmationDescription = pendingAction
    ? pendingAction.kind === "consignacion"
      ? `Registraras una consignacion de ${formatCurrency(pendingAction.valor)}. El backend descontara este valor del saldo actual de deposito.`
      : `Registraras un pago de servicio por ${formatCurrency(pendingAction.valor)}. El backend descontara este valor del saldo actual de deposito.`
    : "Confirmaras una salida de deposito.";

  return (
    <>
      <section className="section-heading" aria-labelledby="deposito-title">
        <div>
          <p className="eyebrow">Control financiero</p>
          <h1 id="deposito-title">Deposito, consignaciones y servicios</h1>
          <p className="lead">Consulta el saldo real del deposito y registra salidas administrativas con evidencia.</p>
        </div>
        <button className="ghost-button" type="button" onClick={() => void cargarDatos(filtroActual())} disabled={loadState === "loading" || isSubmitting}>
          <RefreshCw size={17} strokeWidth={2.2} />
          Actualizar
        </button>
      </section>

      {errorMessage ? (
        <div className="form-alert" role="status">
          <AlertCircle size={18} strokeWidth={2.2} />
          <span>{errorMessage}</span>
        </div>
      ) : null}

      <section className="deposito-summary-grid" aria-label="Resumen de deposito">
        <article className="deposito-summary-card balance">
          <span>Saldo actual</span>
          <strong>{formatCurrency(saldo?.saldoActual)}</strong>
          <small>Devuelto por backend</small>
        </article>
        <article className="deposito-summary-card income">
          <span>Entradas mostradas</span>
          <strong>{formatCurrency(resumen.entradas)}</strong>
          <small>Incluye cierres de caja</small>
        </article>
        <article className="deposito-summary-card expense">
          <span>Salidas mostradas</span>
          <strong>{formatCurrency(resumen.salidas)}</strong>
          <small>Consignaciones y servicios</small>
        </article>
      </section>

      <section className="deposito-actions-grid" aria-label="Operaciones de deposito">
        <form className="panel deposito-form-panel" onSubmit={handleConsignacionSubmit}>
          <div className="panel-title">
            <div>
              <h2>Registrar consignacion</h2>
              <p>Salida de dinero desde el deposito hacia una cuenta bancaria.</p>
            </div>
            <Landmark size={22} strokeWidth={2.2} />
          </div>

          <label className="field-label">
            Valor consignado
            <div className="field-control plain">
              <input
                inputMode="decimal"
                type="text"
                value={valorConsignacion}
                onChange={(event) => setValorConsignacion(normalizeMoneyInput(event.target.value))}
                disabled={isSubmitting}
                required
              />
            </div>
          </label>

          <label className="field-label">
            Observacion
            <div className="field-control plain">
              <input
                maxLength={1000}
                type="text"
                value={observacionConsignacion}
                onChange={(event) => setObservacionConsignacion(event.target.value)}
                disabled={isSubmitting}
                placeholder="Opcional"
              />
            </div>
          </label>

          <label className="field-label">
            Evidencia de consignacion
            <div className="file-control">
              <FileUp size={18} strokeWidth={2.2} />
              <input
                accept="image/png,image/jpeg,image/webp,application/pdf"
                type="file"
                ref={evidenciaConsignacionRef}
                onChange={(event) => setEvidenciaConsignacion(event.target.files?.[0] ?? null)}
                disabled={isSubmitting}
                required
              />
            </div>
            <small className="field-hint">Requerida por RF-50; se envia al backend despues de registrar la salida.</small>
          </label>

          <button className="primary-button full" type="submit" disabled={isSubmitting || loadState !== "success"}>
            <Save size={18} strokeWidth={2.2} />
            {submittingAction === "consignacion" ? "Registrando" : "Registrar consignacion"}
          </button>
        </form>

        <form className="panel deposito-form-panel" onSubmit={handlePagoServicioSubmit}>
          <div className="panel-title">
            <div>
              <h2>Registrar pago de servicio</h2>
              <p>Salida de deposito para arriendo, energia, agua, internet u otro servicio activo.</p>
            </div>
            <Building2 size={22} strokeWidth={2.2} />
          </div>

          <label className="field-label">
            Tipo de servicio
            <div className="field-control plain">
              <select value={idTipoServicio} onChange={(event) => setIdTipoServicio(event.target.value)} disabled={isSubmitting} required>
                <option value="">Selecciona un servicio</option>
                {tiposServicio.map((tipoServicio) => (
                  <option key={tipoServicio.id} value={tipoServicio.id}>
                    {tipoServicio.nombre}
                  </option>
                ))}
              </select>
            </div>
          </label>

          <label className="field-label">
            Valor pagado
            <div className="field-control plain">
              <input
                inputMode="decimal"
                type="text"
                value={valorServicio}
                onChange={(event) => setValorServicio(normalizeMoneyInput(event.target.value))}
                disabled={isSubmitting}
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
                value={descripcionServicio}
                onChange={(event) => setDescripcionServicio(event.target.value)}
                disabled={isSubmitting}
                placeholder="Opcional"
              />
            </div>
          </label>

          <label className="field-label">
            Evidencia del pago
            <div className="file-control">
              <FileUp size={18} strokeWidth={2.2} />
              <input
                accept="image/png,image/jpeg,image/webp,application/pdf"
                type="file"
                ref={evidenciaServicioRef}
                onChange={(event) => setEvidenciaServicio(event.target.files?.[0] ?? null)}
                disabled={isSubmitting}
                required
              />
            </div>
            <small className="field-hint">Requerida por RF-51 y RF-53; se conserva mediante el backend.</small>
          </label>

          <button className="primary-button full" type="submit" disabled={isSubmitting || loadState !== "success"}>
            <Save size={18} strokeWidth={2.2} />
            {submittingAction === "servicio" ? "Registrando" : "Registrar pago de servicio"}
          </button>
        </form>
      </section>

      {actionMessage ? (
        <div className="deposito-status" role="status">
          <ShieldCheck size={18} strokeWidth={2.2} />
          <span>{actionMessage}</span>
        </div>
      ) : null}

      {evidenceMessage ? (
        <div className={`deposito-status ${pendingEvidence ? "warning" : ""}`} role="status">
          <FileUp size={18} strokeWidth={2.2} />
          <span>{evidenceMessage}</span>
          {pendingEvidence ? (
            <button className="ghost-button" type="button" onClick={() => void retryEvidenceUpload()} disabled={isUploadingEvidence}>
              <RefreshCw size={17} strokeWidth={2.2} />
              {isUploadingEvidence ? "Adjuntando" : "Reintentar evidencia"}
            </button>
          ) : null}
        </div>
      ) : null}

      <article className="panel deposito-history-panel">
        <div className="panel-title">
          <div>
            <h2>Historial de movimientos</h2>
            <p>Consulta completa o por periodo. El saldo se toma siempre de backend.</p>
          </div>
          <ClipboardList size={22} strokeWidth={2.2} />
        </div>

        <form className="deposito-filter-form" onSubmit={handleConsultarMovimientos}>
          <label className="field-label">
            Fecha inicial
            <div className="field-control plain">
              <input type="date" value={fechaInicio} onChange={(event) => setFechaInicio(event.target.value)} disabled={isSubmitting} />
            </div>
          </label>
          <label className="field-label">
            Fecha final
            <div className="field-control plain">
              <input type="date" value={fechaFin} onChange={(event) => setFechaFin(event.target.value)} disabled={isSubmitting} />
            </div>
          </label>
          <button className="primary-button" type="submit" disabled={isSubmitting || loadState === "loading"}>
            <ClipboardList size={18} strokeWidth={2.2} />
            Consultar
          </button>
          <button className="ghost-button" type="button" onClick={handleHistorialCompleto} disabled={isSubmitting || loadState === "loading"}>
            <RefreshCw size={17} strokeWidth={2.2} />
            Ver completo
          </button>
        </form>

        <ul className="deposito-movements-list">
          {movimientos.length > 0 ? (
            movimientos.map((movimiento) => {
              const salida = isSalida(movimiento);

              return (
                <li className="deposito-movement-row" key={movimiento.idMovimientoDeposito}>
                  <div className={`deposito-movement-icon ${salida ? "expense" : "income"}`}>
                    {salida ? <Building2 size={18} strokeWidth={2.2} /> : <Landmark size={18} strokeWidth={2.2} />}
                  </div>
                  <div className="deposito-movement-main">
                    <strong>{movementLabel(movimiento.tipoMovimientoDeposito)}</strong>
                    <small>
                      {movimiento.nombreUsuarioRegistro} - {formatDateTime(movimiento.fechaMovimiento)}
                    </small>
                    {movimiento.nombreServicio ? <em>Servicio: {movimiento.nombreServicio}</em> : null}
                    {movimiento.observacion ? <em>{movimiento.observacion}</em> : null}
                  </div>
                  <strong className={salida ? "expense" : "income"}>{salida ? "- " : "+ "}{formatCurrency(movimiento.valorMovimiento)}</strong>
                  <div className="deposito-movement-balance">
                    <span>Saldo posterior</span>
                    <strong>{formatCurrency(movimiento.saldoPosterior)}</strong>
                  </div>
                  <span className={`badge ${salida ? "warning" : "success"}`}>{salida ? "Salida" : "Entrada"}</span>
                </li>
              );
            })
          ) : (
            <li className="deposito-empty">No hay movimientos para el periodo consultado.</li>
          )}
        </ul>

        {lastEvidence ? (
          <div className="deposito-evidence-proof">
            <CheckCircle2 size={18} strokeWidth={2.2} />
            <span>Evidencia registrada: {lastEvidence.nombreArchivo}</span>
          </div>
        ) : null}
      </article>

      <ConfirmationDialog
        confirmLabel={pendingAction?.kind === "consignacion" ? "Registrar consignacion" : "Registrar pago"}
        description={confirmationDescription}
        isConfirming={isSubmitting}
        onCancel={() => setPendingAction(null)}
        onConfirm={() => void confirmPendingAction()}
        open={pendingAction !== null}
        title={pendingAction?.kind === "consignacion" ? "Confirmar consignacion bancaria" : "Confirmar pago de servicio"}
      />
    </>
  );
}
