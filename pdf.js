async function generarPDF(){
    const { jsPDF } = window.jspdf;
    const doc = new jsPDF();

    const numero = document.getElementById("numeroPresupuesto").value;
    const fecha = document.getElementById("fecha").value;
    const nombre = document.getElementById("nombre").value;
    const apellido = document.getElementById("apellido").value;
    const telefono = document.getElementById("telefono").value;
    const email = document.getElementById("email").value;
    const direccion = document.getElementById("direccion").value;
    const localidad = document.getElementById("localidad").value;
    const observaciones = document.getElementById("observaciones").value;
    const subtotalMO = document.getElementById("subtotal-mo").innerText;
    const subtotalMat = document.getElementById("subtotal-mat").innerText;
    const total = document.getElementById("totalGeneral").innerText;

    doc.setFontSize(20);
    doc.text("SIRDROLET ELECTRICIDAD", 14, 20);

    doc.setFontSize(10);
    doc.text("Instalaciones eléctricas - Mantenimiento - Emergencias", 14, 28);
    doc.line(14, 32, 196, 32);

    // DATOS PRESUPUESTO
    doc.setFontSize(12);
    doc.text(`Presupuesto: ${numero}`, 14, 42);
    doc.text(`Fecha: ${fecha}`, 140, 42);

    // CLIENTE
    doc.setFontSize(14);
    doc.text("DATOS DEL CLIENTE", 14, 55);

    doc.setFontSize(11);
    doc.text(`Nombre: ${nombre} ${apellido}`, 14, 65);
    doc.text(`Telefono: ${telefono}`, 14, 72);
    doc.text(`Email: ${email}`, 14, 79);
    doc.text(`Direccion: ${direccion}`, 14, 86);
    doc.text(`Localidad: ${localidad}`, 14, 93);

    // TABLA
    let filas = [];
    document.querySelectorAll("#trabajos tr").forEach(fila => {
        const trabajo = fila.querySelector("select").value;
        const cantidad = fila.querySelector("input").value;
        const precio = fila.querySelector(".precio").innerText;
        const totalFila = fila.querySelector(".total").innerText;

        filas.push([
            cantidad,
            trabajo,
            `$${precio}`,
            `$${Number(totalFila.replace(/\./g, "")).toLocaleString("es-AR")}`
        ]);
    });

    doc.autoTable({
        startY: 105,
        head: [["Cant.", "Descripción", "Precio", "Total"]],
        body: filas
    });

    const y = doc.lastAutoTable.finalY + 15;

    // RESUMEN
    doc.text(`Subtotal M.O.: $${subtotalMO}`, 140, y);
    doc.text(`Subtotal Mat.: $${subtotalMat}`, 140, y + 8);

    doc.setFontSize(16);
    doc.text(`TOTAL: $${total}`, 140, y + 25);

    // OBSERVACIONES
    doc.setFontSize(12);
    doc.text("OBSERVACIONES", 14, y + 15);

    doc.setFontSize(10);
    const lineas = doc.splitTextToSize(observaciones || "Sin observaciones.", 100);
    doc.text(lineas, 14, y + 23);

    // FIRMAS
    const firmaY = y + 65;
    doc.line(20, firmaY, 80, firmaY);
    doc.line(120, firmaY, 180, firmaY);

    doc.text("Firma Cliente", 30, firmaY + 8);
    doc.text("Firma Electricista", 125, firmaY + 8);

    doc.save(`${numero}.pdf`);
}

function generarPDFFromStorage(){
    const p = JSON.parse(localStorage.getItem("presupuestoPDF"));
    if(!p) return;

    const { jsPDF } = window.jspdf;
    const doc = new jsPDF();

    doc.setFontSize(20);
    doc.text("SIRDROLET ELECTRICIDAD", 14, 20);

    doc.setFontSize(10);
    doc.text("Instalaciones eléctricas - Mantenimiento", 14, 28);
    doc.line(14, 32, 196, 32);

    doc.text(`Presupuesto: ${p.numero}`, 14, 45);
    doc.text(`Fecha: ${p.fecha}`, 140, 45);
    doc.text(`Cliente: ${p.nombre} ${p.apellido}`, 14, 60);
    doc.text(`Telefono: ${p.telefono}`, 14, 70);

    let filas = [];
    if (p.trabajos && Array.isArray(p.trabajos)) {
        p.trabajos.forEach(t => {
            filas.push([t.cantidad, t.trabajo, `$${t.precio}`, `$${t.total}`]);
        });
    }

    doc.autoTable({
        startY: 80,
        head: [["Cant.", "Trabajo", "Precio", "Total"]],
        body: filas
    });

    let y = doc.lastAutoTable.finalY + 15;

    doc.text(`Subtotal M.O.: $${p.subtotalMO || "0"}`, 140, y);
    doc.text(`Subtotal Mat.: $${p.subtotalMat || "0"}`, 140, y + 8);

    doc.setFontSize(16);
    doc.text(`Total: $${p.total}`, 140, y + 22);

    doc.save(`${p.numero}.pdf`);
}