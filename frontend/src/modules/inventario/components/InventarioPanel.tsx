import {
  ArrowDown,
  ArrowUp,
  Boxes,
  CheckCircle2,
  ClipboardList,
  PackageOpen,
  RefreshCw,
  SlidersHorizontal,
  XCircle,
} from "lucide-react";
import { FormEvent, useCallback, useEffect, useMemo, useState } from "react";
import type { UserRole } from "../../../app/routes/appRoutes";
import { ApiClientError } from "../../../shared/services/apiClient";
import { formatDisplayName } from "../../../shared/utils/displayText";
import {
  aprobarAjusteInventario,
  obtenerInventarioSnapshot,
  rechazarAjusteInventario,
  registrarConsumoDiario,
  registrarPaqueteVasos,
  solicitarAjusteInventario,
} from "../services/inventarioService";
import type {
  AjusteInventario,
  ConsumoDiarioInventarioResponse,
  ExistenciaInventarioDiario,
  ExistenciaInventarioGeneral,
  InventarioSnapshot,
  PaqueteVasosAbiertoResponse,
} from "../types";

type LoadState = "loading" | "success" | "error";

type InventarioPanelProps = {
  token: string;
  role: UserRole | null;
};

type LastAction =
  | { type: "paquete"; response: PaqueteVasosAbiertoResponse }
  | { type: "consumo"; response: ConsumoDiarioInventarioResponse }
  | { type: "ajuste"; response: AjusteInventario }
  | { type: "ajuste-aprobado"; response: AjusteInventario }
  | { type: "ajuste-rechazado"; response: AjusteInventario };

const DEFAULT_STOCK_ENTRY_REASON = "Reabastecimiento";

function messageFor(error: unknown) {
  if (error instanceof ApiClientError) {
    return error.message;
  }

  return error instanceof Error ? error.message : "No fue posible consultar inventario";
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

function itemLabel(item: { nombreItem: string; onzas: number | null }) {
  return `${formatDisplayName(item.nombreItem)}${item.onzas ? ` · ${item.onzas} oz` : ""}`;
}

function orderInventoryItemsForDisplay<T extends { nombreItem: string; onzas: number | null }>(items: T[]) {
  return [...items].sort((left, right) => {
    const leftOunces = left.onzas;
    const rightOunces = right.onzas;
    const leftIsCup = leftOunces !== null;
    const rightIsCup = rightOunces !== null;

    if (leftIsCup && rightIsCup) {
      return leftOunces - rightOunces;
    }

    if (leftIsCup) {
      return -1;
    }

    if (rightIsCup) {
      return 1;
    }

    return left.nombreItem.localeCompare(right.nombreItem, "es");
  });
}

function emptySnapshot(): InventarioSnapshot {
  return {
    ajustes: [],
    existenciasDiarias: [],
    existenciasGenerales: [],
  };
}

function SummaryCard({ label, value, detail }: { label: string; value: number | string; detail: string }) {
  return (
    <article className="inventario-summary-card">
      <span>{label}</span>
      <strong>{value}</strong>
      <small>{detail}</small>
    </article>
  );
}

function DailyRow({ item }: { item: ExistenciaInventarioDiario }) {
  return (
    <li className="inventory-row daily">
      <span>
        <strong>{itemLabel(item)}</strong>
        <small>Control de jornada</small>
      </span>
      <dl>
        <div>
          <dt>Inicial</dt>
          <dd>{item.cantidadInicial}</dd>
        </div>
        <div>
          <dt>Ingresada</dt>
          <dd>{item.cantidadIngresada}</dd>
        </div>
        <div>
          <dt>Vendida</dt>
          <dd>{item.cantidadVendida}</dd>
        </div>
        <div>
          <dt>Perdida</dt>
          <dd>{item.cantidadPerdida}</dd>
        </div>
        <div>
          <dt>Teorica</dt>
          <dd>{item.cantidadFinalTeorica}</dd>
        </div>
      </dl>
    </li>
  );
}

function AdjustmentRow({
  adjustment,
  canApprove,
  isResolving,
  note,
  onNoteChange,
  onApprove,
  onReject,
}: {
  adjustment: AjusteInventario;
  canApprove: boolean;
  isResolving: boolean;
  note: string;
  onNoteChange: (value: string) => void;
  onApprove: () => void;
  onReject: () => void;
}) {
  const isPending = adjustment.estadoAprobacion === "pendiente";
  const isEntrada = adjustment.sentidoAjuste === "entrada";
  const Icon = isEntrada ? ArrowUp : ArrowDown;

  return (
    <li className="adjustment-row">
      <div className={`movement-icon ${isEntrada ? "entrada" : "salida"}`}>
        <Icon size={18} strokeWidth={2.3} />
      </div>
      <span>
        <strong>{formatDisplayName(adjustment.nombreItem)}</strong>
        <small>
          {adjustment.sentidoAjuste} · {adjustment.cantidadAjuste} unidades · {adjustment.nombreUsuarioSolicitante}
        </small>
        <em>{adjustment.motivoAjuste}</em>
      </span>
      <b className={`badge ${adjustment.estadoAprobacion === "aprobado" ? "success" : "warning"}`}>
        {adjustment.estadoAprobacion}
      </b>
      <time>{formatDateTime(adjustment.fechaSolicitud)}</time>
      {canApprove && isPending ? (
        <div className="adjustment-actions">
          <input
            type="text"
            value={note}
            onChange={(event) => onNoteChange(event.target.value)}
            placeholder="Observacion opcional"
            maxLength={1000}
          />
          <button className="icon-action success" type="button" onClick={onApprove} disabled={isResolving}>
            <CheckCircle2 size={17} strokeWidth={2.2} />
            Aprobar
          </button>
          <button className="icon-action danger" type="button" onClick={onReject} disabled={isResolving}>
            <XCircle size={17} strokeWidth={2.2} />
            Rechazar
          </button>
        </div>
      ) : adjustment.observacionAprobacion ? (
        <small className="adjustment-note">{adjustment.observacionAprobacion}</small>
      ) : null}
    </li>
  );
}

export function InventarioPanel({ token, role }: InventarioPanelProps) {
  const [snapshot, setSnapshot] = useState<InventarioSnapshot>(emptySnapshot);
  const [loadState, setLoadState] = useState<LoadState>("loading");
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [idItemPaquete, setIdItemPaquete] = useState("");
  const [cantidadPaquetes, setCantidadPaquetes] = useState("1");
  const [unidadesRotas, setUnidadesRotas] = useState("0");
  const [idItemConsumo, setIdItemConsumo] = useState("");
  const [cantidadConsumida, setCantidadConsumida] = useState("1");
  const [observacionConsumo, setObservacionConsumo] = useState("");
  const [idItemAjuste, setIdItemAjuste] = useState("");
  const [cantidadAjuste, setCantidadAjuste] = useState("1");
  const [sentidoAjuste, setSentidoAjuste] = useState<"entrada" | "salida">("entrada");
  const [motivoAjuste, setMotivoAjuste] = useState(() =>
    role === "gerente" ? DEFAULT_STOCK_ENTRY_REASON : "",
  );
  const [adjustmentNotes, setAdjustmentNotes] = useState<Record<string, string>>({});
  const [resolvingAdjustmentId, setResolvingAdjustmentId] = useState<string | null>(null);
  const [submitMessage, setSubmitMessage] = useState<string | null>(null);
  const [lastAction, setLastAction] = useState<LastAction | null>(null);
  const [isSubmittingPackage, setIsSubmittingPackage] = useState(false);
  const [isSubmittingConsumption, setIsSubmittingConsumption] = useState(false);
  const [isSubmittingAdjustment, setIsSubmittingAdjustment] = useState(false);

  const canManageInventory = role === "administrador" || role === "gerente";
  const canApproveAdjustments = role === "gerente";
  const isManager = role === "gerente";
  const adjustmentFormTitle = isManager ? "Ingreso / correccion de stock general" : "Solicitud de ajuste";
  const adjustmentFormDetail = isManager ? "Aplicacion directa con trazabilidad" : "Pendiente de decision gerencial";
  const adjustmentSubmitLabel = isManager ? "Aplicar stock" : "Solicitar ajuste";
  const adjustmentSubmittingLabel = isManager ? "Aplicando" : "Solicitando";
  const managementValue = isManager ? "Control" : canManageInventory ? "Solicitudes" : "Solo lectura";
  const openCashBoxId = snapshot.existenciasDiarias[0]?.idCajaDiaria ?? "";
  const hasOpenCashBox = Boolean(openCashBoxId);

  const loadInventory = useCallback(async () => {
    setLoadState("loading");
    setErrorMessage(null);

    try {
      const response = await obtenerInventarioSnapshot(token);
      const orderedGeneralItems = orderInventoryItemsForDisplay(response.existenciasGenerales);
      setSnapshot(response);
      setLoadState("success");
      setIdItemPaquete((current) => current || (firstPackageItem(orderedGeneralItems)?.idItemInventario ?? ""));
      setIdItemConsumo((current) => current || (firstManualItem(response.existenciasGenerales)?.idItemInventario ?? ""));
      setIdItemAjuste((current) => current || (orderedGeneralItems[0]?.idItemInventario ?? ""));
    } catch (error) {
      setLoadState("error");
      setErrorMessage(messageFor(error));
    }
  }, [token]);

  useEffect(() => {
    void loadInventory();
  }, [loadInventory]);

  const generalItems = useMemo(
    () => orderInventoryItemsForDisplay(snapshot.existenciasGenerales),
    [snapshot.existenciasGenerales],
  );
  const packageItems = useMemo(
    () =>
      generalItems.filter(
        (item) => item.tipoControl === "automatico_por_venta" && Boolean(item.idTamanoVaso),
      ),
    [generalItems],
  );
  const manualItems = useMemo(
    () => snapshot.existenciasGenerales.filter((item) => item.tipoControl === "manual_por_consumo"),
    [snapshot.existenciasGenerales],
  );

  const pendingAdjustments = useMemo(
    () => snapshot.ajustes.filter((adjustment) => adjustment.estadoAprobacion === "pendiente").length,
    [snapshot.ajustes],
  );

  const totalDiario = useMemo(
    () => snapshot.existenciasDiarias.reduce((total, item) => total + item.cantidadFinalTeorica, 0),
    [snapshot.existenciasDiarias],
  );
  const dailyItems = useMemo(
    () => orderInventoryItemsForDisplay(snapshot.existenciasDiarias),
    [snapshot.existenciasDiarias],
  );

  async function handlePackageSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSubmitMessage(null);
    setLastAction(null);

    const paquetes = Number(cantidadPaquetes);
    const rotas = Number(unidadesRotas || 0);

    if (!hasOpenCashBox) {
      setSubmitMessage("Abre una caja diaria para registrar paquetes de la jornada.");
      return;
    }

    if (!idItemPaquete || !Number.isInteger(paquetes) || paquetes < 1) {
      setSubmitMessage("Selecciona un vaso y una cantidad de paquetes valida.");
      return;
    }

    if (!Number.isInteger(rotas) || rotas < 0) {
      setSubmitMessage("Las unidades rotas deben ser cero o un entero positivo.");
      return;
    }

    setIsSubmittingPackage(true);

    try {
      const response = await registrarPaqueteVasos(token, {
        cantidadPaquetes: paquetes,
        idItemInventario: idItemPaquete,
        unidadesRotas: rotas,
      });
      setLastAction({ response, type: "paquete" });
      setCantidadPaquetes("1");
      setUnidadesRotas("0");
      await loadInventory();
    } catch (error) {
      setSubmitMessage(messageFor(error));
    } finally {
      setIsSubmittingPackage(false);
    }
  }

  async function handleConsumptionSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSubmitMessage(null);
    setLastAction(null);

    const cantidad = Number(cantidadConsumida);

    if (!hasOpenCashBox) {
      setSubmitMessage("Abre una caja diaria para registrar consumos de la jornada.");
      return;
    }

    if (!idItemConsumo || !Number.isInteger(cantidad) || cantidad < 1) {
      setSubmitMessage("Selecciona un item manual y una cantidad valida.");
      return;
    }

    setIsSubmittingConsumption(true);

    try {
      const response = await registrarConsumoDiario(token, {
        cantidadConsumida: cantidad,
        idItemInventario: idItemConsumo,
        observacion: observacionConsumo.trim() || undefined,
      });
      setLastAction({ response, type: "consumo" });
      setCantidadConsumida("1");
      setObservacionConsumo("");
      await loadInventory();
    } catch (error) {
      setSubmitMessage(messageFor(error));
    } finally {
      setIsSubmittingConsumption(false);
    }
  }

  async function handleAdjustmentSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSubmitMessage(null);
    setLastAction(null);

    const cantidad = Number(cantidadAjuste);

    if (!idItemAjuste || !Number.isInteger(cantidad) || cantidad < 1) {
      setSubmitMessage("Selecciona un item y una cantidad de ajuste valida.");
      return;
    }

    if (!motivoAjuste.trim()) {
      setSubmitMessage("Indica el motivo del ajuste de inventario.");
      return;
    }

    setIsSubmittingAdjustment(true);

    try {
      const response = await solicitarAjusteInventario(token, {
        cantidadAjuste: cantidad,
        idItemInventario: idItemAjuste,
        motivoAjuste: motivoAjuste.trim(),
        sentidoAjuste,
        tipoStock: "general",
      });
      setLastAction({ response, type: "ajuste" });
      setCantidadAjuste("1");
      setMotivoAjuste(isManager ? DEFAULT_STOCK_ENTRY_REASON : "");
      setSentidoAjuste("entrada");
      await loadInventory();
    } catch (error) {
      setSubmitMessage(messageFor(error));
    } finally {
      setIsSubmittingAdjustment(false);
    }
  }

  function updateAdjustmentNote(idAjusteInventario: string, value: string) {
    setAdjustmentNotes((current) => ({ ...current, [idAjusteInventario]: value }));
  }

  async function handleResolveAdjustment(idAjusteInventario: string, action: "aprobar" | "rechazar") {
    setSubmitMessage(null);
    setLastAction(null);
    setResolvingAdjustmentId(idAjusteInventario);

    try {
      const request = {
        observacionAprobacion: adjustmentNotes[idAjusteInventario]?.trim() || undefined,
      };
      const response =
        action === "aprobar"
          ? await aprobarAjusteInventario(token, idAjusteInventario, request)
          : await rechazarAjusteInventario(token, idAjusteInventario, request);
      setLastAction({ response, type: action === "aprobar" ? "ajuste-aprobado" : "ajuste-rechazado" });
      setAdjustmentNotes((current) => {
        const next = { ...current };
        delete next[idAjusteInventario];
        return next;
      });
      await loadInventory();
    } catch (error) {
      setSubmitMessage(messageFor(error));
    } finally {
      setResolvingAdjustmentId(null);
    }
  }

  return (
    <>
      <section className="section-heading" aria-labelledby="inventario-title">
        <div>
          <p className="eyebrow">Inventario operativo</p>
          <h1 id="inventario-title">Stock diario y operaciones</h1>
          <p className="lead">Gestiona las operaciones de la jornada y revisa el stock diario.</p>
        </div>
        <button className="ghost-button" type="button" onClick={loadInventory} disabled={loadState === "loading"}>
          <RefreshCw size={17} strokeWidth={2.2} />
          Reintentar
        </button>
      </section>

      {errorMessage && loadState === "error" ? (
        <div className="form-alert" role="status">
          <Boxes size={18} strokeWidth={2.2} />
          <span>{errorMessage}</span>
        </div>
      ) : null}

      {submitMessage ? (
        <div className="form-alert" role="status">
          <ClipboardList size={18} strokeWidth={2.2} />
          <span>{submitMessage}</span>
        </div>
      ) : null}

      {lastAction ? (
        <div className="success-alert" role="status">
          <PackageOpen size={18} strokeWidth={2.2} />
          <span>
            {lastAction.type === "paquete"
              ? `Paquete registrado: ${formatDisplayName(lastAction.response.nombreItem)}, ${lastAction.response.unidadesDisponibles} unidades disponibles.`
              : lastAction.type === "consumo"
                ? `Consumo registrado: ${formatDisplayName(lastAction.response.nombreItem)}, ${lastAction.response.cantidadConsumida} unidades.`
                : lastAction.type === "ajuste"
                  ? lastAction.response.estadoAprobacion === "aprobado"
                    ? `Stock actualizado: ${formatDisplayName(lastAction.response.nombreItem)}, ${lastAction.response.cantidadAjuste} unidades.`
                    : `Ajuste solicitado: ${formatDisplayName(lastAction.response.nombreItem)}, ${lastAction.response.cantidadAjuste} unidades.`
                  : lastAction.type === "ajuste-aprobado"
                    ? `Ajuste aprobado: ${formatDisplayName(lastAction.response.nombreItem)}, ${lastAction.response.cantidadAjuste} unidades.`
                    : `Ajuste rechazado: ${formatDisplayName(lastAction.response.nombreItem)}.`}
          </span>
        </div>
      ) : null}

      <div className="inventario-summary-grid">
        <SummaryCard label="Stock diario" value={snapshot.existenciasDiarias.length} detail={`${totalDiario} unidades teoricas`} />
        <SummaryCard label="Ajustes" value={snapshot.ajustes.length} detail={`${pendingAdjustments} pendientes`} />
        <SummaryCard label="Gestion" value={managementValue} detail="Acciones segun tu rol" />
      </div>

      {canManageInventory ? (
        <div className="inventory-actions-grid">
          <form className="panel inventory-action-form" onSubmit={handlePackageSubmit}>
            <div className="panel-title">
              <div>
                <h2>Abrir paquetes de vasos</h2>
                <p>Stock diario desde stock general</p>
              </div>
              <PackageOpen size={22} strokeWidth={2.2} />
            </div>

            <div className="inventory-action-fields">
              <label className="field-label">
                Vaso
                <div className="field-control plain">
                  <select value={idItemPaquete} onChange={(event) => setIdItemPaquete(event.target.value)}>
                    {packageItems.map((item) => (
                      <option key={item.idItemInventario} value={item.idItemInventario}>
                        {itemLabel(item)} · stock general {item.cantidadActual}
                      </option>
                    ))}
                  </select>
                </div>
              </label>
              <div className="inventory-form-row">
                <label className="field-label">
                  Paquetes
                  <div className="field-control plain">
                    <input
                      min="1"
                      step="1"
                      type="number"
                      value={cantidadPaquetes}
                      onChange={(event) => setCantidadPaquetes(event.target.value)}
                    />
                  </div>
                </label>
                <label className="field-label">
                  Unidades rotas
                  <div className="field-control plain">
                    <input
                      min="0"
                      step="1"
                      type="number"
                      value={unidadesRotas}
                      onChange={(event) => setUnidadesRotas(event.target.value)}
                    />
                  </div>
                </label>
              </div>
            </div>

            <button
              className="primary-button full"
              type="submit"
              disabled={isSubmittingPackage || packageItems.length === 0 || !hasOpenCashBox}
            >
              <PackageOpen size={18} strokeWidth={2.2} />
              {isSubmittingPackage ? "Registrando" : "Registrar paquete"}
            </button>
          </form>

          <form className="panel inventory-action-form" onSubmit={handleConsumptionSubmit}>
            <div className="panel-title">
              <div>
                <h2>Consumo diario de desechables</h2>
                <p>Items manuales desde stock general</p>
              </div>
              <ClipboardList size={22} strokeWidth={2.2} />
            </div>

            <div className="inventory-action-fields">
              <label className="field-label">
                Item
                <div className="field-control plain">
                  <select value={idItemConsumo} onChange={(event) => setIdItemConsumo(event.target.value)}>
                    {manualItems.map((item) => (
                      <option key={item.idItemInventario} value={item.idItemInventario}>
                        {formatDisplayName(item.nombreItem)} · stock general {item.cantidadActual}
                      </option>
                    ))}
                  </select>
                </div>
              </label>

              <label className="field-label">
                Cantidad consumida
                <div className="field-control plain">
                  <input
                    min="1"
                    step="1"
                    type="number"
                    value={cantidadConsumida}
                    onChange={(event) => setCantidadConsumida(event.target.value)}
                  />
                </div>
              </label>

              <label className="field-label">
                Observacion
                <div className="field-control plain">
                  <input
                    type="text"
                    value={observacionConsumo}
                    onChange={(event) => setObservacionConsumo(event.target.value)}
                    placeholder="Opcional"
                  />
                </div>
              </label>
            </div>

            <button
              className="primary-button full"
              type="submit"
              disabled={isSubmittingConsumption || manualItems.length === 0 || !hasOpenCashBox}
            >
              <ClipboardList size={18} strokeWidth={2.2} />
              {isSubmittingConsumption ? "Registrando" : "Registrar consumo"}
            </button>
          </form>

          <form className="panel inventory-action-form" onSubmit={handleAdjustmentSubmit}>
            <div className="panel-title">
              <div>
                <h2>{adjustmentFormTitle}</h2>
                <p>{adjustmentFormDetail}</p>
              </div>
              <SlidersHorizontal size={22} strokeWidth={2.2} />
            </div>

            <div className="inventory-action-fields">
              <label className="field-label">
                Item
                <div className="field-control plain">
                  <select value={idItemAjuste} onChange={(event) => setIdItemAjuste(event.target.value)}>
                    {generalItems.map((item) => (
                      <option key={item.idItemInventario} value={item.idItemInventario}>
                        {itemLabel(item)} · stock general {item.cantidadActual}
                      </option>
                    ))}
                  </select>
                </div>
              </label>

              <div className="inventory-form-row">
                <label className="field-label">
                  Sentido
                  <div className="field-control plain">
                    <select
                      value={sentidoAjuste}
                      onChange={(event) => setSentidoAjuste(event.target.value as "entrada" | "salida")}
                    >
                      <option value="entrada">Entrada</option>
                      <option value="salida">Salida</option>
                    </select>
                  </div>
                </label>
                <label className="field-label">
                  Cantidad
                  <div className="field-control plain">
                    <input
                      min="1"
                      step="1"
                      type="number"
                      value={cantidadAjuste}
                      onChange={(event) => setCantidadAjuste(event.target.value)}
                    />
                  </div>
                </label>
              </div>

              <label className="field-label">
                Motivo
                <div className="field-control plain">
                  <input
                    type="text"
                    value={motivoAjuste}
                    onChange={(event) => setMotivoAjuste(event.target.value)}
                    placeholder="Reabastecimiento, correccion o conteo"
                    maxLength={1000}
                  />
                </div>
              </label>
            </div>

            <button
              className="primary-button full"
              type="submit"
              disabled={isSubmittingAdjustment || snapshot.existenciasGenerales.length === 0}
            >
              <SlidersHorizontal size={18} strokeWidth={2.2} />
              {isSubmittingAdjustment ? adjustmentSubmittingLabel : adjustmentSubmitLabel}
            </button>
          </form>
        </div>
      ) : (
        <article className="panel inventory-readonly-note">
          <Boxes size={22} strokeWidth={2.2} />
          <div>
            <h2>Gestion reservada</h2>
            <p>
              El acceso operativo a inventario queda reservado para administrador o gerente, con validacion final del
              sistema.
            </p>
          </div>
        </article>
      )}

      <div className="inventory-panel-grid">
        <article className="panel">
          <div className="panel-title">
              <div>
                <h2>Stock diario</h2>
              <p>Conteo operativo de la jornada abierta</p>
            </div>
            <span className="badge">{loadState === "loading" ? "Cargando" : `${snapshot.existenciasDiarias.length}`}</span>
          </div>
          <ul className="inventory-list">
            {dailyItems.length > 0 ? (
              dailyItems.map((item) => <DailyRow key={item.idExistenciaDiaria} item={item} />)
            ) : (
              <li className="inventory-empty">Sin stock diario cargado para la caja abierta.</li>
            )}
          </ul>
        </article>

        <article className="panel">
          <div className="panel-title">
              <div>
                <h2>Ajustes de stock general</h2>
              <p>Solicitudes y decisiones registradas</p>
            </div>
            <span className="badge">{loadState === "loading" ? "Cargando" : `${snapshot.ajustes.length}`}</span>
          </div>
          <ul className="adjustment-list">
            {snapshot.ajustes.length > 0 ? (
              snapshot.ajustes.slice(0, 20).map((adjustment) => (
                <AdjustmentRow
                  key={adjustment.idAjusteInventario}
                  adjustment={adjustment}
                  canApprove={canApproveAdjustments}
                  isResolving={resolvingAdjustmentId === adjustment.idAjusteInventario}
                  note={adjustmentNotes[adjustment.idAjusteInventario] ?? ""}
                  onNoteChange={(value) => updateAdjustmentNote(adjustment.idAjusteInventario, value)}
                  onApprove={() => void handleResolveAdjustment(adjustment.idAjusteInventario, "aprobar")}
                  onReject={() => void handleResolveAdjustment(adjustment.idAjusteInventario, "rechazar")}
                />
              ))
            ) : (
              <li className="inventory-empty">Sin ajustes de inventario registrados.</li>
            )}
          </ul>
        </article>
      </div>
    </>
  );
}

function firstPackageItem(items: ExistenciaInventarioGeneral[]) {
  return items.find((item) => item.tipoControl === "automatico_por_venta" && Boolean(item.idTamanoVaso));
}

function firstManualItem(items: ExistenciaInventarioGeneral[]) {
  return items.find((item) => item.tipoControl === "manual_por_consumo");
}
