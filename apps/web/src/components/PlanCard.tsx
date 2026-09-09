import type { ReactNode } from 'react';
import type { TicketPlan } from '@scd/types';

interface PlanCardProps {
  plan: TicketPlan;
  /** When set, the whole card renders as a button (e.g. the registration picker). */
  onClick?: () => void;
  disabled?: boolean;
  cta: ReactNode;
}

/** One pricing card -- same structure for every ticket plan, driven entirely
 * by live plan data so a name/price/benefits change in the admin shows up
 * everywhere this is used (registration, homepage) without a code change. */
export function PlanCard({ plan, onClick, disabled, cta }: PlanCardProps) {
  const soldOut = plan.spotsLeft === 0;
  const content = (
    <>
      <span className="plan-card-label">{plan.name}</span>
      <span className="plan-card-price">
        {plan.currency} {plan.price}
      </span>
      {plan.description && <span className="plan-card-desc">{plan.description}</span>}
      {plan.benefits.length > 0 && (
        <ul className="plan-card-benefits">
          {plan.benefits.map((benefit) => (
            <li key={benefit}>{benefit}</li>
          ))}
        </ul>
      )}
      {plan.capacity != null && plan.spotsLeft != null && (
        <span className="plan-card-spots">{soldOut ? 'Sold out' : `${plan.spotsLeft} spot${plan.spotsLeft === 1 ? '' : 's'} left`}</span>
      )}
      {cta}
    </>
  );

  if (onClick) {
    return (
      <button type="button" className="plan-card" disabled={disabled || soldOut} onClick={onClick}>
        {content}
      </button>
    );
  }
  return <div className="plan-card">{content}</div>;
}
