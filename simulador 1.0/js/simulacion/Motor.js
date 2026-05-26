export class Motor {
    constructor() { this.tiempoActual = 0; this.listaEventos = []; }
    agregarEvento(tiempo, tipo, datosExtra = {}) {
        this.listaEventos.push({ tiempo, tipo, ...datosExtra });
        this.listaEventos.sort((a, b) => a.tiempo - b.tiempo);
    }
    siguienteEvento() {
        if (this.listaEventos.length === 0) return null;
        const evento = this.listaEventos.shift();
        this.tiempoActual = evento.tiempo;
        return evento;
    }
    obtenerTiempoProx(tipoEvento, idAux = null) {
        const evt = this.listaEventos.find(e => e.tipo === tipoEvento && (idAux === null || e.idCola === idAux || e.idServidor === idAux));
        return evt ? evt.tiempo : null;
    }
    reiniciar(tiempoInicial = 0) { this.tiempoActual = tiempoInicial; this.listaEventos = []; }
}