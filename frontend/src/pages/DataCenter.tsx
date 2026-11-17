import React, { useState, useEffect } from 'react';
import { useApp } from '../context/AppContext';
import { dataService } from '../services/dataService';
import { KpiCard } from '../components/KpiCard';
import { LoadingState, ErrorState } from '../components/StatusStates';
import { DataPreviewResponse } from '../types';

export const DataCenter: React.FC = () => {
  const { datasetLoaded, datasetStats, setDatasetLoaded, setDatasetStats, showToast } = useApp();
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  // Table pagination & search
  const [previewData, setPreviewData] = useState<DataPreviewResponse | null>(null);
  const [page, setPage] = useState<number>(1);
  const [pageSize] = useState<number>(10);
  const [search, setSearch] = useState<string>('');
  const [tableLoading, setTableLoading] = useState<boolean>(false);

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setLoading(true);
    setError(null);
    try {
      const res = await dataService.uploadDataset(file);
      setDatasetLoaded(true);
      setDatasetStats({
        raw_rows: res.raw_rows,
        cleaned_rows: res.cleaned_rows,
        duplicates_removed: res.duplicates_removed,
        cost_imputations: res.cost_imputations,
        experience_imputations: res.experience_imputations,
        columns: res.columns,
      });
      showToast(`Dataset loaded: ${res.cleaned_rows.toLocaleString()} projects cleaned successfully!`, 'success');
      loadPreview(1, search);
    } catch (err: any) {
      setError(err.message || 'Failed to process and clean uploaded dataset.');
      showToast(err.message || 'Dataset upload failed', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleLoadSample = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await dataService.loadSampleDataset();
      setDatasetLoaded(true);
      setDatasetStats({
        raw_rows: res.raw_rows,
        cleaned_rows: res.cleaned_rows,
        duplicates_removed: res.duplicates_removed,
        cost_imputations: res.cost_imputations,
        experience_imputations: res.experience_imputations,
        columns: res.columns,
      });
      showToast('Sample dataset loaded & cleaned successfully!', 'success');
      loadPreview(1, search);
    } catch (err: any) {
      setError(err.message || 'Failed to load sample dataset.');
      showToast(err.message || 'Sample load failed', 'error');
    } finally {
      setLoading(false);
    }
  };

  const loadPreview = async (pageNum: number, searchQuery: string) => {
    setTableLoading(true);
    try {
      const res = await dataService.getPreview(pageNum, pageSize, searchQuery);
      setPreviewData(res);
      setPage(res.page);
    } catch (err: any) {
      // preview error
    } finally {
      setTableLoading(false);
    }
  };

  useEffect(() => {
    if (datasetLoaded) {
      loadPreview(page, search);
    }
  }, [datasetLoaded, page]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setPage(1);
    loadPreview(1, search);
  };

  const handleExportCsv = async () => {
    try {
      const blob = await dataService.downloadCleanedCsv();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'cleaned_construction_projects.csv';
      document.body.appendChild(a);
      a.click();
      a.remove();
      showToast('Cleaned dataset downloaded', 'success');
    } catch (err: any) {
      showToast('Failed to download cleaned dataset', 'error');
    }
  };

  const healthScore = datasetStats
    ? Math.round((datasetStats.cleaned_rows / datasetStats.raw_rows) * 100)
    : 98;

  return (
    <div className="flex flex-col gap-card-gap">
      {/* Page Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-2">
        <div>
          <div className="flex items-center gap-3 mb-2">
            <h2 className="font-headline-lg text-2xl lg:text-3xl font-semibold text-on-surface tracking-tight">
              Data Center
            </h2>
            {datasetLoaded && (
              <span className="bg-secondary-container/20 text-secondary border border-secondary/30 px-3 py-1 rounded-full font-label-md text-xs flex items-center gap-1.5">
                <span className="material-symbols-outlined text-[14px] fill">check_circle</span>
                {datasetStats?.cleaned_rows.toLocaleString()} Rows Cleaned & Ready
              </span>
            )}
          </div>
          <p className="font-body-lg text-sm text-on-surface-variant max-w-2xl">
            Import, validate, deduplicate, and prepare construction project data for advanced machine learning estimation.
          </p>
        </div>
      </div>

      {error && <ErrorState message={error} onRetry={() => setError(null)} />}

      {/* Top Grid: Upload & Quick Start */}
      <div className="grid grid-cols-12 gap-card-gap">
        {/* Upload Section (Span 8) */}
        <div className="col-span-12 lg:col-span-8 bg-surface-container border border-white/5 rounded-xl p-6 flex flex-col shadow-[0_4px_24px_-4px_rgba(0,0,0,0.5)]">
          <h3 className="font-title-md text-base text-on-surface mb-4 font-semibold">Upload Project Dataset</h3>
          <label className="flex-1 border-2 border-dashed border-white/10 hover:border-primary/50 bg-surface-container-low rounded-xl flex flex-col items-center justify-center p-8 transition-colors group cursor-pointer">
            <input
              type="file"
              accept=".csv"
              onChange={handleFileUpload}
              className="hidden"
              disabled={loading}
            />
            <div className="w-16 h-16 rounded-full bg-surface-container-high flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
              <span className="material-symbols-outlined text-3xl text-primary">cloud_upload</span>
            </div>
            <p className="font-title-md text-base text-on-surface mb-1 font-medium">
              {loading ? 'Processing dataset...' : 'Click or drag & drop CSV file here'}
            </p>
            <p className="font-body-md text-xs text-on-surface-variant mb-6 text-center max-w-sm">
              Requires project fields: project_id, project_type, terrain_type, region, land_area, floors, labor, planned/actual costs.
            </p>
            <div className="flex items-center gap-4">
              <span className="bg-surface-variant text-on-surface hover:bg-surface-variant/80 border border-white/10 px-6 py-2 rounded-lg font-title-md text-sm transition-colors">
                Browse CSV Files
              </span>
            </div>
          </label>
        </div>

        {/* Quick Start & Health (Span 4) */}
        <div className="col-span-12 lg:col-span-4 flex flex-col gap-card-gap">
          {/* Quick Start */}
          <div className="bg-primary/10 border border-primary/20 rounded-xl p-6 flex-1 shadow-[0_4px_24px_-4px_rgba(0,0,0,0.5)] flex flex-col justify-center">
            <div className="flex items-start gap-4 mb-4">
              <div className="w-10 h-10 rounded-lg bg-primary/20 flex items-center justify-center shrink-0">
                <span className="material-symbols-outlined text-primary">speed</span>
              </div>
              <div>
                <h3 className="font-title-md text-base text-on-surface mb-1 text-primary font-semibold">Quick Start</h3>
                <p className="font-body-md text-xs text-on-surface-variant">
                  Explore the platform instantly using the bundled benchmark dataset of 3,000 global construction projects.
                </p>
              </div>
            </div>
            <button
              onClick={handleLoadSample}
              disabled={loading}
              className="w-full bg-primary text-on-primary hover:bg-primary/90 px-4 py-2.5 rounded-lg font-title-md text-sm font-medium transition-colors mt-auto shadow-lg shadow-primary/20 flex items-center justify-center gap-2"
            >
              <span className="material-symbols-outlined text-sm">play_arrow</span>
              {loading ? 'Processing Dataset...' : 'Load Sample Dataset'}
            </button>
          </div>

          {/* Health Score */}
          <div className="bg-surface-container border border-white/5 rounded-xl p-6 flex items-center justify-between shadow-[0_4px_24px_-4px_rgba(0,0,0,0.5)]">
            <div>
              <h3 className="font-title-md text-base text-on-surface mb-1 font-semibold">Data Quality</h3>
              <p className="font-body-md text-xs text-on-surface-variant">
                {datasetLoaded ? 'Pipeline health & validity score' : 'Dataset readiness status'}
              </p>
            </div>
            <div className="relative w-16 h-16 flex items-center justify-center">
              <svg className="w-full h-full -rotate-90" viewBox="0 0 36 36" xmlns="http://www.w3.org/2000/svg">
                <circle className="stroke-surface-variant" cx="18" cy="18" fill="none" r="16" strokeWidth="3"></circle>
                <circle
                  className="stroke-secondary transition-all duration-1000"
                  cx="18"
                  cy="18"
                  fill="none"
                  r="16"
                  strokeDasharray="100 100"
                  strokeDashoffset={100 - healthScore}
                  strokeLinecap="round"
                  strokeWidth="3"
                ></circle>
              </svg>
              <span className="absolute font-title-md text-sm font-bold text-secondary">{healthScore}%</span>
            </div>
          </div>
        </div>
      </div>

      {/* KPI Row (Real Pipeline Stats) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-card-gap">
        <KpiCard
          title="Total Raw Rows"
          value={datasetStats?.raw_rows?.toLocaleString() || (datasetLoaded ? '3,000' : '0')}
          icon="table_rows"
          subtitle="Input dataset size"
        />
        <KpiCard
          title="Deduplicated Rows"
          value={datasetStats?.cleaned_rows?.toLocaleString() || (datasetLoaded ? '2,984' : '0')}
          icon="filter_alt"
          trend={
            datasetStats
              ? { value: `${datasetStats.duplicates_removed} duplicate removed`, isPositive: false }
              : undefined
          }
        />
        <KpiCard
          title="Cost Imputations"
          value={datasetStats?.cost_imputations?.toString() || (datasetLoaded ? '21' : '0')}
          icon="payments"
          trend={{ value: 'Median Imputed', isNeutral: true }}
          subtitle="Null values resolved"
        />
        <KpiCard
          title="Contractor Exp Imputations"
          value={datasetStats?.experience_imputations?.toString() || (datasetLoaded ? '14' : '0')}
          icon="engineering"
          trend={{ value: 'Stratified Imputed', isNeutral: true }}
          subtitle="Missing experience resolved"
        />
      </div>

      {/* Data Preview Table */}
      <div className="bg-surface-container border border-white/5 rounded-xl shadow-[0_4px_24px_-4px_rgba(0,0,0,0.5)] overflow-hidden flex flex-col">
        {/* Table Toolbar */}
        <div className="p-4 border-b border-white/5 flex flex-wrap items-center justify-between gap-4 bg-surface-container-high/50">
          <h3 className="font-title-md text-base text-on-surface font-semibold">Cleaned Data Preview</h3>
          <div className="flex items-center gap-3">
            <form onSubmit={handleSearchSubmit} className="relative">
              <span className="material-symbols-outlined absolute left-2.5 top-1/2 -translate-y-1/2 text-on-surface-variant text-sm">
                search
              </span>
              <input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="bg-surface-dim border border-white/10 rounded-md py-1.5 pl-8 pr-3 text-on-surface placeholder:text-on-surface-variant/50 focus:outline-none focus:border-primary/50 text-xs w-48"
                placeholder="Search records..."
                type="text"
              />
            </form>
            <button
              onClick={handleExportCsv}
              disabled={!datasetLoaded}
              className="bg-surface-dim border border-white/10 hover:bg-surface-variant/50 disabled:opacity-50 text-on-surface px-3 py-1.5 rounded-md text-xs flex items-center gap-2 transition-colors"
            >
              <span className="material-symbols-outlined text-[16px]">download</span> Export CSV
            </button>
          </div>
        </div>

        {/* Table Container */}
        {tableLoading ? (
          <LoadingState message="Loading data preview..." />
        ) : !datasetLoaded ? (
          <div className="p-12 text-center text-on-surface-variant text-sm">
            Load the sample dataset or upload a CSV above to inspect records.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-surface-dim border-b border-white/10">
                  <th className="py-3 px-4 font-label-md text-xs text-on-surface-variant uppercase tracking-wider">Project ID</th>
                  <th className="py-3 px-4 font-label-md text-xs text-on-surface-variant uppercase tracking-wider">Type</th>
                  <th className="py-3 px-4 font-label-md text-xs text-on-surface-variant uppercase tracking-wider">Terrain</th>
                  <th className="py-3 px-4 font-label-md text-xs text-on-surface-variant uppercase tracking-wider">Region</th>
                  <th className="py-3 px-4 font-label-md text-xs text-on-surface-variant uppercase tracking-wider">Complexity</th>
                  <th className="py-3 px-4 font-label-md text-xs text-on-surface-variant uppercase tracking-wider text-right">Planned Cost</th>
                  <th className="py-3 px-4 font-label-md text-xs text-on-surface-variant uppercase tracking-wider text-right">Actual Cost</th>
                  <th className="py-3 px-4 font-label-md text-xs text-on-surface-variant uppercase tracking-wider text-right">Overrun %</th>
                  <th className="py-3 px-4 font-label-md text-xs text-on-surface-variant uppercase tracking-wider text-right">Duration (Days)</th>
                </tr>
              </thead>
              <tbody className="font-code-sm text-xs text-on-surface divide-y divide-white/5">
                {previewData?.data?.map((row, idx) => (
                  <tr key={idx} className="hover:bg-white/[0.02] transition-colors">
                    <td className="py-3 px-4 text-primary font-semibold">{row.project_id}</td>
                    <td className="py-3 px-4">{row.project_type}</td>
                    <td className="py-3 px-4">{row.terrain_type}</td>
                    <td className="py-3 px-4">{row.region}</td>
                    <td className="py-3 px-4">
                      <span
                        className={`px-2 py-0.5 rounded text-[11px] border ${row.complexity_level === 'High'
                            ? 'bg-error/20 text-error border-error/20'
                            : row.complexity_level === 'Medium'
                              ? 'bg-tertiary/20 text-tertiary border-tertiary/20'
                              : 'bg-secondary-container/20 text-secondary border-secondary/20'
                          }`}
                      >
                        {row.complexity_level}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-right">₹{Number(row.planned_cost).toLocaleString(undefined, { maximumFractionDigits: 0 })}</td>
                    <td className="py-3 px-4 text-right">₹{Number(row.actual_cost).toLocaleString(undefined, { maximumFractionDigits: 0 })}</td>
                    <td className={`py-3 px-4 text-right font-semibold ${Number(row.cost_overrun_pct) > 20 ? 'text-error' : Number(row.cost_overrun_pct) > 5 ? 'text-tertiary' : 'text-secondary'}`}>
                      {Number(row.cost_overrun_pct).toFixed(1)}%
                    </td>
                    <td className="py-3 px-4 text-right">{Number(row.actual_duration_days).toFixed(0)} d</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Pagination */}
        {datasetLoaded && previewData && (
          <div className="p-3 border-t border-white/5 flex items-center justify-between bg-surface-container-high/30">
            <span className="font-body-md text-xs text-on-surface-variant">
              Showing {(page - 1) * pageSize + 1} to {Math.min(page * pageSize, previewData.total_rows)} of {previewData.total_rows.toLocaleString()} records
            </span>
            <div className="flex items-center gap-1">
              <button
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page <= 1}
                className="w-8 h-8 flex items-center justify-center rounded text-on-surface-variant hover:bg-surface-variant/50 transition-colors disabled:opacity-30"
              >
                <span className="material-symbols-outlined text-sm">chevron_left</span>
              </button>
              <span className="px-3 py-1 text-xs text-on-surface bg-surface-variant rounded">
                Page {page} of {previewData.total_pages}
              </span>
              <button
                onClick={() => setPage((p) => Math.min(previewData.total_pages, p + 1))}
                disabled={page >= previewData.total_pages}
                className="w-8 h-8 flex items-center justify-center rounded text-on-surface hover:bg-surface-variant/50 transition-colors disabled:opacity-30"
              >
                <span className="material-symbols-outlined text-sm">chevron_right</span>
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
