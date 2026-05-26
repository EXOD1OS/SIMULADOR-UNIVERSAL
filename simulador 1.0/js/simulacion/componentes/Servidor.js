export class Servidor {
    constructor(id, x, y) { 
        this.id = id; this.x = x; this.y = y; 
        this.ocupado = false; this.habilitado = true; this.clienteActual = null;
        this.zonaSeguridad = false; this.clienteEnZona = null;
        this.usaZonaSeguridad = false;
    }
    dibujar(ctx) {
        if (this.usaZonaSeguridad) {
            ctx.setLineDash([4, 4]); ctx.strokeStyle = '#7f8c8d'; ctx.strokeRect(this.x - 55, this.y - 15, 30, 30);
            ctx.setLineDash([]); ctx.fillStyle = '#7f8c8d'; ctx.font = '10px Arial'; ctx.fillText('Z.S.', this.x - 50, this.y - 20);
            if (this.zonaSeguridad && this.clienteEnZona) {
                ctx.beginPath(); ctx.arc(this.x - 40, this.y, 8, 0, 2 * Math.PI); ctx.fillStyle = this.clienteEnZona.color; ctx.fill(); ctx.stroke(); 
            }
        }
        ctx.beginPath(); ctx.arc(this.x, this.y, 20, 0.5 * Math.PI, 1.5 * Math.PI); ctx.fillStyle = this.habilitado ? '#2ecc71' : '#e74c3c'; ctx.fill(); ctx.stroke();
        ctx.fillStyle = '#ffffff'; ctx.fillRect(this.x, this.y - 20, 40, 40); ctx.strokeRect(this.x, this.y - 20, 40, 40);
        if (this.ocupado && this.clienteActual) { 
            ctx.beginPath(); ctx.arc(this.x + 20, this.y, 10, 0, 2 * Math.PI); ctx.fillStyle = this.clienteActual.color; ctx.fill(); ctx.stroke(); 
        }
        ctx.fillStyle = '#000'; ctx.font = '12px Arial'; ctx.fillText(`P.S. ${this.id}`, this.x - 5, this.y - 25);
    }
}