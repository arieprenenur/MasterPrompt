import React, { useState } from 'react';
import { Sparkles, X, Save, Calendar, Globe, Palette, Film, Check } from 'lucide-react';
import { ContentDna, LocalizedMetadata, ContentDnaPreset } from '../types';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  visualPrompt: string;
  i2vPrompt?: string;
  contentDna: ContentDna;
  bilingualMetadata: {
    en: LocalizedMetadata;
    target: LocalizedMetadata;
  };
  targetCountry: string;
  targetLanguage: string;
  thumbnail?: string;
  onSaved: (preset: ContentDnaPreset) => void;
  onOpenCalendarGenerator: (preset: ContentDnaPreset) => void;
  onToast: (msg: string) => void;
}

export const ContentDnaModal: React.FC<Props> = ({
  isOpen,
  onClose,
  visualPrompt,
  i2vPrompt,
  contentDna,
  bilingualMetadata,
  targetCountry,
  targetLanguage,
  thumbnail,
  onSaved,
  onOpenCalendarGenerator,
  onToast,
}) => {
  const [name, setName] = useState(
    contentDna?.visualStyle
      ? `${contentDna.visualStyle.split('/')[0].trim()} - DNA`
      : 'Preset Gaya Konten Baru'
  );
  const [description, setDescription] = useState(
    `Preset DNA untuk target ${targetCountry} (${targetLanguage}), gaya visual ${contentDna?.visualStyle || 'visual unik'}.`
  );
  const [isSaving, setIsSaving] = useState(false);

  if (!isOpen) return null;

  const handleSave = async (openCalendar = false) => {
    if (!name.trim()) {
      onToast('Beri nama untuk preset DNA!');
      return;
    }

    setIsSaving(true);
    try {
      // Bikin ID unik dan timestamp secara lokal (Client-Side)
      const id = 'dna_' + Date.now().toString();
      const createdAt = new Date().toISOString();

      const savedPreset: ContentDnaPreset = {
        id: id,
        name: name,
        description: description,
        thumbnail: thumbnail || '',
        target_country: targetCountry,
        target_language: targetLanguage,
        visual_prompt: visualPrompt,
        i2v_prompt: i2vPrompt || '',
        content_dna: contentDna,
        bilingual_metadata: bilingualMetadata,
        created_at: createdAt,
      };

      // Simpan langsung ke localStorage browser (Tanpa Backend)
      const local = JSON.parse(localStorage.getItem('vtp_dna_presets') || '[]');
      localStorage.setItem('vtp_dna_presets', JSON.stringify([savedPreset, ...local]));

      onSaved(savedPreset);
      onToast('Preset Content DNA berhasil disimpan ke perangkat!');

      if (openCalendar) {
        onOpenCalendarGenerator(savedPreset);
      }
      onClose();
    } catch (err: any) {
      console.error(err);
      onToast(`Error: ${err.message || 'Gagal menyimpan'}`);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[120] bg-black/80 backdrop-blur-md flex items-center justify-center p-4">
      <div className="bg-bg-card border border-stroke rounded-2xl w-full max-w-2xl max-h-[90vh] flex flex-col shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="p-4 border-b border-stroke flex items-center justify-between bg-white/[0.02]">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-brand/20 border border-brand/40 flex items-center justify-center text-brand">
              <Sparkles className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-base font-display uppercase tracking-wider text-white">
                Simpan Sebagai Content DNA / Preset
              </h3>
              <p className="text-[11px] text-gray-400 font-medium">
                Penyimpanan lokal 100% aman di perangkat Anda
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

        {/* Content Body */}
        <div className="flex-1 overflow-y-auto p-5 space-y-4 custom-scrollbar text-xs">
          {/* Preset Name */}
          <div className="space-y-1.5">
            <label className="text-[11px] font-black uppercase tracking-wider text-gray-300">
              Nama DNA / Preset
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="vtp-input w-full h-11 text-sm font-bold"
              placeholder="Contoh: Dark Cyberpunk Lore - Tokyo"
            />
          </div>

          {/* Description */}
          <div className="space-y-1.5">
            <label className="text-[11px] font-black uppercase tracking-wider text-gray-300">
              Catatan / Deskripsi Strategi
            </label>
            <input
              type="text"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="vtp-input w-full h-10 text-xs"
              placeholder="Deskripsi singkat preset ini..."
            />
          </div>

          {/* DNA Characteristics Card */}
          <div className="bg-black/50 border border-white/10 rounded-xl p-3.5 space-y-2.5">
            <h4 className="text-[11px] font-black uppercase tracking-wider text-brand flex items-center gap-1.5">
              <Palette className="w-3.5 h-3.5" /> Karakteristik Content DNA Terkunci:
            </h4>

            <div className="grid grid-cols-2 gap-2 text-[11px]">
              <div className="p-2 rounded-lg bg-white/[0.02] border border-white/5">
                <span className="text-gray-500 font-bold block mb-0.5">Gaya Visual:</span>
                <span className="text-white font-semibold">{contentDna?.visualStyle || 'Cinematic High Detail'}</span>
              </div>

              <div className="p-2 rounded-lg bg-white/[0.02] border border-white/5">
                <span className="text-gray-500 font-bold block mb-0.5">Target Pasar & Bahasa:</span>
                <span className="text-white font-semibold flex items-center gap-1">
                  <Globe className="w-3 h-3 text-brand" /> {targetCountry} ({targetLanguage})
                </span>
              </div>

              <div className="p-2 rounded-lg bg-white/[0.02] border border-white/5">
                <span className="text-gray-500 font-bold block mb-0.5">Pencahayaan & Atmosfer:</span>
                <span className="text-white font-semibold truncate block">
                  {contentDna?.lighting || 'Volumetric Dramatic Glow'}
                </span>
              </div>

              <div className="p-2 rounded-lg bg-white/[0.02] border border-white/5">
                <span className="text-gray-500 font-bold block mb-0.5">Format Rekomendasi:</span>
                <span className="text-brand-light font-semibold flex items-center gap-1">
                  <Film className="w-3 h-3" /> {contentDna?.formatRecommendation || 'YouTube Shorts / TikTok'}
                </span>
              </div>
            </div>

            {/* Color Palette Preview */}
            {contentDna?.colorPalette && contentDna.colorPalette.length > 0 && (
              <div className="pt-2 border-t border-white/5 flex items-center gap-2">
                <span className="text-[10px] text-gray-400 font-bold">Palet Warna:</span>
                <div className="flex flex-wrap gap-1">
                  {contentDna.colorPalette.map((col, idx) => (
                    <span key={idx} className="px-2 py-0.5 rounded bg-white/10 text-gray-200 text-[10px] font-mono">
                      {col}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Master Prompt Snippet */}
          <div className="space-y-1.5">
            <label className="text-[11px] font-black uppercase tracking-wider text-gray-400">
              Template Prompt Master
            </label>
            <div className="bg-black/40 border border-white/5 rounded-xl p-3 text-[11px] text-gray-400 font-mono line-clamp-3 leading-relaxed">
              {visualPrompt}
            </div>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="p-4 border-t border-stroke bg-white/[0.02] flex items-center justify-end gap-2.5">
          <button
            onClick={onClose}
            className="px-4 py-2.5 rounded-xl text-gray-400 hover:text-white hover:bg-white/5 font-bold transition-all"
          >
            Batal
          </button>

          <button
            onClick={() => handleSave(false)}
            disabled={isSaving}
            className="px-4 py-2.5 bg-white/10 hover:bg-white/20 text-white rounded-xl font-bold transition-all flex items-center gap-2 border border-white/10 disabled:opacity-50"
          >
            <Save className="w-4 h-4" /> Simpan DNA Lokal
          </button>

          <button
            onClick={() => handleSave(true)}
            disabled={isSaving}
            className="vtp-btn-primary px-5 py-2.5 flex items-center gap-2 text-xs font-black shadow-lg shadow-brand/20 disabled:opacity-50"
          >
            <Calendar className="w-4 h-4" /> Simpan & Buat Kalender Konten
          </button>
        </div>
      </div>
    </div>
  );
};
