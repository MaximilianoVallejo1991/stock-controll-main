// src/pages/sales/NewSale.jsx
import { useState, useMemo, useEffect } from "react";
import { useTheme } from "../../context/ThemeContext";
import { v } from "../../styles/variables";
import axios from "axios";
import SaleDetail from "./SaleDetail";
import ConfirmModal from "../../components/Modals/ConfirmModal";
import DiscountSummaryModal from "../../components/Modals/DiscountSummaryModal";
import useUserStore from "../../store/userStore";
import usePosStore from "../../store/posStore";
import { useNavigate } from "react-router-dom";
import { formatCurrency } from "../../utils/currency";
import { FaChevronUp, FaChevronDown, FaMagic, FaCheck, FaSearchPlus } from "react-icons/fa";
import Modal from "../../components/Modals/Modal";
import { useRef } from "react";

const NewSale = () => {
  const { theme } = useTheme();
  const navigate = useNavigate();
  // El usuario y contexto general ya son manejados por Zustand/Axios automágicamente.

  const {
    cart, setCart,
    search, setSearch,
    category, setCategory,
    paymentBreakdown,
    addPayment, updatePayment, removePayment,
    selectedClient, setSelectedClient,
    clientSearchText, setClientSearchText,
    clearPos
  } = usePosStore();

  const productListRef = useRef(null);
  const cartRef = useRef(null);
  const [showScrollUpProds, setShowScrollUpProds] = useState(false);
  const [showScrollDownProds, setShowScrollDownProds] = useState(false);
  const [showScrollUpCart, setShowScrollUpCart] = useState(false);
  const [showScrollDownCart, setShowScrollDownCart] = useState(false);

  const checkScroll = (ref, setUp, setDown) => {
    if (ref.current) {
      const { scrollTop, scrollHeight, clientHeight } = ref.current;
      setUp(scrollTop > 10);
      setDown(scrollTop + clientHeight < scrollHeight - 10);
    }
  };


  const [mockProducts, setMockProducts] = useState([]);
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [categories, setCategories] = useState(["Todas"]);
  const [isLoading, setIsLoading] = useState(true);
  const [currentSale, setCurrentSale] = useState(null);
  const [isConfirmOpen, setIsConfirmOpen] = useState(false);
  const [clients, setClients] = useState([]);
  const [showClientDropdown, setShowClientDropdown] = useState(false);
  const [newPaymentMethod, setNewPaymentMethod] = useState("Efectivo");
  const [newPaymentAmount, setNewPaymentAmount] = useState("");
  const [isSplitPayment, setIsSplitPayment] = useState(false);
  const [singleMethod, setSingleMethod] = useState("Efectivo");
  const [customerPayment, setCustomerPayment] = useState("");
  const [isDiscountModalOpen, setIsDiscountModalOpen] = useState(false);
  const [discountPreview, setDiscountPreview] = useState(null);
  const [preferredRuleIds, setPreferredRuleIds] = useState([]); 
  const [excludedRuleIds, setExcludedRuleIds] = useState([]);   // Reglas silenciadas manualmente (SC-3.0)
  const [isLoadingPreview, setIsLoadingPreview] = useState(false);
  const [isCartModalOpen, setIsCartModalOpen] = useState(false);

  useEffect(() => {
    // Si cambia el carrito, invalidamos el preview de descuentos para forzar un recálculo si deciden confirmar.
    setDiscountPreview(null);
  }, [cart]);

  useEffect(() => {
    setIsLoading(true);

    Promise.all([
      axios.get(`/api/categories`).then(res => res.data),
      axios.get(`/api/products`).then(res => res.data),
      axios.get(`/api/clients`).then(res => res.data)
    ])
      .then(([cats, prods, clis]) => {
        setCategories(["Todas", ...new Set(cats.map(c => c.name))]);

        setClients(Array.isArray(clis) ? clis : []);

        const mappedProducts = prods.filter(p => p.isActive).map(p => ({
          ...p,
          brand: "Genérico",
          barcode: p.barcode || p.id.substring(0, 5),
          category: p.category ? p.category.name : "Sin categoría"
        }));
        setMockProducts(mappedProducts);
      })
      .catch(err => console.error("Error fetching data:", err))
      .finally(() => setIsLoading(false));
  }, []);

  const filteredProducts = useMemo(() => {
    if (search.trim().length < 1 && category === "Todas") return [];

    return mockProducts.filter(p => {

      const matchCategory = category === "Todas" || p.category === category;
      const text = search.toLowerCase();
      const matchText =
        p.name.toLowerCase().includes(text) ||
        p.brand.toLowerCase().includes(text) ||
        p.barcode.includes(text);
      return matchCategory && matchText;
    });
  }, [search, category]);
  useEffect(() => {
    const prodEl = productListRef.current;
    const cartEl = cartRef.current;
    const handleScrollProds = () => checkScroll(productListRef, setShowScrollUpProds, setShowScrollDownProds);
    const handleScrollCart = () => checkScroll(cartRef, setShowScrollUpCart, setShowScrollDownCart);

    if (prodEl) {
      prodEl.addEventListener("scroll", handleScrollProds);
      // Initial check
      checkScroll(productListRef, setShowScrollUpProds, setShowScrollDownProds);
    }
    if (cartEl) {
      cartEl.addEventListener("scroll", handleScrollCart);
      checkScroll(cartRef, setShowScrollUpCart, setShowScrollDownCart);
    }

    return () => {
      if (prodEl) prodEl.removeEventListener("scroll", handleScrollProds);
      if (cartEl) cartEl.removeEventListener("scroll", handleScrollCart);
    };
  }, [filteredProducts, cart]);

  const scrollToExtreme = (ref, toBottom) => {
    if (ref.current) {
      ref.current.scrollTo({
        top: toBottom ? ref.current.scrollHeight : 0,
        behavior: "smooth"
      });
    }
  };

  const filteredClientsSearch = useMemo(() => {
    const activeClients = clients.filter(c => c.isActive !== false);
    if (!clientSearchText.trim()) return activeClients;

    const text = clientSearchText.toLowerCase();
    return activeClients.filter(c => {
      return c.isActive !== false && (
        c.firstName?.toLowerCase().includes(text) ||
        c.lastName?.toLowerCase().includes(text) ||
        c.dni?.includes(text)
      );
    });
  }, [clientSearchText, clients]);

  useEffect(() => {
    setSelectedIndex(0);
  }, [search, category]);

  const handleKeyDown = (e) => {
    if (!filteredProducts.length) return;

    if (e.key === "ArrowDown") {
      e.preventDefault();

      let next = selectedIndex;

      do {
        next++;
      } while (
        next < filteredProducts.length &&
        filteredProducts[next].stock === 0
      );

      if (next < filteredProducts.length) {
        setSelectedIndex(next);
      }
    }

    if (e.key === "ArrowUp") {
      e.preventDefault();
      setSelectedIndex(prev =>
        prev > 0 ? prev - 1 : prev
      );
    }

    if (e.key === "Enter") {
      e.preventDefault();

      const product = filteredProducts[selectedIndex];

      if (product.stock > 0) {
        addToCart(product);
      }
    }
  };

  const total = cart.reduce((acc, i) => acc + i.quantity * i.price, 0); // Este es el CRUDO sin descuentos (para validación)
  // Consumimos el TOTAL NETO del backend (cero cálculos front). Si no hay, es el total crudo.
  const netTotal = discountPreview ? Math.max(0.01, parseFloat((total - (discountPreview.discountTotal || 0)).toFixed(2))) : total;

  const totalPaid = paymentBreakdown.reduce((acc, p) => acc + p.amount, 0);
  const remaining = Math.max(0, netTotal - totalPaid);
  const isFullyCovered = paymentBreakdown.length > 0 && remaining < 0.01;

  const handleAddPayment = () => {
    const amount = parseFloat(newPaymentAmount);
    if (!amount || amount <= 0) return;

    if (newPaymentMethod === "Cuenta Corriente") {
      if (!selectedClient) {
        alert("Debe seleccionar un cliente para usar Cuenta Corriente.");
        return;
      }
      if (!selectedClient.currentAccount || selectedClient.currentAccount.status !== "OPEN") {
        alert("El cliente seleccionado no tiene una cuenta corriente abierta o no califica.");
        return;
      }
    }

    const cappedAmount = Math.min(amount, remaining > 0 ? remaining : amount);
    addPayment(newPaymentMethod, cappedAmount);
    setNewPaymentAmount("");
  };

  const handleAddPaymentKey = (e) => {
    if (e.key === "Enter") handleAddPayment();
  };

  // When the single-method select changes, immediately update paymentBreakdown
  const handleSingleMethodChange = (method) => {
    if (method === "Cuenta Corriente") {
      if (!selectedClient) {
        alert("Debe seleccionar un cliente para usar Cuenta Corriente.");
        return;
      }
      if (!selectedClient.currentAccount || selectedClient.currentAccount.status !== "OPEN") {
        alert("El cliente seleccionado no tiene una cuenta corriente abierta o no califica.");
        return;
      }
    }
    setSingleMethod(method);
    // Apply the full neto to this single method
  };

  // Keep the single-method breakdown in sync with NET total whenever we're in simple mode
  const singlePaymentBreakdown = useMemo(
    () => [{ method: singleMethod, amount: netTotal }],
    [singleMethod, netTotal]
  );

  // Decide which breakdown to use based on mode
  const activeBreakdown = isSplitPayment ? paymentBreakdown : singlePaymentBreakdown;
  const totalPaidActive = activeBreakdown.reduce((acc, p) => acc + p.amount, 0);
  const isFullyCoveredActive = !isSplitPayment || (paymentBreakdown.length > 0 && Math.abs(totalPaidActive - netTotal) < 0.01);

  const cashAmountInSale = useMemo(() => {
    return activeBreakdown
      .filter(p => p.method.toLowerCase() === "efectivo")
      .reduce((sum, p) => sum + p.amount, 0);
  }, [activeBreakdown]);

  const showCashCalculator = cashAmountInSale > 0 && isFullyCoveredActive;

  const handleToggleSplit = (checked) => {
    setIsSplitPayment(checked);
    // Reset the split breakdown when toggling off
    if (!checked) {
      usePosStore.getState().clearPayments();
    }
  };

  const addToCart = (product) => {
    if (product.stock <= 0) return;

    setCart(prev => {
      const found = prev.find(p => p.id === product.id);
      if (found) {
        if (found.quantity >= product.stock) return prev;
        return prev.map(p =>
          p.id === product.id ? { ...p, quantity: p.quantity + 1 } : p
        );
      }
      return [...prev, { ...product, quantity: 1 }];
    });
  };

  // Función para obtener preview de descuentos
  const fetchDiscountPreview = async () => {
    setIsLoadingPreview(true);
    try {
      const payload = {
        items: cart.map(item => ({ id: item.id, quantity: item.quantity })),
        clientId: selectedClient?.id || null,
        paymentMethods: activeBreakdown.length > 0
          ? activeBreakdown.map(p => p.method)
          : [singleMethod],
        preferredRuleIds,
        excludedRuleIds // Enviamos exclusiones
      };
      
      const response = await axios.post('/api/discounts/preview', payload);
      setDiscountPreview(response.data);
    } catch (err) {
      console.error('Error fetching discount preview:', err);
      setDiscountPreview(null);
    } finally {
      setIsLoadingPreview(false);
    }
  };

  // Handler para abrir modal de descuentos
  const handleOpenDiscountModal = async () => {
    // 1. Siempre lanzamos una petición limpia al abrir para sincronizar (Reset preferences)
    const freshPreview = await fetchDiscountPreviewWithParams([], []);
    
    // 2. Cargamos como preferidos lo que el sistema propuso por defecto (Freeze State)
    if (freshPreview?.appliedDiscounts) {
      const currentAppliedIds = freshPreview.appliedDiscounts.map(d => d.ruleId);
      setPreferredRuleIds(currentAppliedIds);
      setExcludedRuleIds([]);
    }
    
    setIsDiscountModalOpen(true);
  };

  // Handler para alternar selección manual de descuentos (AXIOM-STEERING + SC-3.0 EXCLUSION)
  const handleToggleRule = (ruleId) => {
    // Si la regla YA está en preferidos, la quitamos y la mandamos a excluidos (Strict Toggle)
    const isCurrentlyPreferred = preferredRuleIds.includes(ruleId);
    
    let nextPreferred = [...preferredRuleIds];
    let nextExcluded = [...excludedRuleIds];

    if (isCurrentlyPreferred) {
      // Estaba marcada -> Desmarcar y Silenciar
      nextPreferred = nextPreferred.filter(id => id !== ruleId);
      nextExcluded = [...new Set([...nextExcluded, ruleId])];
    } else {
      // Estaba desmarcada -> Marcar y Liberar
      nextPreferred = [...new Set([...nextPreferred, ruleId])];
      nextExcluded = nextExcluded.filter(id => id !== ruleId);
    }

    setPreferredRuleIds(nextPreferred);
    setExcludedRuleIds(nextExcluded);
    
    // Lanzamos preview automáticamente con la nueva configuración
    fetchDiscountPreviewWithParams(nextPreferred, nextExcluded);
  };

  const handleClearAllDiscounts = () => {
    // Silenciar todas las reglas que el motor proponga o tenga disponibles
    const allEligibleIds = [
      ...(discountPreview?.appliedDiscounts || []),
      ...(discountPreview?.interchangeableDiscounts || [])
    ].map(r => r.ruleId);

    setExcludedRuleIds(allEligibleIds);
    setPreferredRuleIds([]);
    fetchDiscountPreviewWithParams([], allEligibleIds);
  };

  const handleResetDiscounts = () => {
    // Volver a la propuesta original del sistema
    setExcludedRuleIds([]);
    setPreferredRuleIds([]);
    fetchDiscountPreviewWithParams([], []);
  };

  const fetchDiscountPreviewWithParams = async (preferred, excluded) => {
    setIsLoadingPreview(true);
    try {
      const payload = {
        items: cart.map(item => ({ id: item.id, quantity: item.quantity })),
        clientId: selectedClient?.id || null,
        paymentMethods: activeBreakdown.length > 0
          ? activeBreakdown.map(p => p.method)
          : [singleMethod],
        preferredRuleIds: preferred,
        excludedRuleIds: excluded
      };
      
      const response = await axios.post('/api/discounts/preview', payload);
      setDiscountPreview(response.data);
      return response.data; // Retornamos para uso en handlers
    } catch (err) {
      console.error('Error fetching discount preview:', err);
      return null;
    } finally {
      setIsLoadingPreview(false);
    }
  };

  const processSale = async () => {
    if (cart.length === 0) return;
    try {
      // Cerrar modal de descuentos antes de procesar
      setIsDiscountModalOpen(false);
      setDiscountPreview(null);
      
      // Enviamos el subtotal (sin descuentos) para validación del backend
      const saleData = {
        amount: total,  // subtotal sin descuentos - para validación
        paymentBreakdown: activeBreakdown,
        clientId: selectedClient ? selectedClient.id : null,
        items: cart.map(item => ({
          id: item.id,
          quantity: item.quantity,
          price: item.price
        })),
        preferredRuleIds,
        excludedRuleIds
      };

      const response = await axios.post("/api/sales", saleData);

      if (response.status === 201) {
        // Refresh products and reset cart
        clearPos();
        setCustomerPayment("");

        // Open the modal with the receipt
        setCurrentSale({
          ...response.data,
          items: cart // passing cart directly as it has product names which the backend relation might omit on creation
        });

        setIsConfirmOpen(false);

        axios.get(`/api/products`)
          .then(res => res.data)
          .then(prods => {
            const mappedProducts = prods.filter(p => p.isActive).map(p => ({
              ...p,
              brand: "Genérico",
              barcode: p.barcode || p.id.substring(0, 5),
              category: p.category ? p.category.name : "Sin categoría"
            }));
            setMockProducts(mappedProducts);
          });
      }
    } catch (error) {
      console.error("Sale error:", error);
      alert("Ocurrió un error al procesar la venta: " + (error.response?.data?.message || err.message));
    }
  };

  const decreaseQty = (id) => {
    setCart(prev =>
      prev
        .map(p => p.id === id ? { ...p, quantity: p.quantity - 1 } : p)
        .filter(p => p.quantity > 0)
    );
  };

  const removeItem = (id) => {
    setCart(prev => prev.filter(p => p.id !== id));
  };

  const IconDelete = v.iconeliminarTabla;


  return (
    <div className="h-full flex flex-col gap-4 overflow-y-auto no-scrollbar" style={{ backgroundColor: theme.bgtotal, color: theme.text }}>
      <h1 className="text-2xl font-bold">Nueva Venta</h1>

      {/* TICKET SETTINGS (Top Bar) */}
      <div className="flex flex-col md:flex-row gap-4 p-4 rounded-lg items-center" style={{ backgroundColor: theme.bgcards, boxShadow: v.boxshadowGray }}>

        {/* Client Search */}
        <div className="flex-1 relative flex flex-col gap-1 z-20">
          <label className="text-sm font-semibold">Cliente</label>
          <div className="flex items-center">
            {selectedClient ? (
              <div
                className="flex flex-1 justify-between items-center p-2 rounded cursor-pointer border ring-1 ring-green-500"
                style={{ backgroundColor: theme.bg3, borderColor: theme.bg }}
                onClick={() => {
                  setSelectedClient(null);
                  setClientSearchText("");
                  setShowClientDropdown(true);
                }}
              >
                <span>{selectedClient.firstName} {selectedClient.lastName} {selectedClient.dni && `(${selectedClient.dni})`}</span>
                <span className="text-sm opacity-60 hover:opacity-100">Cambiar</span>
              </div>
            ) : (
              <input
                value={clientSearchText}
                onChange={(e) => {
                  setClientSearchText(e.target.value);
                  setShowClientDropdown(true);
                }}
                onFocus={() => setShowClientDropdown(true)}
                onBlur={() => setTimeout(() => setShowClientDropdown(false), 200)}
                placeholder="Buscar cliente por nombre o DNI (vacio = Consumidor Final)..."
                className="flex-1 p-2 rounded outline-none"
                style={{ backgroundColor: theme.bg }}
              />
            )}
          </div>

          {!selectedClient && showClientDropdown && (
            <div
              className="absolute top-full mt-1 w-full max-h-48 overflow-y-auto no-scrollbar rounded shadow-lg border z-50"
              style={{ backgroundColor: theme.bgcards, borderColor: theme.bg3 }}
            >
              <div
                className="p-2 cursor-pointer hover:bg-black/10 border-b font-semibold text-green-600"
                style={{ borderColor: theme.bg3 }}
                onClick={() => {
                  setSelectedClient(null);
                  setClientSearchText("");
                  setShowClientDropdown(false);
                }}
              >
                Consumidor Final
              </div>
              {filteredClientsSearch.length > 0 ? (
                filteredClientsSearch.map(c => (
                  <div
                    key={c.id}
                    className="p-2 cursor-pointer transition-colors hover:bg-black/10 border-b last:border-0"
                    style={{ borderColor: theme.bg3 }}
                    onClick={() => {
                      setSelectedClient(c);
                      setShowClientDropdown(false);
                    }}
                  >
                    {c.firstName} {c.lastName} {c.dni && `- DNI: ${c.dni}`}
                  </div>
                ))
              ) : (
                <div className="p-2 text-sm opacity-60">No se encontraron clientes...</div>
              )}
            </div>
          )}
        </div>

        {/* Payment Section */}
        <div className="flex flex-col gap-2 md:w-72">
          {/* Label + split toggle */}
          <div className="flex items-center justify-between">
            <label className="text-sm font-semibold">Método de Pago</label>
            <label className="flex items-center gap-1.5 text-xs cursor-pointer select-none" title="Activar pago con múltiples medios">
              <input
                type="checkbox"
                checked={isSplitPayment}
                onChange={(e) => handleToggleSplit(e.target.checked)}
                className="accent-blue-500 cursor-pointer"
              />
              <span className="opacity-70">Pago combinado</span>
            </label>
          </div>

          {!isSplitPayment ? (
            /* Simple mode: single selector */
            <select
              value={singleMethod}
              onChange={(e) => handleSingleMethodChange(e.target.value)}
              className="w-full p-2 rounded outline-none"
              style={{ backgroundColor: theme.bg, color: theme.text }}
            >
              <option value="Efectivo">Efectivo</option>
              <option value="Tarjeta">Tarjeta</option>
              <option value="Transferencia">Transferencia</option>
              <option value="Cuenta Corriente">Cuenta Corriente</option>
            </select>
          ) : (
            /* Split mode: full multi-payment panel */
            <>
              {/* Existing payments */}
              {paymentBreakdown.map((p, i) => (
                <div
                  key={i}
                  className="flex items-center justify-between px-3 py-1.5 rounded text-sm font-medium"
                  style={{ backgroundColor: theme.bg3, border: `1px solid ${theme.border}` }}
                >
                  <span style={{ color: theme.colortitlecard }}>{p.method}</span>
                  <div className="flex items-center gap-1">
                    <span className="opacity-50 text-[10px]">$</span>
                    <input
                      type="number"
                      value={p.amount}
                      step="0.01"
                      className="w-16 bg-transparent font-bold outline-none border-b border-transparent focus:border-blue-500 text-right"
                      onChange={(e) => updatePayment(i, p.method, parseFloat(e.target.value) || 0)}
                    />
                  </div>
                  <button
                    type="button"
                    onClick={() => removePayment(i)}
                    className="ml-2 opacity-60 hover:opacity-100 transition-opacity"
                    style={{ color: theme.danger }}
                  >
                    ✕
                  </button>
                </div>
              ))}

              {/* Remaining badge */}
              {cart.length > 0 && (
                <div
                  className={`text-xs px-2 py-1 rounded font-semibold ${!isFullyCoveredActive ? 'cursor-pointer hover:opacity-80 active:scale-95 transition-all' : ''}`}
                  title={!isFullyCoveredActive ? "Completar con el saldo restante" : ""}
                  onClick={() => !isFullyCoveredActive && setNewPaymentAmount(remaining.toFixed(2))}
                  style={{
                    backgroundColor: isFullyCoveredActive ? theme.successBg : theme.dangerBg,
                    color: isFullyCoveredActive ? theme.successText : theme.dangerText
                  }}
                >
                  {isFullyCoveredActive
                    ? "✓ Total cubierto"
                    : `Restante: ${formatCurrency(remaining)} (Clic para completar)`
                  }
                </div>
              )}

              {/* Botón rápido para CC si hay saldo y cliente con cuenta */}
              {!isFullyCoveredActive && selectedClient?.currentAccount?.status === "OPEN" && remaining > 0 && (
                <button
                  type="button"
                  onClick={() => addPayment("Cuenta Corriente", parseFloat(remaining.toFixed(2)))}
                  className="w-full mt-1 py-1 rounded text-[10px] font-bold uppercase transition-all hover:opacity-80 flex items-center justify-center gap-1 border border-dashed"
                  style={{ borderColor: theme.danger, color: theme.danger }}
                >
                  <FaFileInvoiceDollar size={10} /> Cargar restante en C.C.
                </button>
              )}

              {/* Add new payment row */}
              {!isFullyCoveredActive && cart.length > 0 && (
                <div className="flex gap-1 mt-1 items-center">
                  <select
                    value={newPaymentMethod}
                    onChange={(e) => setNewPaymentMethod(e.target.value)}
                    className="p-1.5 rounded outline-none text-sm flex-shrink-0"
                    style={{ backgroundColor: theme.bg, color: theme.text }}
                  >
                    <option value="Efectivo">Efectivo</option>
                    <option value="Tarjeta">Tarjeta</option>
                    <option value="Transferencia">Transferencia</option>
                    <option value="Cuenta Corriente">Cuenta Corriente</option>
                  </select>
                  <div className="flex-1 relative flex items-center">
                    <input
                      type="number"
                      min="0"
                      step="0.01"
                      value={newPaymentAmount}
                      onChange={(e) => setNewPaymentAmount(e.target.value)}
                      onKeyDown={handleAddPaymentKey}
                      placeholder={formatCurrency(remaining)}
                      className="w-full p-1.5 pr-8 rounded outline-none text-sm"
                      style={{ backgroundColor: theme.bg, color: theme.text }}
                    />
                    {remaining > 0 && (
                      <button
                        type="button"
                        onClick={() => setNewPaymentAmount(remaining.toFixed(2))}
                        title="Completar con saldo restante"
                        className="absolute right-1.5 p-1 rounded hover:bg-black/10 transition-colors"
                        style={{ color: theme.primary }}
                      >
                        <FaMagic size={12} />
                      </button>
                    )}
                  </div>
                  <button
                    type="button"
                    onClick={handleAddPayment}
                    className="px-2 py-1.5 rounded text-sm font-bold transition-opacity hover:opacity-80 flex-shrink-0 flex items-center justify-center"
                    style={{ backgroundColor: theme.primary, color: "white" }}
                    title="Confirmar medio de pago"
                  >
                    <FaCheck size={14} />
                  </button>
                </div>
              )}
            </>
          )}
        </div>
      </div>

      <div className="grid grid-cols-12 gap-4 flex-1 min-h-0 overflow-hidden">

        {/* PRODUCTOS */}
        <div className="col-span-7 rounded-lg p-4 flex flex-col relative overflow-hidden"
          style={{ backgroundColor: theme.bgcards, boxShadow: v.boxshadowGray }}>

          {showScrollUpProds && (
            <button
              onClick={() => scrollToExtreme(productListRef, false)}
              className="absolute top-16 left-1/2 -translate-x-1/2 z-20 p-1 rounded-full shadow-md animate-bounce opacity-70 hover:opacity-100 transition-opacity"
              style={{ backgroundColor: theme.bg3, color: theme.text }}
            >
              <FaChevronUp size={14} />
            </button>
          )}

          <div className="flex flex-col h-full overflow-y-auto no-scrollbar" ref={productListRef}>

            {/* Filtros */}
            <div className="flex gap-2 mb-2">
              <input
                autoFocus
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Buscar por nombre, marca o código..."
                className="flex-1 p-2 rounded outline-none"
                style={{ backgroundColor: theme.bg }}
              />

              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="p-2 rounded"
                style={{ backgroundColor: theme.bg }}
              >
                {categories.map(c => (
                  <option key={c}>{c}</option>
                ))}
              </select>
            </div>

            {/* Tabla */}
            <div className="overflow-auto no-scrollbar">
              <table className="w-full border-collapse overflow-y-auto no-scrollbar">
                <thead>
                  <tr style={{ backgroundColor: theme.bg3 }}>
                    <th className="p-2 text-left">👁</th>
                    <th className="p-2 text-left">Nombre</th>
                    <th className="p-2 text-left">Marca</th>
                    <th className="p-2 text-right">Precio</th>
                    <th className="p-2 text-center">Stock</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredProducts.map((p, index) => {
                    const agotado = p.stock <= 0;
                    return (
                      <tr
                        key={p.id}
                        onClick={() => !agotado && addToCart(p)}
                        style={{
                          background: index === selectedIndex ? theme.bg5 : "transparent",
                          cursor: agotado ? "not-allowed" : "pointer",
                          opacity: agotado ? 0.5 : 1
                        }}
                      >
                        <td
                          className="p-2 cursor-pointer hover:bg-black/10 transition-colors"
                          onClick={(e) => { e.stopPropagation(); navigate(`/products/details/${p.id}`); }}
                          title="Ver detalles"
                        >
                          👁
                        </td>
                        <td className="p-2">{p.name}</td>
                        <td className="p-2">{p.brand}</td>
                        <td className="p-2 text-right">{formatCurrency(p.price)}</td>
                        <td className="p-2 text-center">
                          {agotado ? "Agotado" : p.stock}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div> {/* Closes productListRef scrollable div */}
          {showScrollDownProds && (
            <button
              onClick={() => scrollToExtreme(productListRef, true)}
              className="absolute bottom-4 left-1/2 -translate-x-1/2 z-20 p-1 rounded-full shadow-md animate-bounce opacity-70 hover:opacity-100 transition-opacity"
              style={{ backgroundColor: theme.bg3, color: theme.text }}
            >
              <FaChevronDown size={14} />
            </button>
          )}
        </div> {/* Closes col-span-7 product wrapper */}

        {/* CARRITO */}
        <div className="col-span-5 rounded-lg p-4 flex flex-col relative overflow-hidden"
          style={{ backgroundColor: theme.bgcards, boxShadow: v.boxshadowGray }}>

          {showScrollUpCart && (
            <button
              onClick={() => scrollToExtreme(cartRef, false)}
              className="absolute top-12 left-1/2 -translate-x-1/2 z-20 p-1 rounded-full shadow-md animate-bounce opacity-70 hover:opacity-100 transition-opacity"
              style={{ backgroundColor: theme.bg3, color: theme.text }}
            >
              <FaChevronUp size={12} />
            </button>
          )}

          <div className="flex items-center justify-between mb-2">
            <h2 className="text-xl font-semibold">Carrito</h2>
            <button 
              type="button"
              onClick={() => setIsCartModalOpen(true)}
              className="p-1.5 rounded-full hover:bg-black/10 transition-colors"
              title="Ampliar vista del carrito"
              style={{ color: theme.primary }}
            >
              <FaSearchPlus size={18} />
            </button>
          </div>

          <div className="flex-1 overflow-auto no-scrollbar" ref={cartRef}>
            {cart.map(item => (
              <div key={item.id} className="mb-2 p-2 rounded" style={{ backgroundColor: theme.bg3 }}>
                <div className="flex justify-between">
                  <div>
                    <p className="font-semibold">{item.name}</p>
                    <p className="text-sm">{formatCurrency(item.price)}</p>
                  </div>
                  <button onClick={() => removeItem(item.id)}>
                    <IconDelete size={18} color={v.rojo} />
                  </button>
                </div>

                <div className="flex justify-between items-center mt-2">
                  <div className="flex gap-2 items-center">
                    <button onClick={() => decreaseQty(item.id)} className="px-2 rounded" style={{ backgroundColor: theme.bg }}>–</button>
                    <b>{item.quantity}</b>
                    <span>/ {item.stock}</span>
                  </div>
                  <b>{formatCurrency(item.quantity * item.price)}</b>
                </div>
              </div>
            ))}
          </div>
          {showScrollDownCart && (
            <button
              onClick={() => scrollToExtreme(cartRef, true)}
              className="absolute bottom-32 left-1/2 -translate-x-1/2 z-10 p-1 rounded-full shadow-md animate-bounce opacity-70 hover:opacity-100 transition-opacity"
              style={{ backgroundColor: theme.bg3, color: theme.text }}
            >
              <FaChevronDown size={12} />
            </button>
          )}

          <div className="mt-4 p-2 rounded" style={{ backgroundColor: theme.bg }}>
            <div className="flex justify-between text-lg font-bold">
              <span>Total</span>
              <span>{formatCurrency(total)}</span>
            </div>

            {/* Calculadora de Vuelto */}
            {showCashCalculator && (
              <div className="mt-4 p-2 rounded-lg border-1 border-dashed animate-in fade-in slide-in-from-bottom-2 duration-300"
                style={{ backgroundColor: theme.bg3, borderColor: `${theme.primary}40` }}>
                <p className="text-xs font-bold uppercase tracking-wider opacity-60 mb-0"></p>
                <div className="flex flex-col gap-2">
                  <div className="flex items-center justify-between">
                  </div>
                  <div className="flex items-center gap-2">
                    <label className="text-sm flex-shrink-0">Paga con:</label>
                    <input
                      type="number"
                      value={customerPayment}
                      onChange={(e) => setCustomerPayment(e.target.value)}
                      placeholder="0.00"
                      className="flex-1 p-1.5 rounded outline-none text-right font-bold w-0"
                      style={{ backgroundColor: theme.bg, color: theme.text }}
                    />
                  </div>
                  {customerPayment !== "" && parseFloat(customerPayment) !== cashAmountInSale && (
                    <div className="flex items-center justify-between mt-1 pt-2 border-t" style={{ borderColor: theme.bg }}>
                      <span className={`text-sm font-semibold ${parseFloat(customerPayment) > cashAmountInSale ? "text-green-500" : "text-red-500"}`}>
                        {parseFloat(customerPayment) > cashAmountInSale ? "Vuelto:" : "Faltan:"}
                      </span>
                      <span className={`text-lg font-bold ${parseFloat(customerPayment) > cashAmountInSale ? "text-green-500" : "text-red-500"}`}>
                        {formatCurrency(Math.abs(parseFloat(customerPayment) - cashAmountInSale))}
                      </span>
                    </div>
                  )}
                </div>
              </div>
            )}

            <button
              onClick={handleOpenDiscountModal}
              className="w-full mt-4 p-2 rounded font-semibold transition-opacity hover:opacity-90"
              style={{ backgroundColor: theme.primary, color: "white", opacity: (cart.length && isFullyCoveredActive) ? 1 : 0.4 }}
              disabled={!cart.length || !isFullyCoveredActive}
            >
              Calcular Descuentos
            </button>
          </div>

        </div>

      </div>

      <ConfirmModal
        isOpen={isConfirmOpen}
        onClose={() => setIsConfirmOpen(false)}
        onConfirm={processSale}
        message="¿Confirmar Venta?"
      >
        <div className="mb-3 text-sm pb-2 border-b" style={{ borderColor: theme.bg }}>
          <span className="font-semibold">Cliente: </span>
          {selectedClient ? `${selectedClient.firstName} ${selectedClient.lastName} ${selectedClient.dni ? `(DNI: ${selectedClient.dni})` : ''}` : "Consumidor Final"}
        </div>
        <div className="max-h-40 overflow-y-auto mb-2 pr-2 custom-scrollbar no-scrollbar text-sm">
          {cart.map((item, index) => (
            <div key={index} className="flex justify-between py-1 border-b last:border-0" style={{ borderColor: theme.bg }}>
              <span className="truncate pr-2">{item.quantity}x {item.name}</span>
              <span>{formatCurrency(item.quantity * item.price)}</span>
            </div>
          ))}
        </div>
        <div className="flex justify-between font-bold text-lg pt-2 border-t mt-2" style={{ borderColor: theme.bg }}>
          <span>Total:</span>
          <span>{formatCurrency(total)}</span>
        </div>
        {activeBreakdown.length > 1 && (
          <div className="mt-2 space-y-1">
            <p className="text-xs font-semibold opacity-60">Medios de pago:</p>
            {activeBreakdown.map((p, i) => (
              <div key={i} className="flex justify-between text-sm">
                <span>{p.method}</span>
                <span>{formatCurrency(p.amount)}</span>
              </div>
            ))}
          </div>
        )}
      </ConfirmModal>

      <Modal 
        isOpen={isCartModalOpen} 
        onClose={() => setIsCartModalOpen(false)}
        maxWidth="max-w-4xl"
      >
        <div className="flex flex-col gap-4 max-h-[85vh]">
          <div className="flex justify-between items-center border-b pb-2" style={{ borderColor: theme.bg }}>
            <h2 className="text-2xl font-bold">Resumen Detallado</h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 overflow-hidden">
            {/* Lista de Productos */}
            <div className="flex flex-col gap-2 overflow-y-auto pr-2 custom-scrollbar">
              <h3 className="text-sm font-bold uppercase opacity-50 mb-1">
                Productos ({cart.length})
              </h3>
              {cart.map(item => (
                <div key={item.id} className="p-3 rounded-lg flex justify-between items-center" style={{ backgroundColor: theme.bg3 }}>
                  <div className="flex-1">
                    <p className="font-bold">{item.name}</p>
                    <p className="text-xs opacity-60">{item.brand} - {formatCurrency(item.price)} x {item.quantity}</p>
                  </div>
                  <div className="text-right font-bold">
                    {formatCurrency(item.price * item.quantity)}
                  </div>
                </div>
              ))}
              {cart.length === 0 && <p className="text-center opacity-50 py-10">El carrito está vacío</p>}
            </div>

            {/* Totales y Pagos */}
            <div className="flex flex-col gap-4 p-4 rounded-xl" style={{ backgroundColor: theme.bgtotal, boxShadow: v.boxshadowGray }}>
              <div className="flex justify-between items-end border-b pb-3" style={{ borderColor: theme.bg }}>
                <span className="text-lg font-semibold">Total Venta</span>
                <span className="text-3xl font-black" style={{ color: theme.primary }}>
                  {formatCurrency(total)}
                </span>
              </div>

              <div className="flex flex-col gap-3">
                <div className="flex items-center justify-between mb-1">
                  <h4 className="text-xs font-bold opacity-40 uppercase tracking-widest">Configuración de Pago</h4>
                  <label className="flex items-center gap-1.5 text-xs cursor-pointer select-none" title="Activar pago con múltiples medios">
                    <input
                      type="checkbox"
                      checked={isSplitPayment}
                      onChange={(e) => handleToggleSplit(e.target.checked)}
                      className="accent-blue-500 cursor-pointer"
                    />
                    <span className="opacity-70">Pago combinado</span>
                  </label>
                </div>

                {!isSplitPayment ? (
                  <select
                    value={singleMethod}
                    onChange={(e) => handleSingleMethodChange(e.target.value)}
                    className="w-full p-2.5 rounded-lg outline-none text-sm font-semibold border transition-all focus:ring-2"
                    style={{ backgroundColor: theme.bg, color: theme.text, borderColor: theme.bg3 }}
                  >
                    <option value="Efectivo">Efectivo</option>
                    <option value="Tarjeta">Tarjeta</option>
                    <option value="Transferencia">Transferencia</option>
                  </select>
                ) : (
                  <div className="flex flex-col gap-2">
                    {paymentBreakdown.map((p, i) => (
                      <div key={i} className="flex items-center justify-between px-3 py-2 rounded-lg text-sm font-medium border"
                        style={{ backgroundColor: theme.bg, borderColor: theme.bg3 }}>
                        <span className="opacity-70">{p.method}</span>
                        <div className="flex items-center gap-2">
                           <div className="flex items-center gap-1">
                             <span className="opacity-50 text-[10px]">$</span>
                             <input
                               type="number"
                               value={p.amount}
                               step="0.01"
                               className="w-20 bg-transparent font-bold outline-none border-b border-transparent focus:border-blue-500 text-right"
                               onChange={(e) => updatePayment(i, p.method, parseFloat(e.target.value) || 0)}
                             />
                           </div>
                           <button type="button" onClick={() => removePayment(i)} className="p-1 hover:bg-black/5 rounded transition-colors" style={{ color: theme.danger }}>✕</button>
                        </div>
                      </div>
                    ))}

                    <div className="text-[10px] px-2 py-1 rounded-full font-bold uppercase tracking-wider text-center"
                      style={{ backgroundColor: isFullyCoveredActive ? theme.successBg : theme.dangerBg, color: isFullyCoveredActive ? theme.successText : theme.dangerText }}>
                      {isFullyCoveredActive ? "✓ Cubierto" : `Faltan ${formatCurrency(remaining)}`}
                    </div>

                    {!isFullyCoveredActive && cart.length > 0 && (
                      <div className="flex gap-1.5 items-center mt-1">
                        <select
                          value={newPaymentMethod}
                          onChange={(e) => setNewPaymentMethod(e.target.value)}
                          className="p-2 rounded-lg outline-none text-xs w-28 border"
                          style={{ backgroundColor: theme.bg, color: theme.text, borderColor: theme.bg3 }}
                        >
                          <option value="Efectivo">Efectivo</option>
                          <option value="Tarjeta">Tarjeta</option>
                          <option value="Transferencia">Transferencia</option>
                        </select>
                        <div className="flex-1 relative flex items-center">
                          <input
                            type="number" value={newPaymentAmount}
                            onChange={(e) => setNewPaymentAmount(e.target.value)}
                            onKeyDown={handleAddPaymentKey}
                            placeholder={formatCurrency(remaining)}
                            className="w-full p-2 pr-8 rounded-lg outline-none text-xs border"
                            style={{ backgroundColor: theme.bg, color: theme.text, borderColor: theme.bg3 }}
                          />
                          {remaining > 0 && (
                            <button type="button" onClick={() => setNewPaymentAmount(remaining.toFixed(2))} className="absolute right-1.5 p-1 hover:scale-110 transition-transform">
                              <FaMagic size={10} style={{ color: theme.primary }} />
                            </button>
                          )}
                        </div>
                        <button onClick={handleAddPayment} className="p-2 rounded-lg shadow-sm hover:opacity-80 active:scale-95 transition-all flex-shrink-0" style={{ backgroundColor: theme.primary, color: "white" }}>
                          <FaCheck size={12} />
                        </button>
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* Replica de la calculadora de vuelto */}
              {showCashCalculator && (
                <div className="p-4 rounded-lg border border-dashed mt-2" style={{ borderColor: `${theme.primary}60`, backgroundColor: theme.bg }}>
                   <div className="flex flex-col gap-3">
                      <div className="flex items-center gap-2">
                        <label className="text-sm font-bold">Paga con:</label>
                        <input 
                          type="number"
                          value={customerPayment}
                          onChange={(e) => setCustomerPayment(e.target.value)}
                          className="flex-1 p-2 rounded outline-none text-right font-bold text-lg"
                          style={{ backgroundColor: theme.bg3, color: theme.text }}
                        />
                      </div>
                      {customerPayment !== "" && parseFloat(customerPayment) !== cashAmountInSale && (
                        <div className="flex items-center justify-between">
                          <span className={`font-bold ${parseFloat(customerPayment) > cashAmountInSale ? "text-green-500" : "text-red-500"}`}>
                            {parseFloat(customerPayment) > cashAmountInSale ? "Vuelto:" : "Faltan:"}
                          </span>
                          <span className={`text-2xl font-black ${parseFloat(customerPayment) > cashAmountInSale ? "text-green-500" : "text-red-500"}`}>
                            {formatCurrency(Math.abs(parseFloat(customerPayment) - cashAmountInSale))}
                          </span>
                        </div>
                      )}
                   </div>
                </div>
              )}

              <button 
                onClick={() => { setIsCartModalOpen(false); setIsConfirmOpen(true); }}
                className="w-full py-4 rounded-xl font-bold text-lg shadow-lg hover:scale-[1.01] active:scale-95 transition-all mt-auto"
                style={{ backgroundColor: theme.primary, color: "white" }}
                disabled={!cart.length || !isFullyCoveredActive}
              >
                CONFIRMAR VENTA
              </button>
            </div>
          </div>
        </div>
      </Modal>

      <DiscountSummaryModal
        isOpen={isDiscountModalOpen}
        onClose={() => {
          setIsDiscountModalOpen(false);
          setDiscountPreview(null);
        }}
        onConfirm={processSale}
        cart={cart}
        client={selectedClient}
        preview={discountPreview}
        isLoading={isLoadingPreview}
        paymentBreakdown={activeBreakdown}
        total={total}
        preferredRuleIds={preferredRuleIds}
        excludedRuleIds={excludedRuleIds}
        onToggleRule={handleToggleRule}
        onClearAll={handleClearAllDiscounts}
        onReset={handleResetDiscounts}
      />

      <SaleDetail
        isOpen={currentSale !== null}
        onClose={() => setCurrentSale(null)}
        saleData={currentSale}
      />
    </div>
  );
};

export default NewSale;
