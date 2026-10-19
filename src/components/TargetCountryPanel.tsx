import React from 'react';
import { Globe, TrendingUp, Clock, Users, DollarSign, CheckCircle2 } from 'lucide-react';
import { TargetCountryAnalysis } from '../types';

interface Props {
  countries: TargetCountryAnalysis[];
  selectedCountry: string;
  onSelectCountry: (country: TargetCountryAnalysis) => void;
}

export const TargetCountryPanel: React.FC<Props> = ({
  countries,
  selectedCountry,
  onSelectCountry,
}) => {
  if (!countries || countries.length === 0) return null;

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <label className="text-[11px] font-black text-gray-400 uppercase tracking-widest flex items-center gap-1.5">
          <Globe className="w-3.5 h-3.5 text-brand" /> Analisa Negara Target Potensial
        </label>
        <span className="text-[10px] text-gray-500 font-bold">Pilih untuk ganti target bahasa</span>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-2.5">
        {countries.map((c) => {
          const isSelected = selectedCountry.toLowerCase() === c.country.toLowerCase();
          return (
            <div
              key={c.code || c.country}
              onClick={() => onSelectCountry(c)}
              className={`p-3 rounded-xl border transition-all cursor-pointer relative overflow-hidden flex flex-col justify-between ${
                isSelected
                  ? 'bg-brand/15 border-brand shadow-[0_0_20px_rgba(59,130,246,0.3)] ring-1 ring-brand'
                  : 'bg-black/40 border-white/10 hover:border-white/20 hover:bg-white/[0.04]'
              }`}
            >
              {isSelected && (
                <div className="absolute top-2 right-2 text-brand">
                  <CheckCircle2 className="w-4 h-4 fill-brand/20" />
                </div>
              )}

              <div>
                <div className="flex items-center gap-2 mb-1.5">
                  <span className="text-2xl leading-none">{c.flag || '🌐'}</span>
                  <div>
                    <h4 className="text-xs font-black text-white leading-tight flex items-center gap-1.5">
                      {c.country}
                      <span className="text-[9px] px-1.5 py-0.5 rounded bg-white/10 text-gray-300 font-mono">
                        {c.langCode?.toUpperCase() || c.code}
                      </span>
                    </h4>
                    <span className="text-[10px] text-brand-light font-bold">
                      {c.language}
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-2 my-2">
                  <div className="px-2 py-0.5 rounded-md bg-brand/20 border border-brand/30 text-[10px] font-black text-brand flex items-center gap-1">
                    <TrendingUp className="w-3 h-3" /> {c.fitScore}% Match
                  </div>
                  <div className="text-[9px] text-gray-400 font-medium truncate flex items-center gap-1">
                    <DollarSign className="w-2.5 h-2.5 text-yellow-400 shrink-0" />
                    <span className="truncate">{c.cpmTier}</span>
                  </div>
                </div>

                <p className="text-[11px] text-gray-300 leading-snug line-clamp-2 mb-2 font-normal">
                  {c.reasoning}
                </p>
              </div>

              <div className="pt-2 border-t border-white/5 space-y-1 text-[10px]">
                <div className="flex items-center gap-1.5 text-gray-400">
                  <Users className="w-3 h-3 text-gray-500 shrink-0" />
                  <span className="truncate">{c.targetAudience}</span>
                </div>
                <div className="flex items-center gap-1.5 text-gray-400">
                  <Clock className="w-3 h-3 text-brand/70 shrink-0" />
                  <span className="text-gray-300 font-medium truncate">{c.bestPostingTime}</span>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
