import React from 'react';
import { AlertCircle } from 'lucide-react';

interface DisclosureBannerProps {
  className?: string;
}

export const DisclosureBanner: React.FC<DisclosureBannerProps> = ({ className = '' }) => {
  return (
    <div
      className={`bg-cream-200/80 border-y border-gold-300/40 px-4 py-2.5 text-xs text-noir-700 backdrop-blur-sm ${className}`}
      role="region"
      aria-label="Promotional Ranking Disclosure"
    >
      <div className="max-w-7xl mx-auto flex items-center justify-center gap-2 text-center">
        <AlertCircle className="w-4 h-4 text-gold-600 shrink-0" />
        <p className="font-medium tracking-wide">
          <span className="font-semibold text-noir-900 uppercase text-[10px] tracking-widest bg-gold-500/15 text-gold-700 px-1.5 py-0.5 rounded mr-1">
            Mandatory Disclosure
          </span>
          Rankings are based on verified promotional spend and do not represent product quality or editorial recommendations.
        </p>
      </div>
    </div>
  );
};
