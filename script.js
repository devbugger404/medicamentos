// Lógica para determinar categoría y entrega de medicamentos
(function () {
    const startBtn = document.getElementById('startBtn');
    const resetBtn = document.getElementById('resetBtn');
    const addPatientBtn = document.getElementById('addPatientBtn');
    const stopBtn = document.getElementById('stopBtn');

    const stock1El = document.getElementById('stock1');
    const stock2El = document.getElementById('stock2');
    const showStock1 = document.getElementById('showStock1');
    const showStock2 = document.getElementById('showStock2');
    const sistolicaEl = document.getElementById('sistolica');
    const diastolicaEl = document.getElementById('diastolica');
    const messageEl = document.getElementById('message');

    const totalPatientsEl = document.getElementById('totalPatients');
    const med1CountEl = document.getElementById('med1Count');
    const med2CountEl = document.getElementById('med2Count');
    const patientsTableBody = document.querySelector('#patientsTable tbody');
    const inputsCard = document.querySelector('.inputs-card');
    const patientCard = document.querySelector('.patient-card');
    const statusCard = document.querySelector('.status-card');
    const tableCard = document.querySelector('.table-card');
    const summaryCard = document.querySelector('.summary-card');
    const summaryEl = document.getElementById('summary');

    let state = {
        stock1: 0,
        stock2: 0,
        initial1: 0,
        initial2: 0,
        totalPatients: 0,
        med1Count: 0,
        med2Count: 0,
        running: false
    };

    function updateStatus() {
        showStock1.textContent = state.stock1;
        showStock2.textContent = state.stock2;
        totalPatientsEl.textContent = state.totalPatients;
        med1CountEl.textContent = state.med1Count;
        med2CountEl.textContent = state.med2Count;
    }

    function resetAll() {
        state = { stock1: 0, stock2: 0, initial1: 0, initial2: 0, totalPatients: 0, med1Count: 0, med2Count: 0, running: false };
        patientsTableBody.innerHTML = '';
        summaryEl.innerHTML = '';
        messageEl.textContent = '';
        inputsCard.classList.remove('hidden');
        patientCard.classList.add('hidden');
        statusCard.classList.add('hidden');
        tableCard.classList.add('hidden');
        summaryCard.classList.add('hidden');
        stock1El.value = 100; stock2El.value = 100; sistolicaEl.value = ''; diastolicaEl.value = '';
        updateStatus();
    }

    function determineCategory(s, d) {
        // s: sistólica, d: diastólica
        // Regla basada en la tabla proporcionada en el enunciado (intervalos adaptados)
        // Devuelve {categoria, medType, dosis}
        // medType: 0 = ninguno, 1 = medicamento1, 2 = medicamento2

        // Hipotensión: s < 69 && d < 48 -> medicamento 2, 6 dosis
        if (s < 69 && d < 48) return { categoria: 'hipotension', medType: 2, dosis: 6 };

        // Óptima: [69 - 98] && [48 - 66] -> ninguno
        if (s >= 69 && s <= 98 && d >= 48 && d <= 66) return { categoria: 'Optima', medType: 0, dosis: 0 };

        // Común: [98 - 143] && [66 - 92] -> ninguno
        if (s > 98 && s <= 143 && d > 66 && d <= 92) return { categoria: 'Comun', medType: 0, dosis: 0 };

        // Pre HTA: [143 - 177] && [92 - 124] -> med1, 6
        if (s > 143 && s <= 177 && d > 92 && d <= 124) return { categoria: 'Pre HTA', medType: 1, dosis: 6 };

        // HTAG1: [177 - 198] && [124 - 142] -> med1, 10
        if (s > 177 && s <= 198 && d > 124 && d <= 142) return { categoria: 'HTAG1', medType: 1, dosis: 10 };

        // HTAG2: [198 - 246] && [142 - 169] -> med1, 18
        if (s > 198 && s <= 246 && d > 142 && d <= 169) return { categoria: 'HTAG2', medType: 1, dosis: 18 };

        // HTAG3: s >= 246 && d >= 169 -> med1, 35
        if (s >= 246 && d >= 169) return { categoria: 'HTAG3', medType: 1, dosis: 35 };

        // HTASS: s >= 162 && d < 86 -> med1, 17
        if (s >= 162 && d < 86) return { categoria: 'HTASS', medType: 1, dosis: 17 };

        // Si no entra en ninguna categoría conocida
        return { categoria: 'Sin categoria', medType: 0, dosis: 0 };
    }

    function formatPercent(part, total) {
        if (total === 0) return '0.00%';
        return ((part / total * 100).toFixed(2) + '%');
    }

    function finalize(reason) {
        state.running = false;
        patientCard.classList.add('hidden');
        summaryCard.classList.remove('hidden');

        const med1 = state.med1Count;
        const med2 = state.med2Count;
        const total = state.totalPatients;

        summaryEl.innerHTML = `
      <p>Total pacientes atendidos: <strong>${total}</strong></p>
      <p>Pacientes a los que se les entregó el medicamento 1: <strong>${med1}</strong> — ${formatPercent(med1, total)}</p>
      <p>Pacientes a los que se les entregó el medicamento 2: <strong>${med2}</strong> — ${formatPercent(med2, total)}</p>
      <p>Motivo de finalización: <em>${reason}</em></p>
    `;
    }

    addPatientBtn && addPatientBtn.addEventListener('click', () => {
        if (!state.running) return;
        const s = Number(sistolicaEl.value);
        const d = Number(diastolicaEl.value);
        if (!Number.isFinite(s) || !Number.isFinite(d)) { messageEl.textContent = 'Ingrese valores válidos de presión.'; return; }

        const result = determineCategory(s, d);
        state.totalPatients++;

        let medGiven = 'Ninguna';
        let dosesGiven = 0;

        if (result.medType === 1) {
            // medicamento 1
            if (state.stock1 >= result.dosis) {
                state.stock1 -= result.dosis; dosesGiven = result.dosis; medGiven = 'Medicamento 1'; state.med1Count++;
            } else if (state.stock1 > 0) {
                dosesGiven = state.stock1; medGiven = 'Medicamento 1 (parcial)'; state.stock1 = 0; state.med1Count++;
            } else {
                // no stock
                medGiven = 'No disponible'; dosesGiven = 0;
            }
        } else if (result.medType === 2) {
            if (state.stock2 >= result.dosis) {
                state.stock2 -= result.dosis; dosesGiven = result.dosis; medGiven = 'Medicamento 2'; state.med2Count++;
            } else if (state.stock2 > 0) {
                dosesGiven = state.stock2; medGiven = 'Medicamento 2 (parcial)'; state.stock2 = 0; state.med2Count++;
            } else {
                medGiven = 'No disponible'; dosesGiven = 0;
            }
        }

        // Registrar en la tabla
        const tr = document.createElement('tr');
        tr.innerHTML = `<td>${state.totalPatients}</td><td>${s}</td><td>${d}</td><td>${result.categoria}</td><td>${medGiven}</td><td>${dosesGiven}</td>`;
        patientsTableBody.appendChild(tr);

        updateStatus();

        // Mensaje breve
        messageEl.textContent = `Paciente registrado. Categoría: ${result.categoria}. Medicación: ${medGiven}. Dosis: ${dosesGiven}.`;

        // Si alguna de las existencias se terminó -> finalizar
        if (state.stock1 === 0 || state.stock2 === 0) {
            finalize('Se agotó al menos uno de los medicamentos.');
            updateStatus();
        }
    });

    startBtn && startBtn.addEventListener('click', () => {
        const s1 = Number(stock1El.value);
        const s2 = Number(stock2El.value);
        if (!Number.isInteger(s1) || !Number.isInteger(s2) || s1 < 0 || s2 < 0) { alert('Ingrese existencias válidas (enteros >= 0).'); return; }
        state.stock1 = s1; state.stock2 = s2; state.initial1 = s1; state.initial2 = s2; state.running = true;
        inputsCard.classList.add('hidden');
        patientCard.classList.remove('hidden');
        statusCard.classList.remove('hidden');
        tableCard.classList.remove('hidden');
        summaryCard.classList.add('hidden');
        updateStatus();
        messageEl.textContent = 'Registro iniciado. Ingrese presiones y pulse Registrar.';
    });

    stopBtn && stopBtn.addEventListener('click', () => {
        finalize('Usuario detuvo el registro.');
    });

    resetBtn && resetBtn.addEventListener('click', () => {
        resetAll();
    });

    // Inicialización
    resetAll();

})();
