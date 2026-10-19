import React from 'react';
import {
  Sparkles,
  X,
  Trash2,
  Calendar,
  Globe,
  Palette,
  Copy,
  Check,
  ArrowRight,
  FolderOpen,
} from 'lucide-react';
import { ContentDnaPreset } from '../types';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  presets: ContentDnaPreset[];
  onSelectPreset: (preset: ContentDnaPreset) => void;
  onOpenCalendar: (preset: ContentDnaPreset) => void;
  onDeletePreset: (id: string) => void;
  onToast: (msg: string) => void;
}

export const PresetsDrawer: React.FC<Props> = ({
  isOpen,
  onClose,
  presets,
  onSelectPreset,
  onOpenCalendar,
  onDeletePreset,
  onToast,
}) => {
  const [copiedId, setCopiedId] = React.useState<string | null>(null);

  if (!isOpen) return null;

  const copyPrompt = (prompt: string, id: string) => {
    navigator.clipboard.writeText(prompt);
    setCopiedId(id);
    onToast('Master prompt tersalin!');
    setTimeout(() => setCopiedId(null), 2000);
  };

  return (
    <div className="fixed inset-0 z-[125] bg-black/80 backdrop-blur-md flex items-center justify-end">
      <div className="bg-bg-card border-l border-stroke w-full max-w-xl h-full flex flex-col shadow-2xl animate-in slide-in-from-right duration-300">
        {/* Header */}
        <div className="p-4 border-b border-stroke flex items-center justify-between bg-white/[0.02]">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-brand/20 border border-brand/40 flex items-center justify-center text-brand">
              <FolderOpen className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-base font-display uppercase tracking-wider text-white">
                Preset Content DNA Tersimpan ({presets.length})
              </h3>
              <p className="text-[11px] text-gray-400 font-medium">
                Pilih preset untuk menerapkan gaya atau generate kalender 7/30 hari
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-gray-400 hover:text-white hover:bg-white/10 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* List of Presets */}
        <div className="flex-1 overflow-y-auto p-4 space-y-3.5 custom-scrollbar pb-20">
          {presets.length === 0 ? (
            <div className="h-64 flex flex-col items-center justify-center text-center opacity-30">
              <Sparkles className="w-12 h-12 mb-3" />
              <p className="text-xs font-bold uppercase tracking-wider">Belum ada Content DNA tersimpan</p>
              <p className="text-[11px] text-gray-500 mt-1 max-w-xs">
                Analisis visual gambar atau YouTube thumbnail, lalu klik "Simpan Sebagai DNA / Preset"
              </p>
            </div>
          ) : (
            presets.map((preset) => (
              <div
                key={preset.id}
                className="bg-black/50 border border-white/10 rounded-xl p-4 hover:border-brand/40 transition-all space-y-3"
              >
                {/* Title & Actions */}
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <h4 className="text-sm font-bold text-white leading-tight">
                      {preset.name}
                    </h4>
                    {preset.description && (
                      <p className="text-[11px] text-gray-400 mt-0.5">{preset.description}</p>
                    )}
                  </div>
                  <button
                    onClick={() => onDeletePreset(preset.id)}
                    className="p-1.5 text-gray-500 hover:text-red-400 hover:bg-red-500/10 rounded-lg transition-colors"
                    title="Hapus Preset"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>

                {/* Metadata Pills */}
                <div className="flex flex-wrap gap-2 text-[10px]">
                  <span className="px-2 py-0.5 rounded bg-brand/10 text-brand border border-brand/20 font-bold flex items-center gap-1">
                    <Globe className="w-3 h-3" /> {preset.target_country} ({preset.target_language})
                  </span>
                  {preset.content_dna?.visualStyle && (
                    <span className="px-2 py-0.5 rounded bg-white/5 text-gray-300 border border-white/5 font-medium">
                      {preset.content_dna.visualStyle}
                    </span>
                  )}
                  {preset.content_dna?.formatRecommendation && (
                    <span className="px-2 py-0.5 rounded bg-blue-500/10 text-blue-300 border border-blue-500/20 font-medium">
                      {preset.content_dna.formatRecommendation}
                    </span>
                  )}
                </div>

                {/* Color Palette */}
                {preset.content_dna?.colorPalette && preset.content_dna.colorPalette.length > 0 && (
                  <div className="flex items-center gap-1.5 pt-1 text-[10px] text-gray-400">
                    <Palette className="w-3 h-3 text-brand/70" />
                    <div className="flex flex-wrap gap-1">
                      {preset.content_dna.colorPalette.map((col, idx) => (
                        <span key={idx} className="px-1.5 py-0.5 rounded bg-white/5 font-mono text-[9px] text-gray-300">
                          {col}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                {/* Action Buttons */}
                <div className="pt-2 border-t border-white/5 flex items-center justify-between gap-2">
                  <div className="flex items-center gap-1.5">
                    <button
                      onClick={() => copyPrompt(preset.visual_prompt, preset.id)}
                      className="px-2 py-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-gray-300 text-[10px] font-bold transition-all flex items-center gap-1"
                      title="Salin Master Prompt Visual"
                    >
                      {copiedId === preset.id ? <Check className="w-3 h-3 text-brand-light" /> : <Copy className="w-3 h-3" />}
                      <span>Prompt T2I</span>
                    </button>
                    {preset.i2v_prompt && (
                      <button
                        onClick={() => copyPrompt(preset.i2v_prompt!, `i2v_${preset.id}`)}
                        className="px-2 py-1.5 rounded-lg bg-blue-500/10 hover:bg-blue-500/20 text-blue-300 text-[10px] font-bold transition-all flex items-center gap-1 border border-blue-500/20"
                        title="Salin Prompt Animasi I2V (Seamless Loop)"
                      >
                        {copiedId === `i2v_${preset.id}` ? <Check className="w-3 h-3 text-cyan-400" /> : <Copy className="w-3 h-3" />}
                        <span>I2V Loop</span>
                      </button>
                    )}
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => {
                        onSelectPreset(preset);
                        onClose();
                      }}
                      className="px-3 py-1.5 rounded-lg bg-white/10 hover:bg-white/20 text-white text-[11px] font-bold transition-all"
                    >
                      Terapkan DNA
                    </button>
                    <button
                      onClick={() => {
                        onOpenCalendar(preset);
                        onClose();
                      }}
                      className="px-3 py-1.5 rounded-lg bg-brand hover:bg-brand-light text-white text-[11px] font-black transition-all flex items-center gap-1 shadow-md shadow-blue-500/20"
                    >
                      <Calendar className="w-3 h-3" />
                      <span>Buat Kalender</span>
                      <ArrowRight className="w-3 h-3" />
                    </button>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};
