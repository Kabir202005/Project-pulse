import React, { useState, useEffect } from 'react';
import { useApp } from '../context/AppContext';
import { analyticsService } from '../services/analyticsService';
import { PortfolioData } from '../types';
import { KpiCard } from '../components/KpiCard';
import { LoadingState, ErrorState, EmptyState } from '../components/StatusStates';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  Cell,
} from 'recharts';

export const ExecutiveDashboard: React.FC = () => {
  const { datasetLoaded, isAuthenticated, user, openAuthModal } = useApp();
  const [data, setData] = useState<PortfolioData | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const fetchPortfolio = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await analyticsService.getPortfolio();
      setData(res);
    } catch (err: any) {
      setError(err.message || 'Failed to fetch executive portfolio summary.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPortfolio();
  }, [datasetLoaded]);

  if (loading && !data) {
    return <LoadingState message="Aggregating portfolio intelligence..." />;
  }

  if (error && !data) {
    return <ErrorState message={error} onRetry={fetchPortfolio} />;
  }

  if (!data) {
    return (
      <EmptyState
        title="Executive Portfolio Initializing"
        description="Connecting to Project Pulse analytical engine to aggregate capital budget and variance intelligence."
        actionText="Retry Loading"
        actionPath="/dashboard"
      />
    );
  }

  return (
    <div className="flex flex-col gap-card-gap">
      {/* Public Dashboard Info / Authentication Banner */}
      {!isAuthenticated && (
        <div className="bg-surface-container border border-primary/20 rounded-xl p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 shadow-md bg-gradient-to-r from-primary/5 via-transparent to-transparent">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-primary/10 flex items-center justify-center text-primary shrink-0">
              <span className="material-symbols-outlined text-xl">public</span>
            </div>
            <div>
              <h4 className="text-sm font-semibold text-on-surface">Public Executive Dashboard</h4>
              <p className="text-xs text-on-surface-variant">
                You are viewing the open construction portfolio. Sign in with your email to access AI Estimator & Smart Resource Optimizer.
              </p>
            </div>
          </div>
          <button
            onClick={() => openAuthModal()}
            className="bg-primary text-on-primary hover:bg-primary/90 px-4 py-2 rounded-lg font-title-md text-xs font-medium transition-all shadow-sm shadow-primary/20 flex items-center gap-1.5 shrink-0"
          >
            <span className="material-symbols-outlined text-sm">login</span>
            <span>Sign In / Login</span>
          </button>
        </div>
      )}

      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-2">
        <div>
          <div className="flex items-center gap-3 mb-2">
            <h2 className="font-headline-lg text-2xl lg:text-3xl font-semibold text-on-surface tracking-tight">
              Executive Dashboard
            </h2>
            <span className="bg-primary/10 text-primary border border-primary/30 px-3 py-1 rounded-full font-label-md text-xs flex items-center gap-1.5">
              <span className="material-symbols-outlined text-[14px] fill">shield</span>
              Portfolio Oversight
            </span>
          </div>
          <p className="font-body-lg text-sm text-on-surface-variant max-w-2xl">
            Real-time capital budget adherence, schedule slippage rates, and high-risk project variance monitoring.
          </p>
        </div>

        {isAuthenticated && user && (
          <div className="flex items-center gap-2 bg-surface-container px-3 py-1.5 rounded-lg border border-white/5 text-xs text-on-surface-variant">
            <span className="material-symbols-outlined text-base text-secondary">verified_user</span>
            <span>Authenticated: <strong className="text-on-surface">{user.email}</strong></span>
          </div>
        )}
      </div>

      {/* KPI Row 1 */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-card-gap">
        <KpiCard
          title="Active Portfolio Projects"
          value={data.total_projects.toLocaleString()}
          icon="folder_special"
          subtitle="Total monitored capital projects"
        />
        <KpiCard
          title="Total Planned Budget"
          value={`₹${(data.planned_cost / 1_000_000).toFixed(1)}K`}
          icon="account_balance_wallet"
          subtitle={`₹${data.planned_cost.toLocaleString(undefined, { maximumFractionDigits: 0 })}`}
        />
        <KpiCard
          title="Total Actual Cost"
          value={`₹${(data.actual_cost / 1_000_000).toFixed(1)}K`}
          icon="payments"
          highlight
          trend={{
            value: `+${((data.actual_cost - data.planned_cost) / 1_000_000).toFixed(1)}M variance`,
            isPositive: false,
          }}
          subtitle={`₹${data.actual_cost.toLocaleString(undefined, { maximumFractionDigits: 0 })}`}
        />
        <KpiCard
          title="Avg. Cost Overrun"
          value={`${data.avg_cost_overrun.toFixed(1)}%`}
          icon="trending_up"
          trend={{
            value: `${data.avg_cost_overrun > 15 ? 'Critical' : 'Moderate'} Drift`,
            isPositive: data.avg_cost_overrun < 10,
          }}
          subtitle="Portfolio-wide mean cost drift"
        />
      </div>

      {/* KPI Row 2 */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-card-gap">
        <KpiCard
          title="Avg. Schedule Delay"
          value={`${data.avg_schedule_overrun.toFixed(1)}%`}
          icon="timelapse"
          trend={{
            value: `${data.avg_schedule_overrun > 15 ? 'High' : 'Controlled'} Drift`,
            isPositive: data.avg_schedule_overrun < 10,
          }}
        />
        <KpiCard
          title="On-Budget Rate (≤10%)"
          value={`${data.on_budget_rate.toFixed(0)}%`}
          icon="verified"
          trend={{
            value: `${data.on_budget_rate >= 70 ? 'Optimal' : 'Needs Review'}`,
            isPositive: data.on_budget_rate >= 70,
          }}
        />
        <KpiCard
          title="On-Schedule Rate (≤10%)"
          value={`${data.on_schedule_rate.toFixed(0)}%`}
          icon="event_available"
          trend={{
            value: `${data.on_schedule_rate >= 70 ? 'On Track' : 'Lagging'}`,
            isPositive: data.on_schedule_rate >= 70,
          }}
        />
        <KpiCard
          title="Cost Intensity"
          value={`₹${data.avg_cost_per_sqft.toFixed(2)}/sqft`}
          icon="square_foot"
          subtitle="Portfolio average intensity"
        />
      </div>

      {/* Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-card-gap">
        {/* Terrain Overruns */}
        <div className="bg-surface-container border border-white/5 rounded-xl p-6 shadow-lg flex flex-col">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-title-md text-base text-on-surface font-semibold flex items-center gap-2">
              <span className="material-symbols-outlined text-primary text-lg">terrain</span>
              Cost Overrun by Terrain Type
            </h3>
            <span className="text-xs text-on-surface-variant">Avg % Cost Drift</span>
          </div>
          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={data.terrain_overruns} margin={{ top: 10, right: 10, left: -20, bottom: 20 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                <XAxis
                  dataKey="terrain_type"
                  stroke="#8c909f"
                  fontSize={11}
                  angle={-15}
                  textAnchor="end"
                  tickLine={false}
                />
                <YAxis stroke="#8c909f" fontSize={11} unit="%" tickLine={false} />
                <Tooltip
                  contentStyle={{ backgroundColor: '#1d2027', borderColor: 'rgba(255,255,255,0.1)', borderRadius: '8px', color: '#e1e2ec' }}
                  formatter={(val: any) => [`${Number(val).toFixed(1)}%`, 'Avg Overrun']}
                />
                <Bar dataKey="avg_cost_overrun_pct" radius={[4, 4, 0, 0]}>
                  {data.terrain_overruns.map((entry, index) => (
                    <Cell
                      key={`cell-${index}`}
                      fill={entry.avg_cost_overrun_pct > 25 ? '#ffb4ab' : entry.avg_cost_overrun_pct > 15 ? '#ffb95f' : '#4edea3'}
                    />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Complexity Overruns */}
        <div className="bg-surface-container border border-white/5 rounded-xl p-6 shadow-lg flex flex-col">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-title-md text-base text-on-surface font-semibold flex items-center gap-2">
              <span className="material-symbols-outlined text-secondary text-lg">layers</span>
              Cost Overrun by Complexity Level
            </h3>
            <span className="text-xs text-on-surface-variant">Avg % Cost Drift</span>
          </div>
          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={data.complexity_overruns} margin={{ top: 10, right: 10, left: -20, bottom: 20 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                <XAxis dataKey="complexity_level" stroke="#8c909f" fontSize={11} tickLine={false} />
                <YAxis stroke="#8c909f" fontSize={11} unit="%" tickLine={false} />
                <Tooltip
                  contentStyle={{ backgroundColor: '#1d2027', borderColor: 'rgba(255,255,255,0.1)', borderRadius: '8px', color: '#e1e2ec' }}
                  formatter={(val: any) => [`${Number(val).toFixed(1)}%`, 'Avg Overrun']}
                />
                <Bar dataKey="avg_cost_overrun_pct" radius={[4, 4, 0, 0]}>
                  {data.complexity_overruns.map((entry, index) => (
                    <Cell
                      key={`cell-comp-${index}`}
                      fill={entry.complexity_level === 'High' ? '#ffb4ab' : entry.complexity_level === 'Medium' ? '#ffb95f' : '#4edea3'}
                    />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* High-Risk Projects Alert Table */}
      <div className="bg-surface-container border border-white/5 rounded-xl shadow-lg overflow-hidden flex flex-col">
        <div className="p-4 border-b border-white/5 bg-surface-container-high/50 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-error/10 text-error flex items-center justify-center">
              <span className="material-symbols-outlined text-lg">warning</span>
            </div>
            <div>
              <h3 className="font-title-md text-base text-on-surface font-semibold">Highest-Risk Projects</h3>
              <p className="font-body-md text-xs text-on-surface-variant">
                Flagged for cost overrun exceeding the 75th percentile benchmark ({data.high_risk_threshold.toFixed(1)}%)
              </p>
            </div>
          </div>
          <span className="bg-error/15 text-error border border-error/30 text-xs px-3 py-1 rounded-full font-semibold">
            {data.high_risk_projects.length} Critical Projects
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-surface-dim border-b border-white/10 text-xs text-on-surface-variant uppercase">
                <th className="py-3 px-4 font-semibold">Project ID</th>
                <th className="py-3 px-4 font-semibold">Type</th>
                <th className="py-3 px-4 font-semibold">Terrain</th>
                <th className="py-3 px-4 font-semibold">Complexity</th>
                <th className="py-3 px-4 font-semibold text-right">Planned Cost</th>
                <th className="py-3 px-4 font-semibold text-right">Actual Cost</th>
                <th className="py-3 px-4 font-semibold text-right">Cost Overrun %</th>
                <th className="py-3 px-4 font-semibold text-right">Schedule Overrun %</th>
              </tr>
            </thead>
            <tbody className="font-code-sm text-xs text-on-surface divide-y divide-white/5">
              {data.high_risk_projects.map((prj, i) => (
                <tr key={i} className="hover:bg-white/[0.02] transition-colors">
                  <td className="py-3 px-4 text-primary font-semibold">{prj.project_id}</td>
                  <td className="py-3 px-4">{prj.project_type}</td>
                  <td className="py-3 px-4">{prj.terrain_type}</td>
                  <td className="py-3 px-4">
                    <span className="bg-error/20 text-error border border-error/30 px-2 py-0.5 rounded text-[11px]">
                      {prj.complexity_level}
                    </span>
                  </td>
                  <td className="py-3 px-4 text-right">₹{Number(prj.planned_cost).toLocaleString(undefined, { maximumFractionDigits: 0 })}</td>
                  <td className="py-3 px-4 text-right">₹{Number(prj.actual_cost).toLocaleString(undefined, { maximumFractionDigits: 0 })}</td>
                  <td className="py-3 px-4 text-right font-semibold text-error">
                    +{Number(prj.cost_overrun_pct).toFixed(1)}%
                  </td>
                  <td className="py-3 px-4 text-right font-semibold text-tertiary">
                    +{Number(prj.schedule_overrun_pct).toFixed(1)}%
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
