// --- IMPORTACIONES Y DEPENDENCIAS GLOBALES ---
import { Motor } from './simulacion/Motor.js';
import { Servidor } from './simulacion/componentes/Servidor.js';
import { Cola } from './simulacion/componentes/Cola.js';
import { Renderizador } from './graficos/Renderizador.js';
import { TablaDatos } from './interfaz/TablaDatos.js';
import { Menu } from './interfaz/Menu.js';
import { coloresColas } from './config/escenarios.js';

const motor = new Motor();
const renderizador = new Renderizador('lienzoSimulacion');
const tabla = new TablaDatos('cabeceraTabla', 'cuerpoTabla');
const menu = new Menu();

let cfgGlobal = null;
let arregloColas = [];
let servidores = [];
let contadorIdGlobal = 0;
let estadisticas = { atendidos: 0, abandonos: 0, descansosIniciados: 0 };

// --- Generar distribucion ---
function procesarDistribucion(gen, permitirCero = false) {
    if (!gen || gen.tipo === 'desactivado') return null;
    let tiempo = 0; 
    
    if (gen.tipo === 'constante') {
        tiempo = gen.params.val; 
    } 
    else if (gen.tipo === 'uniforme') {
        tiempo = gen.params.min + Math.random() * (gen.params.max - gen.params.min);
    } 
    else if (gen.tipo === 'normal') {
        let u = 0, v = 0;
        while (u === 0) u = Math.random();
        while (v === 0) v = Math.random();
        
        let z = Math.sqrt(-2.0 * Math.log(u)) * Math.cos(2.0 * Math.PI * v);
        tiempo = gen.params.media + z * gen.params.desvio;
    }
    
    return permitirCero ? Math.max(0, Math.round(tiempo)) : Math.max(1, Math.round(tiempo));
}

// --- LÓGICA DE ASIGNACIÓN  ---
function despertarServidor(idCola) {
    const cola = arregloColas[idCola];   
    if (!cola || cola.cantidad === 0) return;

    let srvLibre = null;   

    if (cfgGlobal.sistema.modoAsignacion === 'independiente' || cfgGlobal.sistema.modoAsignacion === 'serie') {
        srvLibre = servidores.find(s => 
            s.id === idCola && !s.ocupado && !s.zonaSeguridad && s.habilitado
        );
    } else {
        srvLibre = servidores.find(s => 
            !s.ocupado && !s.zonaSeguridad && s.habilitado
        );
    }

    if (srvLibre) {                    
        const proxCliente = cola.obtenerSiguiente(); 
        if (proxCliente) {             
            const cfgSrv = cfgGlobal.servidores[srvLibre.id]; 
            const tTransito = procesarDistribucion(cfgSrv.transito);

            if (tTransito) {                    
                srvLibre.zonaSeguridad = true; 
                srvLibre.clienteEnZona = proxCliente;
                motor.agregarEvento(motor.tiempoActual + tTransito, 'LLEGADA_PS', { idServidor: srvLibre.id });
            } else {
                srvLibre.ocupado = true; 
                srvLibre.clienteActual = proxCliente;
                const tServicio = procesarDistribucion(cfgSrv.servicio);
                motor.agregarEvento(motor.tiempoActual + tServicio, 'FIN_SERVICIO', { idServidor: srvLibre.id });
            }
        }
    }
}   

function programarFinDescanso(idServidor) {
    const cfgSrv = cfgGlobal.servidores[idServidor]; 
    const tDescanso = procesarDistribucion(cfgSrv.descanso);
    
    if (tDescanso) {
        motor.agregarEvento(motor.tiempoActual + tDescanso, 'FIN_DESCANSO', { idServidor: idServidor });
        estadisticas.descansosIniciados++;
    } 
    else {
        const s = servidores.find(x => x.id === idServidor);
        if (s) s.habilitado = true;
    }
}

// --- ACTUALIZACIÓN DE ESTADÍSTICAS ---
function registrarFilaTabla(eventoStr) {
    let llegadas = [], finalizados = [], cantidadCola = [], ocupacion = [], disponibilidad = [];
    
    cfgGlobal.colas.forEach((configCola, i) => {
        llegadas.push(motor.obtenerTiempoProx('LLEGADA', i) || "-");
        cantidadCola.push(arregloColas[i].cantidad);   
    });

    servidores.forEach(servidorActual => {
        let eventoFin = motor.obtenerTiempoProx('FIN_SERVICIO', servidorActual.id);
        finalizados.push(eventoFin || "-");           
        ocupacion.push(servidorActual.ocupado ? 1 : 0);       
        disponibilidad.push(!servidorActual.ocupado && servidorActual.habilitado ? 1 : 0); 
    });

    const usarTransito = cfgGlobal.servidores.some(servidorActual => servidorActual.transito.tipo !== 'desactivado');

    tabla.agregarFila(
        motor.tiempoActual, eventoStr, llegadas, finalizados,
        cantidadCola, ocupacion, disponibilidad,
        arregloColas, servidores, usarTransito
    );
}

function dibujarPantalla() {
    renderizador.dibujarEscena(motor.tiempoActual, [...arregloColas, ...servidores], tabla.formatearHora(motor.tiempoActual));
    const totalEnCola = arregloColas.reduce((acc, cola) => acc + cola.cantidad, 0);

    document.getElementById('listaEstadisticas').innerHTML = `
        <li>En Cola (Total Sistema): <strong style="color:#f39c12;">${totalEnCola}</strong></li>
        <li>Atendidos (Finalizados): <strong>${estadisticas.atendidos}</strong></li>
        <li>Abandonos (Descartados): <strong style="color:#e74c3c;">${estadisticas.abandonos}</strong></li>
        <li>Descansos tomados: <strong>${estadisticas.descansosIniciados || 0}</strong></li>
    `;
}

// --- INICIALIZACIÓN DE LA SIMULACIÓN ---
function inicializarSimulacion() {
    tabla.limpiarTabla();
    cfgGlobal = menu.obtenerConfiguracion();
    
    let horaInicio = cfgGlobal.sistema.horaInicio === 0 ? 28800 : cfgGlobal.sistema.horaInicio;
    motor.reiniciar(horaInicio);
    
    arregloColas = []; servidores = [];
    estadisticas = { atendidos: 0, abandonos: 0, descansosIniciados: 0 };
    contadorIdGlobal = 0;

    const modo = cfgGlobal.sistema.modoAsignacion;
    tabla.configurarColumnas(cfgGlobal.sistema.numColas, cfgGlobal.sistema.numServidores);

    cfgGlobal.colas.forEach((c, i) => {
        let nuevaCola = new Cola(i, 200, 80 + (i * 60), c.prioridad);
        if (c.clientesIniciales > 0 && !(modo === 'serie' && i > 0)) {
            for(let j=0; j<c.clientesIniciales; j++) {
                nuevaCola.agregar({ id: ++contadorIdGlobal, tLlegada: motor.tiempoActual, color: coloresColas[i % coloresColas.length] });
            }
        }
        arregloColas.push(nuevaCola);
    });
    
    if (cfgGlobal.sistema.horaInicio === 0) {
        arregloColas[0].agregar({ id: ++contadorIdGlobal, tLlegada: motor.tiempoActual, color: coloresColas[0] });
    }

    cfgGlobal.servidores.forEach((s, i) => {
        let nuevoSrv = new Servidor(i, 420, 80 + (i * 60));
        nuevoSrv.usaZonaSeguridad = s.transito.tipo !== 'desactivado';
        
        let idxColaAsociada = (modo === 'independiente' || modo === 'serie') ? i : 0;
        let cfgColaAsociada = cfgGlobal.colas[idxColaAsociada];

        if (cfgColaAsociada && cfgColaAsociada.esperaPrevia > 0) {
            nuevoSrv.ocupado = true;
            nuevoSrv.clienteActual = { id: 'Ficticio', color: '#95a5a6', esFicticio: true }; 
            motor.agregarEvento(motor.tiempoActual + cfgColaAsociada.esperaPrevia, 'FIN_SERVICIO', { idServidor: nuevoSrv.id });
        }

        servidores.push(nuevoSrv);
        
        const tTrabajo = procesarDistribucion(s.trabajo);
        if (tTrabajo) motor.agregarEvento(motor.tiempoActual + tTrabajo, 'FIN_TRABAJO', { idServidor: nuevoSrv.id });
    });

    cfgGlobal.colas.forEach((c, i) => {
        if (!(modo === 'serie' && i > 0)) {
            let tLlegadaInicial = procesarDistribucion(c.llegada);
            if (tLlegadaInicial) {
                let tiempoDesplazado = motor.tiempoActual + (c.esperaPrevia || 0) + tLlegadaInicial;
                motor.agregarEvento(tiempoDesplazado, 'LLEGADA', { idCola: i });
            }
        }
    });

    if (modo === 'compartido') {
        let colasOrdenadas = [...arregloColas].sort((a,b) => a.prioridad - b.prioridad);
        colasOrdenadas.forEach(cola => {
            while (cola.cantidad > 0 && servidores.some(s => !s.ocupado && !s.zonaSeguridad && s.habilitado)) {
                despertarServidor(cola.idConfig);
            }
        });
    } else {
        arregloColas.forEach(cola => despertarServidor(cola.idConfig));
    }

    registrarFilaTabla("INICIO");
    dibujarPantalla();
}

// --- MÁQUINA DE ESTADOS FINITOS (EVENT LOOP) ---
function procesarSiguienteEvento() {
    const evento = motor.siguienteEvento();
    if (!evento || evento.tiempo > cfgGlobal.sistema.horaFin) {
        alert("Simulación terminada."); return false; 
    }

    const t = evento.tiempo;
    let tipoStr = evento.tipo;

    if (evento.tipo === 'LLEGADA') {
        const idC = evento.idCola;
        tipoStr += ` (C${idC + 1})`;
        
        const nuevoCliente = { id: ++contadorIdGlobal, tLlegada: t, color: arregloColas[idC].color };
        arregloColas[idC].agregar(nuevoCliente);

        const tAbandono = procesarDistribucion(cfgGlobal.colas[idC].tolerancia);
        if (tAbandono) motor.agregarEvento(t + tAbandono, 'ABANDONO', { idCola: idC, idCliente: nuevoCliente.id });

        const tProxLleg = procesarDistribucion(cfgGlobal.colas[idC].llegada);
        if (tProxLleg) motor.agregarEvento(t + tProxLleg, 'LLEGADA', { idCola: idC });

        despertarServidor(idC);
    } 
    else if (evento.tipo === 'LLEGADA_PS') {
        const idS = evento.idServidor;
        tipoStr += ` (PS${idS + 1})`; 
        const srv = servidores.find(s => s.id === idS);
        
        srv.zonaSeguridad = false;
        srv.ocupado = true;
        srv.clienteActual = srv.clienteEnZona;
        srv.clienteEnZona = null;
        
        const tServ = procesarDistribucion(cfgGlobal.servidores[idS].servicio);
        motor.agregarEvento(t + tServ, 'FIN_SERVICIO', { idServidor: idS });
    }
    else if (evento.tipo === 'FIN_SERVICIO') {
        const idS = evento.idServidor;
        tipoStr += ` (PS${idS + 1})`; 
        const srv = servidores.find(s => s.id === idS);
        
        const clienteTerminado = srv.clienteActual;
        srv.ocupado = false;
        srv.clienteActual = null;
        
        if (!clienteTerminado.esFicticio) estadisticas.atendidos++;

        const modo = cfgGlobal.sistema.modoAsignacion;
        if (modo === 'serie') {
            const proxIdx = srv.id + 1; 
            if (proxIdx < cfgGlobal.sistema.numColas && !clienteTerminado.esFicticio) {
                arregloColas[proxIdx].agregar(clienteTerminado);
                const tAb = procesarDistribucion(cfgGlobal.colas[proxIdx].tolerancia);
                if(tAb) motor.agregarEvento(t + tAb, 'ABANDONO', { idCola: proxIdx, idCliente: clienteTerminado.id });
                despertarServidor(proxIdx);
            }
        }

        if (!srv.habilitado) {
            programarFinDescanso(srv.id);
        } else {
            if (modo === 'compartido') {
                let colasOrdenadas = [...arregloColas].sort((a,b) => a.prioridad - b.prioridad);
                for(let cola of colasOrdenadas) {
                    if (cola.cantidad > 0) { despertarServidor(cola.idConfig); break; }
                }
            } else {
                despertarServidor(srv.id);
            }
        }
    }
    else if (evento.tipo === 'ABANDONO') {
        const cola = arregloColas[evento.idCola];
        tipoStr += ` (C${evento.idCola + 1})`;
        if (cola.eliminarPorId(evento.idCliente)) estadisticas.abandonos++;
    }
    else if (evento.tipo === 'FIN_TRABAJO') {
        const idS = evento.idServidor;
        tipoStr += ` (PS${idS + 1})`;
        const srv = servidores.find(s => s.id === idS);
        srv.habilitado = false;
        if (!srv.ocupado && !srv.zonaSeguridad) {
            programarFinDescanso(srv.id);
        }
    }
    else if (evento.tipo === 'FIN_DESCANSO') {
        const idS = evento.idServidor;
        tipoStr += ` (PS${idS + 1})`;
        const srv = servidores.find(s => s.id === idS);
        srv.habilitado = true;
        
        const tTr = procesarDistribucion(cfgGlobal.servidores[idS].trabajo);
        if (tTr) motor.agregarEvento(t + tTr, 'FIN_TRABAJO', { idServidor: srv.id });

        const modo = cfgGlobal.sistema.modoAsignacion;
        if (modo === 'compartido') {
            let colasOrdenadas = [...arregloColas].sort((a,b) => a.prioridad - b.prioridad);
            for(let cola of colasOrdenadas) {
                if (cola.cantidad > 0) { despertarServidor(cola.idConfig); break; }
            }
        } else {
            despertarServidor(srv.id);
        }
    }

    registrarFilaTabla(tipoStr);
    dibujarPantalla();
    return true; 
}

// --- BINDEOS DE EVENTOS ---
document.getElementById('btnReiniciar').addEventListener('click', inicializarSimulacion);
document.getElementById('btnPasoAPaso').addEventListener('click', () => { 
    if(cfgGlobal) procesarSiguienteEvento(); 
    else inicializarSimulacion(); 
});
document.getElementById('btnSimularTodo').addEventListener('click', () => {
    if(!cfgGlobal) inicializarSimulacion();
    while (procesarSiguienteEvento()) {} 
});
window.onload = () => inicializarSimulacion();