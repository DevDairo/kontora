import { apiClient } from "../../../shared/services/apiClient";
import type { ArchivoEvidenciaResponse } from "../types";

export function cargarEvidenciaPagoVenta(token: string, idPagoVenta: string, archivo: File) {
  const formData = new FormData();
  formData.append("archivo", archivo);

  return apiClient.post<ArchivoEvidenciaResponse>(
    `/evidencias/pagos-venta/${encodeURIComponent(idPagoVenta)}`,
    formData,
    { token },
  );
}

export function cargarAjusteEvidenciaPagoVenta(token: string, idPagoVenta: string, archivo: File) {
  const formData = new FormData();
  formData.append("archivo", archivo);

  return apiClient.post<ArchivoEvidenciaResponse>(
    `/evidencias/pagos-venta/${encodeURIComponent(idPagoVenta)}/ajustes`,
    formData,
    { token },
  );
}

export function cargarEvidenciaGastoCaja(token: string, idGastoCaja: string, archivo: File) {
  const formData = new FormData();
  formData.append("archivo", archivo);

  return apiClient.post<ArchivoEvidenciaResponse>(
    `/evidencias/gastos-caja/${encodeURIComponent(idGastoCaja)}`,
    formData,
    { token },
  );
}

export function cargarEvidenciaConsignacionBancaria(token: string, idConsignacionBancaria: string, archivo: File) {
  const formData = new FormData();
  formData.append("archivo", archivo);

  return apiClient.post<ArchivoEvidenciaResponse>(
    `/evidencias/consignaciones-bancarias/${encodeURIComponent(idConsignacionBancaria)}`,
    formData,
    { token },
  );
}

export function cargarEvidenciaPagoServicio(token: string, idPagoServicio: string, archivo: File) {
  const formData = new FormData();
  formData.append("archivo", archivo);

  return apiClient.post<ArchivoEvidenciaResponse>(
    `/evidencias/pagos-servicios/${encodeURIComponent(idPagoServicio)}`,
    formData,
    { token },
  );
}

export function listarEvidenciasPagoVenta(token: string, idPagoVenta: string) {
  return apiClient.get<ArchivoEvidenciaResponse[]>(
    `/evidencias/pagos-venta/${encodeURIComponent(idPagoVenta)}`,
    { token },
  );
}

export function listarEvidenciasGastoCaja(token: string, idGastoCaja: string) {
  return apiClient.get<ArchivoEvidenciaResponse[]>(
    `/evidencias/gastos-caja/${encodeURIComponent(idGastoCaja)}`,
    { token },
  );
}

export function listarEvidenciasConsignacionBancaria(token: string, idConsignacionBancaria: string) {
  return apiClient.get<ArchivoEvidenciaResponse[]>(
    `/evidencias/consignaciones-bancarias/${encodeURIComponent(idConsignacionBancaria)}`,
    { token },
  );
}

export function listarEvidenciasPagoServicio(token: string, idPagoServicio: string) {
  return apiClient.get<ArchivoEvidenciaResponse[]>(
    `/evidencias/pagos-servicios/${encodeURIComponent(idPagoServicio)}`,
    { token },
  );
}

export function descargarEvidencia(token: string, idArchivoEvidencia: string) {
  return apiClient.getBlob(
    `/evidencias/${encodeURIComponent(idArchivoEvidencia)}/descargar`,
    { token },
  );
}
