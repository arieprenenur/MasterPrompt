import React, { useState } from 'react';
import { Calendar, Sparkles, X, RefreshCcw, Globe, Flame, Zap, ArrowRight } from 'lucide-react';
import { ContentDna, ContentDnaPreset, ContentCalendar } from '../types';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  preset?: ContentDnaPreset | null;
  contentDna?: ContentDna | null;
  visualPrompt?: string;
  targetCountry?: string;
  targetLanguage?: string;
  onCalendarGenerated: (calendar: ContentCalendar) => void;
  onToast: (msg: string) => void;
}

export const CalendarModal: React.FC<Props> = ({
  isOpen,
  onClose,
  preset,
  contentDna,
  visualPrompt,
  targetCountry,
  targetLanguage,
  onCalendarGenerated,
  onToast,
}) => {
  const [daysCount, setDaysCount] = useState<7 | 30>(7);
  const [extraFocus, setExtraFocus] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);

  if (!isOpen) return null;

  const activeDna = preset?.content_dna || contentDna;
  const activeCountry = preset?.target_country || targetCountry || 'Global';
  const activeLanguage = preset?.target_language || targetLanguage || 'English';
  const activeVisualPrompt = preset?.visual_prompt || visualPrompt || '';

  const handleGenerate = async () => {
    setIsGenerating(true);
    try {
      const res = await fetch('/api/generate-calendar', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contentDna: activeDna,
          visualPrompt: activeVisualPrompt,
          targetCountry: activeCountry,
          targetLanguage: activeLanguage,
          days: daysCount,
          extraFocus,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Gagal menghasilkan kalender');

      const rawDays = data.calendar || [];

      // Save to database
      const saveRes = await fetch('/api/calendars', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: `${preset?.name || activeDna?.visualStyle || 'Konten'} - Plan ${daysCount} Hari`,
          preset_id: preset?.id || '',
          preset_name: preset?.name || '',
          days_count: daysCount,
          target_country: activeCountry,
          target_language: activeLanguage,
          days: rawDays,
        }),
      });

      const savedData = await saveRes.json();

      const calendarObj: ContentCalendar = {
        id: savedData.id || `cal_${Date.now()}`,
        name: savedData.name || `Plan ${daysCount} Hari`,
        preset_id: preset?.id,
        preset_name: preset?.name,
        days_count: daysCount,
        target_country: activeCountry,
        target_language: activeLanguage,
        created_at: new Date().toISOString(),
        days: rawDays,
      };

      onCalendarGenerated(calendarObj);
      onToast(`Berhasil membuat kalender konten ${daysCount} hari!`);
      onClose();
    } catch (err: any) {
      console.error(err);
      onToast(`Error: ${err.message || 'Gagal membuat kalender'}`);
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[130] bg-black/80 backdrop-blur-md flex items-center justify-center p-4">
      <div className="bg-bg-card border border-stroke rounded-2xl w-full max-w-xl max-h-[90vh] flex flex-col shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="p-4 border-b border-stroke flex items-center justify-between bg-white/[0.02]">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-red-600/20 border border-red-500/40 flex items-center justify-center text-red-500">
              <Calendar className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-base font-display uppercase tracking-wider text-white">
                Kalender Konten YouTube AI (7 / 30 Hari)
              </h3>
              <p className="text-[11px] text-gray-400 font-medium">
                Roadmap YouTube Shorts & Long-form dengan judul SEO, hook 3 detik & prompt I2V
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

        {/* Form Body */}
        <div className="flex-1 overflow-y-auto p-5 space-y-5 custom-scrollbar text-xs">
          {/* Active DNA summary */}
          <div className="bg-black/50 border border-brand/20 rounded-xl p-3 flex items-center justify-between">
            <div>
              <span className="text-[10px] text-gray-500 uppercase font-black tracking-wider block">
                Sumber Content DNA:
              </span>
              <p className="text-xs font-bold text-white">
                {preset?.name || activeDna?.visualStyle || 'Visual Prompt Saat Ini'}
              </p>
              <div className="flex items-center gap-2 mt-1 text-[11px] text-brand-light">
                <Globe className="w-3 h-3" />
                <span>
                  {activeCountry} &bull; {activeLanguage}
                </span>
              </div>
            </div>
            <div className="px-2.5 py-1 rounded-lg bg-brand/10 border border-brand/30 text-[10px] font-black text-brand uppercase">
              DNA Active
            </div>
          </div>

          {/* Plan Duration Selector (7 vs 30 Days) */}
          <div className="space-y-2">
            <label className="text-[11px] font-black uppercase tracking-wider text-gray-300">
              Pilih Durasi Kalender Konten:
            </label>
            <div className="grid grid-cols-2 gap-3">
              {/* 7 Days Option */}
              <div
                onClick={() => setDaysCount(7)}
                className={`p-3.5 rounded-xl border cursor-pointer transition-all flex flex-col justify-between ${
                  daysCount === 7
                    ? 'bg-brand/10 border-brand ring-1 ring-brand text-white shadow-lg shadow-brand/10'
                    : 'bg-black/40 border-white/10 hover:border-white/20 text-gray-400'
                }`}
              >
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-lg font-black text-brand">7 HARI</span>
                    <Zap className="w-4 h-4 text-brand" />
                  </div>
                  <h4 className="text-xs font-bold text-white mb-1">Sprint Mingguan Viral</h4>
                  <p className="text-[11px] text-gray-400 leading-snug">
                    Fokus penetrasi algoritma cepat, testing hook, dan eksposur tinggi 1 minggu penuh.
                  </p>
                </div>
              </div>

              {/* 30 Days Option */}
              <div
                onClick={() => setDaysCount(30)}
                className={`p-3.5 rounded-xl border cursor-pointer transition-all flex flex-col justify-between ${
                  daysCount === 30
                    ? 'bg-brand/10 border-brand ring-1 ring-brand text-white shadow-lg shadow-brand/10'
                    : 'bg-black/40 border-white/10 hover:border-white/20 text-gray-400'
                }`}
              >
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-lg font-black text-brand">30 HARI</span>
                    <Flame className="w-4 h-4 text-orange-400" />
                  </div>
                  <h4 className="text-xs font-bold text-white mb-1">Master Plan 1 Bulan</h4>
                  <p className="text-[11px] text-gray-400 leading-snug">
                    Roadmap menyeluruh: Discovery, storytelling, edukasi, pilar authority & konversi.
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Extra Creator Focus */}
          <div className="space-y-1.5">
            <label className="text-[11px] font-black uppercase tracking-wider text-gray-300">
              Fokus Tambahan / Niche Custom (Opsional)
            </label>
            <input
              type="text"
              value={extraFocus}
              onChange={(e) => setExtraFocus(e.target.value)}
              className="vtp-input w-full h-10 text-xs"
              placeholder="Contoh: Fokus AI visual storytelling, misteri sejarah, atau tips prompt Midjourney..."
            />
          </div>

          <div className="bg-white/[0.02] border border-white/5 rounded-xl p-3 text-[11px] text-gray-400 space-y-1">
            <span className="text-gray-300 font-bold block flex items-center gap-1">
              <span>🔴</span> Yang Dihasilkan Khusus YouTube Setiap Hari:
            </span>
            <ul className="list-disc list-inside space-y-0.5 text-gray-400">
              <li>Judul SEO YouTube 50-60 karakter (Opsi Viral Hook & Search Intent)</li>
              <li>Skrip hook 3 detik pertama pencegah swipe-away</li>
              <li>Prompt visual Midjourney / Flux untuk Thumbnail & Footage</li>
              <li>Prompt animasi I2V (Static locked tripod & perfect seamless loop)</li>
              <li>Format YouTube (Shorts 9:16 / Video 16:9) & CTA Subscriber</li>
            </ul>
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-stroke bg-white/[0.02] flex items-center justify-end gap-2.5">
          <button
            onClick={onClose}
            className="px-4 py-2.5 rounded-xl text-gray-400 hover:text-white font-bold transition-all"
          >
            Batal
          </button>
          <button
            onClick={handleGenerate}
            disabled={isGenerating}
            className="vtp-btn-primary px-5 py-2.5 flex items-center gap-2 text-xs font-black shadow-lg shadow-brand/20 disabled:opacity-50"
          >
            {isGenerating ? (
              <>
                <RefreshCcw className="w-4 h-4 animate-spin" />
                <span>Menyusun {daysCount} Konten...</span>
              </>
            ) : (
              <>
                <Sparkles className="w-4 h-4" />
                <span>Generate Kalender {daysCount} Hari</span>
                <ArrowRight className="w-4 h-4" />
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};
