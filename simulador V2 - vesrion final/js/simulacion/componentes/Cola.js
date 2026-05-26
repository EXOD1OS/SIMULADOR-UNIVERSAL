import { coloresColas } from '../../config/escenarios.js';

// Estructura de datos y lógica visual para la fila de espera
export class Cola {
    constructor(idConfig, x, y, prioridad) {
        this.idConfig = idConfig;
        this.prioridad = prioridad;
        this.x = x;
        this.y = y;
        this.clientes = [];
        this.color = coloresColas[idConfig % coloresColas.length];
    }

    // --- MANEJO DE CLIENTES ---
    agregar(cliente) { 
        cliente.color = this.color; 
        this.clientes.push(cliente); 
    }

    obtenerSiguiente() { 
        return this.clientes.shift(); 
    }

    eliminarPorId(idCliente) {
        const indice = this.clientes.findIndex(c => c.id === idCliente);
        if (indice !== -1) { 
            this.clientes.splice(indice, 1); 
            return true;
        }
        return false; 
    }

    get cantidad() { return this.clientes.length; }

    // --- RENDERIZADO ---
    dibujar(ctx) {
        const maxDibujo = Math.min(this.clientes.length, 12);
        for (let i = 0; i < maxDibujo; i++) {
            ctx.beginPath(); 
            ctx.arc(this.x - (i * 18), this.y, 8, 0, 2 * Math.PI);
            ctx.fillStyle = this.color; ctx.fill(); ctx.stroke();
        }
        if (this.clientes.length > 12) {
            ctx.fillStyle = '#000'; ctx.font = '12px Arial';
            ctx.fillText(`+${this.clientes.length - 12}`, this.x - (12 * 18) - 10, this.y + 3);
        }
    }
}