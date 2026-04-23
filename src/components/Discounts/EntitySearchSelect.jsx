/**
 * EntitySearchSelect.jsx
 * ─────────────────────────────────────────────────────────────────
 * Selector multi/single con búsqueda dinámica contra un endpoint existente.
 * Reutilizable para: Productos, Categorías, Clientes.
 *
 * Props:
 *  - endpoint: string          — 'products' | 'categories' | 'clients'
 *  - selectedIds: string[]     — IDs actualmente seleccionados
 *  - onChange: fn(string[])    — callback con el nuevo array de IDs
 *  - labelField: string         — campo del objeto a mostrar (ej: 'name')
 *  - labelFormat: fn(item)?    — función para formatear label (recibe item, retorna string)
 *  - subLabelField: string?   — campo secundario (ej: 'barcode', 'barcodePrefix')
 *  - placeholder: string?      — texto del input de búsqueda
 *  - single: boolean?          — si true, solo permite una selección
 * ─────────────────────────────────────────────────────────────────
 */

import { useEffect, useRef, useState } from 'react';
import axios from 'axios';
import { useTheme } from '../../context/ThemeContext';
import { v } from '../../styles/variables';
import { RiCloseLine } from 'react-icons/ri';

const EntitySearchSelect = ({
  endpoint,
  selectedIds = [],
  onChange,
  labelField = 'name',
  labelFormat = null, // función(item) → string
  subLabelField = null,
  placeholder = 'Buscar...',
  single = false,
}) => {
  const { theme }              = useTheme();
  const [items, setItems]      = useState([]);   // todos los activos del endpoint
  const [query, setQuery]      = useState('');
  const [isOpen, setIsOpen]    = useState(false);
  const [loading, setLoading]  = useState(false);
  const [error, setError]      = useState(null);
  const [highlightedIndex, setHighlightedIndex] = useState(-1);
  const containerRef           = useRef(null);

  // ── Fetch al endpoint al montar ─────────────────────────────────
  useEffect(() => {
    setLoading(true);
    setError(null);
    axios
      .get(`/api/${endpoint}`)
      .then((res) => {
        // Filtrar solo activos (todos los modelos tienen isActive)
        const active = (res.data ?? []).filter((item) => item.isActive !== false);
        setItems(active);
      })
      .catch(() => setError(`No se pudieron cargar los datos de ${endpoint}.`))
      .finally(() => setLoading(false));
  }, [endpoint]);

  // ── Cierra el dropdown al hacer click fuera ─────────────────────
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (containerRef.current && !containerRef.current.contains(e.target)) {
        setIsOpen(false);
        setHighlightedIndex(-1);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // ── Resetear highlightedIndex al cerrar ────────────────────────────
  useEffect(() => {
    if (!isOpen) {
      setHighlightedIndex(-1);
    }
  }, [isOpen]);

  // ── Keyboard navigation ────────────────────────────────────────────
  const handleKeyDown = (e) => {
    const items = filtered;
    if (items.length === 0) return;

    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setHighlightedIndex((i) => Math.min(i + 1, items.length - 1));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setHighlightedIndex((i) => Math.max(i - 1, 0));
    } else if (e.key === 'Enter' && highlightedIndex >= 0) {
      e.preventDefault();
      toggle(items[highlightedIndex].id);
    } else if (e.key === 'Escape') {
      setIsOpen(false);
      setHighlightedIndex(-1);
    }
  };

  // ── Buscar: por nombre, id, barcode y barcodePrefix ────────────
  const q = query.toLowerCase().trim();
  const filtered = items.filter((item) => {
    if (!q) return true;
    return (
      labelFormat ? labelFormat(item)?.toLowerCase().includes(q) : item[labelField]?.toLowerCase().includes(q) ||
      item.id?.toLowerCase().startsWith(q) ||
      item.barcode?.toLowerCase().includes(q) ||
      item.barcodePrefix?.toLowerCase().includes(q)
    );
  });

  // Items seleccionados (para los chips)
  const selectedItems = items.filter((item) => selectedIds.includes(item.id));

  // ── Acciones ────────────────────────────────────────────────────
  const toggle = (id) => {
    if (single) {
      onChange(selectedIds.includes(id) ? [] : [id]);
    } else {
      const next = selectedIds.includes(id)
        ? selectedIds.filter((s) => s !== id)
        : [...selectedIds, id];
      onChange(next);
    }
    setQuery('');
    setIsOpen(false);
  };

  const remove = (id) => onChange(selectedIds.filter((s) => s !== id));

  // ── Estilos ─────────────────────────────────────────────────────
  const inputStyle = {
    backgroundColor: theme.bg,
    color:           theme.text,
    border:          `1px solid ${theme.border}`,
    borderRadius:    v.borderRadius,
  };

  const dropdownStyle = {
    backgroundColor: theme.bg3,
    border:          `1px solid ${theme.border}`,
    boxShadow:       v.boxshadowGray,
  };

  const itemHoverStyle = (selected, highlighted) => ({
    backgroundColor: highlighted 
      ? '#0ea5e9'  // sky-500 - azul vívido para highlight
      : selected ? theme.infoBg : 'transparent',
    color: highlighted 
      ? '#ffffff'  // blanco para máximo contraste
      : selected ? theme.infoText : theme.text,
    fontWeight: highlighted ? '600' : '400',
  });

  const chipStyle = {
    backgroundColor: theme.bg2,
    color:           theme.text,
    border:          `1px solid ${theme.border}`,
  };

  return (
    <div ref={containerRef} className="relative">

      {/* Chips de seleccionados */}
      {selectedItems.length > 0 && (
        <div className="flex flex-wrap gap-1.5 mb-2">
          {selectedItems.map((item) => (
            <span
              key={item.id}
              className="flex items-center gap-1 text-xs px-2 py-1 rounded-full"
              style={chipStyle}
            >
              {labelFormat ? labelFormat(item) : item[labelField]}
              {subLabelField && item[subLabelField] && (
                <span className="opacity-50 font-mono"> · {item[subLabelField]}</span>
              )}
              <button
                type="button"
                onClick={() => remove(item.id)}
                className="hover:opacity-70 ml-0.5"
                title="Quitar"
              >
                <RiCloseLine size={12} />
              </button>
            </span>
          ))}
        </div>
      )}

      {/* Input de búsqueda */}
      <input
        type="text"
        value={query}
        onChange={(e) => { setQuery(e.target.value); setIsOpen(true); }}
        onFocus={() => setIsOpen(true)}
        onKeyDown={handleKeyDown}
        placeholder={loading ? 'Cargando...' : placeholder}
        disabled={loading}
        style={inputStyle}
        className="w-full p-2 border rounded text-sm"
      />

      {/* Error de fetch */}
      {error && (
        <p className="text-xs mt-1" style={{ color: theme.danger }}>
          {error}
        </p>
      )}

      {/* Dropdown */}
      {isOpen && !loading && !error && (
        <div
          className="absolute z-50 w-full mt-1 rounded-lg overflow-hidden max-h-52 overflow-y-auto"
          style={dropdownStyle}
        >
          {filtered.length === 0 ? (
            <p className="text-xs p-3" style={{ color: theme.colorSubtitle }}>
              {q ? 'Sin resultados para esa búsqueda.' : 'No hay items disponibles.'}
            </p>
          ) : (
            filtered.map((item, idx) => {
              const isSelected = selectedIds.includes(item.id);
              const isHighlighted = idx === highlightedIndex;
              return (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => toggle(item.id)}
                  className="w-full text-left px-3 py-2 text-sm flex items-center justify-between hover:opacity-80 transition-colors"
                  style={itemHoverStyle(isSelected, isHighlighted)}
                >
                  <span className="flex flex-col">
                    <span className="font-medium">{labelFormat ? labelFormat(item) : item[labelField]}</span>
                    {subLabelField && item[subLabelField] && (
                      <span className="text-xs font-mono opacity-50">
                        {item[subLabelField]}
                      </span>
                    )}
                  </span>
                  {isSelected && <span className="text-xs font-bold">✓</span>}
                </button>
              );
            })
          )}
        </div>
      )}
    </div>
  );
};

export default EntitySearchSelect;
