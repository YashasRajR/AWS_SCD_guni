import { Link } from 'react-router-dom';
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
    <div className="plan-card-grid">
      {plans.map((plan) => (
        <PlanCard
          key={plan.id}
          plan={plan}
          cta={
            <Link to="/register" className="btn btn-primary">
              Register for {plan.name} →
            </Link>
          }
        />
      ))}
    </div>
  );
}
