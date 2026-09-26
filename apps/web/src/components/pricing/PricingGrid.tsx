import { useTicketPlans } from '../../lib/queries.js';
import { PlanCard } from '../PlanCard.js';
import { SkeletonGrid } from '../ui/Skeleton.js';
import { ErrorState } from '../ui/ErrorState.js';
import { EmptyState } from '../ui/EmptyState.js';

export function PricingGrid() {
  const { items: plans, loading, error, reload } = useTicketPlans();

  if (loading) return <SkeletonGrid count={2} />;
  if (error) return <ErrorState onRetry={reload} />;
  if (plans.length === 0) return <EmptyState message="Ticket pricing will be published soon." />;

  return (
    <div className="lanyard-tickets-row">
      {plans.map((plan, index) => (
        <PlanCard
          key={plan.id}
          plan={plan}
          phase={index === 0 ? 'PHASE 01' : 'PHASE 02'}
        />
      ))}
    </div>
  );
}
