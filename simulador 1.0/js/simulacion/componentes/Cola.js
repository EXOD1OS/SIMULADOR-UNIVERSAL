import { coloresColas } from "../../config/escenarios.js";

export class Cola {
  constructor(idConfig, x, y, prioridad) {
    this.idConfig = idConfig;
    this.prioridad = prioridad;
    this.x = x;
    this.y = y;
    this.clientes = [];
    this.color = coloresColas[idConfig % coloresColas.length];
  }
  agregar(cliente) {
    cliente.color = this.color;
    this.clientes.push(cliente);
  }
  obtenerSiguiente() {
    return this.clientes.shift();
  }
  eliminarPorId(idCliente) {
    const indice = this.clientes.findIndex((c) => c.id === idCliente);
    if (indice !== -1) {
      this.clientes.splice(indice, 1);
      return true;
    }
    return false;
  }
  get cantidad() {
    return this.clientes.length;
  }
  dibujar(ctx) {
    for (let i = 0; i < this.clientes.length; i++) {
      ctx.beginPath();
      ctx.arc(this.x - i * 20, this.y, 8, 0, 2 * Math.PI);
      ctx.fillStyle = this.color;
      ctx.fill();
      ctx.stroke();
      ctx.fillStyle = "#fff";
      ctx.font = "8px Arial";
      ctx.fillText(`C${this.idConfig + 1}`, this.x - i * 20 - 5, this.y + 3);
    }
  }
}
