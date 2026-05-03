import React, { useEffect, useRef } from "react";
import JsBarcode from "jsbarcode";

const BarcodePreview = ({ barcode }) => {
    const canvasRef = useRef(null);

    useEffect(() => {
        if (barcode && canvasRef.current) {
            try {
                JsBarcode(canvasRef.current, barcode, {
                    format: "CODE128",
                    displayValue: true,
                    fontSize: 16,
                    width: 2,
                    height: 50,
                    background: "#ffffff",
                    lineColor: "#000000"
                });
            } catch (err) {
                console.error("Error generating barcode preview:", err);
            }
        }
    }, [barcode]);

    if (!barcode) return null;

    return (
        <div className="flex flex-col items-center gap-2 p-4 bg-white rounded-lg border border-gray-200 shadow-sm mt-4">
            <p className="text-[10px] text-gray-500 uppercase font-bold tracking-widest">Vista Previa Etiqueta</p>
            <canvas ref={canvasRef}></canvas>
        </div>
    );
};

export default BarcodePreview;
