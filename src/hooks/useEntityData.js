import { useState, useEffect, useCallback } from "react";
import axios from "axios";

export const useEntityData = (entity, id) => {
    const [data, setData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [categories, setCategories] = useState([]);
    const [activeProductsCount, setActiveProductsCount] = useState(0);

    const fetchData = useCallback(async () => {
        setLoading(true);
        setError(null);
        try {
            const res = await axios.get(`/api/${entity}/${id}`);
            setData(res.data);
            
            // Lógica específica para categorías
            if (entity === "categories") {
                const prodRes = await axios.get(`/api/products?categoryId=${id}`);
                const activeOnes = prodRes.data.filter(p => p.isActive !== false);
                setActiveProductsCount(activeOnes.length);
            }
        } catch (err) {
            console.error(`Error cargando ${entity}`, err);
            setError(err);
        } finally {
            setLoading(false);
        }
    }, [entity, id]);

    // Cargar categorías si es un producto
    useEffect(() => {
        if (entity === "products") {
            axios.get("/api/categories")
                .then(res => setCategories(res.data))
                .catch(err => console.error("Error fetching categories:", err));
        }
    }, [entity]);

    useEffect(() => {
        if (id) {
            fetchData();
        }
    }, [fetchData, id]);

    return { 
        data, 
        setData, 
        loading, 
        error, 
        fetchData, 
        categories, 
        activeProductsCount 
    };
};
