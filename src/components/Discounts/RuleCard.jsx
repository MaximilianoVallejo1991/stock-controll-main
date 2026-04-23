/**
 * RuleCard.jsx
 * ─────────────────────────────────────────────────────────────────
 * Componente de presentación para una regla de descuento individual.
 * Usado por: DiscountsMainPage (Grid de Cards)
 *
 * Props:
 *  - rule: DiscountRule  — datos de la regla
 *  - onEdit: fn          — callback al clickar "Editar" (Fase 3)
 * ─────────────────────────────────────────────────────────────────
 */

import { useTheme } from '../../context/ThemeContext';
import { DISCOUNT_TYPE_META, conditionsToText } from '../../constants/discountConstants';
import { v } from '../../styles/variables';
import { RiEditLine } from 'react-icons/ri';

const RuleCard = ({ rule, onEdit }) => {
  const { theme } = useTheme();
  const meta = DISCOUNT_TYPE_META[rule.type] ?? { label: rule.type, icon: '🏷️' };
  const conditionText = conditionsToText(rule.type, rule.conditions);

  const cardStyle = {
    backgroundColor: theme.bgcards,
    borderColor: theme.border,
    color: theme.text,
    boxShadow: v.boxshadowGray,
  };

  const badgeStyle = rule.isActive
    ? { backgroundColor: theme.successBg, color: theme.successText }
    : { backgroundColor: theme.dangerBg, color: theme.dangerText };

  const percentageStyle = {
    color: theme.primary,
  };

  const subtitleStyle = {
    color: theme.colorSubtitle,
  };

  const iconBgStyle = {
    backgroundColor: theme.bg2,
  };

  const dividerStyle = {
    borderColor: theme.border,
  };

  return (
    <div
      className="rounded-xl border p-5 flex flex-col gap-3 transition-transform hover:scale-[1.02]"
      style={cardStyle}
    >
      {/* Header: icono + tipo + badge de estado */}
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <span
            className="text-xl w-9 h-9 flex items-center justify-center rounded-lg"
            style={iconBgStyle}
            aria-hidden="true"
          >
            {meta.icon}
          </span>
          <span className="text-xs font-semibold uppercase tracking-wide" style={subtitleStyle}>
            {meta.label}
          </span>
        </div>
        <span className="text-xs font-semibold px-2 py-1 rounded-full" style={badgeStyle}>
          {rule.isActive ? 'Activo' : 'Inactivo'}
        </span>
      </div>

      {/* Nombre */}
      <h3 className="font-bold text-base leading-tight" style={{ color: theme.colortitlecard }}>
        {rule.name}
      </h3>

      {/* Porcentaje — dato principal */}
      <div className="text-4xl font-black leading-none" style={percentageStyle}>
        {rule.percentage}%
      </div>

      {/* Descripción de conditions */}
      <p className="text-sm" style={subtitleStyle}>
        {conditionText}
      </p>

      {/* Descripción opcional */}
      {rule.description && (
        <p className="text-xs" style={{ color: theme.colorSubtitle, opacity: 0.75 }}>
          {rule.description}
        </p>
      )}

      {/* Divider */}
      <div className="border-t" style={dividerStyle} />

      {/* Footer: fechas + acciones */}
      <div className="flex items-center justify-between gap-2">
        <span className="text-xs" style={subtitleStyle}>
          {rule.endsAt
            ? `Vence: ${new Date(rule.endsAt).toLocaleDateString('es-AR')}`
            : 'Sin vencimiento'}
        </span>

        {/* Botón editar — Solo si tiene permiso (onEdit prop presente) */}
        {onEdit && (
          <button
            onClick={() => onEdit?.(rule)}
            className="flex items-center gap-1 text-xs px-3 py-1 rounded-lg transition-colors hover:opacity-80"
            style={{ backgroundColor: theme.bg2, color: theme.text }}
            title="Editar regla"
          >
            <RiEditLine size={14} />
            Editar
          </button>
        )}
      </div>
    </div>
  );
};

export default RuleCard;
