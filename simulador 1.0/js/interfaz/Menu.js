import { configInicial } from '../config/escenarios.js';

export class Menu {
    constructor() {
        this.panelSistema = document.getElementById('panelSistema');
        this.panelColas = document.getElementById('panelColas');
        this.panelGeneradores = document.getElementById('panelGeneradores');
        this.renderizarSistema();
        this.renderizarGeneradoresGenerales();
    }

    renderizarSistema() {
        configInicial.sistema.forEach(item => {
            const row = document.createElement('div');
            row.className = 'config-row';
            const stepAttr = item.tipo === 'time' ? 'step="1"' : ''; 
            row.innerHTML = `<label><b>${item.label}</b></label><input type="${item.tipo}" id="sys_${item.id}" value="${item.val}" ${stepAttr} min="${item.min||0}">`;
            this.panelSistema.appendChild(row);
        });

        document.getElementById('sys_numColas').addEventListener('change', (e) => this.renderizarColas(e.target.value));
        this.renderizarColas(1); 
    }

    renderizarColas(cantidad) {
        this.panelColas.innerHTML = '<h3>👥 Configuración de Colas (Prioridades)</h3>';
        for(let i = 0; i < cantidad; i++) {
            const div = document.createElement('div');
            div.className = 'caja-cola';
            // Por defecto, la cola 1 arranca con 3 clientes para imitar tu Problema 1 al cargar
            const clientesPorDefecto = (i === 0) ? 3 : 0; 
            div.innerHTML = `
                <h4>Cola Tipo ${i+1}</h4>
                <div class="config-row">
                    <label>Prioridad (1 es Máxima):</label>
                    <input type="number" id="cola_prio_${i}" value="${i+1}" min="1">
                </div>
                <div class="config-row">
                    <label>Clientes Iniciales:</label>
                    <input type="number" id="cola_ini_${i}" value="${clientesPorDefecto}" min="0">
                </div>
                ${this.htmlGenerador(`llegada_${i}`, 'Intervalo Llegadas', 'constante', {val: 45 + (i*5), min: 30, max: 60, media: 45, desvio: 5})}
            `;
            this.panelColas.appendChild(div);
            this.activarEventosGenerador(`llegada_${i}`);
        }
    }

    renderizarGeneradoresGenerales() {
        configInicial.generadoresGenerales.forEach(gen => {
            const html = this.htmlGenerador(gen.id, gen.label, gen.defaultType, gen.params);
            const div = document.createElement('div');
            div.innerHTML = html;
            this.panelGeneradores.appendChild(div);
            this.activarEventosGenerador(gen.id);
        });
    }

    htmlGenerador(id, label, defaultType, params) {
        return `
            <div class="config-row">
                <strong>${label}</strong>
                <select id="gen_tipo_${id}">
                    <option value="desactivado" ${defaultType === 'desactivado' ? 'selected' : ''}>Desactivado</option>
                    <option value="constante" ${defaultType === 'constante' ? 'selected' : ''}>Constante</option>
                    <option value="uniforme">Uniforme</option>
                    <option value="normal">Normal</option>
                </select>
                <div id="gen_params_${id}" class="parametros-dinamicos">
                    <input type="hidden" id="${id}_val" value="${params.val}">
                    <input type="hidden" id="${id}_min" value="${params.min}">
                    <input type="hidden" id="${id}_max" value="${params.max}">
                    <input type="hidden" id="${id}_media" value="${params.media}">
                    <input type="hidden" id="${id}_desvio" value="${params.desvio}">
                </div>
            </div>
        `;
    }

    activarEventosGenerador(id) {
        const select = document.getElementById(`gen_tipo_${id}`);
        const container = document.getElementById(`gen_params_${id}`);
        const inputsOcultos = {
            val: document.getElementById(`${id}_val`).value,
            min: document.getElementById(`${id}_min`).value,
            max: document.getElementById(`${id}_max`).value,
            media: document.getElementById(`${id}_media`).value,
            desvio: document.getElementById(`${id}_desvio`).value
        };

        const actualizar = () => {
            const tipo = select.value;
            if (tipo === 'desactivado') container.innerHTML = `<span style="font-size:11px; color:#bdc3c7;">(Apagado)</span>`;
            else if (tipo === 'constante') container.innerHTML = `<input type="number" id="${id}_val" value="${inputsOcultos.val}" title="Segundos">`;
            else if (tipo === 'uniforme') container.innerHTML = `<input type="number" id="${id}_min" value="${inputsOcultos.min}" title="Min"><input type="number" id="${id}_max" value="${inputsOcultos.max}" title="Max">`;
            else if (tipo === 'normal') container.innerHTML = `<input type="number" id="${id}_media" value="${inputsOcultos.media}" title="μ"><input type="number" id="${id}_desvio" value="${inputsOcultos.desvio}" title="σ">`;
        };
        select.addEventListener('change', actualizar);
        actualizar();
    }

    horaASegundos(horaString) {
        const p = horaString.split(':');
        return (parseInt(p[0])||0)*3600 + (parseInt(p[1])||0)*60 + (parseInt(p[2])||0);
    }

    obtenerConfiguracion() {
        const c = { sistema: {}, generadores: {}, colas: [] };
        configInicial.sistema.forEach(item => {
            const val = document.getElementById(`sys_${item.id}`).value;
            c.sistema[item.id] = item.tipo === 'time' ? this.horaASegundos(val) : parseInt(val);
        });
        configInicial.generadoresGenerales.forEach(gen => {
            c.generadores[gen.id] = this.leerGenerador(gen.id);
        });
        for(let i=0; i<c.sistema.numColas; i++) {
            c.colas.push({ 
                id: i, 
                prioridad: parseInt(document.getElementById(`cola_prio_${i}`).value), 
                clientesIniciales: parseInt(document.getElementById(`cola_ini_${i}`).value) || 0,
                llegada: this.leerGenerador(`llegada_${i}`) 
            });
        }
        return c;
    }

    leerGenerador(id) {
        const tipo = document.getElementById(`gen_tipo_${id}`).value;
        let params = {};
        if (tipo === 'constante') params.val = parseFloat(document.getElementById(`${id}_val`).value);
        if (tipo === 'uniforme') { params.min = parseFloat(document.getElementById(`${id}_min`).value); params.max = parseFloat(document.getElementById(`${id}_max`).value); }
        if (tipo === 'normal') { params.media = parseFloat(document.getElementById(`${id}_media`).value); params.desvio = parseFloat(document.getElementById(`${id}_desvio`).value); }
        return { tipo, params };
    }
}