import { useState, useMemo, useEffect } from "react";
import { useTheme } from "../../context/ThemeContext";
import { v } from "../../styles/variables";
import axios from "axios";
import SaleDetail from "./SaleDetail";
import DiscountSummaryModal from "../../components/Modals/DiscountSummaryModal";
import useUserStore from "../../store/userStore";
import usePosStore from "../../store/posStore";
import { useNavigate } from "react-router-dom";
import { formatCurrency } from "../../utils/currency";
import { FaChevronUp, FaChevronDown, FaSearchPlus, FaFileInvoiceDollar, FaShoppingCart, FaUsers, FaCheck } from "react-icons/fa";
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
  const [clientSelectedIndex, setClientSelectedIndex] = useState(0);
  const [categories, setCategories] = useState(["Todas"]);
  const [isLoading, setIsLoading] = useState(true);
  const [currentSale, setCurrentSale] = useState(null);
  const [isConfirmOpen, setIsConfirmOpen] = useState(false);
  const [clients, setClients] = useState([]);
  const [showClientDropdown, setShowClientDropdown] = useState(false);
  const [isDiscountModalOpen, setIsDiscountModalOpen] = useState(false);
  const [discountPreview, setDiscountPreview] = useState(null);
  const [preferredRuleIds, setPreferredRuleIds] = useState([]);
  const [excludedRuleIds, setExcludedRuleIds] = useState([]);
  const [isLoadingPreview, setIsLoadingPreview] = useState(false);
  const [isCartModalOpen, setIsCartModalOpen] = useState(false);
  const [isClientExpanded, setIsClientExpanded] = useState(false);
  // breakdown confirmado por el modal (se usa solo para processSale)
  const [confirmedBreakdown, setConfirmedBreakdown] = useState([]);
  const [isProcessing, setIsProcessing] = useState(false);

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

  useEffect(() => {
    setClientSelectedIndex(0);
  }, [clientSearchText]);

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
      setSelectedIndex(prev => (prev > 0 ? prev - 1 : prev));
    }

    if (e.key === "Enter") {
      e.preventDefault();
      const product = filteredProducts[selectedIndex];
      if (product.stock > 0) {
        addToCart(product);
      }
    }
  };

  const handleClientKeyDown = (e) => {
    if (!showClientDropdown) return;

    // 0 es "Consumidor Final", 1+ son los clientes filtrados
    const totalOptions = filteredClientsSearch.length + 1;

    if (e.key === "ArrowDown") {
      e.preventDefault();
      setClientSelectedIndex(prev => (prev < totalOptions - 1 ? prev + 1 : prev));
    }

    if (e.key === "ArrowUp") {
      e.preventDefault();
      setClientSelectedIndex(prev => (prev > 0 ? prev - 1 : 0));
    }

    if (e.key === "Enter") {
      e.preventDefault();
      if (clientSelectedIndex === 0) {
        setSelectedClient(null);
        setClientSearchText("");
        setShowClientDropdown(false);
      } else {
        const client = filteredClientsSearch[clientSelectedIndex - 1];
        if (client) {
          setSelectedClient(client);
          setShowClientDropdown(false);
        }
      }
    }

    if (e.key === "Escape") {
      setShowClientDropdown(false);
    }
  };

  const total = cart.reduce((acc, i) => acc + i.quantity * i.price, 0);
  const netTotal = discountPreview ? (discountPreview.finalTotal || total) : total;

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

  // Abre el modal y dispara un primer preview limpio (sin breakdown aún)
  const handleOpenDiscountModal = async () => {
    const freshPreview = await fetchDiscountPreviewWithParams([], [], []);
    if (freshPreview?.appliedDiscounts) {
      setPreferredRuleIds(freshPreview.appliedDiscounts.map(d => d.ruleId));
      setExcludedRuleIds([]);
    }
    setIsDiscountModalOpen(true);
  };

  const handleToggleRule = (ruleId) => {
    const isCurrentlyPreferred = preferredRuleIds.includes(ruleId);
    const nextPreferred = isCurrentlyPreferred
      ? preferredRuleIds.filter(id => id !== ruleId)
      : [...new Set([...preferredRuleIds, ruleId])];
    const nextExcluded = isCurrentlyPreferred
      ? [...new Set([...excludedRuleIds, ruleId])]
      : excludedRuleIds.filter(id => id !== ruleId);
    setPreferredRuleIds(nextPreferred);
    setExcludedRuleIds(nextExcluded);
    fetchDiscountPreviewWithParams(nextPreferred, nextExcluded, confirmedBreakdown);
  };

  const handleClearAllDiscounts = () => {
    const allIds = [
      ...(discountPreview?.appliedDiscounts || []),
      ...(discountPreview?.interchangeableDiscounts || [])
    ].map(r => r.ruleId);
    setExcludedRuleIds(allIds);
    setPreferredRuleIds([]);
    fetchDiscountPreviewWithParams([], allIds, confirmedBreakdown);
  };

  const handleResetDiscounts = () => {
    setExcludedRuleIds([]);
    setPreferredRuleIds([]);
    fetchDiscountPreviewWithParams([], [], confirmedBreakdown);
  };

  // breakdown viene del modal (reactivo al cambio de pagos)
  const fetchDiscountPreviewWithParams = async (preferred, excluded, breakdown) => {
    setIsLoadingPreview(true);
    try {
      const payload = {
        items: cart.map(item => ({ id: item.id, quantity: item.quantity })),
        clientId: selectedClient?.id || null,
        paymentMethods: breakdown.length > 0 ? breakdown.map(p => p.method) : ["Efectivo"],
        paymentBreakdown: breakdown,
        preferredRuleIds: preferred,
        excludedRuleIds: excluded
      };
      const response = await axios.post('/api/discounts/preview', payload);
      setDiscountPreview(response.data);
      return response.data;
    } catch (err) {
      console.error('Error fetching discount preview:', err);
      return null;
    } finally {
      setIsLoadingPreview(false);
    }
  };

  // Llamado por el modal cada vez que cambia el desglose de pagos
  const handlePaymentChange = (breakdown) => {
    setConfirmedBreakdown(breakdown);
    fetchDiscountPreviewWithParams(preferredRuleIds, excludedRuleIds, breakdown);
  };

  // finalBreakdown viene del botón de confirmación del modal
  const processSale = async (finalBreakdown) => {
    if (cart.length === 0 || isProcessing) return;
    setIsProcessing(true);
    try {
      const saleData = {
        amount: total,
        paymentBreakdown: finalBreakdown,
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
        setIsDiscountModalOpen(false);
        setIsCartModalOpen(false);
        clearPos();
        setConfirmedBreakdown([]);
        setDiscountPreview(null);
        setCurrentSale({ ...response.data, items: cart });

        axios.get('/api/products').then(res => {
          const mapped = res.data.filter(p => p.isActive).map(p => ({
            ...p,
            brand: "Genérico",
            barcode: p.barcode || p.id.substring(0, 5),
            category: p.category ? p.category.name : "Sin categoría"
          }));
          setMockProducts(mapped);
        });
      }
    } catch (error) {
      console.error("Sale error:", error);
      alert("Ocurrió un error al procesar la venta: " + (error.response?.data?.message || error.message));
    } finally {
      setIsProcessing(false);
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
    <div className="h-full flex flex-col gap-4 overflow-y-auto no-scrollbar relative" style={{ backgroundColor: theme.bgtotal, color: theme.text }}>
      <h1 className="text-xl md:text-2xl font-bold px-4 md:px-0">Nueva Venta</h1>

      {/* TICKET SETTINGS (Top Bar) */}
      <div className="flex flex-col lg:flex-row gap-2 md:gap-4 p-2 md:p-4 rounded-xl z-30" style={{ backgroundColor: theme.bgcards, boxShadow: v.boxshadowGray }}>

        {/* --- SECCIÓN CLIENTE (Acordeón en Mobile) --- */}
        <div className={`flex-1 flex flex-col ${isClientExpanded ? '' : 'lg:overflow-visible overflow-hidden'}`}>
          {/* Header del Acordeón (Mobile) / Título (Desktop) */}
          <div
            onClick={() => window.innerWidth < 1024 && setIsClientExpanded(!isClientExpanded)}
            className="flex items-center justify-between p-3 lg:p-0 cursor-pointer lg:cursor-default rounded-lg hover:bg-black/5 lg:hover:bg-transparent"
          >
            <div className="flex items-center gap-2">
              <span className="text-blue-500"><FaUsers size={18} /></span>
              <span className="text-sm font-bold uppercase tracking-wider opacity-70 lg:hidden">
                Cliente: {selectedClient ? `${selectedClient.firstName} ${selectedClient.lastName}` : 'Consumidor Final'}
              </span>
              <span className="hidden lg:inline text-sm font-bold uppercase tracking-wider opacity-70">Información del Cliente</span>
            </div>
            <span className="lg:hidden opacity-50">
              {isClientExpanded ? <FaChevronUp size={14} /> : <FaChevronDown size={14} />}
            </span>
          </div>

          {/* Contenido Desplegable */}
          <div className={`${isClientExpanded ? 'block' : 'hidden lg:block'} mt-2 lg:mt-1 animate-in fade-in slide-in-from-top-2 duration-200`}>
            <div className="relative flex flex-col gap-1">
              <div className="flex items-center">
                {selectedClient ? (
                  <div
                    className="flex flex-1 justify-between items-center p-3 rounded-xl border-2 ring-1 ring-green-500/30 transition-all active:scale-[0.98]"
                    style={{ backgroundColor: theme.bg, borderColor: theme.success }}
                    onClick={() => {
                      setSelectedClient(null);
                      setClientSearchText("");
                      setShowClientDropdown(true);
                    }}
                  >
                    <div className="flex flex-col">
                      <span className="font-bold text-sm">{selectedClient.firstName} {selectedClient.lastName}</span>
                      <span className="text-[10px] opacity-60 uppercase">DNI: {selectedClient.dni || 'Sin DNI'}</span>
                    </div>
                    <span className="text-xs font-bold text-blue-500 bg-blue-500/10 px-2 py-1 rounded-lg">CAMBIAR</span>
                  </div>
                ) : (
                  <div className="relative flex-1 group">
                    <input
                      value={clientSearchText}
                      onChange={(e) => {
                        setClientSearchText(e.target.value);
                        setShowClientDropdown(true);
                      }}
                      onFocus={() => setShowClientDropdown(true)}
                      onBlur={() => setTimeout(() => setShowClientDropdown(false), 200)}
                      onKeyDown={handleClientKeyDown}
                      placeholder="Buscar por Nombre / DNI..."
                      className="w-full p-3 pl-10 rounded-xl outline-none border-2 transition-all focus:border-blue-500 shadow-inner"
                      style={{ backgroundColor: theme.bg, borderColor: theme.bg3 }}
                    />
                    <FaSearchPlus className="absolute left-3 top-1/2 -translate-y-1/2 opacity-30 group-focus-within:opacity-100 text-blue-500 transition-opacity" />
                  </div>
                )}
              </div>

              {!selectedClient && showClientDropdown && (
                <div
                  className="absolute top-full mt-2 w-full max-h-60 overflow-y-auto no-scrollbar rounded-2xl shadow-2xl border-2 z-50 animate-in zoom-in-95 duration-150"
                  style={{ backgroundColor: theme.bgcards, borderColor: theme.bg3 }}
                >
                  <div
                    className="p-3 cursor-pointer hover:bg-green-500/10 border-b-2 font-black text-green-600 flex items-center justify-between"
                    style={{
                      borderColor: theme.bg3,
                      backgroundColor: clientSelectedIndex === 0 ? "rgba(0,0,0,0.05)" : "transparent"
                    }}
                    onClick={() => {
                      setSelectedClient(null);
                      setClientSearchText("");
                      setShowClientDropdown(false);
                    }}
                  >
                    👤 CONSUMIDOR FINAL
                    {clientSelectedIndex === 0 && <FaCheck size={12} />}
                  </div>
                  {filteredClientsSearch.length > 0 ? (
                    filteredClientsSearch.map((c, idx) => (
                      <div
                        key={c.id}
                        className="p-3 cursor-pointer transition-colors hover:bg-blue-500/10 border-b last:border-0 flex items-center justify-between"
                        style={{
                          borderColor: theme.bg3,
                          backgroundColor: clientSelectedIndex === (idx + 1) ? "rgba(0,0,0,0.05)" : "transparent"
                        }}
                        onClick={() => {
                          setSelectedClient(c);
                          setShowClientDropdown(false);
                        }}
                      >
                        <div className="flex flex-col">
                          <span className="font-bold text-sm">{c.firstName} {c.lastName}</span>
                          <span className="text-[10px] opacity-60 italic">DNI: {c.dni || '---'}</span>
                        </div>
                        {clientSelectedIndex === (idx + 1) && <FaCheck size={12} className="text-blue-500" />}
                      </div>
                    ))
                  ) : (
                    <div className="p-4 text-sm opacity-60 italic text-center">No se encontraron clientes...</div>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>



      <div className="flex flex-col md:grid md:grid-cols-12 gap-4 flex-1 min-h-0 overflow-hidden px-4 md:px-0">

        {/* PRODUCTOS */}
        <div className="flex-1 md:col-span-7 rounded-lg p-4 flex flex-col relative overflow-hidden min-h-[400px] md:min-h-0"
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
        <div className="w-full md:col-span-5 rounded-lg p-4 flex flex-col relative overflow-hidden shrink-0 min-h-[300px] md:min-h-0"
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



            <button
              onClick={handleOpenDiscountModal}
              className="w-full mt-4 p-3 rounded-xl font-black text-lg transition-all hover:opacity-90 active:scale-95 shadow-md"
              style={{ backgroundColor: theme.primary, color: "white", opacity: cart.length ? 1 : 0.4 }}
              disabled={!cart.length}
            >
              🛒 Calcular Descuentos
            </button>
          </div>

        </div>

      </div>

      {/* STICKY FOOTER MOBILE (Solo visible en móviles) */}
      <div className="md:hidden sticky bottom-0 left-0 right-0 p-4 shadow-[0_-4px_10px_rgba(0,0,0,0.1)] flex items-center justify-between z-30 shrink-0"
        style={{ backgroundColor: theme.bgcards, borderTop: `1px solid ${theme.bg3}` }}>
        <div className="flex flex-col">
          <span className="text-[10px] opacity-60 uppercase font-black">Total</span>
          <span className="text-xl font-black" style={{ color: theme.success }}>{formatCurrency(netTotal)}</span>
        </div>
        <div className="flex gap-2 relative">
          <button
            onClick={() => setIsCartModalOpen(true)}
            className="p-3 rounded-xl relative transition-transform active:scale-90"
            style={{ backgroundColor: `${theme.primary}20`, color: theme.primary }}
          >
            <FaShoppingCart size={22} />
            {cart.length > 0 && (
              <span className="absolute -top-2 -right-2 bg-red-500 text-white text-[10px] w-5 h-5 flex items-center justify-center rounded-full border-2 font-bold" style={{ borderColor: theme.bgcards }}>
                {cart.reduce((acc, item) => acc + item.quantity, 0)}
              </span>
            )}
          </button>
          <button
            onClick={handleOpenDiscountModal}
            disabled={!cart.length}
            className="px-6 py-3 rounded-xl font-black text-white shadow-lg disabled:opacity-50 transition-all active:scale-95 uppercase text-sm tracking-wider"
            style={{ backgroundColor: theme.success }}
          >
            Calcular Descuentos
          </button>
        </div>
      </div>



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
                <p className="text-xs font-bold opacity-40 uppercase tracking-widest">Pago</p>
                <p className="text-sm opacity-60 italic">Los medios de pago se configuran en la pantalla de Cierre de Venta.</p>
                <button
                  onClick={() => { setIsCartModalOpen(false); handleOpenDiscountModal(); }}
                  disabled={!cart.length}
                  className="w-full py-3 rounded-xl font-black text-white shadow-lg hover:scale-[1.01] active:scale-95 transition-all"
                  style={{ backgroundColor: theme.primary }}
                >
                  Ir a Cerrar Venta
                </button>
              </div>

            </div>
          </div>
        </div>
      </Modal>

      <DiscountSummaryModal
        isOpen={isDiscountModalOpen}
        onClose={() => {
          setIsDiscountModalOpen(false);
          setDiscountPreview(null);
          setConfirmedBreakdown([]);
        }}
        onConfirm={processSale}
        cart={cart}
        client={selectedClient}
        preview={discountPreview}
        isLoading={isLoadingPreview}
        total={total}
        preferredRuleIds={preferredRuleIds}
        excludedRuleIds={excludedRuleIds}
        onToggleRule={handleToggleRule}
        onClearAll={handleClearAllDiscounts}
        onReset={handleResetDiscounts}
        onPaymentChange={handlePaymentChange}
        isProcessing={isProcessing}
      />

      <SaleDetail
        isOpen={currentSale !== null}
        onClose={() => setCurrentSale(null)}
        saleData={currentSale}
      />

      {/* OVERLAY DE PROCESAMIENTO PREMIUM */}
      {isProcessing && (
        <div className="fixed inset-0 z-[9999] flex flex-col items-center justify-center backdrop-blur-md bg-black/40 animate-in fade-in duration-300">
          <div className="bg-white dark:bg-zinc-900 p-8 rounded-3xl shadow-2xl flex flex-col items-center gap-4 scale-110 animate-in zoom-in-90 duration-300">
            <div className="relative">
              <div className="w-16 h-16 border-4 border-blue-500/20 border-t-blue-500 rounded-full animate-spin"></div>
              <FaShoppingCart className="absolute inset-0 m-auto text-blue-500 animate-pulse" size={24} />
            </div>
            <div className="flex flex-col items-center">
              <h3 className="text-xl font-black uppercase tracking-tighter">Procesando Venta</h3>
              <p className="text-xs opacity-60 font-medium">Aguardá un instante, por favor...</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default NewSale;
