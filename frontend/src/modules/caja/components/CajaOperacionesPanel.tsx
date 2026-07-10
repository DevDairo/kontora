import { Banknote, ClipboardList, RefreshCw, Save, WalletCards } from "lucide-react";
import { type FormEvent, useCallback, useEffect, useMemo, useState } from "react";
import { ApiClientError } from "../../../shared/services/apiClient";
import { normalizeMoneyInput } from "../../../shared/utils/moneyInput";
import { obtenerGastosSnapshot, registrarAdicionDiaria } from "../../gastos/services/gastosService";
import type { GastosSnapshot } from "../../gastos/types";

type LoadState = "loading" | "success" | "no-cash-box" | "error";
type SubmitAction = "adicion" | null;

type CajaOperacionesPanelProps = {
  token: string;
};

function emptySnapshot(): GastosSnapshot {
  return { adicion: null, gastos: [], pagoTrabajadores: null, resumenCaja: null };
}

function formatCurrency(value: number | null | undefined) {
  return new Intl.NumberFormat("es-CO", {
    currency: "COP",
    maximumFractionDigits: 0,
    style: "currency",
  }).format(Number(value ?? 0));
}

function messageFor(error: unknown) {
  if (error instanceof ApiClientError) {
    return error.message;
  }

  return error instanceof Error ? error.message : "No fue posible consultar las operaciones de caja";
}

function toNumber(value: string) {
  return Number(value || 0);
}

function SummaryCard({ label, value, detail }: { label: string; value: string; detail: string }) {
  return (
    <article className="gastos-summary-card">
      <span>{label}</span>
      <strong>{value}</strong>
      <small>{detail}</small>
    </article>
  );
}

export function CajaOperacionesPanel({ token }: CajaOperacionesPanelProps) {
  const [snapshot, setSnapshot] = useState<GastosSnapshot>(emptySnapshot);
  const [loadState, setLoadState] = useState<LoadState>("loading");
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [actionMessage, setActionMessage] = useState<string | null>(null);
  const [submittingAction, setSubmittingAction] = useState<SubmitAction>(null);
  const [cantidadAdiciones, setCantidadAdiciones] = useState("0");
  const [valorAdicion, setValorAdicion] = useState("1000");

  const loadSnapshot = useCallback(async () => {
    setLoadState("loading");
    setErrorMessage(null);

    try {
      const response = await obtenerGastosSnapshot(token, true);
      setSnapshot(response);
      setLoadState("success");
    } catch (error) {
      setSnapshot(emptySnapshot());

      if (error instanceof ApiClientError && error.status === 409) {
        setLoadState("no-cash-box");
        setErrorMessage(error.message);
        return;
      }

      setLoadState("error");
      setErrorMessage(messageFor(error));
    }
  }, [token]);

  useEffect(() => {
    void loadSnapshot();
  }, [loadSnapshot]);

  useEffect(() => {
    if (!snapshot.adicion) {
      return;
    }

    setCantidadAdiciones(String(snapshot.adicion.cantidadAdiciones));
    setValorAdicion(String(snapshot.adicion.valorUnitario));
  }, [snapshot.adicion]);

  const resumenCaja = snapshot.resumenCaja;
  const pagoTrabajadores = snapshot.pagoTrabajadores;
  const isCashBoxOpen = loadState === "success";
  const gastosActivos = useMemo(
    () => snapshot.gastos.filter((gasto) => gasto.estadoGasto !== "anulado"),
    [snapshot.gastos],
  );

  async function handleAdicionSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const cantidad = Number(cantidadAdiciones);
    const valorUnitario = toNumber(valorAdicion);

    if (!Number.isInteger(cantidad) || cantidad < 0 || !Number.isFinite(valorUnitario) || valorUnitario < 0) {
      setActionMessage("La cantidad de adiciones y su valor unitario deben ser valores validos iguales o mayores a cero.");
      return;
    }

    setSubmittingAction("adicion");
    setActionMessage(null);

    try {
      await registrarAdicionDiaria(token, { cantidadAdiciones: cantidad, valorUnitario });
      await loadSnapshot();
      setActionMessage("Adiciones diarias actualizadas.");
    } catch (error) {
      setActionMessage(messageFor(error));
    } finally {
      setSubmittingAction(null);
    }
  }

  return (
    <section className="caja-operaciones-section" aria-labelledby="caja-operaciones-title">
      <div className="caja-operaciones-heading">
        <div>
          <p className="eyebrow">Control financiero</p>
          <h2 id="caja-operaciones-title">Operaciones de caja diaria</h2>
          <p>Adiciones, pago a trabajadores y proyeccion de efectivo para la caja abierta.</p>
        </div>
        <button className="ghost-button" type="button" onClick={loadSnapshot} disabled={loadState === "loading"}>
          <RefreshCw size={17} strokeWidth={2.2} />
          Actualizar
        </button>
      </div>

      {errorMessage ? (
        <div className="form-alert" role="status">
          <WalletCards size={18} strokeWidth={2.2} />
          <span>{errorMessage}</span>
        </div>
      ) : null}

      <section className="gastos-summary-grid" aria-label="Resumen de operaciones de caja">
        <SummaryCard
          label="Gastos activos"
          value={formatCurrency(resumenCaja?.totalGastos)}
          detail={`${gastosActivos.length} registro${gastosActivos.length === 1 ? "" : "s"}; se gestionan desde Gastos`}
        />
        <SummaryCard
          label="Adiciones"
          value={formatCurrency(resumenCaja?.totalAdiciones)}
          detail={snapshot.adicion ? `${snapshot.adicion.cantidadAdiciones} adiciones registradas; suma efectivo esperado` : "Sin registro para la caja"}
        />
        <SummaryCard
          label="Pago trabajadores"
          value={formatCurrency(pagoTrabajadores?.valorTotalPagado)}
          detail={pagoTrabajadores?.confirmadoParaCierre ? "Confirmado; descuenta efectivo esperado" : "Pendiente de confirmar"}
        />
      </section>

      {resumenCaja ? (
        <section className="gastos-cash-flow" aria-labelledby="caja-cash-flow-title">
          <div className="gastos-cash-flow-heading">
            <div>
              <p className="eyebrow">Caja diaria</p>
              <h2 id="caja-cash-flow-title">Proyeccion de efectivo fisico</h2>
            </div>
            <span className={`badge ${resumenCaja.listoParaCierre ? "success" : "warning"}`}>
              {resumenCaja.listoParaCierre ? "Requisitos de cierre completos" : "Pendiente para cierre"}
            </span>
          </div>

          <div className="gastos-cash-flow-content">
            <div className="gastos-cash-flow-lines" aria-label="Formula de efectivo esperado sin base">
              <div className="gastos-flow-line income">
                <span>Ventas en efectivo</span>
                <strong>+ {formatCurrency(resumenCaja.totalVentasEfectivo)}</strong>
              </div>
              <div className="gastos-flow-line income">
                <span>Adiciones</span>
                <strong>+ {formatCurrency(resumenCaja.totalAdiciones)}</strong>
              </div>
              <div className="gastos-flow-line expense">
                <span>Gastos activos</span>
                <strong>- {formatCurrency(resumenCaja.totalGastos)}</strong>
              </div>
              <div className="gastos-flow-line expense">
                <span>Pago a trabajadores</span>
                <strong>- {formatCurrency(resumenCaja.totalPagoTrabajadores)}</strong>
              </div>
              <div className="gastos-flow-line total">
                <span>Efectivo esperado sin base</span>
                <strong>{formatCurrency(resumenCaja.efectivoEsperadoSinBase)}</strong>
              </div>
            </div>

            <dl className="gastos-cash-context">
              <div>
                <dt>Total de ventas</dt>
                <dd>{formatCurrency(resumenCaja.totalVentas)}</dd>
              </div>
              <div>
                <dt>Transferencias</dt>
                <dd>{formatCurrency(resumenCaja.totalVentasTransferencia)}</dd>
              </div>
              <div>
                <dt>Base de caja</dt>
                <dd>{formatCurrency(resumenCaja.valorBase)}</dd>
              </div>
            </dl>
          </div>

          <p className="gastos-cash-flow-note">
            Las transferencias no son efectivo fisico y la base se conserva. El deposito se define en Cierre con el efectivo contado sin base, no con esta proyeccion.
          </p>
          {!resumenCaja.listoParaCierre ? (
            <p className="gastos-cash-flow-warning">
              {!resumenCaja.adicionDiariaRegistrada ? "Falta registrar adiciones diarias. " : ""}
              {!resumenCaja.pagoTrabajadoresRegistrado
                ? "Falta registrar el pago diario a trabajadores."
                : !resumenCaja.pagoTrabajadoresConfirmado
                  ? "Falta confirmar el pago diario a trabajadores."
                  : resumenCaja.efectivoEsperadoSinBase < 0
                    ? "El efectivo esperado sin base no puede ser negativo."
                    : ""}
            </p>
          ) : null}
        </section>
      ) : null}

      <section className="gastos-actions-grid" aria-label="Operaciones financieras de caja">
        <form className="panel gastos-form-panel" onSubmit={handleAdicionSubmit}>
          <div className="panel-title">
            <div>
              <h2>Adiciones diarias</h2>
              <p>Registro unico por caja; se actualiza mientras siga abierta.</p>
            </div>
            <Banknote size={22} strokeWidth={2.2} />
          </div>

          <div className="gastos-field-row">
            <label className="field-label">
              Cantidad
              <div className="field-control plain">
                <input
                  min="0"
                  step="1"
                  type="number"
                  value={cantidadAdiciones}
                  onChange={(event) => setCantidadAdiciones(event.target.value)}
                  disabled={!isCashBoxOpen}
                  required
                />
              </div>
            </label>
            <label className="field-label">
              Valor unitario
              <div className="field-control plain">
                <input
                  inputMode="decimal"
                  type="text"
                  value={valorAdicion}
                  onChange={(event) => setValorAdicion(normalizeMoneyInput(event.target.value))}
                  disabled={!isCashBoxOpen}
                />
              </div>
            </label>
          </div>

          <div className="gastos-calculated-total">
            <span>Total calculado por backend</span>
            <strong>{formatCurrency(snapshot.adicion?.valorTotal ?? toNumber(cantidadAdiciones) * toNumber(valorAdicion))}</strong>
          </div>

          <button className="primary-button full" type="submit" disabled={!isCashBoxOpen || submittingAction === "adicion"}>
            <Save size={18} strokeWidth={2.2} />
            {submittingAction === "adicion" ? "Guardando" : "Guardar adiciones"}
          </button>
        </form>

      </section>

      {actionMessage ? (
        <div className="form-alert" role="status">
          <ClipboardList size={18} strokeWidth={2.2} />
          <span>{actionMessage}</span>
        </div>
      ) : null}
    </section>
  );
}
