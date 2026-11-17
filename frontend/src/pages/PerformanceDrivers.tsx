import React, { useState, useEffect } from 'react';
import { useApp } from '../context/AppContext';
import { analyticsService } from '../services/analyticsService';
import { PerformanceDimensionData, DriverCorrelation } from '../types';
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

export const PerformanceDrivers: React.FC = () => {
  const { datasetLoaded } = useApp();
  const [dimension, setDimension] = useState<string>('terrain_type');
  const [perfData, setPerfData] = useState<PerformanceDimensionData | null>(null);
  const [drivers, setDrivers] = useState<DriverCorrelation[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const fetchData = async (dim: string) => {
    setLoading(true);
    setError(null);
    try {
      const [perfRes, driversRes] = await Promise.all([
        analyticsService.getPerformance(dim),
        analyticsService.getDrivers(),
      ]);
      setPerfData(perfRes);
      setDrivers(driversRes.correlations);
    } catch (err: any) {
      setError(err.message || 'Failed to load performance & driver data.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (datasetLoaded) {
      fetchData(dimension);
    }
  }, [datasetLoaded, dimension]);

  if (!datasetLoaded) {
    return (
      <EmptyState
        title="Performance & Driver Analysis Not Available"
        description="Load a project dataset in the Data Center to evaluate categorical cost drivers and linear feature correlations."
      />
    );
  }

  if (loading && !perfData) {
    return <LoadingState message="Calculating dimension groupings and feature correlations..." />;
  }

  if (error) {
    return <ErrorState message={error} onRetry={() => fetchData(dimension)} />;
  }

  return (
    <div className="flex flex-col gap-card-gap">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-2">
        <div>
          <h2 className="font-headline-lg text-2xl lg:text-3xl font-semibold text-on-surface tracking-tight">
            Performance & Driver Analysis
          </h2>
          <p className="font-body-lg text-sm text-on-surface-variant max-w-2xl">
            Decompose cost & schedule overrun across dimensions and identify statistical correlation drivers.
          </p>
        </div>

        {/* Dimension Selector */}
        <div className="flex items-center gap-3 bg-surface-container border border-white/10 rounded-lg px-3 py-1.5 shadow-sm">
          <span className="text-xs text-on-surface-variant font-medium">Analyze Dimension:</span>
          <select
            value={dimension}
            onChange={(e) => setDimension(e.target.value)}
            className="bg-surface-dim text-on-surface text-sm border-0 focus:ring-1 focus:ring-primary rounded px-2 py-1 outline-none font-medium"
          >
            <option value="terrain_type">Terrain Type</option>
            <option value="project_type">Project Type</option>
            <option value="region">Region</option>
            <option value="complexity_level">Complexity Level</option>
            <option value="season">Season</option>
            <option value="weather_risk">Weather Risk</option>
          </select>
        </div>
      </div>

      {/* Grouped Performance Table */}
      <div className="bg-surface-container border border-white/5 rounded-xl shadow-lg overflow-hidden flex flex-col">
        <div className="p-4 border-b border-white/5 bg-surface-container-high/50 flex items-center justify-between">
          <h3 className="font-title-md text-base text-on-surface font-semibold capitalize">
            {dimension.replace('_', ' ')} Grouping Metrics
          </h3>
          <span className="text-xs text-on-surface-variant">
            {perfData?.data.length} Sub-categories analyzed
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-surface-dim border-b border-white/10 text-xs text-on-surface-variant uppercase">
                <th className="py-3 px-4 font-semibold capitalize">{dimension.replace('_', ' ')}</th>
                <th className="py-3 px-4 font-semibold text-right">Projects</th>
                <th className="py-3 px-4 font-semibold text-right">Avg Cost Overrun</th>
                <th className="py-3 px-4 font-semibold text-right">Avg Schedule Delay</th>
                <th className="py-3 px-4 font-semibold text-right">Avg Actual Cost</th>
                <th className="py-3 px-4 font-semibold text-right">Avg Duration</th>
                <th className="py-3 px-4 font-semibold text-right">Cost / sqft</th>
              </tr>
            </thead>
            <tbody className="font-code-sm text-xs text-on-surface divide-y divide-white/5">
              {perfData?.data.map((row, i) => (
                <tr key={i} className="hover:bg-white/[0.02] transition-colors">
                  <td className="py-3 px-4 font-semibold text-primary">{row[dimension]}</td>
                  <td className="py-3 px-4 text-right">{row.projects.toLocaleString()}</td>
                  <td className={`py-3 px-4 text-right font-semibold ${row.avg_cost_overrun_pct > 20 ? 'text-error' : row.avg_cost_overrun_pct > 10 ? 'text-tertiary' : 'text-secondary'}`}>
                    {Number(row.avg_cost_overrun_pct).toFixed(1)}%
                  </td>
                  <td className="py-3 px-4 text-right text-on-surface-variant font-medium">
                    {Number(row.avg_schedule_overrun_pct).toFixed(1)}%
                  </td>
                  <td className="py-3 px-4 text-right">₹{Number(row.avg_actual_cost).toLocaleString(undefined, { maximumFractionDigits: 0 })}</td>
                  <td className="py-3 px-4 text-right">{Number(row.avg_actual_duration).toFixed(0)} days</td>
                  <td className="py-3 px-4 text-right">₹{Number(row.avg_cost_per_sqft).toFixed(2)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Two Column Grid: Chart vs Driver Correlations */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-card-gap">
        {/* Dimension Comparison Chart */}
        <div className="bg-surface-container border border-white/5 rounded-xl p-6 shadow-lg flex flex-col">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-title-md text-base text-on-surface font-semibold capitalize">
              Cost Overrun by {dimension.replace('_', ' ')}
            </h3>
            <span className="text-xs text-on-surface-variant">Avg % Cost Drift</span>
          </div>
          <div className="h-72 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={perfData?.data || []} margin={{ top: 10, right: 10, left: -20, bottom: 20 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                <XAxis
                  dataKey={dimension}
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
                  {perfData?.data.map((entry, index) => (
                    <Cell
                      key={`perf-cell-${index}`}
                      fill={entry.avg_cost_overrun_pct > 25 ? '#ffb4ab' : entry.avg_cost_overrun_pct > 15 ? '#ffb95f' : '#4edea3'}
                    />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Feature Correlation / Driver Chart */}
        <div className="bg-surface-container border border-white/5 rounded-xl p-6 shadow-lg flex flex-col">
          <div className="flex items-center justify-between mb-2">
            <h3 className="font-title-md text-base text-on-surface font-semibold flex items-center gap-2">
              <span className="material-symbols-outlined text-primary text-lg">stacked_line_chart</span>
              Factor Influence (Cost Overrun Correlation)
            </h3>
          </div>
          <p className="font-body-md text-xs text-on-surface-variant mb-4">
            Linear Pearson correlation with cost overrun. Positive values accelerate budget slippage.
          </p>
          <div className="h-72 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart layout="vertical" data={drivers} margin={{ top: 10, right: 30, left: 40, bottom: 10 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                <XAxis type="number" stroke="#8c909f" fontSize={11} domain={[-0.5, 0.5]} />
                <YAxis dataKey="feature" type="category" stroke="#8c909f" fontSize={11} width={130} tickLine={false} />
                <Tooltip
                  contentStyle={{ backgroundColor: '#1d2027', borderColor: 'rgba(255,255,255,0.1)', borderRadius: '8px', color: '#e1e2ec' }}
                  formatter={(val: any) => [Number(val).toFixed(4), 'Correlation']}
                />
                <Bar dataKey="correlation" radius={[0, 4, 4, 0]}>
                  {drivers.map((entry, index) => (
                    <Cell
                      key={`corr-cell-${index}`}
                      fill={entry.correlation > 0.05 ? '#ffb4ab' : entry.correlation < -0.05 ? '#4edea3' : '#adc6ff'}
                    />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </div>
  );
};
