// ==========================================
// CONFIGURACIÓN DE SUPABASE (CONEXIÓN EN LA NUBE)
// ==========================================
const SUPABASE_URL = "https://dxbicbhbkxvtupuezuct.supabase.co";
const SUPABASE_ANON_KEY = "sb_publishable_pGQiIj7rdMCu0LPbh30CgA_p7stNbsW";

const _supabase = supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

let presupuestosGlobales = [];

// ==========================================
// CONTROL DE ACCESO Y SESIÓN (AUTH)
// ==========================================
document.addEventListener("DOMContentLoaded", async () => {
    const { data: { session } } = await _supabase.auth.getSession();

    if (session) {
        document.getElementById("login-container").style.display = "none";
        await inicializarApp();
    } else {
        document.getElementById("login-container").style.display = "flex";
    }
});

async function iniciarSesion() {
    const email = document.getElementById("login-email").value.trim();
    const password = document.getElementById("login-password").value;
    const errorTxt = document.getElementById("login-error");

    errorTxt.style.display = "none";

    if (!email || !password) {
        errorTxt.innerText = "Por favor, completa todos los campos.";
        errorTxt.style.display = "block";
        return;
    }

    const { data, error } = await _supabase.auth.signInWithPassword({ email, password });

    if (error) {
        errorTxt.innerText = "Usuario o contraseña incorrectos.";
        errorTxt.style.display = "block";
    } else {
        document.getElementById("login-container").style.display = "none";
        await inicializarApp();
    }
}

async function cerrarSesion() {
    await _supabase.auth.signOut();
    window.location.reload();
}

async function inicializarApp() {
    await generarNumeroPresupuesto();

    const hoy = new Date();
    document.getElementById("fecha").value = hoy.toISOString().split("T")[0];

    const vencimiento = new Date();
    vencimiento.setDate(vencimiento.getDate() + 14);
    document.getElementById("vencimiento").value = vencimiento.toISOString().split("T")[0];

    agregarTrabajo();
    await cargarHistorial();
}

// ==========================================
// CONSTANTES Y CONFIGURACIÓN INICIAL
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

function cargarListaClientes() {
    const select = document.getElementById("clienteSelect");
    select.innerHTML = '<option value="">-- Cargar como cliente nuevo --</option>';

    const clientesUnicos = [];
    const telefonosVistos = new Set();

    [...presupuestosGlobales].reverse().forEach(p => {
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
        document.getElementById("nombre").value = c.nombre || "";
        document.getElementById("apellido").value = c.apellido || "";
        document.getElementById("telefono").value = c.telefono || "";
        document.getElementById("email").value = c.email || "";
        document.getElementById("direccion").value = c.direccion || "";
        document.getElementById("localidad").value = c.localidad || "";
    } else {
        document.querySelectorAll("#nombre, #apellido, #telefono, #email, #direccion, #localidad").forEach(input => input.value = "");
    }
}

async function generarNumeroPresupuesto() {
    const { data, error } = await _supabase
        .from('presupuestos')
        .select('numero')
        .order('id', { ascending: false })
        .limit(1);

    let ultimoNum = 0;
    if (data && data.length > 0) {
        const ultimoTexto = data[0].numero;
        ultimoNum = Number(ultimoTexto.replace("PRES-", "")) || 0;
    }
    
    const numero = "PRES-" + String(ultimoNum + 1).padStart(4, "0");
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
            const inputTxt = fila.querySelector("input[type='text']");
            array.push({
                trabajo: inputTxt ? inputTxt.value : "Material",
                cantidad: fila.querySelector(".cant-mat").value,
                precio: fila.querySelector(".precio-mat").value,
                total: fila.querySelector(".total-mat").innerText
            });
        } else {
            array.push({
                trabajo: fila.querySelector("select").value,
                whitespace: fila.querySelector("input").value,
                precio: fila.querySelector(".precio").innerText,
                total: fila.querySelector(".total").innerText
            });
        }
    });
    return array;
}

// ==========================================
// GESTIÓN DE BASE DE DATOS (SUPABASE)
// ==========================================
async function guardarPresupuesto() {
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

    const { error } = await _supabase.from('presupuestos').insert([presupuesto]);

    if (error) {
        alert("Error al guardar en la nube: " + error.message);
    } else {
        alert("Presupuesto guardado exitosamente!");
        await generarNumeroPresupuesto();
        await cargarHistorial();
    }
}

async function cargarHistorial() {
    const tbody = document.getElementById("historial");
    if(!tbody) return;
    tbody.innerHTML = "";

    const { data: presupuestos, error } = await _supabase
        .from('presupuestos')
        .select('*')
        .order('id', { ascending: true });

    if (error) {
        console.error(error);
        return;
    }

    // ⬇️ ACÁ ESTÁ EL PARCHE DE PERSISTENCIA PARA EL PDF ⬇️
    window.listaPresupuestos = presupuestos || [];
    localStorage.setItem("listaPresupuestos", JSON.stringify(presupuestos || []));
    localStorage.setItem("presupuestos_cache", JSON.stringify(presupuestos || []));

    // Acá abajo sigue el resto de tu código que dibuja las filas en la tabla...
    presupuestosGlobales = presupuestos || [];

    let pendiente = 0, cobradoMes = 0;
    const hoy = new Date().toISOString().split("T")[0];
    const mesActual = hoy.slice(0, 7);

    presupuestosGlobales.forEach((p, index) => {
        const monto = Number(p.total.replace(/\./g, "").replace(/,/g, "")) || 0;
        
        let estadoMostrar = p.estado;
        if (p.estado === "Pendiente" && p.vencimiento && p.vencimiento < hoy) {
            estadoMostrar = "Vencido";
        }

        if (estadoMostrar === "Pendiente") pendiente += monto;
        if (p.estado === "Cobrado" && p.fecha.startsWith(mesActual)) cobradoMes += monto;

        // ⚠️ ATENCIÓN: Cambié el botón del PDF para que busque por número exacto y no por índice
        tbody.innerHTML = `
        <tr>
            <td>${p.numero}</td>
            <td>${p.nombre} ${p.apellido}</td>
            <td>${p.fecha}</td>
            <td>$${p.total}</td>
            <td class="estado-${estadoMostrar}">${estadoMostrar}</td>
            <td>
                <button onclick="generarPDF('${p.numero}')">📄</button>
                <button onclick="cambiarEstado(${index}, '${p.estado}', ${p.id})">🔄</button>
                <button onclick="eliminarPresupuesto(${p.id})">🗑️</button>
            </td>
        </tr>
        ` + tbody.innerHTML;
    });

    document.getElementById("dash-pendiente").innerText = "$" + pendiente.toLocaleString("es-AR");
    document.getElementById("dash-cobrado").innerText = "$" + cobradoMes.toLocaleString("es-AR");
    document.getElementById("dash-cantidad").innerText = presupuestosGlobales.length;

    cargarListaClientes();
}

async function eliminarPresupuesto(id) {
    if(confirm("¿Seguro de eliminar este presupuesto?")) {
        const { error } = await _supabase.from('presupuestos').delete().eq('id', id);
        await cargarHistorial();
    }
}

async function cambiarEstado(index, estadoActual, id) {
    const estados = ["Pendiente", "Aceptado", "Cobrado", "Rechazado"];
    let actual = estados.indexOf(estadoActual);
    actual = (actual + 1) >= estados.length ? 0 : actual + 1;
    const nuevoEstado = estados[actual];

    const { error } = await _supabase.from('presupuestos').update({ estado: nuevoEstado }).eq('id', id);
    await cargarHistorial();
}

function descargarPresupuesto(index) {
    localStorage.setItem("presupuestoPDF", JSON.stringify(presupuestosGlobales[index]));
    generarPDFFromStorage(); 
}

// ==========================================
// FUNCIONES DE UTILIDAD GEdNERAL
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