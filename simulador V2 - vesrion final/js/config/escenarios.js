// Valores por defecto de la interfaz
export const configInicial = {
    sistema: [
        { id: 'horaInicio', label: 'Hora de Inicio', tipo: 'time', val: '08:00:00' },
        { id: 'horaFin', label: 'Hora de Fin (Límite)', tipo: 'time', val: '10:00:00' },
        { id: 'modoAsignacion', label: 'Modo Asignación', tipo: 'select', val: 'compartido', opciones: [
            {val:'compartido', text:'Compartidos (Prioridad)'}, 
            {val:'independiente', text:'Independientes (Paralelos)'},
            {val:'serie', text:'En Serie (Tándem)'}
        ]},
        { id: 'numColas', label: 'Cant. Colas/Tipos', tipo: 'number', val: 1, min: 1, max: 5 },
        { id: 'numServidores', label: 'Cant. Servidores', tipo: 'number', val: 1, min: 1, max: 5 }
    ]
};

// Paleta de colores para las distintas colas
export const coloresColas = ['#3498db', '#e67e22', '#9b59b6', '#e74c3c', '#1abc9c'];