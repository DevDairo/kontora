package com.kontora.pos.inventario.service;

import com.kontora.pos.caja.domain.CajaDiaria;
import com.kontora.pos.caja.repository.CajaDiariaRepository;
import com.kontora.pos.catalogos.domain.ItemInventario;
import com.kontora.pos.catalogos.domain.TamanoVaso;
import com.kontora.pos.catalogos.repository.ItemInventarioRepository;
import com.kontora.pos.common.exception.ApiException;
import com.kontora.pos.common.security.PrincipalUsuario;
import com.kontora.pos.inventario.domain.ConsumoDiarioInventario;
import com.kontora.pos.inventario.domain.ExistenciaInventarioDiario;
import com.kontora.pos.inventario.domain.ExistenciaInventarioGeneral;
import com.kontora.pos.inventario.domain.MovimientoInventario;
import com.kontora.pos.inventario.domain.PaqueteVasosAbierto;
import com.kontora.pos.inventario.dto.ConsumoDiarioInventarioResponse;
import com.kontora.pos.inventario.dto.ExistenciaInventarioDiarioResponse;
import com.kontora.pos.inventario.dto.ExistenciaInventarioGeneralResponse;
import com.kontora.pos.inventario.dto.MovimientoInventarioResponse;
import com.kontora.pos.inventario.dto.PaqueteVasosAbiertoResponse;
import com.kontora.pos.inventario.dto.RegistrarConsumoDiarioInventarioRequest;
import com.kontora.pos.inventario.dto.RegistrarPaqueteVasosRequest;
import com.kontora.pos.inventario.repository.ConsumoDiarioInventarioRepository;
import com.kontora.pos.inventario.repository.ExistenciaInventarioDiarioRepository;
import com.kontora.pos.inventario.repository.ExistenciaInventarioGeneralRepository;
import com.kontora.pos.inventario.repository.MovimientoInventarioRepository;
import com.kontora.pos.inventario.repository.PaqueteVasosAbiertoRepository;
import com.kontora.pos.usuarios.domain.Usuario;
import com.kontora.pos.usuarios.repository.UsuarioRepository;
import com.kontora.pos.ventas.domain.DetalleVenta;
import com.kontora.pos.ventas.domain.Venta;
import jakarta.persistence.EntityManager;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.OffsetDateTime;
import java.util.List;
import java.util.Locale;
import java.util.UUID;

@Service
public class InventarioService {

    private static final String ESTADO_ACTIVO = "activo";
    private static final String ESTADO_CAJA_ABIERTA = "abierta";
    private static final String TIPO_CONTROL_AUTOMATICO = "automatico_por_venta";
    private static final String TIPO_STOCK_GENERAL = "general";
    private static final String TIPO_STOCK_DIARIO = "diario";
    private static final String MOVIMIENTO_APERTURA_PAQUETE = "apertura_paquete";
    private static final String MOVIMIENTO_PERDIDA = "perdida";
    private static final String MOVIMIENTO_VENTA = "venta";
    private static final String MOVIMIENTO_ANULACION_VENTA = "anulacion_venta";
    private static final String MOVIMIENTO_CONSUMO_DIARIO = "consumo_diario";
    private static final String SENTIDO_ENTRADA = "entrada";
    private static final String SENTIDO_SALIDA = "salida";
    private static final String REFERENCIA_PAQUETES = "paquetes_vasos_abiertos";
    private static final String REFERENCIA_CONSUMOS = "consumos_diarios_inventario";
    private static final String REFERENCIA_VENTAS = "ventas";

    private final CajaDiariaRepository cajaDiariaRepository;
    private final UsuarioRepository usuarioRepository;
    private final ItemInventarioRepository itemInventarioRepository;
    private final ExistenciaInventarioGeneralRepository existenciaGeneralRepository;
    private final ExistenciaInventarioDiarioRepository existenciaDiarioRepository;
    private final MovimientoInventarioRepository movimientoInventarioRepository;
    private final PaqueteVasosAbiertoRepository paqueteVasosAbiertoRepository;
    private final ConsumoDiarioInventarioRepository consumoDiarioInventarioRepository;
    private final EntityManager entityManager;

    public InventarioService(
            CajaDiariaRepository cajaDiariaRepository,
            UsuarioRepository usuarioRepository,
            ItemInventarioRepository itemInventarioRepository,
            ExistenciaInventarioGeneralRepository existenciaGeneralRepository,
            ExistenciaInventarioDiarioRepository existenciaDiarioRepository,
            MovimientoInventarioRepository movimientoInventarioRepository,
            PaqueteVasosAbiertoRepository paqueteVasosAbiertoRepository,
            ConsumoDiarioInventarioRepository consumoDiarioInventarioRepository,
            EntityManager entityManager) {
        this.cajaDiariaRepository = cajaDiariaRepository;
        this.usuarioRepository = usuarioRepository;
        this.itemInventarioRepository = itemInventarioRepository;
        this.existenciaGeneralRepository = existenciaGeneralRepository;
        this.existenciaDiarioRepository = existenciaDiarioRepository;
        this.movimientoInventarioRepository = movimientoInventarioRepository;
        this.paqueteVasosAbiertoRepository = paqueteVasosAbiertoRepository;
        this.consumoDiarioInventarioRepository = consumoDiarioInventarioRepository;
        this.entityManager = entityManager;
    }

    @Transactional(readOnly = true)
    public List<ExistenciaInventarioGeneralResponse> consultarExistenciasGenerales() {
        return existenciaGeneralRepository.findAllConItem().stream()
                .map(this::toResponse)
                .toList();
    }

    @Transactional(readOnly = true)
    public List<ExistenciaInventarioDiarioResponse> consultarExistenciasDiariasCajaAbierta() {
        CajaDiaria cajaDiaria = obtenerCajaAbierta();
        return consultarExistenciasDiariasPorCaja(cajaDiaria.getIdCajaDiaria());
    }

    @Transactional(readOnly = true)
    public List<ExistenciaInventarioDiarioResponse> consultarExistenciasDiariasPorCaja(UUID idCajaDiaria) {
        validarCajaExiste(idCajaDiaria);
        return existenciaDiarioRepository.findByCaja(idCajaDiaria).stream()
                .map(this::toResponse)
                .toList();
    }

    @Transactional(readOnly = true)
    public List<MovimientoInventarioResponse> consultarMovimientos(UUID idCajaDiaria, UUID idItemInventario) {
        List<MovimientoInventario> movimientos;
        if (idCajaDiaria != null && idItemInventario != null) {
            movimientos = movimientoInventarioRepository
                    .findByCajaDiaria_IdCajaDiariaAndItemInventario_IdItemInventarioOrderByFechaMovimientoDesc(
                            idCajaDiaria,
                            idItemInventario);
        } else if (idCajaDiaria != null) {
            movimientos = movimientoInventarioRepository.findByCajaDiaria_IdCajaDiariaOrderByFechaMovimientoDesc(idCajaDiaria);
        } else if (idItemInventario != null) {
            movimientos = movimientoInventarioRepository.findByItemInventario_IdItemInventarioOrderByFechaMovimientoDesc(idItemInventario);
        } else {
            movimientos = movimientoInventarioRepository.findAllByOrderByFechaMovimientoDesc();
        }
        return movimientos.stream().map(this::toResponse).toList();
    }

    @Transactional
    public PaqueteVasosAbiertoResponse registrarPaqueteVasos(
            RegistrarPaqueteVasosRequest request,
            PrincipalUsuario principalUsuario) {
        validarRolGestionInventario(principalUsuario);
        CajaDiaria cajaDiaria = obtenerCajaAbierta();
        Usuario usuario = obtenerUsuario(principalUsuario.idUsuario());
        ItemInventario item = obtenerItemActivo(request.idItemInventario());
        validarItemVasoConPaquetes(item);

        int cantidadPaquetes = request.cantidadPaquetes();
        int unidadesPorPaquete = item.getUnidadesPorPaquete();
        int unidadesGeneradas = cantidadPaquetes * unidadesPorPaquete;
        int unidadesRotas = request.unidadesRotas() == null ? 0 : request.unidadesRotas();
        if (unidadesRotas > unidadesGeneradas) {
            throw new ApiException(HttpStatus.BAD_REQUEST, "unidadesRotas no puede superar las unidades generadas");
        }

        ExistenciaInventarioGeneral existenciaGeneral = obtenerExistenciaGeneralBloqueada(item);
        validarStockSuficiente(existenciaGeneral.getCantidadActual(), unidadesGeneradas, "Stock general insuficiente para abrir paquetes de vasos");

        PaqueteVasosAbierto paquete = new PaqueteVasosAbierto();
        paquete.setCajaDiaria(cajaDiaria);
        paquete.setItemInventario(item);
        paquete.setCantidadPaquetes(cantidadPaquetes);
        paquete.setUnidadesPorPaquete(unidadesPorPaquete);
        paquete.setUnidadesRotas(unidadesRotas);
        paquete.setUsuarioRegistro(usuario);
        paquete.setFechaRegistro(OffsetDateTime.now());

        PaqueteVasosAbierto paqueteGuardado = paqueteVasosAbiertoRepository.saveAndFlush(paquete);
        entityManager.refresh(paqueteGuardado);

        existenciaGeneral.setCantidadActual(existenciaGeneral.getCantidadActual() - unidadesGeneradas);

        ExistenciaInventarioDiario existenciaDiaria = obtenerOCrearExistenciaDiaria(cajaDiaria, item);
        existenciaDiaria.setCantidadIngresada(valor(existenciaDiaria.getCantidadIngresada()) + unidadesGeneradas);
        existenciaDiaria.setCantidadPerdida(valor(existenciaDiaria.getCantidadPerdida()) + unidadesRotas);
        recalcularCantidadFinalTeorica(existenciaDiaria);

        registrarMovimiento(
                item,
                cajaDiaria,
                TIPO_STOCK_GENERAL,
                MOVIMIENTO_APERTURA_PAQUETE,
                unidadesGeneradas,
                SENTIDO_SALIDA,
                REFERENCIA_PAQUETES,
                paqueteGuardado.getIdPaqueteVasosAbierto(),
                "Salida de stock general por apertura de paquetes",
                usuario);
        registrarMovimiento(
                item,
                cajaDiaria,
                TIPO_STOCK_DIARIO,
                MOVIMIENTO_APERTURA_PAQUETE,
                unidadesGeneradas,
                SENTIDO_ENTRADA,
                REFERENCIA_PAQUETES,
                paqueteGuardado.getIdPaqueteVasosAbierto(),
                "Ingreso al stock diario por apertura de paquetes",
                usuario);
        if (unidadesRotas > 0) {
            registrarMovimiento(
                    item,
                    cajaDiaria,
                    TIPO_STOCK_DIARIO,
                    MOVIMIENTO_PERDIDA,
                    unidadesRotas,
                    SENTIDO_SALIDA,
                    REFERENCIA_PAQUETES,
                    paqueteGuardado.getIdPaqueteVasosAbierto(),
                    "Vasos rotos al abrir paquetes",
                    usuario);
        }

        return toResponse(paqueteGuardado);
    }

    @Transactional
    public ConsumoDiarioInventarioResponse registrarConsumoDiario(
            RegistrarConsumoDiarioInventarioRequest request,
            PrincipalUsuario principalUsuario) {
        validarRolGestionInventario(principalUsuario);
        CajaDiaria cajaDiaria = obtenerCajaAbierta();
        Usuario usuario = obtenerUsuario(principalUsuario.idUsuario());
        ItemInventario item = obtenerItemActivo(request.idItemInventario());
        if (TIPO_CONTROL_AUTOMATICO.equals(item.getTipoControl())) {
            throw new ApiException(HttpStatus.BAD_REQUEST, "Los consumos manuales no aplican a items automaticos por venta");
        }

        ExistenciaInventarioGeneral existenciaGeneral = obtenerExistenciaGeneralBloqueada(item);
        validarStockSuficiente(
                existenciaGeneral.getCantidadActual(),
                request.cantidadConsumida(),
                "Stock general insuficiente para registrar consumo diario");

        ConsumoDiarioInventario consumo = new ConsumoDiarioInventario();
        consumo.setCajaDiaria(cajaDiaria);
        consumo.setItemInventario(item);
        consumo.setCantidadConsumida(request.cantidadConsumida());
        consumo.setUsuarioRegistro(usuario);
        consumo.setFechaRegistro(OffsetDateTime.now());
        consumo.setObservacion(normalizarObservacion(request.observacion()));

        ConsumoDiarioInventario consumoGuardado = consumoDiarioInventarioRepository.saveAndFlush(consumo);
        existenciaGeneral.setCantidadActual(existenciaGeneral.getCantidadActual() - request.cantidadConsumida());
        registrarMovimiento(
                item,
                cajaDiaria,
                TIPO_STOCK_GENERAL,
                MOVIMIENTO_CONSUMO_DIARIO,
                request.cantidadConsumida(),
                SENTIDO_SALIDA,
                REFERENCIA_CONSUMOS,
                consumoGuardado.getIdConsumoDiarioInventario(),
                consumoGuardado.getObservacion(),
                usuario);

        return toResponse(consumoGuardado);
    }

    public void descontarVasosPorVenta(Venta venta, List<DetalleVenta> detalles, Usuario usuarioRegistro) {
        for (DetalleVenta detalle : detalles) {
            ItemInventario item = obtenerVasoPorTamano(detalle.getTamanoVaso().getIdTamanoVaso());
            ExistenciaInventarioDiario existenciaDiaria = obtenerExistenciaDiariaBloqueada(
                    venta.getCajaDiaria(),
                    item,
                    "No existe stock diario para el vaso vendido");
            int cantidad = detalle.getCantidad();
            validarStockSuficiente(
                    stockDiarioDisponible(existenciaDiaria),
                    cantidad,
                    "Stock diario insuficiente para registrar la venta");

            existenciaDiaria.setCantidadVendida(valor(existenciaDiaria.getCantidadVendida()) + cantidad);
            recalcularCantidadFinalTeorica(existenciaDiaria);
            registrarMovimiento(
                    item,
                    venta.getCajaDiaria(),
                    TIPO_STOCK_DIARIO,
                    MOVIMIENTO_VENTA,
                    cantidad,
                    SENTIDO_SALIDA,
                    REFERENCIA_VENTAS,
                    venta.getIdVenta(),
                    "Salida automatica por venta",
                    usuarioRegistro);
        }
    }

    public void restaurarVasosPorAnulacion(Venta venta, List<DetalleVenta> detalles, Usuario usuarioRegistro) {
        for (DetalleVenta detalle : detalles) {
            ItemInventario item = obtenerVasoPorTamano(detalle.getTamanoVaso().getIdTamanoVaso());
            ExistenciaInventarioDiario existenciaDiaria = obtenerExistenciaDiariaBloqueada(
                    venta.getCajaDiaria(),
                    item,
                    "No existe stock diario para restaurar la venta anulada");
            int cantidad = detalle.getCantidad();
            if (valor(existenciaDiaria.getCantidadVendida()) < cantidad) {
                throw new ApiException(HttpStatus.CONFLICT, "La anulacion dejaria cantidad_vendida negativa");
            }

            existenciaDiaria.setCantidadVendida(existenciaDiaria.getCantidadVendida() - cantidad);
            recalcularCantidadFinalTeorica(existenciaDiaria);
            registrarMovimiento(
                    item,
                    venta.getCajaDiaria(),
                    TIPO_STOCK_DIARIO,
                    MOVIMIENTO_ANULACION_VENTA,
                    cantidad,
                    SENTIDO_ENTRADA,
                    REFERENCIA_VENTAS,
                    venta.getIdVenta(),
                    "Restauracion de stock diario por anulacion de venta",
                    usuarioRegistro);
        }
    }

    private CajaDiaria obtenerCajaAbierta() {
        return cajaDiariaRepository.findPrimeraPorEstadoCaja(ESTADO_CAJA_ABIERTA)
                .orElseThrow(() -> new ApiException(HttpStatus.CONFLICT, "No existe caja diaria abierta para operar inventario"));
    }

    private void validarCajaExiste(UUID idCajaDiaria) {
        if (!cajaDiariaRepository.existsById(idCajaDiaria)) {
            throw new ApiException(HttpStatus.NOT_FOUND, "No existe caja diaria para consultar inventario");
        }
    }

    private Usuario obtenerUsuario(UUID idUsuario) {
        return usuarioRepository.findById(idUsuario)
                .orElseThrow(() -> new ApiException(HttpStatus.UNAUTHORIZED, "Usuario autenticado no encontrado"));
    }

    private ItemInventario obtenerItemActivo(UUID idItemInventario) {
        ItemInventario item = itemInventarioRepository.findById(idItemInventario)
                .orElseThrow(() -> new ApiException(HttpStatus.BAD_REQUEST, "Item de inventario no encontrado"));
        if (!ESTADO_ACTIVO.equals(item.getEstado())) {
            throw new ApiException(HttpStatus.BAD_REQUEST, "Item de inventario inactivo");
        }
        return item;
    }

    private ItemInventario obtenerVasoPorTamano(UUID idTamanoVaso) {
        return itemInventarioRepository.findVasoActivoPorTamano(idTamanoVaso)
                .orElseThrow(() -> new ApiException(HttpStatus.BAD_REQUEST, "No existe item de inventario activo para el tamano de vaso vendido"));
    }

    private void validarItemVasoConPaquetes(ItemInventario item) {
        if (!TIPO_CONTROL_AUTOMATICO.equals(item.getTipoControl())
                || !item.isManejaPaquetes()
                || item.getTamanoVaso() == null
                || item.getUnidadesPorPaquete() == null
                || item.getUnidadesPorPaquete() <= 0) {
            throw new ApiException(HttpStatus.BAD_REQUEST, "Solo vasos con paquetes pueden registrarse como paquete abierto");
        }
    }

    private void validarRolGestionInventario(PrincipalUsuario principalUsuario) {
        String rol = principalUsuario.nombreRol().toLowerCase(Locale.ROOT);
        if (!"administrador".equals(rol) && !"gerente".equals(rol)) {
            throw new ApiException(HttpStatus.FORBIDDEN, "Solo administrador o gerente puede modificar inventario operativo");
        }
    }

    private ExistenciaInventarioGeneral obtenerExistenciaGeneralBloqueada(ItemInventario item) {
        return existenciaGeneralRepository.findByItemForUpdate(item.getIdItemInventario())
                .orElseThrow(() -> new ApiException(HttpStatus.CONFLICT, "No existe existencia general para el item de inventario"));
    }

    private ExistenciaInventarioDiario obtenerOCrearExistenciaDiaria(CajaDiaria cajaDiaria, ItemInventario item) {
        return existenciaDiarioRepository.findByCajaAndItemForUpdate(
                        cajaDiaria.getIdCajaDiaria(),
                        item.getIdItemInventario())
                .orElseGet(() -> nuevaExistenciaDiaria(cajaDiaria, item));
    }

    private ExistenciaInventarioDiario obtenerExistenciaDiariaBloqueada(CajaDiaria cajaDiaria, ItemInventario item, String mensaje) {
        return existenciaDiarioRepository.findByCajaAndItemForUpdate(
                        cajaDiaria.getIdCajaDiaria(),
                        item.getIdItemInventario())
                .orElseThrow(() -> new ApiException(HttpStatus.CONFLICT, mensaje));
    }

    private ExistenciaInventarioDiario nuevaExistenciaDiaria(CajaDiaria cajaDiaria, ItemInventario item) {
        ExistenciaInventarioDiario existenciaDiaria = new ExistenciaInventarioDiario();
        existenciaDiaria.setCajaDiaria(cajaDiaria);
        existenciaDiaria.setItemInventario(item);
        existenciaDiaria.setCantidadInicial(0);
        existenciaDiaria.setCantidadIngresada(0);
        existenciaDiaria.setCantidadVendida(0);
        existenciaDiaria.setCantidadPerdida(0);
        existenciaDiaria.setCantidadAjustada(0);
        existenciaDiaria.setCantidadFinalTeorica(0);
        return existenciaDiarioRepository.saveAndFlush(existenciaDiaria);
    }

    private void validarStockSuficiente(Integer cantidadActual, int cantidadRequerida, String mensaje) {
        if (valor(cantidadActual) < cantidadRequerida) {
            throw new ApiException(HttpStatus.CONFLICT, mensaje);
        }
    }

    private int stockDiarioDisponible(ExistenciaInventarioDiario existenciaDiaria) {
        return valor(existenciaDiaria.getCantidadFinalTeorica());
    }

    private void recalcularCantidadFinalTeorica(ExistenciaInventarioDiario existenciaDiaria) {
        int cantidadFinal = valor(existenciaDiaria.getCantidadInicial())
                + valor(existenciaDiaria.getCantidadIngresada())
                - valor(existenciaDiaria.getCantidadVendida())
                - valor(existenciaDiaria.getCantidadPerdida())
                + valor(existenciaDiaria.getCantidadAjustada());
        if (cantidadFinal < 0) {
            throw new ApiException(HttpStatus.CONFLICT, "El movimiento dejaria stock diario negativo");
        }
        existenciaDiaria.setCantidadFinalTeorica(cantidadFinal);
    }

    private MovimientoInventario registrarMovimiento(
            ItemInventario item,
            CajaDiaria cajaDiaria,
            String tipoStock,
            String tipoMovimiento,
            int cantidad,
            String sentido,
            String referenciaOrigen,
            UUID idReferenciaOrigen,
            String observacion,
            Usuario usuario) {
        if (referenciaOrigen == null || referenciaOrigen.isBlank() || idReferenciaOrigen == null) {
            throw new IllegalStateException("Los movimientos de inventario requieren referencia de origen");
        }
        MovimientoInventario movimiento = new MovimientoInventario();
        movimiento.setItemInventario(item);
        movimiento.setCajaDiaria(cajaDiaria);
        movimiento.setTipoStock(tipoStock);
        movimiento.setTipoMovimiento(tipoMovimiento);
        movimiento.setCantidad(cantidad);
        movimiento.setSentidoMovimiento(sentido);
        movimiento.setReferenciaOrigen(referenciaOrigen);
        movimiento.setIdReferenciaOrigen(idReferenciaOrigen);
        movimiento.setObservacion(normalizarObservacion(observacion));
        movimiento.setUsuarioRegistro(usuario);
        movimiento.setFechaMovimiento(OffsetDateTime.now());
        return movimientoInventarioRepository.save(movimiento);
    }

    private String normalizarObservacion(String observacion) {
        if (observacion == null || observacion.isBlank()) {
            return null;
        }
        return observacion.trim();
    }

    private int valor(Integer valor) {
        return valor == null ? 0 : valor;
    }

    private ExistenciaInventarioGeneralResponse toResponse(ExistenciaInventarioGeneral existencia) {
        ItemInventario item = existencia.getItemInventario();
        TamanoVaso tamanoVaso = item.getTamanoVaso();
        return new ExistenciaInventarioGeneralResponse(
                existencia.getIdExistenciaGeneral(),
                item.getIdItemInventario(),
                item.getNombreItem(),
                item.getTipoControl(),
                tamanoVaso == null ? null : tamanoVaso.getIdTamanoVaso(),
                tamanoVaso == null ? null : tamanoVaso.getOnzas(),
                existencia.getCantidadActual(),
                existencia.getFechaActualizacion());
    }

    private ExistenciaInventarioDiarioResponse toResponse(ExistenciaInventarioDiario existencia) {
        ItemInventario item = existencia.getItemInventario();
        TamanoVaso tamanoVaso = item.getTamanoVaso();
        return new ExistenciaInventarioDiarioResponse(
                existencia.getIdExistenciaDiaria(),
                existencia.getCajaDiaria().getIdCajaDiaria(),
                item.getIdItemInventario(),
                item.getNombreItem(),
                tamanoVaso == null ? null : tamanoVaso.getIdTamanoVaso(),
                tamanoVaso == null ? null : tamanoVaso.getOnzas(),
                existencia.getCantidadInicial(),
                existencia.getCantidadIngresada(),
                existencia.getCantidadVendida(),
                existencia.getCantidadPerdida(),
                existencia.getCantidadAjustada(),
                existencia.getCantidadFinalTeorica(),
                existencia.getCantidadFinalContada(),
                existencia.getDiferencia());
    }

    private MovimientoInventarioResponse toResponse(MovimientoInventario movimiento) {
        return new MovimientoInventarioResponse(
                movimiento.getIdMovimientoInventario(),
                movimiento.getItemInventario().getIdItemInventario(),
                movimiento.getItemInventario().getNombreItem(),
                movimiento.getCajaDiaria() == null ? null : movimiento.getCajaDiaria().getIdCajaDiaria(),
                movimiento.getTipoStock(),
                movimiento.getTipoMovimiento(),
                movimiento.getCantidad(),
                movimiento.getSentidoMovimiento(),
                movimiento.getReferenciaOrigen(),
                movimiento.getIdReferenciaOrigen(),
                movimiento.getObservacion(),
                movimiento.getUsuarioRegistro().getIdUsuario(),
                movimiento.getUsuarioRegistro().getNombreUsuario(),
                movimiento.getFechaMovimiento());
    }

    private PaqueteVasosAbiertoResponse toResponse(PaqueteVasosAbierto paquete) {
        return new PaqueteVasosAbiertoResponse(
                paquete.getIdPaqueteVasosAbierto(),
                paquete.getCajaDiaria().getIdCajaDiaria(),
                paquete.getItemInventario().getIdItemInventario(),
                paquete.getItemInventario().getNombreItem(),
                paquete.getCantidadPaquetes(),
                paquete.getUnidadesPorPaquete(),
                paquete.getUnidadesGeneradas(),
                paquete.getUnidadesRotas(),
                paquete.getUnidadesDisponibles(),
                paquete.getUsuarioRegistro().getIdUsuario(),
                paquete.getUsuarioRegistro().getNombreUsuario(),
                paquete.getFechaRegistro());
    }

    private ConsumoDiarioInventarioResponse toResponse(ConsumoDiarioInventario consumo) {
        return new ConsumoDiarioInventarioResponse(
                consumo.getIdConsumoDiarioInventario(),
                consumo.getCajaDiaria().getIdCajaDiaria(),
                consumo.getItemInventario().getIdItemInventario(),
                consumo.getItemInventario().getNombreItem(),
                consumo.getCantidadConsumida(),
                consumo.getUsuarioRegistro().getIdUsuario(),
                consumo.getUsuarioRegistro().getNombreUsuario(),
                consumo.getFechaRegistro(),
                consumo.getObservacion());
    }
}
