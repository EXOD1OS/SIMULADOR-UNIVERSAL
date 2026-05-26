import { Motor } from './simulacion/Motor.js';
import { Servidor } from './simulacion/componentes/Servidor.js';
import { Cola } from './simulacion/componentes/Cola.js';
import { Renderizador } from './graficos/Renderizador.js';
import { TablaDatos } from './interfaz/TablaDatos.js';
import { Menu } from './interfaz/Menu.js';

const motor = new Motor();
const renderizador = new Renderizador('lienzoSimulacion');
const tabla = new TablaDatos('cabeceraTabla', 'cuerpoTabla');
const menu = new Menu();

let cfgGlobal = null;
let arregloColas = [];
let servidores = [];
let contadorIdGlobal = 0; 

function procesarDistribucion(gen) {
    if (!gen || gen.tipo === 'desactivado') return null;
    let tiempo = 0;
    if (gen.tipo === 'constante') tiempo = gen.params.val;
    else if (gen.tipo === 'uniforme') tiempo = gen.params.min + Math.random() * (gen.params.max - gen.params.min);
    else if (gen.tipo === 'normal') {
        let u = 0, v = 0; while(u === 0) u = Math.random(); while(v === 0) v = Math.random();
        let z = Math.sqrt(-2.0 * Math.log(u)) * Math.cos(2.0 * Math.PI * v);
        tiempo = gen.params.media + z * gen.params.desvio;
    }
    return Math.max(1, Math.round(tiempo)); 
}

function obtenerClienteMayorPrioridad() {
    let mejorCola = null; let mejorPrioridad = Infinity;
    arregloColas.forEach(c => {
        if (c.cantidad > 0 && c.prioridad < mejorPrioridad) { mejorPrioridad = c.prioridad; mejorCola = c; }
    });
    return mejorCola ? mejorCola.obtenerSiguiente() : null;
}

function procesarEvento(evento) {
    if (evento.tipo === 'LLEGADA') {
        const idC = evento.idCola;
        const colaDestino = arregloColas[idC];
        contadorIdGlobal++;
        const nuevoCliente = { id: contadorIdGlobal, idCola: idC, color: colaDestino.color };
        
        const srvLibre = servidores.find(s => !s.ocupado && !s.zonaSeguridad && s.habilitado);
        
        if (srvLibre) {
            const tTransito = procesarDistribucion(cfgGlobal.generadores.transito);
            if (tTransito) {
                srvLibre.zonaSeguridad = true;
                srvLibre.clienteEnZona = nuevoCliente;
                motor.agregarEvento(motor.tiempoActual + tTransito, 'LLEGADA_PS', { idServidor: srvLibre.id });
            } else {
                srvLibre.ocupado = true;
                srvLibre.clienteActual = nuevoCliente;
                motor.agregarEvento(motor.tiempoActual + procesarDistribucion(cfgGlobal.generadores.servicio), 'FIN_SERVICIO', { idServidor: srvLibre.id });
            }
        } else {
            colaDestino.agregar(nuevoCliente);
            const tTolerancia = procesarDistribucion(cfgGlobal.generadores.tolerancia);
            if (tTolerancia) motor.agregarEvento(motor.tiempoActual + tTolerancia, 'ABANDONO', { idCliente: nuevoCliente.id });
        }
        
        motor.agregarEvento(motor.tiempoActual + procesarDistribucion(cfgGlobal.colas[idC].llegada), 'LLEGADA', { idCola: idC });
    } 
    else if (evento.tipo === 'LLEGADA_PS') {
        const srv = servidores.find(s => s.id === evento.idServidor);
        if (srv) {
            srv.zonaSeguridad = false;
            srv.ocupado = true;
            srv.clienteActual = srv.clienteEnZona;
            srv.clienteEnZona = null;
            motor.agregarEvento(motor.tiempoActual + procesarDistribucion(cfgGlobal.generadores.servicio), 'FIN_SERVICIO', { idServidor: srv.id });
        }
    }
    else if (evento.tipo === 'ABANDONO') {
        arregloColas.forEach(c => c.eliminarPorId(evento.idCliente));
    }
    else if (evento.tipo === 'FIN_SERVICIO') {
        const srv = servidores.find(s => s.id === evento.idServidor);
        if (srv && srv.habilitado) {
            const proxCliente = obtenerClienteMayorPrioridad();
            if (proxCliente) {
                const tTransito = procesarDistribucion(cfgGlobal.generadores.transito);
                if (tTransito) {
                    srv.ocupado = false;
                    srv.clienteActual = null;
                    srv.zonaSeguridad = true;
                    srv.clienteEnZona = proxCliente;
                    motor.agregarEvento(motor.tiempoActual + tTransito, 'LLEGADA_PS', { idServidor: srv.id });
                } else {
                    srv.clienteActual = proxCliente;
                    motor.agregarEvento(motor.tiempoActual + procesarDistribucion(cfgGlobal.generadores.servicio), 'FIN_SERVICIO', { idServidor: srv.id });
                }
            } else {
                srv.ocupado = false; srv.clienteActual = null;
            }
        } else if (srv) {
            srv.ocupado = false; srv.clienteActual = null;
        }
    }
    else if (evento.tipo === 'SALIDA_SERVIDOR') {
        const srv = servidores.find(s => s.id === evento.idServidor);
        srv.habilitado = false; 
        motor.agregarEvento(motor.tiempoActual + procesarDistribucion(cfgGlobal.generadores.descanso), 'LLEGADA_SERVIDOR', { idServidor: srv.id });
    }
    else if (evento.tipo === 'LLEGADA_SERVIDOR') {
        const srv = servidores.find(s => s.id === evento.idServidor);
        srv.habilitado = true; 
        
        const proxCliente = obtenerClienteMayorPrioridad();
        if (proxCliente && !srv.ocupado && !srv.zonaSeguridad) {
            const tTransito = procesarDistribucion(cfgGlobal.generadores.transito);
            if (tTransito) {
                srv.zonaSeguridad = true;
                srv.clienteEnZona = proxCliente;
                motor.agregarEvento(motor.tiempoActual + tTransito, 'LLEGADA_PS', { idServidor: srv.id });
            } else {
                srv.ocupado = true;
                srv.clienteActual = proxCliente;
                motor.agregarEvento(motor.tiempoActual + procesarDistribucion(cfgGlobal.generadores.servicio), 'FIN_SERVICIO', { idServidor: srv.id });
            }
        }
        motor.agregarEvento(motor.tiempoActual + procesarDistribucion(cfgGlobal.generadores.trabajo), 'SALIDA_SERVIDOR', { idServidor: srv.id });
    }
}

function registrarEstado(eventoActual) {
    renderizador.dibujarEscena(motor.tiempoActual, [...arregloColas, ...servidores], tabla.formatearHora(motor.tiempoActual));
    
    let fila = [ motor.tiempoActual, eventoActual ? eventoActual.tipo : "INICIO" ];
    
    arregloColas.forEach(c => fila.push(motor.obtenerTiempoProx('LLEGADA', c.idConfig) || "-"));
    
    const transitoActivo = cfgGlobal.generadores.transito.tipo !== 'desactivado';
    if (transitoActivo) fila.push(motor.obtenerTiempoProx('LLEGADA_PS') || "-");
    
    fila.push(motor.obtenerTiempoProx('FIN_SERVICIO') || "-");
    if(cfgGlobal.generadores.tolerancia.tipo !== 'desactivado') fila.push(motor.obtenerTiempoProx('ABANDONO') || "-");
    
    arregloColas.forEach(c => fila.push(c.cantidad));
    fila.push(servidores.map(s => s.ocupado ? '1' : '0').join(' | '));

    tabla.agregarFila(fila, arregloColas, servidores, transitoActivo);
}

function inicializarEscenario() {
    cfgGlobal = menu.obtenerConfiguracion();
    motor.reiniciar(cfgGlobal.sistema.horaInicio);
    
    arregloColas = []; servidores = []; contadorIdGlobal = 0;
    const transitoActivo = cfgGlobal.generadores.transito.tipo !== 'desactivado';

    // 1. Instanciar Colas
    for(let i=0; i < cfgGlobal.sistema.numColas; i++) {
        arregloColas.push(new Cola(i, 250, 100 + (i * 45), cfgGlobal.colas[i].prioridad));
    }
    
    // 2. Instanciar Servidores
    const nSrv = cfgGlobal.sistema.numServidores;
    for(let i=0; i < nSrv; i++) {
        const srv = new Servidor(i+1, 400, 100 + (i * 60));
        srv.usaZonaSeguridad = transitoActivo; 
        servidores.push(srv);
    }

    // 3. Preparar la tabla
    let cabeceras = ["Reloj", "Evento"];
    arregloColas.forEach((c,i) => cabeceras.push(`Prx Lleg C${i+1}`));
    if (transitoActivo) cabeceras.push("Lleg. al PS (ZS)");
    cabeceras.push("Prox. Fin");
    if(cfgGlobal.generadores.tolerancia.tipo !== 'desactivado') cabeceras.push("Prx Abandono");
    arregloColas.forEach((c,i) => cabeceras.push(`Q C${i+1} (Pr:${c.prioridad})`));
    cabeceras.push("Est. PS", "Gráfico");
    tabla.configurarColumnas(cabeceras);

    // 4. Distribuir los "Clientes Iniciales" configurados en el Menú
    let clientesPendientes = [];
    cfgGlobal.colas.forEach(cfgCola => {
        for(let k = 0; k < cfgCola.clientesIniciales; k++) {
            contadorIdGlobal++;
            clientesPendientes.push({
                id: contadorIdGlobal,
                idCola: cfgCola.id,
                prioridad: cfgCola.prioridad,
                color: arregloColas[cfgCola.id].color
            });
        }
    });

    // Ordenamos por prioridad: La prioridad 1 se procesa primero que la 2, etc.
    clientesPendientes.sort((a, b) => a.prioridad - b.prioridad);

    // Repartimos esos clientes
    clientesPendientes.forEach(cliente => {
        const srvLibre = servidores.find(s => !s.ocupado && !s.zonaSeguridad && s.habilitado);
        if (srvLibre) {
            const tTransito = procesarDistribucion(cfgGlobal.generadores.transito);
            if (tTransito) {
                srvLibre.zonaSeguridad = true;
                srvLibre.clienteEnZona = cliente;
                motor.agregarEvento(motor.tiempoActual + tTransito, 'LLEGADA_PS', { idServidor: srvLibre.id });
            } else {
                srvLibre.ocupado = true;
                srvLibre.clienteActual = cliente;
                motor.agregarEvento(motor.tiempoActual + procesarDistribucion(cfgGlobal.generadores.servicio), 'FIN_SERVICIO', { idServidor: srvLibre.id });
            }
        } else {
            // No hay lugar, lo dejamos en su cola correspondiente
            arregloColas[cliente.idCola].agregar(cliente);
            const tTolerancia = procesarDistribucion(cfgGlobal.generadores.tolerancia);
            if (tTolerancia) {
                motor.agregarEvento(motor.tiempoActual + tTolerancia, 'ABANDONO', { idCliente: cliente.id });
            }
        }
    });

    // 5. Iniciar eventos de llegadas futuras
    arregloColas.forEach(c => {
        if (cfgGlobal.colas[c.idConfig].llegada.tipo !== 'desactivado') {
            motor.agregarEvento(motor.tiempoActual + procesarDistribucion(cfgGlobal.colas[c.idConfig].llegada), 'LLEGADA', { idCola: c.idConfig });
        }
    });

    // 6. Iniciar ciclos de trabajo (Si el P2 está activo)
    servidores.forEach(srv => {
        if (cfgGlobal.generadores.trabajo.tipo !== 'desactivado') {
            motor.agregarEvento(motor.tiempoActual + procesarDistribucion(cfgGlobal.generadores.trabajo), 'SALIDA_SERVIDOR', { idServidor: srv.id });
        }
    });

    registrarEstado({tipo: 'INICIO'});
}

document.getElementById('btnPasoAPaso').addEventListener('click', () => {
    let evento;
    do {
        evento = motor.siguienteEvento();
        if(!evento) { alert("Fin."); return; }
        
        let valido = true;
        if(evento.tipo === 'ABANDONO') { 
            valido = arregloColas.some(c => c.clientes.some(cli => cli.id === evento.idCliente));
        }
        
        if(valido && motor.tiempoActual <= cfgGlobal.sistema.horaFin) {
            procesarEvento(evento); registrarEstado(evento); break;
        }
    } while (true);
});

document.getElementById('btnSimularTodo').addEventListener('click', () => {
    const lim = cfgGlobal.sistema.horaFin; let iter = 0; 
    while(motor.listaEventos.length > 0 && motor.listaEventos[0].tiempo <= lim && iter < 10000) {
        document.getElementById('btnPasoAPaso').click(); iter++;
    }
});

document.getElementById('btnReiniciar').addEventListener('click', inicializarEscenario);
setTimeout(inicializarEscenario, 200);