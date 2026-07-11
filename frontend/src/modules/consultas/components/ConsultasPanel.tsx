import { AlertCircle, Archive, Boxes, Building2, ClipboardList, Landmark, ReceiptText, RefreshCw, ShoppingBag, WalletCards } from "lucide-react";
import { type FormEvent, useCallback, useEffect, useMemo, useState } from "react";
import type { UserRole } from "../../../app/routes/appRoutes";
import { ApiClientError } from "../../../shared/services/apiClient";
import {
  consultarCierrePorFecha,
  consultarGastos,
  consultarInventarioActual,
  consultarMovimientosDeposito,
  consultarMovimientosInventario,
  consultarVentas,
} from "../services/consultasService";
import type {
  ConsultaCierreDiario,
  ConsultaGastoCaja,
  ConsultaInventarioActual,
  ConsultaMovimientoDeposito,
  ConsultaMovimientoInventario,
  ConsultaVenta,
  FiltroPeriodo,
} from "../types";

type LoadState = "loading" | "success" | "error";
type ConsultaVista = "ventas" | "gastos" | "inventario" | "cierre" | "deposito";

type ConsultasPanelProps = {
  role: UserRole | null;
  token: string;
};

const ADMIN_VIEWS: ConsultaVista[] = ["ventas", "gastos", "inventario", "cierre", "deposito"];
const VENDEDOR_VIEWS: ConsultaVista[] = ["ventas", "gastos"];

function todayLocalDate() {
  const date = new Date();
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

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
  return error instanceof Error ? error.message : "No fue posible consultar la informacion operativa.";
}

function labelMovimientoDeposito(tipo: string) {
  if (tipo === "entrada_cierre") {
    return "Entrada por cierre";
  }
  if (tipo === "salida_consignacion") {
    return "Consignacion bancaria";
  }
  if (tipo === "salida_pago_servicio") {
    return "Pago de servicio";
  }
  return tipo;
}

function esSalidaDeposito(tipo: string) {
  return tipo.startsWith("salida_");
}

function tabLabel(vista: ConsultaVista) {
  switch (vista) {
    case "ventas":
      return "Ventas";
    case "gastos":
      return "Gastos";
    case "inventario":
      return "Inventario";
    case "cierre":
      return "Cierre";
    case "deposito":
      return "Deposito";
  }
}

export function ConsultasPanel({ role, token }: ConsultasPanelProps) {
  const [fechaInicio, setFechaInicio] = useState(todayLocalDate);
  const [fechaFin, setFechaFin] = useState(todayLocalDate);
  const [filtroAplicado, setFiltroAplicado] = useState<FiltroPeriodo>(() => {
    const fechaActual = todayLocalDate();
    return { fechaFin: fechaActual, fechaInicio: fechaActual };
  });
  const [consultaVersion, setConsultaVersion] = useState(0);
  const [activeView, setActiveView] = useState<ConsultaVista>("ventas");
  const [loadState, setLoadState] = useState<LoadState>("loading");
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [ventas, setVentas] = useState<ConsultaVenta[]>([]);
  const [gastos, setGastos] = useState<ConsultaGastoCaja[]>([]);
  const [inventario, setInventario] = useState<ConsultaInventarioActual[]>([]);
  const [movimientosInventario, setMovimientosInventario] = useState<ConsultaMovimientoInventario[]>([]);
  const [cierre, setCierre] = useState<ConsultaCierreDiario | null>(null);
  const [movimientosDeposito, setMovimientosDeposito] = useState<ConsultaMovimientoDeposito[]>([]);

  const isAdministrative = role === "administrador" || role === "gerente";
  const visibleViews = isAdministrative ? ADMIN_VIEWS : VENDEDOR_VIEWS;

  const cargarVista = useCallback(async (vista: ConsultaVista) => {
    setLoadState("loading");
    setErrorMessage(null);

    try {
      if (vista === "ventas") {
        setVentas(await consultarVentas(token, filtroAplicado));
      } else if (vista === "gastos") {
        setGastos(await consultarGastos(token, filtroAplicado));
      } else if (vista === "inventario") {
        const [inventarioResponse, movimientosResponse] = await Promise.all([
          consultarInventarioActual(token),
          consultarMovimientosInventario(token, filtroAplicado),
        ]);
        setInventario(inventarioResponse);
        setMovimientosInventario(movimientosResponse);
      } else if (vista === "cierre") {
        try {
          setCierre(await consultarCierrePorFecha(token, filtroAplicado.fechaFin ?? filtroAplicado.fechaInicio));
        } catch (error) {
          if (error instanceof ApiClientError && error.status === 404) {
            setCierre(null);
          } else {
            throw error;
          }
        }
      } else {
        setMovimientosDeposito(await consultarMovimientosDeposito(token, filtroAplicado));
      }
      setLoadState("success");
    } catch (error) {
      setLoadState("error");
      setErrorMessage(messageFor(error));
    }
  }, [filtroAplicado, token]);

  useEffect(() => {
    if (!visibleViews.includes(activeView)) {
      setActiveView("ventas");
      return;
    }
    void cargarVista(activeView);
  }, [activeView, cargarVista, consultaVersion, visibleViews]);

  function actualizarConsulta(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (fechaFin && fechaFin < fechaInicio) {
      setErrorMessage("La fecha final no puede ser anterior a la fecha inicial.");
      return;
    }
    setFiltroAplicado({ fechaFin: fechaFin || undefined, fechaInicio });
    setConsultaVersion((version) => version + 1);
  }

  function cambiarVista(vista: ConsultaVista) {
    setActiveView(vista);
  }

  const resumen = useMemo(() => {
    if (activeView === "ventas") {
      return [
        { detail: "Ventas registradas", label: "Registros", value: String(ventas.length) },
        { detail: "Total de ventas", label: "Ventas", value: formatCurrency(ventas.reduce((total, item) => total + item.totalVenta, 0)) },
        { detail: "Pagos en efectivo", label: "Efectivo", value: formatCurrency(ventas.reduce((total, item) => total + item.totalEfectivo, 0)) },
        { detail: "Pagos por transferencia", label: "Transferencias", value: formatCurrency(ventas.reduce((total, item) => total + item.totalTransferencia, 0)) },
      ];
    }

    if (activeView === "gastos") {
      const gastosActivos = gastos.filter((gasto) => gasto.estadoGasto !== "anulado");
      return [
        { detail: "Registros consultados", label: "Gastos", value: String(gastos.length) },
        { detail: "Descuento vigente", label: "Activos", value: formatCurrency(gastosActivos.reduce((total, item) => total + item.valorGasto, 0)) },
        { detail: "Registros anulados", label: "Anulados", value: String(gastos.length - gastosActivos.length) },
        {
          detail: "Jornada consultada",
          label: "Periodo",
          value: filtroAplicado.fechaInicio === filtroAplicado.fechaFin
            ? filtroAplicado.fechaInicio
            : `${filtroAplicado.fechaInicio} a ${filtroAplicado.fechaFin}`,
        },
      ];
    }

    if (activeView === "inventario") {
      const conStockDiario = inventario.filter((item) => item.idCajaDiariaAbierta !== null);
      return [
        { detail: "Items inventariables", label: "Items", value: String(inventario.length) },
        { detail: "Unidades en stock general", label: "Stock general", value: String(inventario.reduce((total, item) => total + (item.cantidadActualGeneral ?? 0), 0)) },
        { detail: "Vasos en jornada abierta", label: "Stock diario", value: String(conStockDiario.reduce((total, item) => total + (item.cantidadFinalTeoricaDiaria ?? 0), 0)) },
        { detail: "Movimientos del periodo", label: "Movimientos", value: String(movimientosInventario.length) },
      ];
    }

    if (activeView === "cierre") {
      return cierre ? [
        { detail: "Total de jornada", label: "Ventas", value: formatCurrency(cierre.totalVentas) },
        { detail: "Efectivo contado sin base", label: "Contado", value: formatCurrency(cierre.efectivoContadoSinBase) },
        { detail: "Diferencia de caja", label: "Diferencia", value: formatCurrency(cierre.diferenciaCaja) },
        { detail: "Valor enviado a deposito", label: "Deposito", value: formatCurrency(cierre.valorADeposito) },
      ] : [
        { detail: "Fecha consultada", label: "Cierre", value: "Sin cierre" },
        { detail: "Consulta de lectura", label: "Jornada", value: filtroAplicado.fechaFin ?? filtroAplicado.fechaInicio },
        { detail: "Sin cambio operativo", label: "Estado", value: "Disponible" },
        { detail: "El backend informa la existencia", label: "Fuente", value: "API" },
      ];
    }

    const entradas = movimientosDeposito.filter((item) => item.tipoMovimientoDeposito === "entrada_cierre");
    const salidas = movimientosDeposito.filter((item) => item.tipoMovimientoDeposito.startsWith("salida_"));
    const saldo = movimientosDeposito[0]?.saldoPosterior ?? 0;
    return [
      { detail: "Saldo posterior mas reciente", label: "Saldo", value: formatCurrency(saldo) },
      { detail: "Entradas por cierre", label: "Entradas", value: formatCurrency(entradas.reduce((total, item) => total + item.valorMovimiento, 0)) },
      { detail: "Consignaciones y servicios", label: "Salidas", value: formatCurrency(salidas.reduce((total, item) => total + item.valorMovimiento, 0)) },
      { detail: "Movimientos consultados", label: "Registros", value: String(movimientosDeposito.length) },
    ];
  }, [activeView, cierre, filtroAplicado, gastos, inventario, movimientosDeposito, movimientosInventario, ventas]);

  return (
    <section className="consultas-panel" aria-label="Consultas operativas">
      <header className="module-header consultas-header">
        <div>
          <span className="eyebrow">Reportes internos</span>
          <h1>Consultas</h1>
          <p>Consulta la jornada sin modificar ventas, gastos, inventario, cierre ni movimientos de deposito.</p>
        </div>
        <div className="consultas-readonly-status" aria-label="Modo de solo lectura">
          <Archive size={18} aria-hidden="true" />
          <span>Solo lectura desde backend</span>
        </div>
      </header>

      <form className="consultas-filter-form" onSubmit={actualizarConsulta}>
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
          Actualizar
        </button>
      </form>

      {errorMessage ? (
        <div className="error-alert consultas-alert" role="alert">
          <AlertCircle size={18} aria-hidden="true" />
          <span>{errorMessage}</span>
        </div>
      ) : null}

      <div className="consultas-tabs" role="tablist" aria-label="Tipo de consulta">
        {visibleViews.map((vista) => (
          <button className={activeView === vista ? "active" : ""} type="button" role="tab" aria-selected={activeView === vista} key={vista} onClick={() => cambiarVista(vista)}>
            {tabLabel(vista)}
          </button>
        ))}
      </div>

      <div className="consultas-summary-grid" aria-label="Resumen de la consulta">
        {resumen.map((item) => (
          <article className="consultas-summary-card" key={item.label}>
            <span>{item.label}</span>
            <strong>{item.value}</strong>
            <small>{item.detail}</small>
          </article>
        ))}
      </div>

      {loadState === "loading" ? <p className="loading-copy">Consultando {tabLabel(activeView).toLowerCase()}...</p> : null}

      {activeView === "ventas" ? (
        <section className="consultas-data-panel" aria-labelledby="consultas-ventas-title">
          <div className="compact-heading">
            <div>
              <span className="eyebrow">Ventas</span>
              <h2 id="consultas-ventas-title">Ventas de la jornada</h2>
            </div>
            <ShoppingBag size={22} aria-hidden="true" />
          </div>
          {loadState === "success" && ventas.length === 0 ? <p className="empty-copy">No hay ventas para el periodo seleccionado.</p> : null}
          <ul className="consultas-record-list">
            {ventas.map((venta) => (
              <li className="consultas-record-row ventas" key={venta.idVenta}>
                <span>
                  <strong>Venta #{venta.numeroVenta}</strong>
                  <small>{venta.nombreUsuarioVendedor} · {venta.tipoComprador}</small>
                </span>
                <span>
                  <strong>{formatCurrency(venta.totalVenta)}</strong>
                  <small>Efectivo {formatCurrency(venta.totalEfectivo)} · Transferencia {formatCurrency(venta.totalTransferencia)}</small>
                </span>
                <span className="status-badge active">{venta.estadoVenta}</span>
              </li>
            ))}
          </ul>
        </section>
      ) : null}

      {activeView === "gastos" ? (
        <section className="consultas-data-panel" aria-labelledby="consultas-gastos-title">
          <div className="compact-heading">
            <div>
              <span className="eyebrow">Gastos</span>
              <h2 id="consultas-gastos-title">Gastos de caja</h2>
            </div>
            <ReceiptText size={22} aria-hidden="true" />
          </div>
          {loadState === "success" && gastos.length === 0 ? <p className="empty-copy">No hay gastos para el periodo seleccionado.</p> : null}
          <ul className="consultas-record-list">
            {gastos.map((gasto) => (
              <li className="consultas-record-row gastos" key={gasto.idGastoCaja}>
                <span>
                  <strong>{gasto.descripcion}</strong>
                  <small>{gasto.nombreUsuarioRegistro} · {formatDateTime(gasto.fechaRegistro)}</small>
                </span>
                <strong>{formatCurrency(gasto.valorGasto)}</strong>
                <span className={`consultas-status ${gasto.estadoGasto === "anulado" ? "anulado" : "activo"}`}>{gasto.estadoGasto}</span>
              </li>
            ))}
          </ul>
        </section>
      ) : null}

      {activeView === "inventario" && isAdministrative ? (
        <div className="consultas-split-data">
          <section className="consultas-data-panel" aria-labelledby="consultas-inventario-title">
            <div className="compact-heading">
              <div>
                <span className="eyebrow">Inventario</span>
                <h2 id="consultas-inventario-title">Existencias actuales</h2>
              </div>
              <Boxes size={22} aria-hidden="true" />
            </div>
            {loadState === "success" && inventario.length === 0 ? <p className="empty-copy">No hay existencias disponibles para consultar.</p> : null}
            <ul className="consultas-record-list">
              {inventario.map((item) => (
                <li className="consultas-record-row inventario" key={item.idItemInventario}>
                  <span>
                    <strong>{item.nombreItem}</strong>
                    <small>{item.nombreCategoria} · {item.nombreUnidad}{item.onzas ? ` · ${item.onzas} oz` : ""}</small>
                  </span>
                  <span>
                    <strong>General {item.cantidadActualGeneral ?? 0}</strong>
                    <small>{item.idCajaDiariaAbierta ? `Diario ${item.cantidadFinalTeoricaDiaria ?? 0}` : "Sin caja abierta"}</small>
                  </span>
                </li>
              ))}
            </ul>
          </section>

          <section className="consultas-data-panel" aria-labelledby="consultas-movimientos-title">
            <div className="compact-heading">
              <div>
                <span className="eyebrow">Trazabilidad</span>
                <h2 id="consultas-movimientos-title">Movimientos de inventario</h2>
              </div>
              <ClipboardList size={22} aria-hidden="true" />
            </div>
            {loadState === "success" && movimientosInventario.length === 0 ? <p className="empty-copy">No hay movimientos para el periodo seleccionado.</p> : null}
            <ul className="consultas-record-list">
              {movimientosInventario.map((movimiento) => (
                <li className="consultas-record-row movimientos" key={movimiento.idMovimientoInventario}>
                  <span>
                    <strong>{movimiento.nombreItem}</strong>
                    <small>{movimiento.tipoMovimiento} · {movimiento.nombreUsuarioRegistro}</small>
                  </span>
                  <span>
                    <strong>{movimiento.sentidoMovimiento === "salida" ? "-" : "+"}{movimiento.cantidad}</strong>
                    <small>{formatDateTime(movimiento.fechaMovimiento)}</small>
                  </span>
                  <span className="status-badge active">{movimiento.tipoStock}</span>
                </li>
              ))}
            </ul>
          </section>
        </div>
      ) : null}

      {activeView === "cierre" && isAdministrative ? (
        <section className="consultas-data-panel" aria-labelledby="consultas-cierre-title">
          <div className="compact-heading">
            <div>
              <span className="eyebrow">Cierre</span>
              <h2 id="consultas-cierre-title">Resultado de la jornada</h2>
            </div>
            <WalletCards size={22} aria-hidden="true" />
          </div>
          {!cierre && loadState === "success" ? <p className="empty-copy">No existe un cierre registrado para la fecha consultada.</p> : null}
          {cierre ? (
            <div className="consultas-cierre-grid">
              <div><span>Ventas</span><strong>{formatCurrency(cierre.totalVentas)}</strong></div>
              <div><span>Transferencias validadas</span><strong>{formatCurrency(cierre.totalTransferenciasValidadas)}</strong></div>
              <div><span>Gastos</span><strong>{formatCurrency(cierre.totalGastos)}</strong></div>
              <div><span>Adiciones</span><strong>{formatCurrency(cierre.totalAdiciones)}</strong></div>
              <div><span>Efectivo esperado sin base</span><strong>{formatCurrency(cierre.efectivoEsperadoSinBase)}</strong></div>
              <div><span>Efectivo contado sin base</span><strong>{formatCurrency(cierre.efectivoContadoSinBase)}</strong></div>
              <div><span>Diferencia</span><strong>{formatCurrency(cierre.diferenciaCaja)}</strong></div>
              <div><span>Valor a deposito</span><strong>{formatCurrency(cierre.valorADeposito)}</strong></div>
            </div>
          ) : null}
        </section>
      ) : null}

      {activeView === "deposito" && isAdministrative ? (
        <section className="consultas-data-panel" aria-labelledby="consultas-deposito-title">
          <div className="compact-heading">
            <div>
              <span className="eyebrow">Deposito</span>
              <h2 id="consultas-deposito-title">Movimientos del deposito</h2>
            </div>
            <Landmark size={22} aria-hidden="true" />
          </div>
          {loadState === "success" && movimientosDeposito.length === 0 ? <p className="empty-copy">No hay movimientos de deposito para el periodo seleccionado.</p> : null}
          <ul className="consultas-record-list">
            {movimientosDeposito.map((movimiento) => {
              const salida = esSalidaDeposito(movimiento.tipoMovimientoDeposito);
              const Icon = salida ? Building2 : Landmark;

              return (
                <li className="consultas-record-row deposito" key={movimiento.idMovimientoDeposito}>
                  <div className={`consultas-deposito-icon ${salida ? "expense" : "income"}`}>
                    <Icon size={18} aria-hidden="true" />
                  </div>
                  <span>
                    <strong>{labelMovimientoDeposito(movimiento.tipoMovimientoDeposito)}</strong>
                    <small>{movimiento.nombreUsuarioRegistro} · {formatDateTime(movimiento.fechaMovimiento)}</small>
                    {movimiento.nombreServicio ? <small>Servicio: {movimiento.nombreServicio}</small> : null}
                    {movimiento.observacion ? <small>{movimiento.observacion}</small> : null}
                  </span>
                  <span>
                    <strong className={`consultas-deposito-value ${salida ? "expense" : "income"}`}>
                      {salida ? "-" : "+"}{formatCurrency(movimiento.valorMovimiento)}
                    </strong>
                    <small>Saldo {formatCurrency(movimiento.saldoPosterior)}</small>
                  </span>
                  <span className={`consultas-deposito-kind ${salida ? "expense" : "income"}`}>{salida ? "Salida" : "Entrada"}</span>
                </li>
              );
            })}
          </ul>
        </section>
      ) : null}
    </section>
  );
}
