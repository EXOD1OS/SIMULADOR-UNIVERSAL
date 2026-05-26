// Estructura de datos y lógica visual del puesto de atención
export class Servidor {
    constructor(id, x, y) { 
        this.id = id;
        this.x = 420;
        this.y = y; 
        
        // Estado base
        this.ocupado = false; 
        this.habilitado = true;
        this.clienteActual = null;
        
        // Estado de tranisicion
        this.zonaSeguridad = false; 
        this.clienteEnZona = null; 
        this.usaZonaSeguridad = false;
    }

    // --- RENDERIZADO ---

    dibujar(ctx) {
        // Caja de zona de seguridad
        if (this.usaZonaSeguridad) {
            ctx.setLineDash([4, 4]); ctx.strokeStyle = '#7f8c8d'; 
            ctx.strokeRect(this.x - 65, this.y - 15, 30, 30);
            ctx.setLineDash([]); ctx.fillStyle = '#7f8c8d'; ctx.font = '10px Arial'; ctx.fillText('Z.S.', this.x - 60, this.y - 20);
            
            if (this.zonaSeguridad && this.clienteEnZona) {
                ctx.beginPath(); ctx.arc(this.x - 50, this.y, 8, 0, 2 * Math.PI); ctx.fillStyle = this.clienteEnZona.color; ctx.fill(); ctx.stroke(); 
            }
        }

        // Semáforo de estado
        ctx.beginPath(); ctx.arc(this.x, this.y, 20, 0.5 * Math.PI, 1.5 * Math.PI); 
        ctx.fillStyle = this.habilitado ? '#2ecc71' : '#e74c3c'; ctx.fill(); ctx.stroke();
        
        ctx.fillStyle = '#ffffff'; ctx.fillRect(this.x, this.y - 20, 40, 40); ctx.strokeRect(this.x, this.y - 20, 40, 40);
        ctx.fillStyle = '#000'; ctx.font = '12px Arial'; ctx.fillText(`PS${this.id + 1}`, this.x - 5, this.y - 25);
        
        // Cliente en atencion
        if (this.ocupado && this.clienteActual) { 
            ctx.beginPath(); ctx.arc(this.x + 20, this.y, 10, 0, 2 * Math.PI); ctx.fillStyle = this.clienteActual.color; ctx.fill(); ctx.stroke(); 
        }
    }
}