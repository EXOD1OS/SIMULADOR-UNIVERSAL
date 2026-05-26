export class TablaDatos {
    constructor(idCabecera, idCuerpo) {
        this.thead = document.getElementById(idCabecera);
        this.tbody = document.getElementById(idCuerpo);
    }
    configurarColumnas(columnasArray) {
        this.thead.innerHTML = '<tr>' + columnasArray.map(col => `<th>${col}</th>`).join('') + '</tr>';
        this.limpiarTabla();
    }
    formatearHora(segs) {
        if (segs === null || segs === undefined || segs === "-") return "*";
        const h = Math.floor(segs / 3600); const m = Math.floor((segs % 3600) / 60); const s = Math.floor(segs % 60);
        return `${h}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
    }
    
    generarGraficoHTML(arrayColas, arrayServidores, usarTransito) {
        let htmlColas = '<div class="columna-colas">';
        arrayColas.forEach((cola, idx) => {
            let circulos = '';
            for(let i=0; i < cola.cantidad; i++) { circulos += `<div class="mini-cliente" style="background-color: ${cola.color};"></div>`; }
            htmlColas += `<div class="fila-cola"><span class="etiqueta-cola">C${idx+1}</span>${circulos}</div>`;
        });
        htmlColas += '</div>';

        let htmlServidores = '<div class="columna-servidores">';
        arrayServidores.forEach(srv => {
            let clientePS = (srv.ocupado && srv.clienteActual) ? `<div class="mini-cliente" style="background-color: ${srv.clienteActual.color};"></div>` : '';
            
            let cajaZS = '';
            if (usarTransito) {
                let clienteZS = (srv.zonaSeguridad && srv.clienteEnZona) ? `<div class="mini-cliente" style="background-color: ${srv.clienteEnZona.color};"></div>` : '';
                cajaZS = `<div class="mini-zona-seguridad">${clienteZS}</div>`;
            }

            const colorSemi = srv.habilitado ? 'verde' : 'rojo';
            htmlServidores += `<div class="fila-ps">${cajaZS}<div class="mini-semicirculo ${colorSemi}"></div><div class="mini-cuadrado">${clientePS}</div></div>`;
        });
        htmlServidores += '</div>';
        
        return `<div class="mini-sistema">${htmlColas}${htmlServidores}</div>`;
    }
    
    agregarFila(valoresTexto, arrayColas, arrayServidores, usarTransito) {
        const tr = document.createElement('tr');
        valoresTexto.forEach(val => {
            const td = document.createElement('td');
            td.textContent = (typeof val === 'number' && val >= 0) ? this.formatearHora(val) : val;
            tr.appendChild(td);
        });
        const tdGrafico = document.createElement('td'); 
        tdGrafico.innerHTML = this.generarGraficoHTML(arrayColas, arrayServidores, usarTransito);
        tr.appendChild(tdGrafico);
        this.tbody.appendChild(tr);
        if (this.tbody.parentElement && this.tbody.parentElement.parentElement) this.tbody.parentElement.parentElement.scrollTop = this.tbody.parentElement.parentElement.scrollHeight;
    }
    limpiarTabla() { this.tbody.innerHTML = ''; }
}