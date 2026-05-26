// Controlador central del Tiempo y la Lista de Eventos Futuros (FEL)
export class Motor {
    constructor() { 
        this.tiempoActual = 0;
        this.listaEventos = [];
    }

    // Añade evento y ordena la lista de eventos  cronológicamente
    agregarEvento(tiempo, tipo, datosExtra = {}) {
        this.listaEventos.push({ tiempo, tipo, ...datosExtra });
        this.listaEventos.sort((a, b) => a.tiempo - b.tiempo);
    }

    // Extrae el evento proximo y avanza el reloj
    siguienteEvento() {
        if (this.listaEventos.length === 0) return null;
        const evento = this.listaEventos.shift();
        this.tiempoActual = evento.tiempo;
        return evento;
    }

    // Busca de eventos
    obtenerTiempoProx(tipoEvento, idAux = null) {
        const evento = this.listaEventos.find(e => e.tipo === tipoEvento && (idAux === null || e.idCola === idAux || e.idServidor === idAux));
        return evento ? evento.tiempo : null;
    }

    reiniciar(tiempoInicial = 0) { 
        this.tiempoActual = tiempoInicial; 
        this.listaEventos = []; 
    }
}