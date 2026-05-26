export const configInicial = {
    sistema: [
        { id: 'horaInicio', label: 'Hora de Inicio', tipo: 'time', val: '08:00:00' },
        { id: 'horaFin', label: 'Hora de Fin (Límite)', tipo: 'time', val: '09:00:00' },
        { id: 'numServidores', label: 'Cantidad de Servidores', tipo: 'number', val: 1, min: 1, max: 5 },
        { id: 'numColas', label: 'Cantidad de Colas/Tipos', tipo: 'number', val: 1, min: 1, max: 5 }
    ],
    generadoresGenerales: [
        { id: 'servicio', label: 'T. Servicio', defaultType: 'constante', params: { val: 40, min: 20, max: 60, media: 40, desvio: 4 } },
        { id: 'transito', label: 'Zona Seguridad (P5)', defaultType: 'desactivado', params: { val: 10, min: 5, max: 20, media: 10, desvio: 2 } },
        { id: 'tolerancia', label: 'T. Abandono (P3)', defaultType: 'desactivado', params: { val: 600, min: 300, max: 900, media: 600, desvio: 60 } },
        { id: 'trabajo', label: 'T. Trabajo (P2)', defaultType: 'desactivado', params: { val: 300, min: 200, max: 400, media: 300, desvio: 20 } },
        { id: 'descanso', label: 'T. Descanso (P2)', defaultType: 'desactivado', params: { val: 60, min: 30, max: 90, media: 60, desvio: 10 } }
    ]
};

export const coloresColas = ['#3498db', '#e67e22', '#9b59b6', '#e74c3c', '#1abc9c'];