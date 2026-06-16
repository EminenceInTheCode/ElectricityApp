// ==========================================
// CONFIGURACIÓN DE GENERACIÓN DE PDF
// ==========================================

// Función principal que se llama desde el botón "Generar PDF" de la app
function generarPDF() {
    // Capturamos los datos actuales de la pantalla
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

    // Validamos que al menos tenga el nombre del cliente
    if (!presupuesto.nombre) {
        alert("Por favor, ingresá al menos el nombre del cliente para generar el PDF.");
        return;
    }

    // Ejecutamos el armador de PDF pasándole los datos
    construirPDF(presupuesto);
}

// Función que se llama desde el historial al tocar el botón del PDF 📄
function generarPDFFromStorage() {
    const data = localStorage.getItem("presupuestoPDF");
    if (!data) return;
    const presupuesto = JSON.parse(data);
    construirPDF(presupuesto);
}

// LÓGICA DE MAQUETADO DEL PRESUPUESTO EN PDF
function construirPDF(p) {
    const { jsPDF } = window.jspdf;
    const doc = new jsPDF({ orientation: "p", unit: "mm", format: "a4" });

    // --- Colores de marca (Azul Eléctrico Profesional) ---
    const primaryColor = [3, 96, 235]; 
    const darkColor = [51, 51, 51];
    const grayColor = [102, 102, 102];

    // --- ENCABEZADO PRINCIPAL ---
    // Barra decorativa superior azul
    doc.setFillColor(primaryColor[0], primaryColor[1], primaryColor[2]);
    doc.rect(0, 0, 210, 8, "F");

    // Icono / Logo Rayo Eléctrico
    doc.setFont("Helvetica", "bold");
    doc.setFontSize(38);
    doc.setTextColor(primaryColor[0], primaryColor[1], primaryColor[2]);
    doc.text("⚡", 15, 26);

    // Nombre de la Empresa / Rubro
    doc.setFontSize(22);
    doc.setTextColor(darkColor[0], darkColor[1], darkColor[2]);
    doc.text("ELECTRICIDAD", 32, 20);
    
    doc.setFont("Helvetica", "normal");
    doc.setFontSize(10);
    doc.setTextColor(grayColor[0], grayColor[1], grayColor[2]);
    doc.text("Instalaciones Eléctricas - Mantenimiento - Obras", 32, 25);

    // Bloque derecho: Datos del presupuesto
    doc.setFont("Helvetica", "bold");
    doc.setFontSize(14);
    doc.setTextColor(primaryColor[0], primaryColor[1], primaryColor[2]);
    doc.text(`PRESUPUESTO`, 140, 18);
    
    doc.setFontSize(11);
    doc.setTextColor(darkColor[0], darkColor[1], darkColor[2]);
    doc.text(`N°: ${p.numero}`, 140, 24);
    
    doc.setFont("Helvetica", "normal");
    doc.setFontSize(9);
    doc.text(`Fecha emisión: ${formatearFecha(p.fecha)}`, 140, 29);
    doc.text(`Vencimiento: ${formatearFecha(p.vencimiento)}`, 140, 34);

    // Línea divisoria
    doc.setDrawColor(220, 226, 230);
    doc.line(15, 40, 195, 40);

    // --- SECCIÓN: DATOS DEL CLIENTE ---
    doc.setFont("Helvetica", "bold");
    doc.setFontSize(11);
    doc.setTextColor(primaryColor[0], primaryColor[1], primaryColor[2]);
    doc.text("DATOS DEL CLIENTE", 15, 48);

    doc.setFont("Helvetica", "normal");
    doc.setFontSize(10);
    doc.setTextColor(darkColor[0], darkColor[1], darkColor[2]);
    
    // Armamos texto formateado para el cliente
    const infoClienteIzquierda = [
        `Cliente: ${p.nombre} ${p.apellido}`,
        `Teléfono: ${p.telefono || "No especificado"}`,
        `Email: ${p.email || "No especificado"}`
    ];
    const infoClienteDerecha = [
        `Dirección: ${p.direccion || "No especificada"}`,
        `Localidad: ${p.localidad || "No especificada"}`
    ];

    doc.text(infoClienteIzquierda, 15, 55);
    doc.text(infoClienteDerecha, 110, 55);

    // Espacio base donde va a arrancar la primera tabla
    let yStart = 72;

    // --- TABLA 1: MANO DE OBRA ---
    if (p.trabajos && p.trabajos.length > 0) {
        doc.setFont("Helvetica", "bold");
        doc.setFontSize(11);
        doc.setTextColor(primaryColor[0], primaryColor[1], primaryColor[2]);
        doc.text("DETALLE DE TRABAJOS (MANO DE OBRA)", 15, yStart);

        const bodyTrabajos = p.trabajos.map(t => [
            t.trabajo, 
            t.cantidad.toString(), 
            `$${t.precio}`, 
            `$${t.total}`
        ]);

        doc.autoTable({
            startY: yStart + 3,
            head: [["Descripción del Trabajo", "Cant.", "Precio Unit.", "Subtotal"]],
            body: bodyTrabajos,
            theme: "striped",
            headStyles: { fillColor: primaryColor, textColor: [255, 255, 255], fontStyle: "bold" },
            styles: { fontSize: 9, cellPadding: 3 },
            columnStyles: {
                0: { cellWidth: "auto" },
                1: { halign: "center", cellWidth: 15 },
                2: { halign: "right", cellWidth: 30 },
                3: { halign: "right", cellWidth: 30 }
            }
        });
        yStart = doc.lastAutoTable.finalY + 10;
    }

    // --- TABLA 2: MATERIALES (Opcional, solo si hay cargados) ---
    // Filtramos si el primer material tiene texto para saber si el usuario cargó algo real
    const tieneMateriales = p.materiales && p.materiales.length > 0 && p.materiales[0].trabajo !== "";
    
    if (tieneMateriales) {
        doc.setFont("Helvetica", "bold");
        doc.setFontSize(11);
        doc.setTextColor(primaryColor[0], primaryColor[1], primaryColor[2]);
        doc.text("MATERIALES UTILIZADOS", 15, yStart);

        const bodyMateriales = p.materiales.map(m => [
            m.trabajo, 
            m.cantidad.toString(), 
            `$${Number(m.precio).toLocaleString("es-AR")}`, 
            `$${m.total}`
        ]);

        doc.autoTable({
            startY: yStart + 3,
            head: [["Descripción del Material", "Cant.", "Precio Unit.", "Subtotal"]],
            body: bodyMateriales,
            theme: "striped",
            headStyles: { fillColor: [80, 90, 100], textColor: [255, 255, 255], fontStyle: "bold" },
            styles: { fontSize: 9, cellPadding: 3 },
            columnStyles: {
                0: { cellWidth: "auto" },
                1: { halign: "center", cellWidth: 15 },
                2: { halign: "right", cellWidth: 30 },
                3: { halign: "right", cellWidth: 30 }
            }
        });
        yStart = doc.lastAutoTable.finalY + 10;
    }

    // --- OBSERVACIONES ---
    if (p.observaciones && p.observaciones.trim() !== "") {
        doc.setFont("Helvetica", "bold");
        doc.setFontSize(10);
        doc.setTextColor(darkColor[0], darkColor[1], darkColor[2]);
        doc.text("Observaciones y condiciones:", 15, yStart);
        
        doc.setFont("Helvetica", "normal");
        doc.setFontSize(9);
        doc.setTextColor(grayColor[0], grayColor[1], grayColor[2]);
        
        // Ajustamos el texto largo para que no se desborde del margen del PDF
        const lineasObs = doc.splitTextToSize(p.observaciones, 110);
        doc.text(lineasObs, 15, yStart + 5);
    }

    // --- CUADRO DE TOTALES (Fijo a la derecha) ---
    let yTotales = yStart;
    doc.setFont("Helvetica", "normal");
    doc.setFontSize(10);
    doc.setTextColor(darkColor[0], darkColor[1], darkColor[2]);

    // Subtotales base
    doc.text(`Subtotal M. Obra:`, 135, yTotales);
    doc.text(`$${p.subtotalMO}`, 195, yTotales, { align: "right" });

    doc.text(`Subtotal Materiales:`, 135, yTotales + 5);
    doc.text(`$${p.subtotalMat}`, 195, yTotales + 5, { align: "right" });

    // Modificadores opcionales (solo los muestra si son mayores a cero)
    let offset = 10;
    if (Number(p.ganancia) > 0) {
        doc.text(`Ganancia M.O. (+${p.ganancia}%):`, 135, yTotales + offset);
        // El cálculo ya viene integrado en el total de la pantalla, así que solo indicamos el % configurado
        doc.text(`Incluido`, 195, yTotales + offset, { align: "right" });
        offset += 5;
    }
    if (Number(p.descuento) > 0) {
        doc.text(`Descuento M.O. (-${p.descuento}%):`, 135, yTotales + offset);
        doc.text(`Incluido`, 195, yTotales + offset, { align: "right" });
        offset += 5;
    }
    if (Number(p.viaticos) > 0) {
        doc.text(`Viáticos / Traslado:`, 135, yTotales + offset);
        doc.text(`+$${Number(p.viaticos).toLocaleString("es-AR")}`, 195, yTotales + offset, { align: "right" });
        offset += 5;
    }

    // Línea final antes del Total General
    doc.setDrawColor(180, 180, 180);
    doc.line(135, yTotales + offset - 2, 195, yTotales + offset - 2);

    // TOTAL GENERAL IMPONENTE
    doc.setFont("Helvetica", "bold");
    doc.setFontSize(14);
    doc.setTextColor(2, 196, 105); // Color Verde Éxito de tu app
    doc.text(`TOTAL FINAL:`, 135, yTotales + offset + 3);
    doc.text(`$${p.total}`, 195, yTotales + offset + 3, { align: "right" });

    // --- PIE DE PÁGINA Y FIRMA ---
    // Línea de firma (Fija abajo en el papel)
    doc.setDrawColor(200, 200, 200);
    doc.line(65, 265, 145, 265);
    doc.setFont("Helvetica", "normal");
    doc.setFontSize(9);
    doc.setTextColor(grayColor[0], grayColor[1], grayColor[2]);
    doc.text("Firma del Técnico Responsable", 105, 270, { align: "center" });

    // Guardar o descargar el PDF con el nombre del cliente y número
    doc.save(`Presupuesto_${p.numero}_${p.nombre}_${p.apellido}.pdf`);
}

// Función auxiliar para pasar las fechas de YYYY-MM-DD a DD/MM/YYYY
function formatearFecha(fechaString) {
    if (!fechaString) return "";
    const partes = fechaString.split("-");
    if (partes.length !== 3) return fechaString;
    return `${partes[2]}/${partes[1]}/${partes[0]}`;
}