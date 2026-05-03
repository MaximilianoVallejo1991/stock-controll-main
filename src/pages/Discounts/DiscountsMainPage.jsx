/**
 * DiscountsMainPage.jsx
 * ─────────────────────────────────────────────────────────────────
 * Página principal del panel de administración de descuentos.
 * Ruta: /discounts
 *
 * Responsabilidades:
 *  - Cargar la lista de reglas desde GET /api/discounts
 *  - Filtrar localmente por estado (activo / inactivo / todos)
 *  - Renderizar el Grid de RuleCards
 *  - Controlar apertura/cierre del DiscountFormModal (crear/editar)
 * ─────────────────────────────────────────────────────────────────
 */

import { useEffect, useMemo, useState } from 'react';
import { useTheme } from '../../context/ThemeContext';
import useDiscountStore from '../../store/discountStore';
import useUserStore from '../../store/userStore';
import { getAllDiscounts, deleteDiscount, deactivateDiscount, activateDiscount } from '../../services/discountService';
import RuleCard from '../../components/Discounts/RuleCard';
import DiscountFormModal from '../../components/Discounts/DiscountFormModal';
import ConfirmModal from '../../components/Modals/ConfirmModal';
import ThemedButton from '../../components/ThemedButton';
import { ROLES } from '../../constants/roles';

const FILTERS = [
  { key: 'all',      label: 'Todos' },
  { key: 'active',   label: 'Activos' },
  { key: 'inactive', label: 'Inactivos' },
];

const DiscountsMainPage = () => {
  const { theme } = useTheme();
  const activeStore = useUserStore((state) => state.activeStore);

  const user = useUserStore((state) => state.user);
  const simulatedRole = useUserStore((state) => state.simulatedRole);
  const effectiveRole = (simulatedRole || user?.role)?.toUpperCase();
  const canManageDiscounts = [ROLES.SISTEMA, ROLES.ADMINISTRADOR, ROLES.ENCARGADO].includes(effectiveRole);

  const {
    rules,
    isLoadingRules,
    rulesError,
    filter,
    setRules,
    setLoadingRules,
    setRulesError,
    setFilter,
    upsertRule,
  } = useDiscountStore();

  // ── Estado del modal ────────────────────────────────────────────
  const [isModalOpen, setIsModalOpen]   = useState(false);
  const [selectedRule, setSelectedRule] = useState(null); // null = crear

  // ── Estado de eliminación ─────────────────────────────────────
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [ruleToDelete, setRuleToDelete] = useState(null);

  // ── Estado para toggle ─────────────────────────────────────────
  const [showToggleConfirm, setShowToggleConfirm] = useState(false);
  const [toggleTarget, setToggleTarget] = useState(null); // { id, shouldActivate }

  // ── Fetch inicial ────────────────────────────────────────────────
  useEffect(() => {
    // Si no hay tienda activa, no intentar cargar descuentos
    if (!activeStore) {
      setRules([]); // Limpiar reglas previas
      setRulesError(null);
      return;
    }

    setLoadingRules(true);
    setRulesError(null);

    getAllDiscounts()
      .then((data) => setRules(data))
      .catch((err) => setRulesError(err.response?.data?.message ?? 'Error al cargar descuentos.'))
      .finally(() => setLoadingRules(false));
  }, [activeStore, setRules, setLoadingRules, setRulesError]);

  // ── Filtro local ────────────────────────────────────────────────
  const filteredRules = useMemo(() => {
    if (filter === 'active')   return rules.filter((r) => r.isActive);
    if (filter === 'inactive') return rules.filter((r) => !r.isActive);
    return rules;
  }, [rules, filter]);

  // ── Handlers del modal ──────────────────────────────────────────
  const handleOpenCreate = () => {
    // No permitir crear si no hay tienda activa
    if (!activeStore) {
      setRulesError('Seleccioná una tienda antes de crear un descuento.');
      return;
    }
    setSelectedRule(null);
    setIsModalOpen(true);
  };

  const handleOpenEdit = (rule) => {
    setSelectedRule(rule);
    setIsModalOpen(true);
  };

  const handleClose = () => {
    setIsModalOpen(false);
    setSelectedRule(null);
  };

  const handleSuccess = (updatedRule) => {
    // Actualiza la lista local sin refetch
    upsertRule(updatedRule);
  };

  // ── Handlers de eliminación ─────────────────────────────────────
  const handleDeleteClick = (rule) => {
    setRuleToDelete(rule);
    setShowDeleteConfirm(true);
  };

  const handleConfirmDelete = async () => {
    if (!ruleToDelete) return;

    try {
      await deleteDiscount(ruleToDelete.id);
      // Remover de la lista local sin refetch
      setRules(rules.filter((r) => r.id !== ruleToDelete.id));
      setShowDeleteConfirm(false);
      setRuleToDelete(null);
      setIsModalOpen(false);
      setSelectedRule(null);
    } catch (err) {
      setRulesError(err.response?.data?.message ?? 'Error al eliminar la regla.');
      setShowDeleteConfirm(false);
    }
  };

  // ── Handler para toggle ────────────────────────────────────────
  const handleToggleActive = (id, shouldActivate) => {
    setToggleTarget({ id, shouldActivate });
    setShowToggleConfirm(true);
  };

  const handleConfirmToggle = async () => {
    if (!toggleTarget) return;
    try {
      if (toggleTarget.shouldActivate) {
        await activateDiscount(toggleTarget.id);
      } else {
        await deactivateDiscount(toggleTarget.id);
      }
      // Refrescar lista
      const data = await getAllDiscounts();
      setRules(data);
      setShowToggleConfirm(false);
      setToggleTarget(null);
      setIsModalOpen(false);
      setSelectedRule(null);
    } catch (err) {
      setRulesError(err.response?.data?.message ?? `Error al ${toggleTarget.shouldActivate ? 'habilitar' : 'deshabilitar'} la regla.`);
    }
  };

  // ── Handler para toggle ────────────────────────────────────────
  const handleCancelDelete = () => {
    setShowDeleteConfirm(false);
    setRuleToDelete(null);
  };

  // ── Render ───────────────────────────────────────────────────────
  return (
    <div className="p-6 min-h-screen" style={{ backgroundColor: theme.bg, color: theme.text }}>

      {/* Header */}
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-bold">Reglas de Descuento</h1>
          <p className="text-sm mt-1" style={{ color: theme.colorSubtitle }}>
            Administrá las reglas de descuento de tu tienda
          </p>
        </div>

        {/* Solo mostrar botón si hay tienda activa y tiene permiso */}
        {activeStore && canManageDiscounts && (
          <ThemedButton onClick={handleOpenCreate}>
            + Crear descuento
          </ThemedButton>
        )}
      </div>

      {/* Filtros rápidos */}
      <div className="flex gap-2 mb-6 flex-wrap">
        {FILTERS.map(({ key, label }) => (
          <button
            key={key}
            onClick={() => setFilter(key)}
            className="px-4 py-1.5 rounded-full text-sm font-medium transition-colors"
            style={{
              backgroundColor: filter === key ? theme.primary : theme.bg2,
              color:           filter === key ? '#fff' : theme.text,
            }}
          >
            {label}
          </button>
        ))}
      </div>

      {/* Loading state */}
      {isLoadingRules && (
        <div className="flex justify-center items-center py-20">
          <span className="text-sm animate-pulse" style={{ color: theme.colorSubtitle }}>
            Cargando reglas...
          </span>
        </div>
      )}

      {/* Estado: tienda no seleccionada */}
      {!isLoadingRules && !activeStore && !rulesError && (
        <div className="flex flex-col items-center justify-center py-20 gap-3">
          <span className="text-5xl">🏪</span>
          <p className="font-semibold text-lg">Seleccioná una tienda</p>
          <p className="text-sm" style={{ color: theme.colorSubtitle }}>
            Elegí una tienda del selector superior para ver sus descuentos.
          </p>
        </div>
      )}

      {/* Error state */}
      {rulesError && !isLoadingRules && activeStore && (
        <div
          className="rounded-lg p-4 text-sm mb-4"
          style={{ backgroundColor: theme.dangerBg, color: theme.dangerText }}
        >
          {rulesError}
        </div>
      )}

      {/* Empty state */}
      {!isLoadingRules && !rulesError && activeStore && filteredRules.length === 0 && (
        <div className="flex flex-col items-center justify-center py-20 gap-3">
          <span className="text-5xl">🏷️</span>
          <p className="font-semibold text-lg">No hay reglas de descuento</p>
          <p className="text-sm" style={{ color: theme.colorSubtitle }}>
            {filter !== 'all'
              ? 'No hay reglas con ese estado. Probá cambiando el filtro.'
              : 'Creá la primera regla de descuento para tu tienda.'}
          </p>
        </div>
      )}

      {/* Grid de Cards */}
      {!isLoadingRules && !rulesError && activeStore && filteredRules.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredRules.map((rule) => (
            <RuleCard
              key={rule.id}
              rule={rule}
              onEdit={canManageDiscounts ? handleOpenEdit : null}
            />
          ))}
        </div>
      )}

      {/* Modal crear/editar */}
      <DiscountFormModal
        isOpen={isModalOpen}
        onClose={handleClose}
        rule={selectedRule}
        onSuccess={handleSuccess}
        onDelete={selectedRule ? () => handleDeleteClick(selectedRule) : undefined}
        onToggleActive={handleToggleActive}
      />

      {/* Modal de confirmación de toggle */}
      <ConfirmModal
        isOpen={showToggleConfirm}
        onClose={() => { setShowToggleConfirm(false); setToggleTarget(null); }}
        onConfirm={handleConfirmToggle}
        title={toggleTarget?.shouldActivate ? 'Habilitar descuento' : 'Deshabilitar descuento'}
        message={`¿Estás seguro de ${toggleTarget?.shouldActivate ? 'habilitar' : 'deshabilitar'} este descuento?`}
        confirmText={toggleTarget?.shouldActivate ? 'Habilitar' : 'Deshabilitar'}
      />

      {/* Modal de confirmación de eliminación */}
      <ConfirmModal
        isOpen={showDeleteConfirm}
        onClose={handleCancelDelete}
        onConfirm={handleConfirmDelete}
        message={`¿Eliminar "${ruleToDelete?.name}"?`}
      >
        <p className="text-sm" style={{ color: theme.textSecondary }}>
          Esta acción no se puede deshacer. La regla será eliminada permanentemente.
        </p>
      </ConfirmModal>

    </div>
  );
};

export { DiscountsMainPage };
