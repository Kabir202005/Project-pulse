import React from 'react';
import { useNavigate } from 'react-router-dom';

export const LoadingState: React.FC<{ message?: string }> = ({
  message = 'Processing analytics...',
}) => {
  return (
    <div className="bg-surface-container border border-white/5 rounded-xl p-12 flex flex-col items-center justify-center min-h-[350px] shadow-lg">
      <div className="w-12 h-12 rounded-full border-4 border-primary/20 border-t-primary animate-spin mb-4"></div>
      <p className="font-title-md text-base text-on-surface font-medium">{message}</p>
      <p className="font-body-md text-xs text-on-surface-variant mt-1">Executing backend Python calculations</p>
    </div>
  );
};

export const ErrorState: React.FC<{
  message?: string;
  onRetry?: () => void;
}> = ({ message = 'Unable to load analytical data.', onRetry }) => {
  return (
    <div className="bg-surface-container border border-error/30 rounded-xl p-8 flex flex-col items-center justify-center min-h-[300px] shadow-lg text-center">
      <div className="w-14 h-14 rounded-full bg-error/10 flex items-center justify-center mb-4 text-error">
        <span className="material-symbols-outlined text-3xl">error_outline</span>
      </div>
      <h4 className="font-title-md text-lg text-on-surface font-semibold mb-1">Analytical Execution Error</h4>
      <p className="font-body-md text-sm text-on-surface-variant max-w-md mb-6">{message}</p>
      {onRetry && (
        <button
          onClick={onRetry}
          className="bg-surface-variant hover:bg-surface-variant/80 border border-white/10 text-on-surface px-5 py-2 rounded-lg font-title-md text-sm flex items-center gap-2 transition-colors"
        >
          <span className="material-symbols-outlined text-sm">refresh</span>
          Retry Request
        </button>
      )}
    </div>
  );
};

export const EmptyState: React.FC<{
  title?: string;
  description?: string;
  actionText?: string;
  actionPath?: string;
  icon?: string;
}> = ({
  title = 'No Dataset Loaded',
  description = 'Load a construction project dataset in the Data Center to begin portfolio analysis and ML estimation.',
  actionText = 'Go to Data Center',
  actionPath = '/',
  icon = 'folder_open',
}) => {
  const navigate = useNavigate();

  return (
    <div className="bg-surface-container border border-white/5 rounded-xl p-12 flex flex-col items-center justify-center min-h-[400px] shadow-lg text-center">
      <div className="w-16 h-16 rounded-full bg-surface-container-high flex items-center justify-center mb-4 text-primary">
        <span className="material-symbols-outlined text-4xl">{icon}</span>
      </div>
      <h3 className="font-headline-md text-xl font-bold text-on-surface mb-2">{title}</h3>
      <p className="font-body-lg text-sm text-on-surface-variant max-w-md mb-6">{description}</p>
      <button
        onClick={() => navigate(actionPath)}
        className="bg-primary text-on-primary hover:bg-primary/90 px-6 py-2.5 rounded-lg font-title-md text-sm font-medium transition-colors shadow-lg shadow-primary/20 flex items-center gap-2"
      >
        <span className="material-symbols-outlined text-sm">arrow_forward</span>
        {actionText}
      </button>
    </div>
  );
};

export const AuthRequiredState: React.FC<{
  featureName?: string;
  onLoginClick?: () => void;
}> = ({ featureName = 'this feature', onLoginClick }) => {
  return (
    <div className="bg-surface-container border border-primary/20 rounded-xl p-12 flex flex-col items-center justify-center min-h-[420px] shadow-2xl text-center max-w-2xl mx-auto my-8">
      <div className="w-16 h-16 rounded-full bg-primary/10 border border-primary/30 flex items-center justify-center mb-4 text-primary">
        <span className="material-symbols-outlined text-3xl">lock</span>
      </div>
      <span className="bg-primary/10 text-primary border border-primary/20 text-xs px-3 py-1 rounded-full font-medium mb-3">
        Protected Feature
      </span>
      <h3 className="font-headline-md text-2xl font-bold text-on-surface mb-2">
        Authentication Required
      </h3>
      <p className="font-body-lg text-sm text-on-surface-variant max-w-md mb-6 leading-relaxed">
        Please sign in with your email address to access {featureName} and use advanced construction intelligence models.
      </p>
      <button
        onClick={onLoginClick}
        className="bg-primary text-on-primary hover:bg-primary/90 px-6 py-3 rounded-lg font-title-md text-sm font-medium transition-all shadow-lg shadow-primary/20 flex items-center gap-2"
      >
        <span className="material-symbols-outlined text-base">login</span>
        Sign In with Email OTP
      </button>
    </div>
  );
};
