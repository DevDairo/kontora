import { AlertCircle, CheckCircle2, Download, FileImage, FileUp, Landmark, ReceiptText, RefreshCw } from "lucide-react";
import { type ChangeEvent, type FormEvent, useCallback, useEffect, useMemo, useRef, useState } from "react";
import { ApiClientError } from "../../../shared/services/apiClient";
import {
  cargarEvidenciaConsignacionBancaria,
  cargarEvidenciaGastoCaja,
  cargarEvidenciaPagoServicio,
  descargarEvidencia,
  listarEvidenciasConsignacionBancaria,
  listarEvidenciasGastoCaja,
  listarEvidenciasPagoServicio,
} from "../services/evidenciasService";
import {
  consultarGastosConEvidencia,
  consultarMovimientosDepositoConEvidencia,
  type FiltroEvidencias,
} from "../services/evidenciasConsultaService";
import type {
  ArchivoEvidenciaResponse,
  ConsultaGastoCajaEvidencia,
  ConsultaMovimientoDepositoEvidencia,
} from "../types";

type LoadState = "loading" | "success" | "error";
type SourceTab = "gastos" | "deposito";
type EvidenceSource = "gasto" | "consignacion" | "servicio";

type EvidenceTarget = {
  fecha: string;
  id: string;
  label: string;
  source: EvidenceSource;
  status: string;
  subtitle: string;
  value: number;
};

type EvidenciasPanelProps = {
  token: string;
};

const FILE_ACCEPT = ".jpg,.jpeg,.png,.webp,.pdf";

function formatDateInput(date: Date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function firstDayOfMonth() {
  const now = new Date();
  return formatDateInput(new Date(now.getFullYear(), now.getMonth(), 1));
}

function formatCurrency(value: number) {
  return new Intl.NumberFormat("es-CO", {
    currency: "COP",
    maximumFractionDigits: 0,
    style: "currency",
  }).format(Number(value ?? 0));
}

function formatDateTime(value: string) {
  return new Intl.DateTimeFormat("es-CO", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(value));
}

function formatFileSize(value: number | null) {
  if (value === null) {
    return "Sin dato";
  }
  return `${value} KB`;
}

function messageFor(error: unknown) {
  if (error instanceof ApiClientError) {
    return error.message;
  }
  return error instanceof Error ? error.message : "No fue posible consultar las evidencias.";
}

function sourceLabel(source: EvidenceSource) {
  switch (source) {
    case "gasto":
      return "Gasto de caja";
    case "consignacion":
      return "Consignacion bancaria";
    case "servicio":
      return "Pago de servicio";
  }
}

function gastoTarget(item: ConsultaGastoCajaEvidencia): EvidenceTarget {
  return {
    fecha: item.fechaRegistro,
    id: item.idGastoCaja,
    label: item.descripcion,
    source: "gasto",
    status: item.estadoGasto,
    subtitle: `${item.nombreUsuarioRegistro} · Jornada ${item.fechaOperacion}`,
    value: item.valorGasto,
  };
}

function depositoTargets(movimientos: ConsultaMovimientoDepositoEvidencia[]): EvidenceTarget[] {
  return movimientos.reduce<EvidenceTarget[]>((targets, movimiento) => {
    if (movimiento.idConsignacionBancaria) {
      targets.push({
        fecha: movimiento.fechaMovimiento,
        id: movimiento.idConsignacionBancaria,
        label: "Consignacion bancaria",
        source: "consignacion",
        status: "registrado",
        subtitle: movimiento.nombreUsuarioRegistro,
        value: movimiento.valorMovimiento,
      });
    }
    if (movimiento.idPagoServicio) {
      targets.push({
        fecha: movimiento.fechaMovimiento,
        id: movimiento.idPagoServicio,
        label: movimiento.nombreServicio ?? "Pago de servicio",
        source: "servicio",
        status: "registrado",
        subtitle: movimiento.nombreUsuarioRegistro,
        value: movimiento.valorMovimiento,
      });
    }
    return targets;
  }, []);
}

export function EvidenciasPanel({ token }: EvidenciasPanelProps) {
  const [fechaInicio, setFechaInicio] = useState(firstDayOfMonth);
  const [fechaFin, setFechaFin] = useState(() => formatDateInput(new Date()));
  const [loadState, setLoadState] = useState<LoadState>("loading");
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [gastos, setGastos] = useState<ConsultaGastoCajaEvidencia[]>([]);
  const [movimientosDeposito, setMovimientosDeposito] = useState<ConsultaMovimientoDepositoEvidencia[]>([]);
  const [activeTab, setActiveTab] = useState<SourceTab>("gastos");
  const [selectedTarget, setSelectedTarget] = useState<EvidenceTarget | null>(null);
  const [evidencias, setEvidencias] = useState<ArchivoEvidenciaResponse[]>([]);
  const [evidenceState, setEvidenceState] = useState<LoadState>("success");
  const [evidenceError, setEvidenceError] = useState<string | null>(null);
  const [archivoSeleccionado, setArchivoSeleccionado] = useState<File | null>(null);
  const [uploadMessage, setUploadMessage] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [downloadingEvidenceId, setDownloadingEvidenceId] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const filtro = useMemo<FiltroEvidencias>(
    () => ({ fechaFin: fechaFin || undefined, fechaInicio: fechaInicio || undefined }),
    [fechaFin, fechaInicio],
  );

  const cargarRegistros = useCallback(async () => {
    setLoadState("loading");
    setErrorMessage(null);

    try {
      const [gastosResponse, movimientosResponse] = await Promise.all([
        consultarGastosConEvidencia(token, filtro),
        consultarMovimientosDepositoConEvidencia(token, filtro),
      ]);
      setGastos(gastosResponse);
      setMovimientosDeposito(movimientosResponse);
      setLoadState("success");
    } catch (error) {
      setGastos([]);
      setMovimientosDeposito([]);
      setLoadState("error");
      setErrorMessage(messageFor(error));
    }
  }, [filtro, token]);

  useEffect(() => {
    void cargarRegistros();
  }, [cargarRegistros]);

  const destinos = useMemo<Record<SourceTab, EvidenceTarget[]>>(() => ({
    deposito: depositoTargets(movimientosDeposito),
    gastos: gastos.map(gastoTarget),
  }), [gastos, movimientosDeposito]);

  const registrosActivos = destinos[activeTab];
  const totalDestinos = destinos.gastos.length + destinos.deposito.length;

  async function cargarEvidencias(target: EvidenceTarget) {
    setEvidenceState("loading");
    setEvidenceError(null);

    try {
      const response = target.source === "gasto"
        ? await listarEvidenciasGastoCaja(token, target.id)
        : target.source === "consignacion"
          ? await listarEvidenciasConsignacionBancaria(token, target.id)
          : await listarEvidenciasPagoServicio(token, target.id);
      setEvidencias(response);
      setEvidenceState("success");
    } catch (error) {
      setEvidencias([]);
      setEvidenceState("error");
      setEvidenceError(messageFor(error));
    }
  }

  function seleccionarDestino(target: EvidenceTarget) {
    setSelectedTarget(target);
    setArchivoSeleccionado(null);
    setUploadMessage(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
    void cargarEvidencias(target);
  }

  function actualizarRegistros(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (fechaFin && fechaFin < fechaInicio) {
      setErrorMessage("La fecha final no puede ser anterior a la fecha inicial.");
      return;
    }
    setSelectedTarget(null);
    setEvidencias([]);
    setUploadMessage(null);
    void cargarRegistros();
  }

  function seleccionarArchivo(event: ChangeEvent<HTMLInputElement>) {
    setArchivoSeleccionado(event.target.files?.[0] ?? null);
    setUploadMessage(null);
  }

  async function adjuntarEvidencia() {
    if (!selectedTarget || !archivoSeleccionado) {
      return;
    }

    setIsUploading(true);
    setUploadMessage(null);

    try {
      if (selectedTarget.source === "gasto") {
        await cargarEvidenciaGastoCaja(token, selectedTarget.id, archivoSeleccionado);
      } else if (selectedTarget.source === "consignacion") {
        await cargarEvidenciaConsignacionBancaria(token, selectedTarget.id, archivoSeleccionado);
      } else {
        await cargarEvidenciaPagoServicio(token, selectedTarget.id, archivoSeleccionado);
      }

      setUploadMessage("Evidencia adjunta correctamente.");
      setArchivoSeleccionado(null);
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
      await cargarEvidencias(selectedTarget);
    } catch (error) {
      setUploadMessage(`Evidencia pendiente: ${messageFor(error)}`);
    } finally {
      setIsUploading(false);
    }
  }

  async function descargarArchivo(evidencia: ArchivoEvidenciaResponse) {
    setDownloadingEvidenceId(evidencia.idArchivoEvidencia);
    setEvidenceError(null);

    try {
      const archivo = await descargarEvidencia(token, evidencia.idArchivoEvidencia);
      const urlArchivo = URL.createObjectURL(archivo);
      const enlace = document.createElement("a");
      enlace.href = urlArchivo;
      enlace.download = evidencia.nombreArchivo;
      document.body.appendChild(enlace);
      enlace.click();
      enlace.remove();
      URL.revokeObjectURL(urlArchivo);
    } catch (error) {
      setEvidenceError(messageFor(error));
    } finally {
      setDownloadingEvidenceId(null);
    }
  }

  return (
    <section className="evidencias-panel" aria-label="Evidencias administrativas">
      <header className="module-header evidencia-header">
        <div>
          <span className="eyebrow">Trazabilidad documental</span>
          <h1>Evidencias</h1>
          <p>Consulta los soportes asociados a gastos y deposito, con sus metadatos registrados.</p>
        </div>
      </header>

      <div className="evidence-summary-grid" aria-label="Resumen de registros consultados">
        <article className="evidence-summary-card">
          <span>Gastos</span>
          <strong>{destinos.gastos.length}</strong>
          <small>Registros de caja del periodo</small>
        </article>
        <article className="evidence-summary-card">
          <span>Deposito</span>
          <strong>{destinos.deposito.length}</strong>
          <small>Consignaciones y servicios</small>
        </article>
        <article className="evidence-summary-card">
          <span>Registros</span>
          <strong>{totalDestinos}</strong>
          <small>Disponibles para consultar</small>
        </article>
      </div>

      <form className="evidence-filter-form module-filter-bar panel" onSubmit={actualizarRegistros}>
        <label className="form-field">
          <span>Fecha inicial</span>
          <input className="field-control plain" type="date" value={fechaInicio} onChange={(event) => setFechaInicio(event.target.value)} />
        </label>
        <label className="form-field">
          <span>Fecha final</span>
          <input className="field-control plain" type="date" value={fechaFin} onChange={(event) => setFechaFin(event.target.value)} />
        </label>
        <button className="primary-button" type="submit" disabled={loadState === "loading"}>
          <RefreshCw size={18} aria-hidden="true" />
          Consultar
        </button>
      </form>

      {errorMessage ? (
        <div className="error-alert evidence-alert" role="alert">
          <AlertCircle size={18} aria-hidden="true" />
          <span>{errorMessage}</span>
        </div>
      ) : null}

      <div className="evidence-tabs" role="tablist" aria-label="Tipo de operacion">
        <button className={activeTab === "gastos" ? "active" : ""} type="button" role="tab" aria-selected={activeTab === "gastos"} onClick={() => setActiveTab("gastos")}>
          Gastos
        </button>
        <button className={activeTab === "deposito" ? "active" : ""} type="button" role="tab" aria-selected={activeTab === "deposito"} onClick={() => setActiveTab("deposito")}>
          Deposito
        </button>
      </div>

      <div className="evidence-workspace">
        <section className="evidence-records-panel" aria-labelledby="evidence-records-title">
          <div className="compact-heading">
            <div>
              <span className="eyebrow">Registros</span>
              <h2 id="evidence-records-title">{activeTab === "gastos" ? "Gastos de caja" : "Movimientos de deposito"}</h2>
            </div>
            <span className="count-badge">{registrosActivos.length}</span>
          </div>

          {loadState === "loading" ? <p className="loading-copy">Consultando registros...</p> : null}
          {loadState === "success" && registrosActivos.length === 0 ? <p className="empty-copy">No hay registros para el periodo seleccionado.</p> : null}
          <ul className="evidence-record-list">
            {registrosActivos.map((target) => (
              <li key={`${target.source}-${target.id}`}>
                <button
                  className={`evidence-record-row ${selectedTarget?.id === target.id && selectedTarget.source === target.source ? "selected" : ""}`}
                  type="button"
                  onClick={() => seleccionarDestino(target)}
                >
                  {target.source === "gasto" ? <ReceiptText size={20} aria-hidden="true" /> : <Landmark size={20} aria-hidden="true" />}
                  <span>
                    <strong>{target.label}</strong>
                    <small>{target.subtitle}</small>
                  </span>
                  <span className="evidence-record-value">
                    <b>{formatCurrency(target.value)}</b>
                    <small>{formatDateTime(target.fecha)}</small>
                  </span>
                </button>
              </li>
            ))}
          </ul>
        </section>

        <section className="evidence-detail-panel" aria-labelledby="evidence-detail-title">
          {!selectedTarget ? (
            <div className="evidence-placeholder">
              <FileImage size={28} aria-hidden="true" />
              <div>
                <span className="eyebrow">Detalle</span>
                <h2 id="evidence-detail-title">Selecciona un registro</h2>
              </div>
            </div>
          ) : (
            <>
              <div className="compact-heading evidence-selected-heading">
                <div>
                  <span className="eyebrow">{sourceLabel(selectedTarget.source)}</span>
                  <h2 id="evidence-detail-title">{selectedTarget.label}</h2>
                  <p>{selectedTarget.subtitle}</p>
                </div>
                <strong>{formatCurrency(selectedTarget.value)}</strong>
              </div>

              <div className="evidence-upload-row">
                <label className="file-picker-control">
                  <FileUp size={18} aria-hidden="true" />
                  <span>{archivoSeleccionado ? archivoSeleccionado.name : "Seleccionar archivo"}</span>
                  <input ref={fileInputRef} type="file" accept={FILE_ACCEPT} onChange={seleccionarArchivo} />
                </label>
                <button className="primary-button" type="button" onClick={() => void adjuntarEvidencia()} disabled={!archivoSeleccionado || isUploading}>
                  <FileUp size={18} aria-hidden="true" />
                  {isUploading ? "Adjuntando" : "Adjuntar"}
                </button>
                {archivoSeleccionado ? (
                  <button className="icon-button" type="button" aria-label="Reintentar adjunto" title="Reintentar adjunto" onClick={() => void adjuntarEvidencia()} disabled={isUploading}>
                    <RefreshCw size={18} aria-hidden="true" />
                  </button>
                ) : null}
              </div>

              {uploadMessage ? (
                <div className={uploadMessage.startsWith("Evidencia adjunta") ? "success-alert evidence-alert" : "warning-alert evidence-alert"} role="status">
                  {uploadMessage.startsWith("Evidencia adjunta") ? <CheckCircle2 size={18} aria-hidden="true" /> : <AlertCircle size={18} aria-hidden="true" />}
                  <span>{uploadMessage}</span>
                </div>
              ) : null}

              {evidenceState === "loading" ? <p className="loading-copy">Consultando evidencias...</p> : null}
              {evidenceError ? (
                <div className="error-alert evidence-alert" role="alert">
                  <AlertCircle size={18} aria-hidden="true" />
                  <span>{evidenceError}</span>
                </div>
              ) : null}
              {evidenceState === "success" && evidencias.length === 0 ? <p className="empty-copy">No hay evidencias registradas para este registro.</p> : null}
              <ul className="evidence-metadata-list">
                {evidencias.map((evidencia) => (
                  <li className="evidence-metadata-item" key={evidencia.idArchivoEvidencia}>
                    <FileImage size={20} aria-hidden="true" />
                    <div>
                      <strong>{evidencia.nombreArchivo}</strong>
                      <small>{evidencia.formatoArchivo.toUpperCase()} · {formatFileSize(evidencia.tamanoOriginalKb)} · {formatDateTime(evidencia.fechaSubida)}</small>
                      <small>{evidencia.nombreUsuarioSubida}{evidencia.fueComprimido ? ` · Comprimido a ${formatFileSize(evidencia.tamanoComprimidoKb)}` : ""}</small>
                    </div>
                    <div className="evidence-metadata-actions">
                      <span className="status-badge active">{evidencia.estado}</span>
                      <button
                        className="icon-button"
                        type="button"
                        aria-label={`Descargar ${evidencia.nombreArchivo}`}
                        title="Descargar evidencia"
                        onClick={() => void descargarArchivo(evidencia)}
                        disabled={downloadingEvidenceId === evidencia.idArchivoEvidencia}
                      >
                        <Download size={18} aria-hidden="true" />
                      </button>
                    </div>
                  </li>
                ))}
              </ul>
            </>
          )}
        </section>
      </div>
    </section>
  );
}
