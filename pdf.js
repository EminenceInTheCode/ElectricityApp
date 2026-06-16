// ==========================================
// CONFIGURACIÓN DE GENERACIÓN DE PDF PROFESIONAL
// ==========================================

// Función principal llamada desde el botón "Generar PDF" del panel
function generarPDF() {
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
        ganancia: document.getElementById("ganancia").value,
        descuento: document.getElementById("descuento").value,
        viaticos: document.getElementById("viaticos").value,
        trabajos: obtenerFilas("#trabajos", false),
        materiales: obtenerFilas("#materiales", true)
    };

    if (!presupuesto.nombre && !presupuesto.apellido) {
        alert("Por favor, cargá los datos del cliente para poder generar el PDF.");
        return;
    }

    construirPDF(presupuesto);
}

// Función que se ejecuta al presionar el botón de la hoja (📄) en el Historial
function generarPDFFromStorage() {
    const data = localStorage.getItem("presupuestoPDF");
    if (!data) return;
    const presupuesto = JSON.parse(data);
    construirPDF(presupuesto);
}

// ARQUITECTURA Y DISEÑO DEL PDF
function construirPDF(p) {
    const { jsPDF } = window.jspdf;
    const doc = new jsPDF({ orientation: "p", unit: "mm", format: "a4" });

    // --- PALETA DE COLORES (Basada en tu App) ---
    const primaryColor = [3, 96, 235];   // #0360eb Azul Eléctrico
    const successColor = [2, 196, 105];  // #02c469 Verde Total
    const darkColor = [40, 44, 52];     // Gris Carbón para texto principal
    const grayColor = [110, 120, 130];   // Gris Neutro para subtítulos
    const lightBg = [248, 249, 250];     // Fondo suave de bloques

    // --- ENCABEZADO DE MARCA ESTILIZADO ---
    // Bloque estético superior izquierdo
    doc.setFillColor(primaryColor[0], primaryColor[1], primaryColor[2]);
    doc.rect(15, 15, 12, 12, "F");
    
    // Icono del rayo centrado en el bloque blanco
    doc.setTextColor(255, 255, 255);
    doc.setFont("Helvetica", "bold");
    doc.setFontSize(14);
    doc.text("⚡", 18, 23);

    // Título de la empresa (Alineado con el bloque)
    doc.setFontSize(22);
    doc.setTextColor(darkColor[0], darkColor[1], darkColor[2]);
    doc.text("ELECTRICIDAD", 32, 21);
    
    doc.setFont("Helvetica", "normal");
    doc.setFontSize(9);
    doc.setTextColor(grayColor[0], grayColor[1], grayColor[2]);
    doc.text("Instalaciones Eléctricas • Mantenimiento • Obras", 32, 26);

    // --- BLOQUE DERECHO: DETALLES DEL DOCUMENTO ---
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

    // --- SECCIÓN: INFORMACIÓN DE LAS PARTES (Dos Columnas) ---
    doc.setDrawColor(220, 225, 230);
    doc.line(15, 42, 195, 42);

    let yClient = 49;
    // Columna 1: Datos del Cliente
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

    // Columna 2: Datos de Vencimiento / Términos
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

    // --- TABLA 1: DETALLE DE MANO DE OBRA ---
    if (p.trabajos && p.trabajos.length > 0) {
        doc.setFont("Helvetica", "bold");
        doc.setFontSize(11);
        doc.setTextColor(primaryColor[0], primaryColor[1], primaryColor[2]);
        doc.text("DETALLE DE MANO DE OBRA Y TAREAS", 15, yStart);

        const bodyTrabajos = p.trabajos.map(t => [
            t.trabajo,
            { content: t.cantidad.toString(), styles: { halign: "center" } },
            { content: `$${t.precio}`, styles: { halign: "right" } },
            { content: `$${t.total}`, styles: { halign: "right" } }
        ]);

        doc.autoTable({
            startY: yStart + 3,
            head: [["Descripción de la Tarea / Servicio", "Cant.", "Precio Unit.", "Total"]],
            body: bodyTrabajos,
            theme: "striped",
            headStyles: { fillColor: primaryColor, textColor: [255, 255, 255], fontStyle: "bold", fontSize: 9 },
            styles: { fontSize: 9, cellPadding: 3.5, textColor: darkColor },
            columnStyles: {
                0: { cellWidth: "auto" },
                1: { cellWidth: 15 },
                2: { cellWidth: 28 },
                3: { cellWidth: 28 }
            },
            margin: { left: 15, right: 15 }
        });
        yStart = doc.lastAutoTable.finalY + 10;
    }

    // --- TABLA 2: MATERIALES (Opcional - Inteligente) ---
    // Chequeamos si el primer material tiene texto cargado
    const tieneMateriales = p.materiales && p.materiales.length > 0 && p.materiales[0].trabajo.trim() !== "";
    
    if (tieneMateriales) {
        doc.setFont("Helvetica", "bold");
        doc.setFontSize(11);
        doc.setTextColor(primaryColor[0], primaryColor[1], primaryColor[2]);
        doc.text("MATERIALES PRESUPUESTADOS", 15, yStart);

        const bodyMateriales = p.materiales.map(m => [
            m.trabajo,
            { content: m.cantidad.toString(), styles: { halign: "center" } },
            { content: `$${Number(m.precio).toLocaleString("es-AR")}`, styles: { halign: "right" } },
            { content: `$${m.total}`, styles: { halign: "right" } }
        ]);

        doc.autoTable({
            startY: yStart + 3,
            head: [["Descripción del Material", "Cant.", "Precio Unit.", "Total"]],
            body: bodyMateriales,
            theme: "striped",
            headStyles: { fillColor: [80, 90, 100], textColor: [255, 255, 255], fontStyle: "bold", fontSize: 9 },
            styles: { fontSize: 9, cellPadding: 3.5, textColor: darkColor },
            columnStyles: {
                0: { cellWidth: "auto" },
                1: { cellWidth: 15 },
                2: { cellWidth: 28 },
                3: { cellWidth: 28 }
            },
            margin: { left: 15, right: 15 }
        });
        yStart = doc.lastAutoTable.finalY + 10;
    }

    // --- SECCIÓN INFERIOR: OBSERVACIONES Y TOTALES ---
    // Verificar si nos queda espacio suficiente en la página, sino saltar automáticamente
    if (yStart > 220) {
        doc.addPage();
        yStart = 20;
    }

    // Cuadro de Observaciones (Izquierda)
    if (p.observaciones && p.observaciones.trim() !== "") {
        doc.setFont("Helvetica", "bold");
        doc.setFontSize(10);
        doc.setTextColor(darkColor[0], darkColor[1], darkColor[2]);
        doc.text("Notas y Condiciones de Servicio:", 15, yStart);
        
        doc.setFont("Helvetica", "normal");
        doc.setFontSize(9);
        doc.setTextColor(grayColor[0], grayColor[1], grayColor[2]);
        
        // Evita desbordes automáticos del cuadro rompiendo las líneas largas
        const lineasObs = doc.splitTextToSize(p.observaciones, 105);
        doc.text(lineasObs, 15, yStart + 5);
    }

    // Desglose de Totales (Derecha alineada)
    let yTotales = yStart;
    doc.setFont("Helvetica", "normal");
    doc.setFontSize(9.5);
    doc.setTextColor(darkColor[0], darkColor[1], darkColor[2]);

    doc.text("Subtotal Mano de Obra:", 130, yTotales);
    doc.text(`$${p.subtotalMO}`, 195, yTotales, { align: "right" });

    doc.text("Subtotal Materiales:", 130, yTotales + 5);
    doc.text(`$${p.subtotalMat}`, 195, yTotales + 5, { align: "right" });

    let offset = 10;
    if (Number(p.ganancia) > 0 && p.ganancia !== "30") { // Muestra si fue modificada del estándar
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

    // Línea divisoria de Cierre
    doc.setDrawColor(200, 205, 210);
    doc.line(130, yTotales + offset - 1, 195, yTotales + offset - 1);

    // DESTACADO DEL TOTAL GENERAL
    doc.setFillColor(lightBg[0], lightBg[1], lightBg[2]);
    doc.rect(130, yTotales + offset + 2, 65, 10, "F");

    doc.setFont("Helvetica", "bold");
    doc.setFontSize(12);
    doc.setTextColor(successColor[0], successColor[1], successColor[2]); // Color verde de la app
    doc.text("TOTAL:", 134, yTotales + offset + 8.5);
    doc.text(`$${p.total}`, 191, yTotales + offset + 8.5, { align: "right" });

    // --- PIE DE PÁGINA (Línea de firma y pie técnico fijo) ---
    doc.setDrawColor(210, 215, 220);
    doc.line(65, 268, 145, 268);
    
    doc.setFont("Helvetica", "normal");
    doc.setFontSize(8.5);
    doc.setTextColor(grayColor[0], grayColor[1], grayColor[2]);
    doc.text("Firma o Sello del Técnico Responsable", 105, 273, { align: "center" });

    // Nombre del archivo dinámico y limpio
    const nombreArchivo = `Presupuesto_${p.numero}_${p.nombre}_${p.apellido}.pdf`.replace(/\s+/g, "_");
    doc.save(nombreArchivo);
}

// Convierte fechas de YYYY-MM-DD a DD/MM/YYYY para que se vea correcto en Argentina
function formatearFecha(fechaString) {
    if (!fechaString) return "";
    const partes = fechaString.split("-");
    if (partes.length !== 3) return fechaString;
    return `${partes[2]}/${partes[1]}/${partes[0]}`;
}