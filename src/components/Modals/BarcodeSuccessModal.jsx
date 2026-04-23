import React, { useRef, useState, useEffect } from "react";
import Modal from "./Modal";
import ThemedButton from "../ThemedButton";
import { useTheme } from "../../context/ThemeContext";
import JsBarcode from "jsbarcode";

const BarcodeSuccessModal = ({ isOpen, onClose, product }) => {
  const { theme } = useTheme();
  const printRef = useRef();

  if (!product) return null;

  useEffect(() => {
    if (isOpen && product?.barcode) {
      setTimeout(() => {
        const element = document.getElementById("barcode-modal-preview");
        if (element) {
          JsBarcode(element, product.barcode, {
            format: "CODE128",
            displayValue: true,
            fontSize: 20,
            width: 2,
            height: 60,
            background: "#ffffff",
            lineColor: "#000000"
          });
        }
      }, 100);
    }
  }, [isOpen, product]);

  const handlePrint = () => {
    const windowUrl = 'about:blank';
    const uniqueName = new Date();
    const windowName = 'Print' + uniqueName.getTime();
    const printWindow = window.open(windowUrl, windowName, 'left=50000,top=50000,width=0,height=0');

    // Generar la URL de la imagen del código de barras usando un canvas oculto
    const canvas = document.createElement("canvas");
    try {
      JsBarcode(canvas, product.barcode, {
        format: "CODE128",
        displayValue: true,
        fontSize: 20,
        margin: 10,
        width: 2,
        height: 60
      });
    } catch (error) {
      console.error("Error generando barcode:", error);
      alert("Error al generar el código de barras.");
      printWindow.close();
      return;
    }
    const barcodeDataUrl = canvas.toDataURL("image/png");

    printWindow.document.head.innerHTML = `
      <title>Imprimir Etiqueta</title>
      <style>
        body { 
          font-family: Arial, sans-serif; 
          display: flex; 
          flex-direction: column; 
          align-items: center; 
          justify-content: center;
          padding: 20px;
          text-align: center;
          margin: 0;
        }
        .name { font-weight: bold; font-size: 18px; margin-bottom: 5px; }
        .barcode-container { margin: 10px 0; }
      </style>
    `;

    printWindow.document.body.innerHTML = `
      <h3 class="name"></h3>
      <div class="barcode-container">
        <img class="barcode" src="${barcodeDataUrl}" alt="Barcode" />
      </div>
    `;

    printWindow.document.body.querySelector('.name').textContent = product.name;
    
    printWindow.onload = () => {
      printWindow.print();
      printWindow.close();
    };

    setTimeout(() => {
      if (!printWindow.closed) {
        printWindow.print();
        printWindow.close();
      }
    }, 500);
    printWindow.focus();
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="¡Operación Exitosa!" maxWidth="max-w-fit">
      <div className="flex flex-col items-center gap-4 p-4 text-center min-w-[300px]">
        <div className="mb-2">
          <h2 className="text-xl font-bold" style={{ color: theme.success }}>
            Producto "{product.name}" creado con éxito
          </h2>
          <p className="text-sm opacity-60 mt-1">Se ha generado el siguiente código de identificación:</p>
        </div>

        {product.profilePicture && (
          <img
            src={product.profilePicture}
            alt={product.name}
            className="w-32 h-32 object-cover rounded-lg border shadow-sm"
            style={{ borderColor: theme.bg3 }}
          />
        )}

        <div ref={printRef} className="flex flex-col items-center bg-white p-6 rounded-xl border border-dashed w-full shadow-inner" style={{ borderColor: theme.bg4 }}>
          <h3 className="name text-lg font-bold mb-2 text-black">{product.name}</h3>

          <div className="barcode-preview-container bg-white p-4 rounded border">
            <canvas id="barcode-modal-preview"></canvas>
          </div>

          <div className="mt-4 flex flex-col items-center">
            <span className="text-xs uppercase tracking-widest opacity-50 mb-1 text-black/50">Código para ingreso manual</span>
            <p className="number text-2xl font-mono font-bold tracking-[0.3em] text-black">
              {product.barcode}
            </p>
          </div>
        </div>

        <div className="flex gap-4 mt-4 w-full">
          <ThemedButton onClick={handlePrint} className="flex-1 py-3 font-bold">
            🖨️ Imprimir Etiqueta
          </ThemedButton>
          <ThemedButton onClick={onClose} className="flex-1 py-3 font-bold" style={{ backgroundColor: theme.bg3, color: theme.text }}>
            Cerrar
          </ThemedButton>
        </div>
      </div>
    </Modal>
  );
};

export default BarcodeSuccessModal;
