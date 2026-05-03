import { useState, useRef } from "react";
import axios from "axios";
import { translate } from "../utils/translator";

export const useEntitySave = (entity, id, onSuccess) => {
    const [isSaving, setIsSaving] = useState(false);
    const savingRef = useRef(false);

    const performSave = async (changesToSave, data, pendingStockAdjustment, pendingImageActions) => {
        if (savingRef.current) return;
        
        savingRef.current = true;
        setIsSaving(true);
        
        try {
            let finalData = data;

            // 1. Guardar cambios básicos
            if (Object.keys(changesToSave).length > 0) {
                const res = await axios.put(`/api/${entity}/${id}`, changesToSave);
                finalData = res.data;
            }

            // 2. Guardar ajuste de stock
            if (pendingStockAdjustment) {
                const stockRes = await axios.put(`/api/products/${id}/stock`, {
                    amount: pendingStockAdjustment.amount,
                    description: pendingStockAdjustment.description
                });
                finalData = stockRes.data;
            }

            // 3. Procesar cola de imágenes
            if (pendingImageActions.length > 0) {
                const translatedEntityIdField = translate(`${entity}Id`);

                for (const action of pendingImageActions) {
                    if (action.type === "delete") {
                        await axios.delete(`/api/images/${action.imageId}`);
                    } else if (action.type === "add") {
                        const formImage = new FormData();
                        formImage.append("file", action.file);
                        formImage.append(translatedEntityIdField, id);
                        formImage.append("altText", "Imagen");
                        formImage.append("isMain", "false");
                        formImage.append("order", "99");
                        await axios.post("/api/images/upload", formImage);
                    } else if (action.type === "set_main" && !action.isNew) {
                        await axios.put(`/api/images/${id}/set-main`, {
                            newProfilePicture: action.imageUrl,
                            entity,
                            imageId: action.imageId,
                        });
                    }
                }

                // Refetch para asegurar estado de imágenes
                const refreshed = await axios.get(`/api/${entity}/${id}`);
                finalData = refreshed.data;

                // Manejo especial para set_main de imagen recién subida
                const setMainNew = pendingImageActions.find(a => a.type === "set_main" && a.isNew);
                if (setMainNew && finalData.Image?.length > 0) {
                    const lastImg = finalData.Image[finalData.Image.length - 1];
                    await axios.put(`/api/images/${id}/set-main`, {
                        newProfilePicture: lastImg.url,
                        entity,
                        imageId: lastImg.id,
                    });
                    const refreshed2 = await axios.get(`/api/${entity}/${id}`);
                    finalData = refreshed2.data;
                }
            }

            if (onSuccess) onSuccess(finalData);
            return { success: true, data: finalData };

        } catch (err) {
            console.error("Error al guardar", err);
            return { 
                success: false, 
                message: err.response?.data?.message || "Hubo un error al guardar los cambios" 
            };
        } finally {
            savingRef.current = false;
            setIsSaving(false);
        }
    };

    // También incluimos las acciones rápidas para centralizar mutaciones
    const toggleActive = async (activeState) => {
        setIsSaving(true);
        try {
            const res = await axios.put(`/api/${entity}/${id}/active`, {
                isActive: activeState
            }, { withCredentials: true });
            if (onSuccess) onSuccess(res.data);
            return { success: true, data: res.data };
        } catch (err) {
            return { success: false, message: err.response?.data?.message || "Error al cambiar estado" };
        } finally {
            setIsSaving(false);
        }
    };

    return { performSave, toggleActive, isSaving };
};
