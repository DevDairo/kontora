export type ArchivoEvidenciaResponse = {
  idArchivoEvidencia: string;
  idPagoVenta: string | null;
  idGastoCaja: string | null;
  idConsignacionBancaria: string | null;
  idPagoServicio: string | null;
  urlArchivo: string;
  nombreArchivo: string;
  tipoArchivo: string;
  formatoArchivo: string;
  tamanoOriginalKb: number;
  tamanoComprimidoKb: number | null;
  fueComprimido: boolean;
  fechaSubida: string;
  idUsuarioSubida: string;
  nombreUsuarioSubida: string;
  estado: string;
};

export type ConsultaTransferenciaEvidencia = {
  idPagoVenta: string;
  idVenta: string;
  idCajaDiaria: string;
  fechaOperacion: string;
  numeroVenta: number;
  idUsuarioVendedor: string;
  nombreUsuarioVendedor: string;
  valorPago: number;
  estadoValidacion: string;
  fechaRegistro: string;
  idUsuarioValidacion: string | null;
  nombreUsuarioValidacion: string | null;
  fechaValidacion: string | null;
  observacionValidacion: string | null;
  cantidadEvidencias: number;
};

export type ConsultaGastoCajaEvidencia = {
  idGastoCaja: string;
  idCajaDiaria: string;
  fechaOperacion: string;
  valorGasto: number;
  descripcion: string;
  estadoGasto: string;
  idUsuarioRegistro: string;
  nombreUsuarioRegistro: string;
  fechaRegistro: string;
};

export type ConsultaMovimientoDepositoEvidencia = {
  idMovimientoDeposito: string;
  tipoMovimientoDeposito: string;
  valorMovimiento: number;
  saldoAnterior: number;
  saldoPosterior: number;
  idCierreCaja: string | null;
  idConsignacionBancaria: string | null;
  idPagoServicio: string | null;
  nombreServicio: string | null;
  idUsuarioRegistro: string;
  nombreUsuarioRegistro: string;
  fechaMovimiento: string;
  observacion: string | null;
};
