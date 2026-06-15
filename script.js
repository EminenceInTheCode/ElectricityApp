// ==========================================
// 1. CONSTANTES Y CONFIGURACIÓN INICIAL
// ==========================================
const precios = {
    "Visita / Presupuesto": 52201,
    "Hora de trabajo": 52201,
    "Punto simple": 18611,
    "Toma doble": 23573,
    "Punto combinación": 20032,
    "Artefacto aplique simple": 28561,
    "Spot LED": 28561,
    "Ventilador de techo": 104220,
    "Ventilador con luminaria": 130315,
    "PAT (Jabalina)": 156271,
    "Tablero principal": 307873,
    "Cambio de toma": 22000,
    "Cambio de punto": 25000,
    "Cambio de térmica": 30000,
    "Instalación de aplique": 28561
};

document.addEventListener("DOMContentLoaded", () => {
    generarNumeroPresupuesto();

    const hoy = new Date();
    const hoyStr = hoy.toISOString().split("T")[0];
    document.getElementById("fecha").value = hoyStr;
    
    // Ponemos las fechas de hoy por defecto en el anotador de tareas
    if(document.getElementById("agendaFechaHable")) document.getElementById("agendaFechaHable").value = hoyStr;
    if(document.getElementById("agendaFechaIr")) document.getElementById("agendaFechaIr").value = hoyStr;

    const vencimiento = new Date();
    vencimiento.setDate(vencimiento.getDate() + 14);
    document.getElementById("vencimiento").value = vencimiento.toISOString().split("T")[0];

    cargarListaClientes();
    agregarTrabajo();
    cargarHistorial();
    cargarAgenda(); // Carga los trabajos guardados en la agenda
});

// ==========================================
// 2. LÓGICA DE CLIENTES (CRM)
// ==========================================
function cargarListaClientes() {
    const presupuestos = JSON.parse(localStorage.getItem("presupuestos")) || [];
    const select = document.getElementById("clienteSelect");
    select.innerHTML = '<option value="">-- Cargar como cliente nuevo --</option>';

    const clientesUnicos = [];
    const telefonosVistos = new Set();

    [...presupuestos].reverse().forEach(p => {
        if (p.telefono && !telefonosVistos.has(p.telefono)) {
            telefonosVistos.add(p.telefono);
            clientesUnicos.push(p);
        }
    });

    clientesUnicos.forEach(c => {
        const option = document.createElement("option");
        option.value = JSON.stringify(c);
        option.text = `${c.nombre} ${c.apellido} - ${c.telefono}`;
        select.appendChild(option);
    });
}

function cargarDatosCliente() {
    const select = document.getElementById("clienteSelect");
    if (select.value) {
        const c = JSON.parse(select.value);
        document.getElementById("nombre").value = c.nombre;
        document.getElementById("apellido").value = c.apellido;
        document.getElementById("telefono").value = c.telefono;
        document.getElementById("email").value = c.email;
        document.getElementById("direccion").value = c.direccion;
        document.getElementById("localidad").value = c.localidad;
    } else {
        document.querySelectorAll("#nombre, #apellido, #telefono, #email, #direccion, #localidad").forEach(input => input.value = "");
    }
}

// ==========================================
// 3. LÓGICA DE PRESUPUESTOS Y CÁLCULOS
// ==========================================
function generarNumeroPresupuesto() {
    const ultimo = Number(localStorage.getItem("ultimoPresupuesto")) || 0;
    const numero = "PRES-" + String(ultimo + 1).padStart(4, "0");
    document.getElementById("numeroPresupuesto").value = numero;
}

function agregarTrabajo() {
    const tbody = document.getElementById("trabajos");
    const fila = document.createElement("tr");

    fila.innerHTML = `
        <td>
            <select onchange="actualizar(this)">
                ${Object.keys(precios).map(p => `<option>${p}</option>`).join("")}
            </select>
        </td>
        <td><input type="number" value="1" min="1" onchange="actualizar(this)"></td>
        <td class="precio">52201</td>
        <td class="total">52.201</td>
        <td><button onclick="eliminarFila(this)">❌</button></td>
    `;
    tbody.appendChild(fila);
    calcularTotal();
}

function actualizar(elemento) {
    const fila = elemento.closest("tr");
    const trabajo = fila.querySelector("select").value;
    const cantidad = Number(fila.querySelector("input").value) || 1;
    const precio = precios[trabajo];

    fila.querySelector(".precio").innerText = precio.toLocaleString("es-AR");
    fila.querySelector(".total").innerText = (precio * cantidad).toLocaleString("es-AR");
    calcularTotal();
}

function agregarMaterial() {
    const tbody = document.getElementById("materiales");
    const fila = document.createElement("tr");

    fila.innerHTML = `
        <td><input type="text" placeholder="Ej: Cable 2.5mm Normalizado" oninput="actualizarMaterial(this)"></td>
        <td><input type="number" value="1" min="1" class="cant-mat" oninput="actualizarMaterial(this)"></td>
        <td>
            <div style="display:flex; align-items:center; gap:5px;">
                $ <input type="number" value="0" min="0" class="precio-mat" oninput="actualizarMaterial(this)">
            </div>
        </td>
        <td class="total-mat">0</td>
        <td><button onclick="eliminarFila(this)">❌</button></td>
    `;
    tbody.appendChild(fila);
    calcularTotal();
}

function actualizarMaterial(elemento) {
    const fila = elemento.closest("tr");
    const cantidad = Number(fila.querySelector(".cant-mat").value) || 0;
    const precio = Number(fila.querySelector(".precio-mat").value) || 0;
    fila.querySelector(".total-mat").innerText = (cantidad * precio).toLocaleString("es-AR");
    calcularTotal();
}

function eliminarFila(btn) {
    btn.closest("tr").remove();
    calcularTotal();
}

function calcularTotal() {
    let subtotalMO = 0;
    document.querySelectorAll("#trabajos .total").forEach(celda => {
        subtotalMO += Number(celda.innerText.replace(/\./g, "").replace(/,/g, ""));
    });

    let subtotalMat = 0;
    document.querySelectorAll("#materiales .total-mat").forEach(celda => {
        subtotalMat += Number(celda.innerText.replace(/\./g, "").replace(/,/g, ""));
    });

    const ganancia = Number(document.getElementById("ganancia").value) || 0;
    const descuento = Number(document.getElementById("descuento").value) || 0;
    const viaticos = Number(document.getElementById("viaticos").value) || 0;

    let totalMO = subtotalMO;
    totalMO += subtotalMO * (ganancia / 100);
    totalMO -= subtotalMO * (descuento / 100);
    
    let total = totalMO + subtotalMat + viaticos;
    total = Math.round(total / 1000) * 1000;

    document.getElementById("subtotal-mo").innerText = subtotalMO.toLocaleString("es-AR");
    document.getElementById("subtotal-mat").innerText = subtotalMat.toLocaleString("es-AR");
    document.getElementById("totalGeneral").innerText = total.toLocaleString("es-AR");
}

function obtenerFilas(selector, isMaterial = false) {
    let array = [];
    document.querySelectorAll(`${selector} tr`).forEach(fila => {
        if(isMaterial) {
            array.push({
                trabajo: fila.querySelector("input[type='text']").value || "Material",
                cantidad: fila.querySelector(".cant-mat").value,
                precio: fila.querySelector(".precio-mat").value,
                total: fila.querySelector(".total-mat").innerText
            });
        } else {
            array.push({
                trabajo: fila.querySelector("select").value,
                cantidad: fila.querySelector("input").value,
                precio: fila.querySelector(".precio").innerText,
                total: fila.querySelector(".total").innerText
            });
        }
    });
    return array;
}

// ==========================================
// 4. GESTIÓN DE LOCALSTORAGE E HISTORIAL
// ==========================================
function guardarPresupuesto() {
    const presupuesto = {
        numero: document.getElementById("numeroPresupuesto").value,
        fecha: document.getElementById("fecha").value,
        vencimiento: document.getElementById("vencimiento").value,
        nombre: document.getElementById("nombre").value,
        apellido: document.getElementById("apellido").value,
        telefono: document.getElementById("telefono").value,
        email: document.getElementById("email").value,
        direccion: document.getElementById("direccion").value,
        localidad: document.getElementById("localidad").value,
        observaciones: document.getElementById("observaciones").value,
        subtotalMO: document.getElementById("subtotal-mo").innerText,
        subtotalMat: document.getElementById("subtotal-mat").innerText,
        total: document.getElementById("totalGeneral").innerText,
        estado: document.getElementById("estado").value,
        trabajos: obtenerFilas("#trabajos", false),
        materiales: obtenerFilas("#materiales", true)
    };

    let presupuestos = JSON.parse(localStorage.getItem("presupuestos")) || [];
    presupuestos.push(presupuesto);
    localStorage.setItem("presupuestos", JSON.stringify(presupuestos));

    let ultimo = Number(localStorage.getItem("ultimoPresupuesto")) || 0;
    localStorage.setItem("ultimoPresupuesto", ultimo + 1);

    generarNumeroPresupuesto();
    cargarListaClientes();
    cargarHistorial();
    
    alert("Presupuesto guardado exitosamente");
}

function cargarHistorial() {
    const tbody = document.getElementById("historial");
    tbody.innerHTML = "";
    const presupuestos = JSON.parse(localStorage.getItem("presupuestos")) || [];

    let pendiente = 0, cobradoMes = 0;
    const hoy = new Date().toISOString().split("T")[0]; // Fecha de hoy en formato AAAA-MM-DD
    const mesActual = hoy.slice(0, 7); // "YYYY-MM"

    presupuestos.forEach((p, index) => {
        const monto = Number(p.total.replace(/\./g, "").replace(/,/g, "")) || 0;
        
        // LÓGICA DE ALERTA DE VENCIDO
        let estadoMostrar = p.estado;
        // Si está pendiente pero la fecha de vencimiento ya pasó (es menor a hoy)
        if (p.estado === "Pendiente" && p.vencimiento && p.vencimiento < hoy) {
            estadoMostrar = "Vencido";
        }

        // Sumamos al dashboard solo si realmente sigue Pendiente (los vencidos no se suman a "A cobrar")
        if (estadoMostrar === "Pendiente") pendiente += monto;
        if (p.estado === "Cobrado" && p.fecha.startsWith(mesActual)) cobradoMes += monto;

        tbody.innerHTML = `
        <tr>
            <td>${p.numero}</td>
            <td>${p.nombre} ${p.apellido}</td>
            <td>${p.fecha}</td>
            <td>$${p.total}</td>
            <td class="estado-${estadoMostrar}">${estadoMostrar}</td>
            <td>
                <button onclick="descargarPresupuesto(${index})">📄</button>
                <button onclick="cambiarEstado(${index})">🔄</button>
                <button onclick="eliminarPresupuesto(${index})">🗑️</button>
            </td>
        </tr>
        ` + tbody.innerHTML;
    });

    document.getElementById("dash-pendiente").innerText = "$" + pendiente.toLocaleString("es-AR");
    document.getElementById("dash-cobrado").innerText = "$" + cobradoMes.toLocaleString("es-AR");
    document.getElementById("dash-cantidad").innerText = presupuestos.length;
}

function eliminarPresupuesto(index) {
    if(confirm("¿Estás seguro de eliminar este presupuesto?")) {
        let presupuestos = JSON.parse(localStorage.getItem("presupuestos")) || [];
        presupuestos.splice(index, 1);
        localStorage.setItem("presupuestos", JSON.stringify(presupuestos));
        cargarHistorial();
    }
}

function cambiarEstado(index) {
    let presupuestos = JSON.parse(localStorage.getItem("presupuestos")) || [];
    const estados = ["Pendiente", "Aceptado", "Cobrado", "Rechazado"];
    
    let actual = estados.indexOf(presupuestos[index].estado);
    actual = (actual + 1) >= estados.length ? 0 : actual + 1;

    presupuestos[index].estado = estados[actual];
    localStorage.setItem("presupuestos", JSON.stringify(presupuestos));
    cargarHistorial();
}

function descargarPresupuesto(index) {
    const presupuestos = JSON.parse(localStorage.getItem("presupuestos")) || [];
    localStorage.setItem("presupuestoPDF", JSON.stringify(presupuestos[index]));
    generarPDFFromStorage(); 
}

// ==========================================
// 5. NUEVA LÓGICA: GESTIÓN DE LA AGENDA DE TRABAJOS
// ==========================================
function agregarTareaAgenda() {
    const descripcion = document.getElementById("agendaTarea").value.trim();
    const fechaHable = document.getElementById("agendaFechaHable").value;
    const fechaIr = document.getElementById("agendaFechaIr").value;
    const estado = document.getElementById("agendaEstado").value;

    if (!descripcion) {
        alert("Por favor, escribe qué trabajo tienes que hacer.");
        return;
    }

    const nuevaTarea = {
        id: Date.now(),
        descripcion,
        fechaHable,
        fechaIr,
        estado
    };

    let tareas = JSON.parse(localStorage.getItem("agenda_tareas")) || [];
    tareas.push(nuevaTarea);
    localStorage.setItem("agenda_tareas", JSON.stringify(tareas));

    document.getElementById("agendaTarea").value = "";
    cargarAgenda();
}

function cargarAgenda() {
    const listaContenedor = document.getElementById("agendaLista");
    if(!listaContenedor) return;
    listaContenedor.innerHTML = "";
    
    let tareas = JSON.parse(localStorage.getItem("agenda_tareas")) || [];

    if (tareas.length === 0) {
        listaContenedor.innerHTML = '<p style="text-align:center; color:var(--text-muted); font-size:13px; margin-top:15px;">No tienes trabajos anotados.</p>';
        return;
    }

    // Ordenar: Pendientes primero, Aceptados al medio, Terminados al final
    tareas.sort((a, b) => {
        const orden = { "Pendiente": 1, "Aceptado": 2, "Terminado": 3 };
        return orden[a.estado] - orden[b.estado];
    });

    tareas.forEach(tarea => {
        const item = document.createElement("div");
        item.className = `tarea-item ${tarea.estado}`;
        
        item.innerHTML = `
            <h4>${tarea.descripcion}</h4>
            <div class="tarea-detalles">
                🗣️ <strong>Hablamos:</strong> ${tarea.fechaHable || 'Sin fecha'}<br>
                🚗 <strong>Tengo que ir:</strong> ${tarea.fechaIr || 'Sin fecha'}
            </div>
            <div style="display:flex; justify-content:between; align-items:center; gap:10px; margin-top:8px;">
                <span class="tarea-badge ${tarea.estado}">${tarea.estado}</span>
                <div style="margin-left:auto; display:flex; gap:5px;">
                    <button class="btn-tarea-status" onclick="ciclarEstadoTarea(${tarea.id})">🔄</button>
                    <button class="btn-tarea-delete" onclick="eliminarTareaAgenda(${tarea.id})">🗑️</button>
                </div>
            </div>
        `;
        listaContenedor.appendChild(item);
    });
}

function ciclarEstadoTarea(id) {
    let tareas = JSON.parse(localStorage.getItem("agenda_tareas")) || [];
    const estados = ["Pendiente", "Aceptado", "Terminado"];
    
    tareas = tareas.map(t => {
        if (t.id === id) {
            let indexActual = estados.indexOf(t.estado);
            indexActual = (indexActual + 1) % estados.length;
            t.estado = estados[indexActual];
        }
        return t;
    });

    localStorage.setItem("agenda_tareas", JSON.stringify(tareas));
    cargarAgenda();
}

function eliminarTareaAgenda(id) {
    if (confirm("¿Quieres quitar este trabajo de la agenda?")) {
        let tareas = JSON.parse(localStorage.getItem("agenda_tareas")) || [];
        tareas = tareas.filter(t => t.id !== id);
        localStorage.setItem("agenda_tareas", JSON.stringify(tareas));
        cargarAgenda();
    }
}

// ==========================================
// 6. FUNCIONES DE UTILIDAD GENERAL
// ==========================================
function toggleDarkMode() {
    document.body.classList.toggle("dark");
}

function generarDatosPrueba() {
    document.getElementById("nombre").value = "Juan";
    document.getElementById("apellido").value = "Perez";
    document.getElementById("telefono").value = "223" + Math.floor(1000000 + Math.random() * 9000000);
    document.getElementById("email").value = "juan.perez@gmail.com";
    document.getElementById("direccion").value = "Rivadavia 1234";
    document.getElementById("localidad").value = "Mar del Plata";
    calcularTotal();
}