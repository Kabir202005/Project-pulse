import React from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useApp } from '../context/AppContext';

export const TopNav: React.FC = () => {
  const navigate = useNavigate();
  const { user, isAuthenticated, openAuthModal, logout } = useApp();

  return (
    <header className="flex justify-between items-center w-full px-container-padding h-16 sticky top-0 z-30 bg-surface/80 backdrop-blur-xl border-b border-white/5">
      <div className="flex items-center gap-6">
        {/* Search */}
        <div className="relative group hidden lg:block">
          <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-on-surface-variant group-focus-within:text-primary transition-colors text-sm">
            search
          </span>
          <input
            className="bg-surface-container-high border border-white/5 rounded-lg py-1.5 pl-10 pr-4 text-on-surface placeholder:text-on-surface-variant/50 focus:outline-none focus:border-primary/50 focus:ring-1 focus:ring-primary/50 transition-all font-body-md text-sm w-64"
            placeholder="Search modules & records..."
            type="text"
          />
        </div>
        <nav className="flex gap-4">
          <Link to="/dashboard" className="text-on-surface-variant font-body-md text-sm hover:text-primary transition-colors py-1">
            Dashboard
          </Link>
          <Link to="/performance" className="text-on-surface-variant font-body-md text-sm hover:text-primary transition-colors py-1">
            Analytics
          </Link>
          <Link to="/estimator" className="text-on-surface-variant font-body-md text-sm hover:text-primary transition-colors py-1">
            AI Tools
          </Link>
        </nav>
      </div>

      <div className="flex items-center gap-4">
        <button
          onClick={() => navigate('/estimator')}
          className="bg-primary text-on-primary hover:bg-primary/90 px-4 py-1.5 rounded-lg font-title-md text-sm font-medium transition-colors shadow-sm shadow-primary/20"
        >
          Predict Scope
        </button>
        <div className="h-6 w-px bg-white/10 mx-1"></div>
        <a
          href="http://localhost:8000/docs"
          target="_blank"
          rel="noopener noreferrer"
          title="FastAPI Swagger Documentation"
          className="text-on-surface-variant hover:text-primary transition-colors flex items-center gap-1 text-xs border border-white/10 px-2 py-1 rounded bg-surface-container hidden sm:flex"
        >
          <span className="material-symbols-outlined text-sm">api</span>
          <span>API Docs</span>
        </a>

        {isAuthenticated && user ? (
          <div className="flex items-center gap-2">
            <div className="flex items-center gap-2 bg-surface-container-high px-3 py-1.5 rounded-lg border border-white/5">
              <span className="material-symbols-outlined text-base text-primary">account_circle</span>
              <span className="text-xs font-medium text-on-surface max-w-[140px] truncate" title={user.email}>
                {user.email}
              </span>
            </div>
            <button
              onClick={logout}
              title="Log out"
              className="text-on-surface-variant hover:text-error hover:bg-error/10 transition-colors p-1.5 rounded-lg border border-transparent hover:border-error/20 flex items-center"
            >
              <span className="material-symbols-outlined text-lg">logout</span>
            </button>
          </div>
        ) : (
          <button
            onClick={() => openAuthModal()}
            className="flex items-center gap-1.5 bg-surface-container hover:bg-surface-container-high text-on-surface border border-white/10 hover:border-primary/40 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors"
          >
            <span className="material-symbols-outlined text-base text-primary">account_circle</span>
            <span>Login / Account</span>
          </button>
        )}
      </div>
    </header>
  );
};
