import React, { useState, useEffect } from 'react';
import { useApp } from '../context/AppContext';
import { reportService } from '../services/reportService';
import { dataService } from '../services/dataService';
import { BusinessReportData } from '../types';
import { LoadingState, ErrorState, EmptyState } from '../components/StatusStates';
import { KpiCard } from '../components/KpiCard';

export const BusinessReport: React.FC = () => {
  const { datasetLoaded, showToast } = useApp();
  const [data, setData] = useState<BusinessReportData | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const fetchReport = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await reportService.getBusinessReport();
      setData(res);
    } catch (err: any) {
      setError(err.message || 'Failed to synthesize business report.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (datasetLoaded) {
      fetchReport();
    }
  }, [datasetLoaded]);

  const handleDownloadMarkdown = async () => {
    try {
      const blob = await reportService.downloadBusinessReport();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'Project_Pulse_Executive_Report.md';
      document.body.appendChild(a);
      a.click();
      a.remove();
      showToast('Executive Markdown report downloaded!', 'success');
    } catch (err: any) {
      showToast('Download failed', 'error');
    }
  };

  const handleDownloadCsv = async () => {
    try {
      const blob = await dataService.downloadCleanedCsv();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'cleaned_project_data.csv';
      document.body.appendChild(a);
      a.click();
      a.remove();
      showToast('Cleaned dataset CSV downloaded!', 'success');
    } catch (err: any) {
      showToast('Download failed', 'error');
    }
  };

  if (!datasetLoaded) {
    return (
      <EmptyState
        title="Business Report Not Available"
        description="Load a project dataset in the Data Center to generate automated executive business reports and audit summaries."
      />
    );
  }

  if (loading) {
    return <LoadingState message="Generating executive intelligence report..." />;
  }

  if (error) {
    return <ErrorState message={error} onRetry={fetchReport} />;
  }

  if (!data) return null;

  const s = data.portfolio_summary;
  const best = data.best_terrain;
  const worst = data.worst_terrain;

  return (
    <div className="flex flex-col gap-card-gap">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-2">
        <div>
          <div className="flex items-center gap-3 mb-2">
            <h2 className="font-headline-lg text-2xl lg:text-3xl font-semibold text-on-surface tracking-tight">
              Executive Business Report
            </h2>
            <span className="bg-secondary-container/20 text-secondary border border-secondary/30 px-3 py-1 rounded-full font-label-md text-xs flex items-center gap-1.5">
              <span className="material-symbols-outlined text-[14px] fill">verified</span>
              Automated Synthesis
            </span>
          </div>
          <p className="font-body-lg text-sm text-on-surface-variant max-w-2xl">
            Comprehensive portfolio findings, terrain-specific contingency guidelines, and empirical governance recommendations.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={handleDownloadMarkdown}
            className="bg-primary text-on-primary hover:bg-primary/90 px-4 py-2 rounded-lg font-title-md text-xs font-medium transition-colors flex items-center gap-2 shadow-lg shadow-primary/20"
          >
            <span className="material-symbols-outlined text-sm">markdown</span>
            Download Report (MD)
          </button>
          <button
            onClick={handleDownloadCsv}
            className="bg-surface-dim hover:bg-surface-variant border border-white/10 text-on-surface px-4 py-2 rounded-lg font-title-md text-xs font-medium transition-colors flex items-center gap-2"
          >
            <span className="material-symbols-outlined text-sm">csv</span>
            Download Cleaned CSV
          </button>
        </div>
      </div>

      {/* Portfolio Snapshot KPI Row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-card-gap">
        <KpiCard
          title="Evaluated Capital Projects"
          value={s.n_projects.toLocaleString()}
          icon="corporate_fare"
          subtitle="Portfolio scope"
        />
        <KpiCard
          title="Total Capital Expenditure"
          value={`₹${(s.total_actual_cost / 1_000_000).toFixed(1)}K`}
          icon="account_balance"
          subtitle={`Planned: ₹${(s.total_planned_cost / 1_000_000).toFixed(1)}K`}
        />
        <KpiCard
          title="Mean Cost Overrun"
          value={`${s.avg_cost_overrun_pct.toFixed(1)}%`}
          icon="trending_up"
          trend={{
            value: `${s.pct_on_budget.toFixed(0)}% On-Budget`,
            isPositive: s.pct_on_budget >= 70,
          }}
        />
        <KpiCard
          title="High-Risk Critical Flags"
          value={`${data.high_risk_count} Projects`}
          icon="warning"
          trend={{
            value: `Top 25% percentile`,
            isPositive: false,
          }}
        />
      </div>

      {/* Report Document Container */}
      <div className="bg-surface-container border border-white/5 rounded-xl p-8 shadow-xl flex flex-col gap-6">
        {/* Document Title Header */}
        <div className="border-b border-white/10 pb-4 flex flex-col md:flex-row md:items-center justify-between gap-2">
          <div>
            <h3 className="font-headline-md text-xl font-bold text-on-surface">
              PROJECT PULSE — Capital Portfolio Intelligence Report
            </h3>
            <p className="font-body-md text-xs text-on-surface-variant mt-1">
              Generated on {new Date(data.generated_at).toLocaleString()} | Automated ML Synthesis Engine
            </p>
          </div>
          <span className="bg-primary/10 text-primary border border-primary/20 text-xs px-3 py-1 rounded font-mono font-semibold">
            Confidential
          </span>
        </div>

        {/* Key Findings Section */}
        <div className="flex flex-col gap-3">
          <h4 className="font-title-md text-base font-semibold text-primary flex items-center gap-2">
            <span className="material-symbols-outlined text-lg">insights</span>
            1. Key Empirical Findings
          </h4>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="bg-surface-dim p-4 rounded-lg border border-secondary/20">
              <div className="flex items-center gap-2 text-secondary font-semibold text-xs mb-1 uppercase tracking-wider">
                <span className="material-symbols-outlined text-base">check_circle</span>
                Optimal Cost Discipline
              </div>
              <p className="text-sm text-on-surface">
                <strong>{best.terrain_type}</strong> terrain demonstrates the strongest budget adherence across the portfolio, averaging a cost overrun of only <strong>{Number(best.avg_cost_overrun_pct).toFixed(1)}%</strong> across {best.projects} completed projects.
              </p>
            </div>

            <div className="bg-surface-dim p-4 rounded-lg border border-error/20">
              <div className="flex items-center gap-2 text-error font-semibold text-xs mb-1 uppercase tracking-wider">
                <span className="material-symbols-outlined text-base">warning</span>
                Maximum Vulnerability Tier
              </div>
              <p className="text-sm text-on-surface">
                <strong>{worst.terrain_type}</strong> terrain represents the largest risk vector, exhibiting an average cost overrun of <strong>{Number(worst.avg_cost_overrun_pct).toFixed(1)}%</strong> across {worst.projects} projects.
              </p>
            </div>
          </div>
        </div>

        {/* Strategic Governance Recommendations */}
        <div className="flex flex-col gap-3">
          <h4 className="font-title-md text-base font-semibold text-secondary flex items-center gap-2">
            <span className="material-symbols-outlined text-lg">recommend</span>
            2. Executive Action Recommendations
          </h4>
          <div className="bg-surface-dim p-5 rounded-lg border border-white/5 flex flex-col gap-3">
            <div className="flex items-start gap-3">
              <div className="w-6 h-6 rounded-full bg-primary/20 text-primary flex items-center justify-center shrink-0 text-xs font-bold mt-0.5">
                1
              </div>
              <p className="text-sm text-on-surface leading-relaxed">
                <strong>Mandate Terrain-Weighted Contingency Reserves:</strong> Apply a supplemental cost contingency reserve for new projects in <em>{worst.terrain_type}</em> terrain to hedge against historical +{Number(worst.avg_cost_overrun_pct).toFixed(1)}% average inflation.
              </p>
            </div>

            <div className="flex items-start gap-3">
              <div className="w-6 h-6 rounded-full bg-primary/20 text-primary flex items-center justify-center shrink-0 text-xs font-bold mt-0.5">
                2
              </div>
              <p className="text-sm text-on-surface leading-relaxed">
                <strong>Pre-Bid AI Estimation Protocol:</strong> Require project estimators to run scope constraints through the <em>Project Pulse AI Estimator</em> prior to tender sign-off rather than relying on static per-square-foot baseline multipliers.
              </p>
            </div>

            <div className="flex items-start gap-3">
              <div className="w-6 h-6 rounded-full bg-primary/20 text-primary flex items-center justify-center shrink-0 text-xs font-bold mt-0.5">
                3
              </div>
              <p className="text-sm text-on-surface leading-relaxed">
                <strong>Resource Allocation Optimization:</strong> Deploy the <em>Smart Resource Optimizer</em> prior to mobilizing site teams to calibrate crew size vs equipment units according to project-specific cost or timeline strategic mandates.
              </p>
            </div>
          </div>
        </div>

        {/* Detailed Report Sections */}
        {data.sections.map((sec, idx) => (
          <div key={idx} className="flex flex-col gap-2">
            <h4 className="font-title-md text-sm font-semibold text-on-surface">
              {idx + 3}. {sec.title}
            </h4>
            <ul className="list-disc list-inside space-y-1 text-xs text-on-surface-variant bg-surface-dim p-4 rounded-lg border border-white/5">
              {sec.items.map((item, i) => (
                <li key={i} className="leading-relaxed">
                  {item}
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>
    </div>
  );
};
