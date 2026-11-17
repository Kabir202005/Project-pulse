import React from 'react';
import { Link, NavLink, useNavigate } from 'react-router-dom';
import { useApp } from '../context/AppContext';

const navItems = [
  { path: '/dashboard', label: 'Executive Dashboard', icon: 'dashboard' },
  { path: '/data-center', label: 'Data Center', icon: 'database' },
  { path: '/performance', label: 'Performance & Drivers', icon: 'insights' },
  { path: '/visualizations', label: 'Interactive Visualizations', icon: 'monitoring' },
  { path: '/estimator', label: 'AI Estimator', icon: 'psychology' },
  { path: '/optimizer', label: 'Smart Resource Optimizer', icon: 'precision_manufacturing' },
  { path: '/what-if', label: 'Sensitivity / What-If', icon: 'query_stats' },
  { path: '/comparison', label: 'Project Comparison', icon: 'compare_arrows' },
  { path: '/reports', label: 'Business Report', icon: 'assessment' },
];

export const Sidebar: React.FC = () => {
  const { datasetLoaded, datasetStats, modelStatus } = useApp();
  const navigate = useNavigate();

  return (
    <nav className="bg-surface-container-low flex flex-col h-full w-[260px] fixed left-0 top-0 z-40 border-r border-white/5">
      {/* Header */}
      <div className="p-container-padding flex items-center gap-3 border-b border-white/5">
        <Link to="/dashboard" className="flex items-center gap-3 w-full group">
          <div className="w-10 h-10 rounded-lg bg-primary-container flex items-center justify-center shrink-0 group-hover:bg-primary transition-colors">
            <span className="material-symbols-outlined text-on-primary-container group-hover:text-on-primary transition-colors fill">precision_manufacturing</span>
          </div>
          <div>
            <h1 className="font-headline-md text-base font-bold text-on-surface tracking-tight group-hover:text-primary transition-colors">PROJECT PULSE</h1>
            <p className="font-label-md text-xs text-on-surface-variant uppercase tracking-widest mt-0.5">Construction Intelligence</p>
          </div>
        </Link>
      </div>

      {/* Main Navigation Links */}
      <div className="flex-1 overflow-y-auto py-4">
        <ul className="flex flex-col gap-1 px-3">
          {navItems.map((item) => (
            <li key={item.path}>
              <NavLink
                to={item.path}
                className={({ isActive }) =>
                  isActive
                    ? 'flex items-center gap-3 px-3 py-2.5 rounded-lg text-primary font-bold border-l-4 border-primary bg-primary/10 transition-colors'
                    : 'flex items-center gap-3 px-3 py-2.5 rounded-lg text-on-surface-variant font-body-md text-sm hover:bg-white/5 hover:text-on-surface transition-colors ml-1 border-l-4 border-transparent'
                }
              >
                {({ isActive }) => (
                  <>
                    <span className={`material-symbols-outlined text-[20px] ${isActive ? 'fill' : ''}`}>
                      {item.icon}
                    </span>
                    <span className="font-title-md text-sm">{item.label}</span>
                  </>
                )}
              </NavLink>
            </li>
          ))}
        </ul>
      </div>

      {/* CTA & Status Footer */}
      <div className="p-container-padding flex flex-col gap-4 border-t border-white/5">
        <button
          onClick={() => navigate('/optimizer')}
          className="w-full bg-primary/10 text-primary border border-primary/30 hover:bg-primary/20 py-2.5 rounded-lg font-title-md text-sm font-medium transition-colors flex items-center justify-center gap-2"
        >
          <span className="material-symbols-outlined text-sm">rocket_launch</span>
          Optimize Project
        </button>

        <ul className="flex flex-col gap-2">
          <li>
            <div className={`flex items-center gap-3 font-label-md text-xs transition-colors ${datasetLoaded ? 'text-secondary' : 'text-on-surface-variant'}`}>
              <span className="material-symbols-outlined text-[18px]">inventory_2</span>
              <span>
                {datasetLoaded
                  ? `Dataset: ${datasetStats?.cleaned_rows?.toLocaleString() || 'Loaded'} Projects`
                  : 'Dataset: Not Loaded'}
              </span>
            </div>
          </li>
          <li>
            <div className={`flex items-center gap-3 font-label-md text-xs transition-colors ${modelStatus.trained ? 'text-secondary' : 'text-tertiary'}`}>
              <span className={`material-symbols-outlined text-[18px] ${modelStatus.trained ? 'fill' : ''}`}>memory</span>
              <span>Model: {modelStatus.trained ? 'Ready' : 'Not Trained'}</span>
            </div>
          </li>
        </ul>
      </div>
    </nav>
  );
};
