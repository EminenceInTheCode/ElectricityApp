// =========================================================================
// CONFIGURACIÓN DE PDF PROFESIONAL - DETECTOR INTELIGENTE DE HISTORIAL
// =========================================================================

// Función principal adaptativa (Soporta clics directos, IDs, objetos o eventos)
function generarPDF(datosAlternativos) {
    let objetoEncontrado = null;
    let elementoFila = null;

    // 1. SI NO VIENE NADA: Es el botón "Generar PDF" grande del panel principal
    if (!datosAlternativos || datosAlternativos instanceof Event || datosAlternativos.target) {
        // Verificamos si se hizo clic en un botón del historial pasando el evento
        const elementoClickeado = datosAlternativos?.target || datosAlternativos;
        if (elementoClickeado && typeof elementoClickeado.closest === 'function') {
            elementoFila = elementoClickeado.closest("tr");
        }
        
        // Si no es un botón de fila de tabla, leemos los campos del formulario principal
        if (!elementoFila) {
            capturarFormularioPrincipal();
            return;
        }
    }

    // 2. SI VIENE UN OBJETO DIRECTO: Lo usamos directamente
    if (datosAlternativos && typeof datosAlternativos === 'object' && !datosAlternativos.target) {
        objetoEncontrado = datosAlternativos;
    }

    // 3. SI VIENE UN TEXTO (Puede ser un JSON string o un ID de presupuesto como 'PRES-0001')
    if (typeof datosAlternativos === 'string') {
        const textoLimpio = datosAlternativos.trim();
        if (textoLimpio.startsWith("{") || textoLimpio.startsWith("[")) {
            try {
                objetoEncontrado = JSON.parse(textoLimpio);
            } catch (e) { console.error("Error parseando JSON", e); }
        }
        
        // Si no era JSON, asumimos que es un ID/Número. Lo buscamos en la base de datos local
        if (!objetoEncontrado) {
            objetoEncontrado = buscarPresupuestoEnMemoria(textoLimpio);
            
            // Si no está en memoria, buscamos la fila HTML de la tabla que contenga ese ID
            if (!objetoEncontrado) {
                const filas = document.querySelectorAll("table tr, tbody tr");
                for (let f of filas) {
                    if (f.innerText.includes(textoLimpio)) {
                        elementoFila = f;
                        break;
                    }
                }
            }
        }
    }

    // 4. SI VIENE UN NÚMERO: Es un ID numérico o un índice de fila
    if (typeof datosAlternativos === 'number') {
        objetoEncontrado = buscarPresupuestoEnMemoria(datosAlternativos) || window.presupuestos?.[datosAlternativos];
    }

    // 5. RESPALDO ABSOLUTO: Si encontramos la fila de la tabla pero no los datos en memoria, los extraemos de la pantalla
    if (elementoFila && !objetoEncontrado) {
        const celdas = elementoFila.querySelectorAll("td");
        if (celdas.length >= 4) {
            const numPresupuesto = celdas[0].innerText.trim();
            const nombreCompleto = celdas[1].innerText.trim().split(" ");
            const primerNombre = nombreCompleto[0] || "Cliente";
            const apellidoRestante = nombreCompleto.slice(1).join(" ") || "";
            const fechaPresupuesto = celdas[2].innerText.trim();
            const totalPresupuesto = celdas[3].innerText.trim().replace("$", "").trim();

            objetoEncontrado = {
                numero: numPresupuesto,
                nombre: primerNombre,
                apellido: apellidoRestante,
                fecha: fechaPresupuesto,
                vencimiento: fechaPresupuesto,
                total: totalPresupuesto,
                subtotalMO: document.getElementById("subtotal-mo")?.innerText || totalPresupuesto,
                subtotalMat: document.getElementById("subtotal-mat")?.innerText || "0",
                trabajos: extraerFilasDeTabla("trabajos"),
                materiales: extraerFilasDeTabla("materiales")
            };
        }
    }

    // Si logramos armar o encontrar el objeto, lo mandamos a construir
    if (objetoEncontrado) {
        mapearYConstruir(objetoEncontrado);
    } else {
        // Caída final segura: Lee la pantalla actual
        capturarFormularioPrincipal();
    }
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

// BUSCADOR INTERNO EN LOCALSTORAGE Y VARIABLES GLOBALES
function buscarPresupuestoEnMemoria(idBuscado) {
    const idStr = idBuscado.toString().trim();
    const llavesStorage = ["presupuestos", "listaPresupuestos", "presupuestoPDF", "historial", "presupuestos_cache"];
    
    // Buscar en LocalStorage
    for (let k of llavesStorage) {
        try {
            const copia = localStorage.getItem(k);
            if (copia) {
                const datos = JSON.parse(copia);
                if (Array.isArray(datos)) {
                    let encontrado = datos.find(i => (i.id?.toString() === idStr || i.numero?.toString() === idStr || i.numero_presupuesto?.toString() === idStr));
                    if (encontrado) return encontrado;
                }
            }
        } catch(e) {}
    }

    // Buscar en variables globales que use tu script.js
    const globales = ["presupuestos", "listaPresupuestos", "todosLosPresupuestos", "dataPresupuestos"];
    for (let g of globales) {
        if (window[g] && Array.isArray(window[g])) {
            let encontrado = window[g].find(i => (i.id?.toString() === idStr || i.numero?.toString() === idStr || i.numero_presupuesto?.toString() === idStr));
            if (encontrado) return encontrado;
        }
    }
    return null;
}

// ENLACES DIRECTOS PARA TU SCRIPT.JS (Redirecciona cualquier variante de nombre de función)
function generarPDFFromStorage(d) { generarPDF(d); }
function generarPDFDesdeHistorial(d) { generarPDF(d); }
function imprimirPresupuesto(d) { generarPDF(d); }
function descargarPDF(d) { generarPDF(d); }
function verPDF(d) { generarPDF(d); }

// TRADUCTOR DE CAMPOS DE BASE DE DATOS (Soporta snake_case de Supabase)
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
        trabajos: normalizarLista(p.trabajos || p.detalles || p.items_mano_obra || []),
        materiales: normalizarLista(p.materiales || p.items_materiales || [])
    };

    // Si los detalles de las filas están vacíos, intentamos capturar lo que esté en las tablas visuales
    if (pLimpio.trabajos.length === 0) pLimpio.trabajos = extraerFilasDeTabla("trabajos");
    if (pLimpio.materiales.length === 0) pLimpio.materiales = extraerFilasDeTabla("materiales");

    construirPDF(pLimpio);
}

function normalizarLista(lista) {
    if (!Array.isArray(lista)) return [];
    return lista.map(i => ({
        trabajo: i.trabajo || i.descripcion || i.detalle || i.item || "Servicio",
        cantidad: i.cantidad || i.cant || "1",
        precio: (i.precio || i.precio_unitario || "0").toString().replace("$", ""),
        total: (i.total || "0").toString().replace("$", "")
    })).filter(i => i.trabajo.trim() !== "");
}

// EXTRACTOR SEGURO DE TABLAS HTML
function extraerFilasDeTabla(idTabla) {
    const tabla = document.getElementById(idTabla) || document.querySelector(`#${idTabla}`);
    if (!tabla) return [];
    
    const resultado = [];
    const filas = tabla.querySelectorAll("tbody tr, tr");
    
    filas.forEach(fila => {
        if (fila.querySelector("th")) return;
        
        const inputs = fila.querySelectorAll("input, textarea");
        if (inputs.length >= 2) {
            let desc = ""; let cant = "1"; let prec = "0";
            inputs.forEach((input, index) => {
                if (input.type === "text" || input.tagName === "TEXTAREA") desc = input.value;
                if (input.type === "number" && index === 1) cant = input.value;
                if (input.type === "number" && index === 2) prec = input.value;
            });
            if (!desc && inputs[0]) desc = inputs[0].value;
            if (desc.trim() !== "") {
                let tCalc = (parseFloat(cant) || 1) * (parseFloat(prec) || 0);
                resultado.push({ trabajo: desc, cantidad: cant || "1", precio: parseFloat(prec).toLocaleString("es-AR"), total: tCalc.toLocaleString("es-AR") });
            }
        } else {
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

// MOTOR DE RENDERIZADO GRÁFICO DEL PDF MEJORADO
function construirPDF(p) {
    const { jsPDF } = window.jspdf;
    const doc = new jsPDF({ orientation: "p", unit: "mm", format: "a4" });

    const primaryColor = [3, 96, 235];   
    const successColor = [2, 196, 105];  
    const darkColor = [40, 44, 52];     
    const grayColor = [110, 120, 130];   
    const lightBg = [248, 249, 250];     

    // Logo decorativo estilizado
    doc.setFillColor(primaryColor[0], primaryColor[1], primaryColor[2]);
    doc.rect(15, 15, 12, 12, "F");
    doc.setTextColor(255, 255, 255);
    doc.setFont("Helvetica", "bold");
    doc.setFontSize(14);
    doc.text("⚡", 18, 23);

    // Nombre Empresa
    doc.setFontSize(22);
    doc.setTextColor(darkColor[0], darkColor[1], darkColor[2]);
    doc.text("ELECTRICIDAD", 32, 21);
    doc.setFont("Helvetica", "normal");
    doc.setFontSize(9);
    doc.setTextColor(grayColor[0], grayColor[1], grayColor[2]);
    doc.text("Instalaciones Eléctricas • Mantenimiento • Obras", 32, 26);

    // Caja Datos del Documento
    doc.setFillColor(lightBg[0], lightBg[1], lightBg[2]);
    doc.rect(130, 15, 65, 22, "F");
    doc.setFont("Helvetica", "bold");
    doc.setFontSize(11);
    doc.setTextColor(primaryColor[0], primaryColor[1], primaryColor[2]);
    doc.text("PRESUPUESTO", 135, 21);
    doc.setFont("Helvetica", "normal");
    doc.setFontSize(9);
    doc.setTextColor(darkColor[0], darkColor[1], darkColor[2]);
    doc.text(`N°: ${p.numero}`, 135, 26);
    doc.text(`Fecha: ${formatearFecha(p.fecha)}`, 135, 31);

    doc.setDrawColor(220, 225, 230);
    doc.line(15, 42, 195, 42);

    // Bloque Información Cliente y Validez
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

    // Tabla de Mano de Obra
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

    // Tabla de Materiales
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

    // Notas y Observaciones
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

    // Totales
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

    // Caja del Total Destacado en Verde Éxito
    doc.setFillColor(lightBg[0], lightBg[1], lightBg[2]);
    doc.rect(130, yTotales + offset + 2, 65, 10, "F");

    doc.setFont("Helvetica", "bold");
    doc.setFontSize(12);
    doc.setTextColor(successColor[0], successColor[1], successColor[2]);
    doc.text("TOTAL:", 134, yTotales + offset + 8.5);
    doc.text(p.total.includes("$") ? p.total : `$${p.total}`, 191, yTotales + offset + 8.5, { align: "right" });

    // Pie de página de firmas
    doc.setDrawColor(210, 215, 220);
    doc.line(65, 268, 145, 268);
    doc.setFont("Helvetica", "normal");
    doc.setFontSize(8.5);
    doc.setTextColor(grayColor[0], grayColor[1], grayColor[2]);
    doc.text("Firma o Sello del Técnico Responsable", 105, 273, { align: "center" });

    const nombreArchivo = `Presupuesto_${p.numero}_${p.nombre}_${p.apellido}.pdf`.replace(/\s+/g, "_");
    doc.save(nombreArchivo);
}

function formatearFecha(fechaString) {
    if (!fechaString) return "";
    const partes = fechaString.split("-");
    if (partes.length !== 3) return fechaString;
    return `${partes[2]}/${partes[1]}/${partes[0]}`;
}