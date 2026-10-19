import React, { useState } from 'react';
import {
  Calendar as CalendarIcon,
  Globe2,
  Copy,
  Check,
  Download,
  Layers,
  Sparkles,
  Trash2,
  Zap,
  Film,
  Send,
  Video,
  Repeat,
  Camera,
  PlaySquare,
} from 'lucide-react';
import { ContentCalendar, CalendarDayPlan } from '../types';

interface Props {
  calendar: ContentCalendar;
  onUpdateCalendar: (updated: ContentCalendar) => void;
  onDeleteCalendar: (id: string) => void;
  onSendToStudio: (day: CalendarDayPlan, calendar: ContentCalendar) => void;
  onToast: (msg: string) => void;
}

export const CalendarView: React.FC<Props> = ({
  calendar,
  onUpdateCalendar,
  onDeleteCalendar,
  onSendToStudio,
  onToast,
}) => {
  const [activeLang, setActiveLang] = useState<'en' | 'target'>('en');
  const [filterStatus, setFilterStatus] = useState<'all' | 'todo' | 'in_progress' | 'done'>('all');
  const [copiedKey, setCopiedKey] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');

  const targetLangLabel = calendar.target_language || 'Target Language';

  const handleCopy = (text: string, key: string) => {
    navigator.clipboard.writeText(text);
    setCopiedKey(key);
    onToast('Berhasil disalin ke papan klip!');
    setTimeout(() => setCopiedKey(null), 2000);
  };

  const handleStatusChange = async (dayIndex: number, newStatus: 'todo' | 'in_progress' | 'done') => {
    const updatedDays = [...calendar.days];
    updatedDays[dayIndex] = {
      ...updatedDays[dayIndex],
      status: newStatus,
    };

    const updatedCal = {
      ...calendar,
      days: updatedDays,
    };

    onUpdateCalendar(updatedCal);

    try {
      await fetch(`/api/calendars/${calendar.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ days: updatedDays }),
      });
    } catch (e) {
      console.warn('Failed to sync calendar status to backend', e);
    }
  };

  const exportCsv = () => {
    const headers = [
      'Day',
      'Pillar',
      'Title (EN)',
      `Title (${targetLangLabel})`,
      'Hook (EN)',
      `Hook (${targetLangLabel})`,
      'Visual Prompt (T2I)',
      'I2V Motion Prompt (Seamless Loop)',
      'Format',
      'CTA',
      'Status',
    ];

    const rows = calendar.days.map((d) => [
      `Day ${d.day}`,
      `"${d.pillar.replace(/"/g, '""')}"`,
      `"${(d.title_en || '').replace(/"/g, '""')}"`,
      `"${(d.title_target || '').replace(/"/g, '""')}"`,
      `"${(d.hook_en || '').replace(/"/g, '""')}"`,
      `"${(d.hook_target || '').replace(/"/g, '""')}"`,
      `"${(d.visualPrompt || '').replace(/"/g, '""')}"`,
      `"${(d.i2vPrompt || `Static locked tripod camera, perfect seamless looping animation, fluid organic micro-movements, 60fps`).replace(/"/g, '""')}"`,
      `"${d.format.replace(/"/g, '""')}"`,
      `"${d.cta.replace(/"/g, '""')}"`,
      d.status,
    ]);

    const csvContent =
      'data:text/csv;charset=utf-8,\uFEFF' +
      [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `${calendar.name.replace(/\s+/g, '_')}_calendar.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    onToast('File CSV berhasil diunduh!');
  };

  const exportMarkdown = () => {
    let md = `# ${calendar.name}\n`;
    md += `**Aplikasi:** Master Mind Konten oleh Kang AI\n`;
    md += `**Target:** ${calendar.target_country} (${calendar.target_language}) | **Durasi:** ${calendar.days_count} Hari\n\n`;

    calendar.days.forEach((d) => {
      md += `## Hari ${d.day}: ${d.dayTitle || d.title_en}\n`;
      md += `- **Pilar Konten:** ${d.pillar} | **Format:** ${d.format}\n`;
      md += `- **Judul (EN):** ${d.title_en}\n`;
      md += `- **Judul (${targetLangLabel}):** ${d.title_target}\n`;
      md += `- **Hook Pembuka (EN):** "${d.hook_en}"\n`;
      md += `- **Hook Pembuka (${targetLangLabel}):** "${d.hook_target}"\n`;
      md += `- **Prompt Visual AI (Flux/Midjourney):** \`${d.visualPrompt}\`\n`;
      md += `- **Prompt Animasi I2V (Locked Tripod & Seamless Loop):** \`${d.i2vPrompt || 'Static locked tripod camera, perfect seamless looping animation, fluid organic micro-movements, 60fps'}\`\n`;
      md += `- **CTA:** ${d.cta}\n`;
      md += `- **Status:** ${d.status.toUpperCase()}\n\n---\n\n`;
    });

    const blob = new Blob([md], { type: 'text/markdown;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `${calendar.name.replace(/\s+/g, '_')}.md`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    onToast('File Markdown berhasil diunduh!');
  };

  const copyAllText = () => {
    let text = `${calendar.name} (${calendar.days_count} Hari) - Master Mind Konten\n\n`;
    calendar.days.forEach((d) => {
      text += `[HARI ${d.day}] ${d.pillar} (${d.format})\n`;
      text += `Judul [EN]: ${d.title_en}\n`;
      text += `Judul [${targetLangLabel}]: ${d.title_target}\n`;
      text += `Hook: ${activeLang === 'en' ? d.hook_en : d.hook_target}\n`;
      text += `Visual Prompt: ${d.visualPrompt}\n`;
      text += `I2V Prompt: ${d.i2vPrompt || 'Static locked tripod camera, perfect seamless looping animation, 60fps'}\n`;
      text += `CTA: ${d.cta}\n\n`;
    });

    navigator.clipboard.writeText(text);
    onToast('Seluruh jadwal konten tersalin!');
  };

  const filteredDays = calendar.days
    .map((day, idx) => ({ ...day, originalIndex: idx }))
    .filter((d) => {
      if (filterStatus !== 'all' && d.status !== filterStatus) return false;
      if (searchQuery) {
        const q = searchQuery.toLowerCase();
        return (
          d.title_en?.toLowerCase().includes(q) ||
          d.title_target?.toLowerCase().includes(q) ||
          d.pillar?.toLowerCase().includes(q) ||
          d.dayTitle?.toLowerCase().includes(q)
        );
      }
      return true;
    });

  const completedCount = calendar.days.filter((d) => d.status === 'done').length;
  const progressPercent = Math.round((completedCount / calendar.days.length) * 100);

  return (
    <div className="flex flex-col w-full h-full min-h-0 bg-bg-card rounded-2xl border border-stroke shadow-xl overflow-hidden">
      {/* Calendar Header Bar */}
      <div className="p-3 sm:p-4 border-b border-stroke bg-white/[0.02] flex flex-col sm:flex-row sm:items-center justify-between gap-3 shrink-0">
        <div>
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-0.5 rounded-lg bg-brand/20 border border-brand/30 text-[10px] font-black text-brand-light uppercase">
              {calendar.days_count} Hari Plan
            </span>
            <span className="text-xs text-gray-400 font-bold flex items-center gap-1">
              <Globe2 className="w-3.5 h-3.5 text-blue-400" /> {calendar.target_country} ({calendar.target_language})
            </span>
          </div>
          <h2 className="text-base sm:text-lg md:text-xl font-display uppercase tracking-wider text-white mt-0.5">
            {calendar.name}
          </h2>
        </div>

        {/* Action Controls */}
        <div className="flex items-center gap-2 flex-wrap">
          {/* Language Switch Toggle */}
          <div className="bg-black/60 p-1 rounded-xl border border-white/10 flex items-center gap-1">
            <button
              onClick={() => setActiveLang('en')}
              className={`px-3 py-1 rounded-lg text-xs font-bold transition-all ${
                activeLang === 'en'
                  ? 'bg-brand text-white shadow-md font-black'
                  : 'text-gray-400 hover:text-white'
              }`}
            >
              🇬🇧 English
            </button>
            <button
              onClick={() => setActiveLang('target')}
              className={`px-3 py-1 rounded-lg text-xs font-bold transition-all ${
                activeLang === 'target'
                  ? 'bg-blue-600 text-white shadow-md font-black'
                  : 'text-gray-400 hover:text-white'
              }`}
            >
              🌐 {targetLangLabel}
            </button>
          </div>

          {/* Export Menu */}
          <div className="flex items-center gap-1.5">
            <button
              onClick={exportCsv}
              className="px-3 py-1.5 rounded-xl bg-white/5 hover:bg-white/10 text-gray-300 text-xs font-bold transition-all flex items-center gap-1.5 border border-white/10"
              title="Download CSV untuk Excel / Sheets"
            >
              <Download className="w-3.5 h-3.5" /> CSV
            </button>
            <button
              onClick={exportMarkdown}
              className="px-3 py-1.5 rounded-xl bg-white/5 hover:bg-white/10 text-gray-300 text-xs font-bold transition-all flex items-center gap-1.5 border border-white/10"
              title="Download Markdown"
            >
              <Download className="w-3.5 h-3.5" /> MD
            </button>
            <button
              onClick={copyAllText}
              className="px-3 py-1.5 rounded-xl bg-brand/15 hover:bg-brand/25 text-brand-light text-xs font-black transition-all flex items-center gap-1.5 border border-brand/30"
            >
              <Copy className="w-3.5 h-3.5" /> Salin Semua
            </button>
            <button
              onClick={() => onDeleteCalendar(calendar.id)}
              className="p-1.5 rounded-xl text-red-400 hover:bg-red-500/10 hover:text-red-300 transition-colors"
              title="Hapus Kalender"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Progress & Filter Subheader */}
      <div className="px-4 py-2.5 border-b border-stroke bg-black/40 flex flex-wrap items-center justify-between gap-3 text-xs shrink-0">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2">
            <span className="text-gray-400 font-bold text-[11px]">Progres:</span>
            <span className="text-brand-light font-black text-[11px]">
              {completedCount} / {calendar.days.length} Selesai ({progressPercent}%)
            </span>
          </div>
          <div className="w-32 h-1.5 bg-white/10 rounded-full overflow-hidden">
            <div
              className="h-full bg-brand transition-all duration-300"
              style={{ width: `${progressPercent}%` }}
            />
          </div>
        </div>

        {/* Filter Pills */}
        <div className="flex items-center gap-1">
          <button
            onClick={() => setFilterStatus('all')}
            className={`px-2.5 py-1 rounded-lg text-[10px] font-black transition-all ${
              filterStatus === 'all'
                ? 'bg-white/20 text-white'
                : 'text-gray-500 hover:text-gray-300'
            }`}
          >
            Semua ({calendar.days.length})
          </button>
          <button
            onClick={() => setFilterStatus('todo')}
            className={`px-2.5 py-1 rounded-lg text-[10px] font-black transition-all ${
              filterStatus === 'todo'
                ? 'bg-yellow-500/20 text-yellow-300 border border-yellow-500/30'
                : 'text-gray-500 hover:text-gray-300'
            }`}
          >
            To Do
          </button>
          <button
            onClick={() => setFilterStatus('in_progress')}
            className={`px-2.5 py-1 rounded-lg text-[10px] font-black transition-all ${
              filterStatus === 'in_progress'
                ? 'bg-blue-500/20 text-blue-300 border border-blue-500/30'
                : 'text-gray-500 hover:text-gray-300'
            }`}
          >
            In Progress
          </button>
          <button
            onClick={() => setFilterStatus('done')}
            className={`px-2.5 py-1 rounded-lg text-[10px] font-black transition-all ${
              filterStatus === 'done'
                ? 'bg-brand/20 text-brand-light border border-brand/30'
                : 'text-gray-500 hover:text-gray-300'
            }`}
          >
            Selesai
          </button>
        </div>
      </div>

      {/* Days List Grid */}
      <div className="flex-1 overflow-y-auto p-2.5 sm:p-4 space-y-3.5 custom-scrollbar pb-28 lg:pb-6 overscroll-contain">
        {filteredDays.length === 0 ? (
          <div className="h-48 flex flex-col items-center justify-center text-center opacity-40">
            <CalendarIcon className="w-10 h-10 mb-2" />
            <p className="text-xs font-bold uppercase tracking-wider">Tidak ada jadwal konten sesuai filter</p>
          </div>
        ) : (
          filteredDays.map((day) => {
            const titleToShow = activeLang === 'en' ? day.title_en : (day.title_target || day.title_en);
            const hookToShow = activeLang === 'en' ? day.hook_en : (day.hook_target || day.hook_en);
            const defaultI2v = `Static locked tripod camera, completely fixed stable angle, zero camera panning. Perfect seamless looping video, fluid cyclical micro-motion: subtle breathing, natural atmosphere drifting, seamless continuous loop, 60fps.`;
            const i2vToShow = day.i2vPrompt || defaultI2v;

            return (
              <div
                key={day.day}
                className={`p-4 rounded-xl border transition-all relative ${
                  day.status === 'done'
                    ? 'bg-white/[0.01] border-brand/30 opacity-80'
                    : day.status === 'in_progress'
                    ? 'bg-blue-500/[0.04] border-blue-500/40 ring-1 ring-blue-500/30'
                    : 'bg-black/40 border-white/10 hover:border-white/20'
                }`}
              >
                {/* Day Header Row */}
                <div className="flex flex-wrap items-center justify-between gap-2 mb-2.5">
                  <div className="flex items-center gap-2">
                    <span className="w-8 h-8 rounded-lg bg-brand/15 border border-brand/30 text-brand-light font-black text-xs flex items-center justify-center">
                      D{day.day}
                    </span>
                    <div>
                      <span className="text-[10px] font-black uppercase tracking-wider text-brand-light flex items-center gap-1">
                        <Layers className="w-3 h-3" /> {day.pillar}
                      </span>
                      {day.dayTitle && (
                        <h4 className="text-xs font-bold text-gray-200">{day.dayTitle}</h4>
                      )}
                    </div>
                  </div>

                  {/* Top Right Controls & Studio Action */}
                  <div className="flex items-center gap-2 flex-wrap">
                    {/* Send to Studio Button */}
                    <button
                      onClick={() => onSendToStudio(day, calendar)}
                      className="px-3 py-1.5 rounded-lg bg-brand hover:bg-brand-light text-white font-black text-[11px] shadow-lg shadow-blue-500/20 flex items-center gap-1.5 transition-all active:scale-95 cursor-pointer"
                      title="Klik untuk langsung produksi visual & video di Studio"
                    >
                      <PlaySquare className="w-3.5 h-3.5" />
                      <span>Produksi di Studio</span>
                    </button>

                    <span className="px-2 py-1 rounded-md bg-white/5 border border-white/10 text-[10px] font-bold text-gray-300">
                      {day.format}
                    </span>

                    {/* Status Switcher */}
                    <div className="flex items-center bg-black/60 rounded-lg p-0.5 border border-white/10">
                      <button
                        onClick={() => handleStatusChange(day.originalIndex, 'todo')}
                        className={`px-2 py-0.5 rounded text-[9px] font-bold transition-all ${
                          day.status === 'todo'
                            ? 'bg-yellow-500 text-black font-black'
                            : 'text-gray-500 hover:text-gray-300'
                        }`}
                      >
                        To Do
                      </button>
                      <button
                        onClick={() => handleStatusChange(day.originalIndex, 'in_progress')}
                        className={`px-2 py-0.5 rounded text-[9px] font-bold transition-all ${
                          day.status === 'in_progress'
                            ? 'bg-blue-600 text-white font-black'
                            : 'text-gray-500 hover:text-gray-300'
                        }`}
                      >
                        Progress
                      </button>
                      <button
                        onClick={() => handleStatusChange(day.originalIndex, 'done')}
                        className={`px-2 py-0.5 rounded text-[9px] font-bold transition-all ${
                          day.status === 'done'
                            ? 'bg-brand text-white font-black'
                            : 'text-gray-500 hover:text-gray-300'
                        }`}
                      >
                        Selesai
                      </button>
                    </div>
                  </div>
                </div>

                {/* Title */}
                <div className="mb-2">
                  <h3 className="text-sm font-bold text-white leading-snug flex items-center justify-between gap-2">
                    <span className="select-all">{titleToShow}</span>
                    <button
                      onClick={() => handleCopy(titleToShow, `title_${day.day}`)}
                      className="p-1 rounded text-gray-400 hover:text-white shrink-0"
                      title="Salin Judul"
                    >
                      {copiedKey === `title_${day.day}` ? <Check className="w-3.5 h-3.5 text-brand-light" /> : <Copy className="w-3.5 h-3.5" />}
                    </button>
                  </h3>
                </div>

                {/* 3-Second Hook */}
                <div className="bg-black/50 border border-white/5 rounded-lg p-2.5 mb-2.5 flex items-start justify-between gap-2">
                  <div className="text-xs text-gray-200">
                    <span className="text-[10px] text-brand-light font-black uppercase tracking-wider block mb-0.5 flex items-center gap-1">
                      <Zap className="w-3 h-3 text-yellow-400" /> Hook Pembuka (0:00 - 0:03s):
                    </span>
                    <p className="italic font-medium select-all leading-relaxed">
                      "{hookToShow}"
                    </p>
                  </div>
                  <button
                    onClick={() => handleCopy(hookToShow, `hook_${day.day}`)}
                    className="p-1 rounded text-gray-400 hover:text-white shrink-0"
                    title="Salin Hook"
                  >
                    {copiedKey === `hook_${day.day}` ? <Check className="w-3.5 h-3.5 text-brand-light" /> : <Copy className="w-3.5 h-3.5" />}
                  </button>
                </div>

                {/* Dual Prompt Grid: T2I Visual Prompt & I2V Motion Prompt */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5">
                  {/* T2I Prompt */}
                  <div className="bg-white/[0.02] border border-white/5 rounded-lg p-2.5 space-y-1">
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] font-black uppercase tracking-wider text-gray-400 flex items-center gap-1">
                        <Sparkles className="w-3 h-3 text-brand" /> Prompt Visual (Flux / Midjourney):
                      </span>
                      <button
                        onClick={() => handleCopy(day.visualPrompt, `prompt_${day.day}`)}
                        className="flex items-center gap-1 px-2 py-0.5 rounded bg-brand/10 hover:bg-brand/20 text-brand-light text-[10px] font-bold"
                      >
                        {copiedKey === `prompt_${day.day}` ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
                        {copiedKey === `prompt_${day.day}` ? 'Tersalin' : 'Salin Visual'}
                      </button>
                    </div>
                    <p className="text-[11px] text-gray-300 font-mono line-clamp-2 leading-relaxed select-all">
                      {day.visualPrompt}
                    </p>
                  </div>

                  {/* I2V Seamless Looping Motion Prompt */}
                  <div className="bg-blue-500/[0.03] border border-blue-500/20 rounded-lg p-2.5 space-y-1">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-1 text-[10px] font-black uppercase tracking-wider text-blue-300">
                        <Video className="w-3 h-3 text-blue-400" />
                        <span>Prompt I2V (Seamless Loop):</span>
                      </div>
                      <button
                        onClick={() => handleCopy(i2vToShow, `i2v_${day.day}`)}
                        className="flex items-center gap-1 px-2 py-0.5 rounded bg-blue-500/20 hover:bg-blue-500/30 text-blue-200 text-[10px] font-bold"
                      >
                        {copiedKey === `i2v_${day.day}` ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
                        {copiedKey === `i2v_${day.day}` ? 'Tersalin' : 'Salin I2V'}
                      </button>
                    </div>
                    <div className="flex items-center gap-1.5 text-[9px] text-blue-400 font-bold mb-0.5">
                      <span className="flex items-center gap-0.5">
                        <Camera className="w-2.5 h-2.5" /> Static Tripod
                      </span>
                      <span>&bull;</span>
                      <span className="flex items-center gap-0.5">
                        <Repeat className="w-2.5 h-2.5" /> Perfect Loop
                      </span>
                    </div>
                    <p className="text-[11px] text-gray-300 font-mono line-clamp-2 leading-relaxed select-all">
                      {i2vToShow}
                    </p>
                  </div>
                </div>

                {/* Footer Bar */}
                <div className="mt-2.5 pt-2 border-t border-white/5 flex items-center justify-between text-[10px]">
                  {day.cta ? (
                    <div className="text-gray-400">
                      <span className="font-bold text-gray-500">CTA:</span> {day.cta}
                    </div>
                  ) : <div />}

                  <button
                    onClick={() => onSendToStudio(day, calendar)}
                    className="text-brand-light hover:underline font-black flex items-center gap-1 ml-auto"
                  >
                    <span>Buka detail produksi di Studio</span>
                    <Send className="w-3 h-3" />
                  </button>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};
