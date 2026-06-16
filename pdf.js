// =========================================================================
// CONFIGURACIÓN DE PDF PROFESIONAL - DETECTOR INTELIGENTE DE HISTORIAL
// =========================================================================

// Función principal adaptativa (Soporta clics directos, IDs, objetos o eventos)
function generarPDF(datosAlternativos) {
    let objetoEncontrado = null;
    let elementoFila = null;
    let idDesdeFila = null;

    // 1. IDENTIFICAR SI VIENE DE UN EVENTO DE CLIC EN EL HISTORIAL
    if (datosAlternativos && (datosAlternativos instanceof Event || datosAlternativos.target)) {
        const target = datosAlternativos.target;
        if (target && typeof target.closest === 'function') {
            elementoFila = target.closest("tr");
        }
    }

    // 2. SI SE HIZO CLIC EN UNA FILA, EXTRAEMOS EL NÚMERO DE PRESUPUESTO (Ej: PRES-0001)
    if (elementoFila) {
        const celdas = elementoFila.querySelectorAll("td");
        if (celdas.length > 0) {
            idDesdeFila = celdas[0].innerText.trim();
        }
    }

    // 3. DETERMINAR EL IDENTIFICADOR O EL OBJETO DIRECTO PASADO
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

    // 4. BUSQUEDA PRIORITARIA: Ir a buscar a Supabase/Memoria el objeto completo usando el ID/Número
    if (buscarPorID && !objetoEncontrado) {
        objetoEncontrado = buscarPresupuestoEnMemoria(buscarPorID);
    }

    // 5. CAÍDA DE SEGURIDAD 1: Si no se encontró en memoria, armamos el PDF con los datos visibles de la fila
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
                numero: numPresupuesto,
                nombre: primerNombre,
                apellido: apellidoRestante,
                fecha: fechaPresupuesto,
                vencimiento: fechaPresupuesto,
                total: totalPresupuesto,
                subtotalMO: totalPresupuesto,
                subtotalMat: "0",
                trabajos: [],
                materiales: []
            };
        }
    }

    // 6. CAÍDA DE SEGURIDAD 2: Si no viene de fila y no hay nada, lee el panel principal actual
    if (!objetoEncontrado) {
        capturarFormularioPrincipal();
        return;
    }

    // Mandar a mapear y construir
    mapearYConstruir(objetoEncontrado);
}

// CAPTURA LOS DATOS DEL FORMULARIO DE LA PANTALLA PRINCIPAL
function capturarFormularioPrincipal() {
    const presupuestoPantalla = {
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
        ganancia: document.getElementById("ganancia")?.value || "0",
        descuento: document.getElementById("descuento")?.value || "0",
        viaticos: document.getElementById("viaticos")?.value || "0",
        trabajos: extraerFilasDeTabla("trabajos"),
        materiales: extraerFilasDeTabla("materiales")
    };
    mapearYConstruir(presupuestoPantalla);
}

// BUSCADOR INTERNO EXHAUSTIVO EN LAS VARIABLES DE ALMACENAMIENTO
function buscarPresupuestoEnMemoria(idBuscado) {
    const idStr = idBuscado.toString().trim().toLowerCase();
    
    // Lista de nombres de variables donde tu script.js podría guardar los presupuestos de Supabase
    const llaves = ["presupuestos", "listaPresupuestos", "todosLosPresupuestos", "historial", "dataPresupuestos", "presupuestos_cache"];
    
    // Buscar en LocalStorage
    for (let k of llaves) {
        try {
            const copia = localStorage.getItem(k);
            if (copia) {
                const datos = JSON.parse(copia);
                if (Array.isArray(datos)) {
                    let enco = datos.find(i => 
                        (i.numero?.toString().toLowerCase() === idStr || 
                         i.numero_presupuesto?.toString().toLowerCase() === idStr || 
                         i.id?.toString().toLowerCase() === idStr)
                    );
                    if (enco) return enco;
                }
            }
        } catch(e) {}
    }

    // Buscar en el objeto global Window (donde se mapean los arrays en ejecución)
    for (let g of llaves) {
        if (window[g] && Array.isArray(window[g])) {
            let enco = window[g].find(i => 
                (i.numero?.toString().toLowerCase() === idStr || 
                 i.numero_presupuesto?.toString().toLowerCase() === idStr || 
                 i.id?.toString().toLowerCase() === idStr)
            );
            if (enco) return enco;
        }
    }
    return null;
}

// REDIRECCIONADORES DE NOMBRES DE FUNCIÓN COMUNES
function generarPDFFromStorage(d) { generarPDF(d); }
function generarPDFDesdeHistorial(d) { generarPDF(d); }
function imprimirPresupuesto(d) { generarPDF(d); }
function descargarPDF(d) { generarPDF(d); }
function verPDF(d) { generarPDF(d); }

// TRADUCTOR DE FORMATOS DE COLUMNAS (Soporta camelCase y snake_case de Supabase)
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
        subtotalMO: p.subtotalMO || p.subtotal_mo || "0",
        subtotalMat: p.subtotalMat || p.subtotal_mat || "0",
        total: p.total || p.total_general || "0",
        ganancia: p.ganancia || p.porcentaje_ganancia || "0",
        descuento: p.descuento || p.porcentaje_descuento || "0",
        viaticos: p.viaticos || p.costo_viaticos || "0",
        trabajos: normalizarLista(p.trabajos || p.detalles || p.items_mano_obra || p.items || []),
        materiales: normalizarLista(p.materiales || p.items_materiales || [])
    };

    // Si es un registro viejo sin ítems guardados, intenta manotear las tablas de la pantalla por las dudas
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

// EXTRACTOR SEGURO DE TABLAS HTML
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
            if (desc.trim() !== "") {
                resultado.push({ trabajo: desc, cantidad: cant, precio: celdaPrecio, total: celdaTotal });
            }
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
            if (desc.trim() !== "") {
                resultado.push({ trabajo: desc, cantidad: cant || "1", precio: parseFloat(prec).toLocaleString("es-AR"), total: celdaTotal });
            }
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

// MOTOR GRÁFICO DEL PDF MEJORADO (CON LOS DATOS DE IAN BUSTO)
function construirPDF(p) {
    const { jsPDF } = window.jspdf;
    const doc = new jsPDF({ orientation: "p", unit: "mm", format: "a4" });

    const primaryColor = [3, 96, 235];   
    const successColor = [2, 196, 105];  
    const darkColor = [40, 44, 52];     
    const grayColor = [110, 120, 130];   
    const lightBg = [248, 249, 250];     

    // Icono del Rayo
    doc.setFillColor(primaryColor[0], primaryColor[1], primaryColor[2]);
    doc.rect(15, 15, 12, 12, "F");
    doc.setTextColor(255, 255, 255);
    doc.setFont("Helvetica", "bold");
    doc.setFontSize(14);
    doc.text("⚡", 18, 23);

    // Encabezado Izquierdo
    doc.setFontSize(22);
    doc.setTextColor(darkColor[0], darkColor[1], darkColor[2]);
    doc.text("ELECTRICIDAD", 32, 21);
    doc.setFont("Helvetica", "normal");
    doc.setFontSize(9);
    doc.setTextColor(grayColor[0], grayColor[1], grayColor[2]);
    doc.text("Instalaciones Eléctricas • Mantenimiento • Obras", 32, 26);

    // --- DATOS CORPORATIVOS: IAN BUSTO ---
    let yPrestador = 19;
    doc.setFont("Helvetica", "bold");
    doc.setFontSize(10.5);
    doc.setTextColor(darkColor[0], darkColor[1], darkColor[2]);
    doc.text("Ian Busto", 118, yPrestador, { align: "right" });
    doc.setFont("Helvetica", "normal");
    doc.setFontSize(8.5);
    doc.setTextColor(grayColor[0], grayColor[1], grayColor[2]);
    doc.text("Técnico Electricista", 118, yPrestador + 4, { align: "right" });
    doc.text("Tel: +54 9 223 XXX-XXXX", 118, yPrestador + 8, { align: "right" }); // Modificá tu número acá directo

    // Bloque derecho de la Factura/Presupuesto
    doc.setFillColor(lightBg[0], lightBg[1], lightBg[2]);
    doc.rect(125, 15, 70, 22, "F");
    doc.setFont("Helvetica", "bold");
    doc.setFontSize(11);
    doc.setTextColor(primaryColor[0], primaryColor[1], primaryColor[2]);
    doc.text("PRESUPUESTO", 130, 21);
    doc.setFont("Helvetica", "normal");
    doc.setFontSize(9);
    doc.setTextColor(darkColor[0], darkColor[1], darkColor[2]);
    doc.text(`N°: ${p.numero}`, 130, 26);
    doc.text(`Fecha: ${formatearFecha(p.fecha)}`, 130, 31);

    doc.setDrawColor(220, 225, 230);
    doc.line(15, 42, 195, 42);

    // Sección Cliente
    let yClient = 49;
    doc.setFont("Helvetica", "bold");
    doc.setFontSize(10);
    doc.setTextColor(primaryColor[0], primaryColor[1], primaryColor[2]);
    doc.text("PREPARADO PARA:", 15, yClient);
    doc.setFont("Helvetica", "bold");
    doc.setFontSize(11);
    doc.setTextColor(darkColor[0], darkColor[1], darkColor[2]);
    doc.text(`${p.nombre} ${p.apellido}`, 15, yClient + 6);
    doc.setFont("Helvetica", "normal");
    doc.setFontSize(9);
    doc.setTextColor(grayColor[0], grayColor[1], grayColor[2]);
    doc.text(`Tel: ${p.telefono || "---"}`, 15, yClient + 11);
    doc.text(`Email: ${p.email || "---"}`, 15, yClient + 16);
    doc.text(`Dirección: ${p.direccion || "---"}, ${p.localidad || "---"}`, 15, yClient + 21);

    // Validez
    doc.setFont("Helvetica", "bold");
    doc.setFontSize(10);
    doc.setTextColor(primaryColor[0], primaryColor[1], primaryColor[2]);
    doc.text("VALIDEZ DEL TRABAJO:", 130, yClient);
    doc.setFont("Helvetica", "normal");
    doc.setFontSize(9);
    doc.setTextColor(darkColor[0], darkColor[1], darkColor[2]);
    doc.text(`Vence el: ${formatearFecha(p.vencimiento)}`, 130, yClient + 6);
    doc.text("Moneda: Pesos Argentinos ($)", 130, yClient + 11);

    let yStart = 82;

    // TABLA DE MANO DE OBRA
    if (p.trabajos && p.trabajos.length > 0) {
        doc.setFont("Helvetica", "bold");
        doc.setFontSize(11);
        doc.setTextColor(primaryColor[0], primaryColor[1], primaryColor[2]);
        doc.text("DETALLE DE MANO DE OBRA Y TAREAS", 15, yStart);

        const bodyTrabajos = p.trabajos.map(t => [
            t.trabajo,
            { content: t.cantidad.toString(), styles: { halign: "center" } },
            { content: t.precio.includes("$") ? t.precio : `$${t.precio}`, styles: { halign: "right" } },
            { content: t.total.includes("$") ? t.total : `$${t.total}`, styles: { halign: "right" } }
        ]);

        doc.autoTable({
            startY: yStart + 3,
            head: [["Descripción de la Tarea / Servicio", "Cant.", "Precio Unit.", "Total"]],
            body: bodyTrabajos,
            theme: "striped",
            headStyles: { fillColor: primaryColor, textColor: [255, 255, 255], fontStyle: "bold", fontSize: 9 },
            styles: { fontSize: 9, cellPadding: 3.5, textColor: darkColor },
            columnStyles: { 0: { cellWidth: "auto" }, 1: { cellWidth: 15 }, 2: { cellWidth: 28 }, 3: { cellWidth: 28 } },
            margin: { left: 15, right: 15 }
        });
        yStart = doc.lastAutoTable.finalY + 10;
    }

    // TABLA DE MATERIALES
    const tieneMat = p.materiales && p.materiales.length > 0 && p.materiales[0].trabajo.trim() !== "";
    if (tieneMat) {
        doc.setFont("Helvetica", "bold");
        doc.setFontSize(11);
        doc.setTextColor(primaryColor[0], primaryColor[1], primaryColor[2]);
        doc.text("MATERIALES PRESUPUESTADOS", 15, yStart);

        const bodyMateriales = p.materiales.map(m => [
            m.trabajo,
            { content: m.cantidad.toString(), styles: { halign: "center" } },
            { content: m.precio.includes("$") ? m.precio : `$${m.precio}`, styles: { halign: "right" } },
            { content: m.total.includes("$") ? m.total : `$${m.total}`, styles: { halign: "right" } }
        ]);

        doc.autoTable({
            startY: yStart + 3,
            head: [["Descripción del Material", "Cant.", "Precio Unit.", "Total"]],
            body: bodyMateriales,
            theme: "striped",
            headStyles: { fillColor: [80, 90, 100], textColor: [255, 255, 255], fontStyle: "bold", fontSize: 9 },
            styles: { fontSize: 9, cellPadding: 3.5, textColor: darkColor },
            columnStyles: { 0: { cellWidth: "auto" }, 1: { cellWidth: 15 }, 2: { cellWidth: 28 }, 3: { cellWidth: 28 } },
            margin: { left: 15, right: 15 }
        });
        yStart = doc.lastAutoTable.finalY + 10;
    }

    if (yStart > 220) { doc.addPage(); yStart = 20; }

    // Observaciones
    if (p.observaciones && p.observaciones.trim() !== "") {
        doc.setFont("Helvetica", "bold");
        doc.setFontSize(10);
        doc.setTextColor(darkColor[0], darkColor[1], darkColor[2]);
        doc.text("Notas y Condiciones de Servicio:", 15, yStart);
        doc.setFont("Helvetica", "normal");
        doc.setFontSize(9);
        doc.setTextColor(grayColor[0], grayColor[1], grayColor[2]);
        const lineasObs = doc.splitTextToSize(p.observaciones, 105);
        doc.text(lineasObs, 15, yStart + 5);
    }

    // Totales finales
    let yTotales = yStart;
    doc.setFont("Helvetica", "normal");
    doc.setFontSize(9.5);
    doc.setTextColor(darkColor[0], darkColor[1], darkColor[2]);

    doc.text("Subtotal Mano de Obra:", 130, yTotales);
    doc.text(p.subtotalMO.includes("$") ? p.subtotalMO : `$${p.subtotalMO}`, 195, yTotales, { align: "right" });

    doc.text("Subtotal Materiales:", 130, yTotales + 5);
    doc.text(p.subtotalMat.includes("$") ? p.subtotalMat : `$${p.subtotalMat}`, 195, yTotales + 5, { align: "right" });

    let offset = 10;
    if (Number(p.ganancia) > 0) {
        doc.text(`Ganancia M.O. (+${p.ganancia}%):`, 130, yTotales + offset);
        doc.text("Incluido", 195, yTotales + offset, { align: "right" });
        offset += 5;
    }
    if (Number(p.descuento) > 0) {
        doc.text(`Descuento M.O. (-${p.descuento}%):`, 130, yTotales + offset);
        doc.text("Incluido", 195, yTotales + offset, { align: "right" });
        offset += 5;
    }
    if (Number(p.viaticos) > 0) {
        doc.text("Viáticos / Traslados:", 130, yTotales + offset);
        doc.text(`+$${Number(p.viaticos).toLocaleString("es-AR")}`, 195, yTotales + offset, { align: "right" });
        offset += 5;
    }

    doc.setDrawColor(200, 205, 210);
    doc.line(130, yTotales + offset - 1, 195, yTotales + offset - 1);

    doc.setFillColor(lightBg[0], lightBg[1], lightBg[2]);
    doc.rect(130, yTotales + offset + 2, 65, 10, "F");

    doc.setFont("Helvetica", "bold");
    doc.setFontSize(12);
    doc.setTextColor(successColor[0], successColor[1], successColor[2]);
    doc.text("TOTAL:", 134, yTotales + offset + 8.5);
    doc.text(p.total.includes("$") ? p.total : `$${p.total}`, 191, yTotales + offset + 8.5, { align: "right" });

    // --- SECCIÓN DE FIRMA CON TU NOMBRE ---
    doc.setDrawColor(210, 215, 220);
    doc.line(65, 268, 145, 268);
    doc.setFont("Helvetica", "bold");
    doc.setFontSize(9);
    doc.setTextColor(darkColor[0], darkColor[1], darkColor[2]);
    doc.text("Ian Busto", 105, 272, { align: "center" });
    doc.setFont("Helvetica", "normal");
    doc.setFontSize(8);
    doc.setTextColor(grayColor[0], grayColor[1], grayColor[2]);
    doc.text("Técnico Electricista Responsable", 105, 276, { align: "center" });

    const nombreArchivo = `Presupuesto_${p.numero}_${p.nombre}_${p.apellido}.pdf`.replace(/\s+/g, "_");
    doc.save(nombreArchivo);
}

function formatearFecha(fechaString) {
    if (!fechaString) return "";
    const partes = fechaString.split("-");
    if (partes.length !== 3) return fechaString;
    return `${partes[2]}/${partes[1]}/${partes[0]}`;
}