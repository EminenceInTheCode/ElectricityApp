async function generarPDF() {
    const { jsPDF } = window.jspdf;
    const doc = new jsPDF();

    const p = {
        numero: document.getElementById("numeroPresupuesto").value,
        fecha: document.getElementById("fecha").value,
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
        // Usamos las funciones de script.js para no repetir código
        trabajos: obtenerFilas("#trabajos", false),
        materiales: obtenerFilas("#materiales", true)
    };

    dibujarDocumento(doc, p);
}

function generarPDFFromStorage() {
    const p = JSON.parse(localStorage.getItem("presupuestoPDF"));
    if (!p) return;
    
    const { jsPDF } = window.jspdf;
    const doc = new jsPDF();
    dibujarDocumento(doc, p);
}

// Función centralizada para dibujar el PDF
function dibujarDocumento(doc, p) {
    // ENCABEZADO
    doc.setFontSize(20);
    doc.setTextColor(13, 110, 253); // Color azul primario
    doc.text("SIRDROLET ELECTRICIDAD", 14, 20);

    doc.setFontSize(10);
    doc.setTextColor(100, 100, 100);
    doc.text("Instalaciones eléctricas - Mantenimiento - Emergencias", 14, 28);
    doc.line(14, 32, 196, 32);

    // DATOS
    doc.setTextColor(0, 0, 0);
    doc.setFontSize(11);
    doc.text(`Presupuesto: ${p.numero}`, 14, 42);
    doc.text(`Fecha: ${p.fecha}`, 140, 42);

    doc.setFont("helvetica", "bold");
    doc.text("DATOS DEL CLIENTE", 14, 55);
    
    doc.setFont("helvetica", "normal");
    doc.text(`Nombre: ${p.nombre} ${p.apellido}`, 14, 63);
    doc.text(`Teléfono: ${p.telefono}`, 14, 70);
    doc.text(`Email: ${p.email}`, 14, 77);
    doc.text(`Dirección: ${p.direccion}`, 14, 84);
    doc.text(`Localidad: ${p.localidad}`, 14, 91);

    let startY = 105;

    // TABLA DE MANO DE OBRA
    if (p.trabajos && p.trabajos.length > 0) {
        doc.setFontSize(12);
        doc.setFont("helvetica", "bold");
        doc.text("Mano de Obra", 14, startY - 5);
        
        let filasMO = p.trabajos.map(t => [t.cantidad, t.trabajo, `$${t.precio}`, `$${t.total}`]);
        doc.autoTable({
            startY: startY,
            head: [["Cant.", "Descripción", "Precio Unit.", "Total"]],
            body: filasMO,
            theme: 'striped',
            headStyles: { fillColor: [13, 110, 253] }
        });
        startY = doc.lastAutoTable.finalY + 15;
    }

    // TABLA DE MATERIALES (Solo si existen)
    if (p.materiales && p.materiales.length > 0) {
        doc.setFontSize(12);
        doc.setFont("helvetica", "bold");
        doc.text("Materiales", 14, startY - 5);

        let filasMat = p.materiales.map(t => [t.cantidad, t.trabajo, `$${t.precio}`, `$${t.total}`]);
        doc.autoTable({
            startY: startY,
            head: [["Cant.", "Material", "Precio Unit.", "Total"]],
            body: filasMat,
            theme: 'grid',
            headStyles: { fillColor: [108, 117, 125] } // Color gris para diferenciar
        });
        startY = doc.lastAutoTable.finalY + 15;
    }

    // RESUMEN Y OBSERVACIONES
    doc.setFont("helvetica", "normal");
    doc.setFontSize(11);
    
    if(p.subtotalMat && p.subtotalMat !== "0") {
        doc.text(`Subtotal M.O.: $${p.subtotalMO}`, 130, startY);
        doc.text(`Subtotal Mat.: $${p.subtotalMat}`, 130, startY + 7);
        startY += 7;
    }

    doc.setFontSize(16);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(25, 135, 84); // Verde success
    doc.text(`TOTAL: $${p.total}`, 130, startY + 15);

    doc.setTextColor(0, 0, 0);
    doc.setFontSize(12);
    doc.text("OBSERVACIONES", 14, startY + 5);
    
    doc.setFont("helvetica", "normal");
    doc.setFontSize(10);
    const obsLines = doc.splitTextToSize(p.observaciones || "Sin observaciones.", 100);
    doc.text(obsLines, 14, startY + 12);

    // FIRMAS
    const firmaY = startY + 60 > 280 ? 270 : startY + 60; // Evitar que caiga fuera de la hoja
    
    doc.setDrawColor(150);
    doc.line(20, firmaY, 80, firmaY);
    doc.line(120, firmaY, 180, firmaY);
    
    doc.text("Firma Cliente", 35, firmaY + 8);
    doc.text("Firma Electricista", 130, firmaY + 8);

    doc.save(`${p.numero}.pdf`);
}