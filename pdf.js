// ==========================================
// CONFIGURACIÓN DE GENERACIÓN DE PDF PROFESIONAL (VERSIÓN ANTIBOMBAS)
// ==========================================

// Función principal llamada desde el botón "Generar PDF" del panel
function generarPDF() {
    // Capturamos los datos de la pantalla usando "?.value" y "?..innerText" 
    // para que si un ID no coincide, la app NO se rompa y siga adelante.
    const presupuesto = {
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
        // Usamos nuestro propio extractor seguro de tablas integrado abajo
        trabajos: extraerFilasDeTabla("trabajos"),
        materiales: extraerFilasDeTabla("materiales")
    };

    construirPDF(presupuesto);
}

// Función que se ejecuta al presionar el botón de la hoja (📄) en el Historial
function generarPDFFromStorage() {
    const data = localStorage.getItem("presupuestoPDF");
    if (!data) return;
    const presupuesto = JSON.parse(data);
    construirPDF(presupuesto);
}

// EXTRACTOR AUTOMÁTICO Y SEGURO DE TABLAS HTML
function extraerFilasDeTabla(idTabla) {
    const tabla = document.getElementById(idTabla) || document.querySelector(`#${idTabla}`);
    if (!tabla) return [];
    
    const resultado = [];
    const filas = tabla.querySelectorAll("tbody tr, tr");
    
    filas.forEach(fila => {
        // Ignoramos la fila si es el encabezado de la tabla
        if (fila.querySelector("th")) return;
        
        // Caso 1: La tabla tiene inputs (Formulario de carga)
        const inputs = fila.querySelectorAll("input, textarea");
        if (inputs.length >= 2) {
            let desc = "";
            let cant = "1";
            let prec = "0";
            let tot = "0";
            
            inputs.forEach((input, index) => {
                if (input.type === "text" || input.tagName === "TEXTAREA") desc = input.value;
                if (input.type === "number" && index === 1) cant = input.value;
                if (input.type === "number" && index === 2) prec = input.value;
            });
            
            // Si los inputs no tenían esos tipos, los sacamos por orden físico básico
            if (!desc && inputs[0]) desc = inputs[0].value;
            
            if (desc.trim() !== "") {
                let totalCalculado = (parseFloat(cant) || 1) * (parseFloat(prec) || 0);
                resultado.push({
                    trabajo: desc,
                    cantidad: cant || "1",
                    precio: parseFloat(prec).toLocaleString("es-AR") || "0",
                    total: totalCalculado.toLocaleString("es-AR")
                });
            }
        } 
        // Caso 2: La tabla tiene celdas de texto común (Historial o Vista estática)
        else {
            const celdas = fila.querySelectorAll("td");
            if (celdas.length >= 4) {
                // Según tu formato visual clásico: Cant, Trabajo, Precio, Total
                let cant = celdas[0].innerText.trim();
                let desc = celdas[1].innerText.trim();
                let prec = celdas[2].innerText.trim().replace("$", "");
                let tot = celdas[3].innerText.trim().replace("$", "");
                
                if (desc !== "" && !desc.includes("Subtotal") && !desc.includes("TOTAL")) {
                    resultado.push({ trabajo: desc, cantidad: cant, precio: prec, total: tot });
                }
            }
        }
    });
    return resultado;
}

// ARQUITECTURA Y DISEÑO DEL PDF MEJORADO
function construirPDF(p) {
    const { jsPDF } = window.jspdf;
    const doc = new jsPDF({ orientation: "p", unit: "mm", format: "a4" });

    // --- PALETA DE COLORES ---
    const primaryColor = [3, 96, 235];   // Azul Eléctrico
    const successColor = [2, 196, 105];  // Verde Éxito
    const darkColor = [40, 44, 52];     // Gris Carbón
    const grayColor = [110, 120, 130];   // Gris Neutro
    const lightBg = [248, 249, 250];     // Fondo bloques

    // --- ENCABEZADO DE MARCA ---
    doc.setFillColor(primaryColor[0], primaryColor[1], primaryColor[2]);
    doc.rect(15, 15, 12, 12, "F");
    
    doc.setTextColor(255, 255, 255);
    doc.setFont("Helvetica", "bold");
    doc.setFontSize(14);
    doc.text("⚡", 18, 23);

    doc.setFontSize(22);
    doc.setTextColor(darkColor[0], darkColor[1], darkColor[2]);
    doc.text("ELECTRICIDAD", 32, 21);
    
    doc.setFont("Helvetica", "normal");
    doc.setFontSize(9);
    doc.setTextColor(grayColor[0], grayColor[1], grayColor[2]);
    doc.text("Instalaciones Eléctricas • Mantenimiento • Obras", 32, 26);

    // Detalle Documento (Bloque Derecho)
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

    // --- INFORMACIÓN DEL CLIENTE ---
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

    // --- TABLA 1: MANO DE OBRA ---
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

    // --- TABLA 2: MATERIALES ---
    if (p.materiales && p.materiales.length > 0) {
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

    if (yStart > 220) {
        doc.addPage();
        yStart = 20;
    }

    // --- OBSERVACIONES Y TOTALES ---
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

    // --- PIE DE PÁGINA ---
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