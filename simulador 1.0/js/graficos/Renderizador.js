export class Renderizador {
    constructor(canvasId) { this.canvas = document.getElementById(canvasId); this.ctx = this.canvas.getContext('2d'); }
    dibujarEscena(tiempoActualSegundos, componentes, horaFormateada) {
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
        this.ctx.fillStyle = '#2c3e50'; this.ctx.font = 'bold 20px Arial'; this.ctx.fillText(`Reloj: ${horaFormateada}`, 20, 30);
        componentes.forEach(comp => comp.dibujar(this.ctx));
    }
}