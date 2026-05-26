import { configInicial } from '../config/escenarios.js';

export class Menu {
    constructor() {
        this.panelSistema = document.getElementById('panelSistema');
        this.panelColas = document.getElementById('panelColas');
        this.panelServidores = document.getElementById('panelServidores');
        this.renderizarSistema();
    }

    renderizarSistema() {
        configInicial.sistema.forEach(item => {
            const row = document.createElement('div');
            row.className = 'config-row';
            if (item.tipo === 'select') {
                let opts = item.opciones.map(o => `<option value="${o.val}" ${item.val===o.val?'selected':''}>${o.text}</option>`).join('');
                row.innerHTML = `<label><b>${item.label}</b></label><select id="sys_${item.id}">${opts}</select>`;
            } else {
                const stepAttr = item.tipo === 'time' ? 'step="1"' : ''; 
                row.innerHTML = `<label><b>${item.label}</b></label><input type="${item.tipo}" id="sys_${item.id}" value="${item.val}" ${stepAttr} min="${item.min||0}">`;
            }
            this.panelSistema.appendChild(row);
        });

        document.getElementById('sys_modoAsignacion').addEventListener('change', () => { this.syncSeries(); this.renderizarColas(document.getElementById('sys_numColas').value); });
        document.getElementById('sys_numColas').addEventListener('change', (e) => { this.renderizarColas(e.target.value); });
        document.getElementById('sys_numServidores').addEventListener('change', (e) => { this.syncSeries(); this.renderizarServidores(e.target.value); this.renderizarColas(document.getElementById('sys_numColas').value); });
        
        this.syncSeries();
        this.renderizarColas(document.getElementById('sys_numColas').value); 
        this.renderizarServidores(document.getElementById('sys_numServidores').value);
    }

    syncSeries() {
        const modo = document.getElementById('sys_modoAsignacion').value;
        const inputColas = document.getElementById('sys_numColas');
        const inputSrv = document.getElementById('sys_numServidores');
        
        if (modo === 'serie') {
            inputColas.value = inputSrv.value;
            inputColas.disabled = true;
        } else {
            inputColas.disabled = false;
        }
    }

    renderizarColas(cantidad) {
        let prevValues = {};
        for(let i=0; i<5; i++) {
            if(document.getElementById(`cola_prio_${i}`)) {
                prevValues[`prio_${i}`] = document.getElementById(`cola_prio_${i}`).value;
                prevValues[`ini_${i}`] = document.getElementById(`cola_ini_${i}`).value;
                prevValues[`esp_${i}`] = document.getElementById(`cola_espera_${i}`).value;
                prevValues[`lleg_${i}`] = this.leerGenerador(`llegada_${i}`);
                prevValues[`tol_${i}`] = this.leerGenerador(`tolerancia_${i}`);
            }
        }

        const modo = document.getElementById('sys_modoAsignacion').value;
        this.panelColas.innerHTML = '<h3>Colas (Llegadas y Abandono)</h3>';
        
        for(let i = 0; i < cantidad; i++) {
            const div = document.createElement('div');
            div.className = 'caja-cola';
            
            const isSerieSubsequent = (modo === 'serie' && i > 0);
            const displayStyle = isSerieSubsequent ? 'none' : 'flex';

            const valPrio = prevValues[`prio_${i}`] !== undefined ? prevValues[`prio_${i}`] : (i+1);
            const valIni = prevValues[`ini_${i}`] !== undefined ? prevValues[`ini_${i}`] : (i===0 ? 3 : 0);
            const valEsp = prevValues[`esp_${i}`] !== undefined ? prevValues[`esp_${i}`] : 0;
            const lleg = prevValues[`lleg_${i}`] || {tipo: 'constante', params: {val: 45 + (i*5), min: 30, max: 60, media: 45, desvio: 5}};
            const tol = prevValues[`tol_${i}`] || {tipo: 'desactivado', params: {val: 600, min: 300, max: 900, media: 600, desvio: 60}};

            div.innerHTML = `
                <h4>Cola Tipo ${i+1} ${isSerieSubsequent ? '(Intermedia)' : ''}</h4>
                <div class="config-row"><label>Prioridad (1 es Max):</label><input type="number" id="cola_prio_${i}" value="${valPrio}" min="1"></div>
                <div class="config-row" style="display:${displayStyle}"><label>Clientes Iniciales:</label><input type="number" id="cola_ini_${i}" value="${isSerieSubsequent ? 0 : valIni}" min="0"></div>
                <div class="config-row" style="display:${displayStyle}"><label>Espera Previa Ini.(s):</label><input type="number" id="cola_espera_${i}" value="${isSerieSubsequent ? 0 : valEsp}" min="0"></div>
                <div style="display:${displayStyle}">
                    ${this.htmlGenerador(`llegada_${i}`, 'Int. Llegadas', lleg.tipo, lleg.params)}
                </div>
                ${this.htmlGenerador(`tolerancia_${i}`, 'T. Abandono', tol.tipo, tol.params)}
            `;
            this.panelColas.appendChild(div);
            this.activarEventosGenerador(`llegada_${i}`);
            this.activarEventosGenerador(`tolerancia_${i}`);
        }
    }

    renderizarServidores(cantidad) {
        let prevValues = {};
        for(let i=0; i<5; i++) {
            if(document.getElementById(`gen_tipo_servicio_srv_${i}`)) {
                prevValues[`serv_${i}`] = this.leerGenerador(`servicio_srv_${i}`);
                prevValues[`trans_${i}`] = this.leerGenerador(`transito_srv_${i}`);
                prevValues[`trab_${i}`] = this.leerGenerador(`trabajo_srv_${i}`);
                prevValues[`desc_${i}`] = this.leerGenerador(`descanso_srv_${i}`);
            }
        }

        this.panelServidores.innerHTML = '<h3>Servidores (Servicio y Descanso)</h3>';
        for(let i=0; i < cantidad; i++) {
            const div = document.createElement('div');
            div.className = 'caja-servidor';
            
            const serv = prevValues[`serv_${i}`] || {tipo: 'constante', params: {val: 40, min: 20, max: 60, media: 40, desvio: 4}};
            const trans = prevValues[`trans_${i}`] || {tipo: 'desactivado', params: {val: 10, min: 5, max: 20, media: 10, desvio: 2}};
            const trab = prevValues[`trab_${i}`] || {tipo: 'desactivado', params: {val: 300, min: 200, max: 400, media: 300, desvio: 20}};
            const desc = prevValues[`desc_${i}`] || {tipo: 'desactivado', params: {val: 60, min: 30, max: 90, media: 60, desvio: 10}};

            div.innerHTML = `
                <h4>Servidor ${i+1}</h4>
                ${this.htmlGenerador(`servicio_srv_${i}`, 'T. Servicio', serv.tipo, serv.params)}
                ${this.htmlGenerador(`transito_srv_${i}`, 'Zona Segur.', trans.tipo, trans.params)}
                ${this.htmlGenerador(`trabajo_srv_${i}`, 'T. Trabajo', trab.tipo, trab.params)}
                ${this.htmlGenerador(`descanso_srv_${i}`, 'T. Descanso', desc.tipo, desc.params)}
            `;
            this.panelServidores.appendChild(div);
            this.activarEventosGenerador(`servicio_srv_${i}`);
            this.activarEventosGenerador(`transito_srv_${i}`);
            this.activarEventosGenerador(`trabajo_srv_${i}`);
            this.activarEventosGenerador(`descanso_srv_${i}`);
        }
    }

    htmlGenerador(id, label, defaultType, params) {
        return `
            <div class="config-row">
                <strong>${label}</strong>
                <select id="gen_tipo_${id}">
                    <option value="desactivado" ${defaultType === 'desactivado' ? 'selected' : ''}>No Usa</option>
                    <option value="constante" ${defaultType === 'constante' ? 'selected' : ''}>Constante</option>
                    <option value="uniforme" ${defaultType === 'uniforme' ? 'selected' : ''}>Uniforme</option>
                    <option value="normal" ${defaultType === 'normal' ? 'selected' : ''}>Normal</option>
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
        if (!select || !container) return; 

        const inputsOcultos = {
            val: document.getElementById(`${id}_val`).value, min: document.getElementById(`${id}_min`).value,
            max: document.getElementById(`${id}_max`).value, media: document.getElementById(`${id}_media`).value,
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

    horaASegundos(hStr) {
        const p = hStr.split(':');
        return (parseInt(p[0])||0)*3600 + (parseInt(p[1])||0)*60 + (parseInt(p[2])||0);
    }

    obtenerConfiguracion() {
        const c = { sistema: {}, colas: [], servidores: [] };
        
        configInicial.sistema.forEach(item => {
            if (item.tipo === 'select') c.sistema[item.id] = document.getElementById(`sys_${item.id}`).value;
            else c.sistema[item.id] = item.tipo === 'time' ? this.horaASegundos(document.getElementById(`sys_${item.id}`).value) : parseInt(document.getElementById(`sys_${item.id}`).value);
        });
        
        for(let i=0; i<c.sistema.numColas; i++) {
            c.colas.push({ 
                id: i, 
                prioridad: parseInt(document.getElementById(`cola_prio_${i}`).value), 
                clientesIniciales: parseInt(document.getElementById(`cola_ini_${i}`).value) || 0,
                esperaPrevia: parseInt(document.getElementById(`cola_espera_${i}`).value) || 0,
                llegada: this.leerGenerador(`llegada_${i}`),
                tolerancia: this.leerGenerador(`tolerancia_${i}`)
            });
        }

        for(let i=0; i<c.sistema.numServidores; i++) {
            c.servidores.push({
                id: i,
                servicio: this.leerGenerador(`servicio_srv_${i}`),
                transito: this.leerGenerador(`transito_srv_${i}`),
                trabajo: this.leerGenerador(`trabajo_srv_${i}`),
                descanso: this.leerGenerador(`descanso_srv_${i}`)
            });
        }
        return c;
    }

    leerGenerador(id) {
        const selectEl = document.getElementById(`gen_tipo_${id}`);
        if(!selectEl) return { tipo: 'desactivado', params: {} };
        const tipo = selectEl.value;
        let params = {};
        if (tipo === 'constante') params.val = parseFloat(document.getElementById(`${id}_val`).value);
        if (tipo === 'uniforme') { params.min = parseFloat(document.getElementById(`${id}_min`).value); params.max = parseFloat(document.getElementById(`${id}_max`).value); }
        if (tipo === 'normal') { params.media = parseFloat(document.getElementById(`${id}_media`).value); params.desvio = parseFloat(document.getElementById(`${id}_desvio`).value); }
        return { tipo, params };
    }
}