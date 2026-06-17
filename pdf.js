// =========================================================================
// CONFIGURACIÓN DE PDF PROFESIONAL - VERSIÓN ULTRA COMPACTA
// =========================================================================

function generarPDF(datosAlternativos) {
    let objetoEncontrado = null;
    let elementoFila = null;
    let idDesdeFila = null;

    if (datosAlternativos && (datosAlternativos instanceof Event || datosAlternativos.target)) {
        const target = datosAlternativos.target;
        if (target && typeof target.closest === 'function') elementoFila = target.closest("tr");
    }

    if (elementoFila) {
        const celdas = elementoFila.querySelectorAll("td");
        if (celdas.length > 0) idDesdeFila = celdas[0].innerText.trim();
    }

    let buscarPorID = idDesdeFila;

    if (datosAlternativos && typeof datosAlternativos === 'object' && !(datosAlternativos instanceof Event) && !datosAlternativos.target) {
        objetoEncontrado = datosAlternativos;
    } else if (typeof datosAlternativos === 'string') {
        const textoLimpio = datosAlternativos.trim();
        if (textoLimpio.startsWith("{") || textoLimpio.startsWith("[")) {
            try { objetoEncontrado = JSON.parse(textoLimpio); } catch (e) {}
        } else {
            buscarPorID = textoLimpio;
        }
    } else if (typeof datosAlternativos === 'number') {
        buscarPorID = datosAlternativos.toString();
    }

    if (buscarPorID && !objetoEncontrado) objetoEncontrado = buscarPresupuestoEnMemoria(buscarPorID);

    if (elementoFila && !objetoEncontrado) {
        const celdas = elementoFila.querySelectorAll("td");
        if (celdas.length >= 4) {
            const numPresupuesto = celdas[0].innerText.trim();
            const nombreCompleto = celdas[1].innerText.trim().split(" ");
            const primerNombre = nombreCompleto[0] || "Cliente";
            const apellidoRestante = nombreCompleto.slice(1).join(" ") || "";
            const fechaPresupuesto = celdas[2].innerText.trim();
            const totalPresupuesto = celdas[3].innerText.trim().replace("$", "").replace(/\./g, "").trim();

            objetoEncontrado = {
                numero: numPresupuesto, nombre: primerNombre, apellido: apellidoRestante,
                fecha: fechaPresupuesto, vencimiento: fechaPresupuesto,
                total: totalPresupuesto, subtotalMO: totalPresupuesto, subtotalMat: "0",
                trabajos: [], materiales: []
            };
        }
    }

    if (!objetoEncontrado) { capturarFormularioPrincipal(); return; }
    mapearYConstruir(objetoEncontrado);
}

function capturarFormularioPrincipal() {
    const p = {
        numero: document.getElementById("numeroPresupuesto")?.value || "0001",
        fecha: document.getElementById("fecha")?.value || "",
        vencimiento: document.getElementById("vencimiento")?.value || "",
        nombre: document.getElementById("nombre")?.value || "Cliente",
        apellido: document.getElementById("apellido")?.value || "",
        telefono: document.getElementById("telefono")?.value || "",
        email: document.getElementById("email")?.value || "",
        direccion: document.getElementById("direccion")?.value || "",
        localidad: document.getElementById("localidad")?.value || "",
        observaciones: document.getElementById("observaciones")?.value || "",
        subtotalMO: document.getElementById("subtotal-mo")?.innerText || "0",
        subtotalMat: document.getElementById("subtotal-mat")?.innerText || "0",
        total: document.getElementById("totalGeneral")?.innerText || "0",
        trabajos: extraerFilasDeTabla("trabajos"),
        materiales: extraerFilasDeTabla("materiales")
    };
    mapearYConstruir(p);
}

function buscarPresupuestoEnMemoria(idBuscado) {
    const idStr = idBuscado.toString().trim().toLowerCase();
    const llaves = ["presupuestos", "listaPresupuestos", "todosLosPresupuestos", "historial", "dataPresupuestos", "presupuestos_cache"];
    
    for (let k of llaves) {
        try {
            const copia = localStorage.getItem(k);
            if (copia) {
                const datos = JSON.parse(copia);
                if (Array.isArray(datos)) {
                    let enco = datos.find(i => (i.numero?.toString().toLowerCase() === idStr || i.numero_presupuesto?.toString().toLowerCase() === idStr || i.id?.toString().toLowerCase() === idStr));
                    if (enco) return enco;
                }
            }
        } catch(e) {}
    }
    for (let g of llaves) {
        if (window[g] && Array.isArray(window[g])) {
            let enco = window[g].find(i => (i.numero?.toString().toLowerCase() === idStr || i.numero_presupuesto?.toString().toLowerCase() === idStr || i.id?.toString().toLowerCase() === idStr));
            if (enco) return enco;
        }
    }
    return null;
}

function generarPDFFromStorage(d) { generarPDF(d); }
function generarPDFDesdeHistorial(d) { generarPDF(d); }
function imprimirPresupuesto(d) { generarPDF(d); }
function descargarPDF(d) { generarPDF(d); }
function verPDF(d) { generarPDF(d); }

function mapearYConstruir(p) {
    if (!p) return;
    const pLimpio = {
        numero: p.numero || p.numero_presupuesto || p.id || "0001",
        fecha: p.fecha || p.fecha_emision || p.created_at || "",
        vencimiento: p.vencimiento || p.fecha_vencimiento || p.fecha || "",
        nombre: p.nombre || p.nombre_cliente || "Cliente",
        apellido: p.apellido || p.apellido_cliente || "",
        telefono: p.telefono || p.telefono_cliente || "",
        email: p.email || p.email_cliente || "",
        direccion: p.direccion || "",
        localidad: p.localidad || "",
        observaciones: p.observaciones || p.notas || "",
        subtotalMO: p.subtotalMO || p.subtotal_mo || p.subtotalManoObra || "0",
        subtotalMat: p.subtotalMat || p.subtotal_mat || p.subtotalMateriales || "0",
        total: p.total || p.total_general || "0",
        trabajos: normalizarLista(p.trabajos || p.detalles || p.items_mano_obra || p.items || []),
        materiales: normalizarLista(p.materiales || p.items_materiales || [])
    };

    if (pLimpio.trabajos.length === 0) pLimpio.trabajos = extraerFilasDeTabla("trabajos");
    if (pLimpio.materiales.length === 0) pLimpio.materiales = extraerFilasDeTabla("materiales");

    construirPDF(pLimpio);
}

function normalizarLista(lista) {
    if (!Array.isArray(lista)) return [];
    return lista.map(i => {
        let cant = i.cantidad || i.whitespace || i.cant || "1";
        return {
            trabajo: i.trabajo || i.descripcion || i.detalle || i.item || "Servicio",
            cantidad: cant.toString(),
            precio: (i.precio || i.precio_unitario || "0").toString().replace("$", "").trim(),
            total: (i.total || "0").toString().replace("$", "").trim()
        };
    }).filter(i => i.trabajo.trim() !== "");
}

function extraerFilasDeTabla(idTabla) {
    const tabla = document.getElementById(idTabla) || document.querySelector(`#${idTabla}`);
    if (!tabla) return [];
    const resultado = [];
    const filas = tabla.querySelectorAll("tbody tr, tr");
    
    filas.forEach(fila => {
        if (fila.querySelector("th")) return;
        const select = fila.querySelector("select");
        const inputs = fila.querySelectorAll("input, textarea");
        
        if (select && inputs.length >= 1) {
            const desc = select.value;
            const cant = inputs[0]?.value || "1";
            const celdaPrecio = fila.querySelector(".precio")?.innerText || "0";
            const celdaTotal = fila.querySelector(".total")?.innerText || "0";
            if (desc.trim() !== "") resultado.push({ trabajo: desc, cantidad: cant, precio: celdaPrecio, total: celdaTotal });
        } 
        else if (inputs.length >= 2) {
            let desc = ""; let cant = "1"; let prec = "0";
            inputs.forEach((input, index) => {
                if (input.type === "text" || input.tagName === "TEXTAREA") desc = input.value;
                if (input.classList.contains("cant-mat")) cant = input.value;
                if (input.classList.contains("precio-mat")) prec = input.value;
            });
            if (!desc && inputs[0]) desc = inputs[0].value;
            const celdaTotal = fila.querySelector(".total-mat")?.innerText || "0";
            if (desc.trim() !== "") resultado.push({ trabajo: desc, cantidad: cant || "1", precio: parseFloat(prec).toLocaleString("es-AR"), total: celdaTotal });
        } 
        else {
            const celdas = fila.querySelectorAll("td");
            if (celdas.length >= 4) {
                let cant = celdas[0].innerText.trim();
                let desc = celdas[1].innerText.trim();
                let prec = celdas[2].innerText.trim().replace("$", "").trim();
                let tot = celdas[3].innerText.trim().replace("$", "").trim();
                if (desc !== "" && !desc.includes("Subtotal") && !desc.includes("TOTAL") && !desc.includes("Acciones")) {
                    resultado.push({ trabajo: desc, cantidad: cant, precio: prec, total: tot });
                }
            }
        }
    });
    return resultado;
}

// DISEÑO COMPACTO Y OPTIMIZADO
function construirPDF(p) {
    const { jsPDF } = window.jspdf;
    const doc = new jsPDF({ orientation: "p", unit: "mm", format: "a4" });

    // Colores
    const primaryColor = [3, 96, 235];
    const successColor = [2, 196, 105];
    const darkColor = [40, 44, 52];

    // --- ENCABEZADO ACHICADO ---
    doc.setFillColor(primaryColor[0], primaryColor[1], primaryColor[2]);
    doc.rect(0, 0, 210, 25, "F"); 
    
    doc.setTextColor(255, 255, 255);
    doc.setFont("Helvetica", "bold");
    doc.setFontSize(16);
    doc.text("ELECTRICIDAD", 15, 12);
    doc.setFontSize(8);
    doc.setFont("Helvetica", "normal");
    doc.text("Instalaciones Eléctricas • Mantenimiento • Obras", 15, 17);
    
    doc.setFont("Helvetica", "bold");
    doc.setFontSize(12);
    doc.text("Ian Busto", 195, 14, { align: "right" });

    // --- DATOS AGRUPADOS ---
    doc.setFillColor(245, 245, 245);
    doc.rect(15, 30, 180, 28, "F");
    
    doc.setTextColor(darkColor[0], darkColor[1], darkColor[2]);
    doc.setFontSize(9);
    doc.setFont("Helvetica", "bold");
    doc.text(`PRESUPUESTO N°: ${p.numero}`, 20, 37);
    doc.text(`FECHA: ${formatearFecha(p.fecha)}`, 20, 43);
    doc.text(`VENCE: ${formatearFecha(p.vencimiento)}`, 20, 49);

    doc.text("CLIENTE:", 110, 37);
    doc.setFont("Helvetica", "normal");
    doc.text(`${p.nombre} ${p.apellido}`, 110, 43);
    doc.text(`Dir: ${p.direccion || "---"}`, 110, 49);
    doc.text(`Tel: ${p.telefono || "---"}`, 110, 55);

    // --- TABLAS ---
    let yStart = 65;
    const tableStyles = { fontSize: 8, cellPadding: 1.5 };
    const headStyles = { fillColor: primaryColor, textColor: 255 };

    if (p.trabajos && p.trabajos.length > 0) {
        doc.setFont("Helvetica", "bold");
        doc.setFontSize(9);
        doc.text("DETALLE DE MANO DE OBRA", 15, yStart);
        doc.autoTable({
            startY: yStart + 2,
            head: [["Descripción", "Cant.", "P. Unit.", "Total"]],
            body: p.trabajos.map(t => [t.trabajo, t.cantidad, t.precio, t.total]),
            theme: "striped", headStyles: headStyles, styles: tableStyles
        });
        yStart = doc.lastAutoTable.finalY + 8;
    }

    if (p.materiales && p.materiales.length > 0 && p.materiales[0].trabajo.trim() !== "") {
        doc.text("MATERIALES", 15, yStart);
        doc.autoTable({
            startY: yStart + 2,
            head: [["Descripción del Material", "Cant.", "P. Unit.", "Total"]],
            body: p.materiales.map(m => [m.trabajo, m.cantidad, m.precio, m.total]),
            theme: "striped", headStyles: { fillColor: [80, 80, 80] }, styles: tableStyles
        });
        yStart = doc.lastAutoTable.finalY + 8;
    }

    // --- TOTALES AL FINAL ---
    const yFinal = 260; 
    doc.setDrawColor(200, 200, 200);
    doc.line(130, yFinal - 5, 195, yFinal - 5);

    doc.setFont("Helvetica", "normal");
    doc.setFontSize(9);
    doc.text("Subtotal Mano de Obra:", 135, yFinal);
    doc.text(p.subtotalMO, 195, yFinal, { align: "right" });
    
    doc.text("Subtotal Materiales:", 135, yFinal + 5);
    doc.text(p.subtotalMat, 195, yFinal + 5, { align: "right" });

    doc.setFont("Helvetica", "bold");
    doc.setFontSize(12);
    doc.setTextColor(successColor[0], successColor[1], successColor[2]);
    doc.text("TOTAL:", 135, yFinal + 12);
    doc.text(p.total, 195, yFinal + 12, { align: "right" });

    doc.save(`Presupuesto_${p.numero}.pdf`);
}

function formatearFecha(fechaString) {
    if (!fechaString) return "";
    const partes = fechaString.split("-");
    if (partes.length !== 3) return fechaString;
    return `${partes[2]}/${partes[1]}/${partes[0]}`;
}