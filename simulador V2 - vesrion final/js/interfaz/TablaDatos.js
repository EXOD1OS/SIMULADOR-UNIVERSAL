// Controlador de la tabla HTML matricial
export class TablaDatos {
    constructor(idCabecera, idCuerpo) {
        this.thead = document.getElementById(idCabecera);
        this.tbody = document.getElementById(idCuerpo);
    }

    // Configura la doble cabecera dinámica
    configurarColumnas(numColas, numServidores) {
        this.limpiarTabla(); 

        let row1 = `<tr>
            <th rowspan="2" class="borde-grueso-der">Hora actual</th>
            <th rowspan="2" class="borde-grueso-der">Evento Actual</th>
            <th colspan="${numColas}" class="borde-grueso-der">Hora de próx. Llegada</th>
            <th colspan="${numServidores}" class="borde-grueso-der">Hora de próx. Fin de Servicio</th>
            <th colspan="${numColas}" class="borde-grueso-der">Cantidad de Clientes en Cola</th>
            <th colspan="${numServidores}" class="borde-grueso-der">Estado del PS (Ocupado)</th>
            <th colspan="${numServidores}" class="borde-grueso-der">Estado del PS (Disponible)</th>
            <th rowspan="2">Gráficamente</th>
        </tr>`;

        let row2 = '<tr>';
        for(let i=1; i<=numColas; i++) row2 += `<th class="${i===numColas?'borde-grueso-der':''}">C${i}</th>`;
        for(let i=1; i<=numServidores; i++) row2 += `<th class="${i===numServidores?'borde-grueso-der':''}">PS${i}</th>`;
        for(let i=1; i<=numColas; i++) row2 += `<th class="${i===numColas?'borde-grueso-der':''}">C${i}</th>`;
        for(let i=1; i<=numServidores; i++) row2 += `<th class="${i===numServidores?'borde-grueso-der':''}">PS${i}</th>`;
        for(let i=1; i<=numServidores; i++) row2 += `<th class="${i===numServidores?'borde-grueso-der':''}">PS${i}</th>`;
        row2 += '</tr>';

        this.thead.innerHTML = row1 + row2;
    }

    formatearHora(segs) {
        if (segs === null || segs === undefined || segs === "-" || segs === "") return "";
        const h = Math.floor(segs / 3600); const m = Math.floor((segs % 3600) / 60); const s = Math.floor(segs % 60);
        return `${h}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
    }

    // Genera la grafico para la tabla
    generarGraficoHTML(arrayColas, arrayServidores, usarTransito) {
        let htmlColas = '<div class="columna-colas">';
        arrayColas.forEach((cola, idx) => {
            let circulos = '';
            for(let i=0; i < Math.min(cola.cantidad, 15); i++) { circulos += `<div class="mini-cliente" style="background-color: ${cola.color};"></div>`; }
            if (cola.cantidad > 15) circulos += `<span style="font-size:10px;">+${cola.cantidad-15}</span>`;
            htmlColas += `<div class="fila-cola"><span class="etiqueta-cola">C${idx+1}</span>${circulos}</div>`;
        });
        htmlColas += '</div>';

        let htmlServidores = '<div class="columna-servidores">';
        arrayServidores.forEach(srv => {
            let clientePS = (srv.ocupado && srv.clienteActual && !srv.clienteActual.esFicticio) ? `<div class="mini-cliente" style="background-color: ${srv.clienteActual.color};"></div>` : '';
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

    // Inserta una fila de datos calculada por el motor
    agregarFila(reloj, eventoActualStr, llegadas, finesServicio, cantidadesCola, estadosOcupado, estadosDisponible, arrayColas, arrayServidores, usarTransito) {
        const tr = document.createElement('tr');

        const addCell = (val, isEnd) => {
            const td = document.createElement('td');
            td.textContent = val;
            if (isEnd) td.classList.add('borde-grueso-der');
            tr.appendChild(td);
        };
        const addTimeCell = (val, isEnd) => {
            const td = document.createElement('td');
            td.textContent = (val !== "" && val !== 0 && val !== "-") ? this.formatearHora(val) : "";
            if (isEnd) td.classList.add('borde-grueso-der');
            tr.appendChild(td);
        };

        addTimeCell(reloj, true);
        addCell(eventoActualStr, true);
        
        llegadas.forEach((val, i) => addTimeCell(val, i === llegadas.length - 1));
        finesServicio.forEach((val, i) => addTimeCell(val, i === finesServicio.length - 1));
        
        cantidadesCola.forEach((val, i) => {
            const td = document.createElement('td');
            td.textContent = (val === 0 || val === "") ? "" : val;
            if (i === cantidadesCola.length - 1) td.classList.add('borde-grueso-der');
            tr.appendChild(td);
        });

        estadosOcupado.forEach((val, i) => addCell(val, i === estadosOcupado.length - 1));
        estadosDisponible.forEach((val, i) => addCell(val, i === estadosDisponible.length - 1));

        const tdGrafico = document.createElement('td'); 
        tdGrafico.innerHTML = this.generarGraficoHTML(arrayColas, arrayServidores, usarTransito);
        tr.appendChild(tdGrafico);

        this.tbody.appendChild(tr);
        
        // Auto-Scroll hacia la última fila
        if (this.tbody.parentElement && this.tbody.parentElement.parentElement) {
            this.tbody.parentElement.parentElement.scrollTop = this.tbody.parentElement.parentElement.scrollHeight;
        }
    }

    limpiarTabla() { this.tbody.innerHTML = ''; }
}