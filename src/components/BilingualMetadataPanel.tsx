import React, { useState } from 'react';
import {
  Copy,
  Check,
  Zap,
  Search,
  Sparkles,
  Volume2,
  FileText,
  Hash,
  Tag,
  Layers,
  Globe2,
  Youtube,
} from 'lucide-react';
import { LocalizedMetadata, ContentDna } from '../types';

interface Props {
  enMetadata: LocalizedMetadata;
  targetMetadata: LocalizedMetadata;
  targetCountryName: string;
  targetLanguageName: string;
  contentDna?: ContentDna;
  onToast: (msg: string) => void;
}

export const BilingualMetadataPanel: React.FC<Props> = ({
  enMetadata,
  targetMetadata,
  targetCountryName,
  targetLanguageName,
  contentDna,
  onToast,
}) => {
  const [activeLang, setActiveLang] = useState<'en' | 'target'>('en');
  const [copiedKey, setCopiedKey] = useState<string | null>(null);

  const activeData = activeLang === 'en' ? enMetadata : targetMetadata;

  const handleCopy = (text: string, key: string, label = 'Berhasil disalin!') => {
    navigator.clipboard.writeText(text);
    setCopiedKey(key);
    onToast(label);
    setTimeout(() => setCopiedKey(null), 2000);
  };

  if (!activeData) return null;

  return (
    <div className="space-y-4">
      {/* YouTube SEO Header & Language Switcher Bar */}
      <div className="bg-black/60 p-2 rounded-xl border border-white/10 flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-2 pl-1">
          <div className="p-1 rounded-md bg-red-600/20 text-red-500 border border-red-500/30">
            <Youtube className="w-4 h-4" />
          </div>
          <div>
            <span className="text-xs font-black uppercase tracking-wider text-white block">
              YouTube SEO & Algorithm Suite
            </span>
            <span className="text-[10px] text-gray-400 font-medium">
              CTR Hook &bull; Bab Chapters &bull; Tag YouTube Studio
            </span>
          </div>
        </div>

        <div className="flex items-center gap-1">
          <button
            onClick={() => setActiveLang('en')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-extrabold transition-all ${
              activeLang === 'en'
                ? 'bg-brand text-white shadow-lg shadow-blue-500/30 font-black'
                : 'text-gray-400 hover:text-white hover:bg-white/5'
            }`}
          >
            <span>🇬🇧</span> English
          </button>

          <button
            onClick={() => setActiveLang('target')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-extrabold transition-all ${
              activeLang === 'target'
                ? 'bg-cyan-600 text-white shadow-lg shadow-cyan-600/30 font-black'
                : 'text-gray-400 hover:text-white hover:bg-white/5'
            }`}
          >
            <span>🌐</span> {targetLanguageName || targetCountryName || 'Target'}
          </button>
        </div>
      </div>

      {/* A/B Test Titles (YouTube Optimized: 50-60 characters) */}
      <div className="space-y-2.5">
        <div className="flex items-center justify-between">
          <label className="text-[11px] font-black text-gray-400 uppercase tracking-widest flex items-center gap-1.5">
            <Sparkles className="w-3.5 h-3.5 text-blue-400" /> Judul Video YouTube (A/B Test)
          </label>
          <span className="text-[10px] text-gray-400 font-bold">
            Rekomendasi YouTube: 50-60 Karakter
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {/* Option A: Viral Hook */}
          <div className="bg-white/[0.03] border border-blue-500/30 rounded-xl p-3.5 flex flex-col justify-between relative group hover:border-blue-500/60 transition-all">
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="px-2 py-0.5 rounded-md bg-blue-500/20 text-blue-300 font-black text-[10px] uppercase tracking-wider flex items-center gap-1 border border-blue-500/30">
                  <Zap className="w-3 h-3 text-yellow-400" /> Opsi A: Viral Hook (Browse / CTR)
                </span>
                <button
                  onClick={() => handleCopy(activeData.titleA, 'titleA')}
                  className="p-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-gray-300 transition-colors"
                  title="Salin Judul"
                >
                  {copiedKey === 'titleA' ? <Check className="w-3.5 h-3.5 text-brand-light" /> : <Copy className="w-3.5 h-3.5" />}
                </button>
              </div>

              <h3 className="text-sm font-bold text-white leading-snug mb-2 select-all">
                {activeData.titleA}
              </h3>
            </div>

            <div className="pt-2 border-t border-white/5 flex items-center justify-between text-[11px] text-gray-400">
              <span className="italic line-clamp-1">{activeData.titleA_explanation || 'Memicu curiosity gap di feed YouTube.'}</span>
              <span className={`font-mono text-[10px] font-bold px-1.5 py-0.2 rounded shrink-0 ml-2 ${
                activeData.titleA.length <= 60 ? 'bg-blue-500/20 text-blue-300' : 'bg-yellow-500/20 text-yellow-300'
              }`}>
                {activeData.titleA.length}/60 Karakter
              </span>
            </div>
          </div>

          {/* Option B: Search SEO */}
          <div className="bg-white/[0.03] border border-cyan-500/30 rounded-xl p-3.5 flex flex-col justify-between relative group hover:border-cyan-500/60 transition-all">
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="px-2 py-0.5 rounded-md bg-cyan-500/20 text-cyan-300 font-black text-[10px] uppercase tracking-wider flex items-center gap-1 border border-cyan-500/30">
                  <Search className="w-3 h-3 text-cyan-400" /> Opsi B: Search SEO (Kata Kunci Utama)
                </span>
                <button
                  onClick={() => handleCopy(activeData.titleB, 'titleB')}
                  className="p-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-gray-300 transition-colors"
                  title="Salin Judul"
                >
                  {copiedKey === 'titleB' ? <Check className="w-3.5 h-3.5 text-brand-light" /> : <Copy className="w-3.5 h-3.5" />}
                </button>
              </div>

              <h3 className="text-sm font-bold text-white leading-snug mb-2 select-all">
                {activeData.titleB}
              </h3>
            </div>

            <div className="pt-2 border-t border-white/5 flex items-center justify-between text-[11px] text-gray-400">
              <span className="italic line-clamp-1">{activeData.titleB_explanation || 'Target kata kunci pencarian YouTube.'}</span>
              <span className={`font-mono text-[10px] font-bold px-1.5 py-0.2 rounded shrink-0 ml-2 ${
                activeData.titleB.length <= 65 ? 'bg-cyan-500/20 text-cyan-300' : 'bg-yellow-500/20 text-yellow-300'
              }`}>
                {activeData.titleB.length}/65 Karakter
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Opening Hook Script (First 3 Seconds Retention Spike) */}
      <div className="bg-blue-500/10 border border-blue-500/30 rounded-xl p-3.5 space-y-2">
        <div className="flex items-center justify-between">
          <label className="text-[11px] font-black text-brand-light uppercase tracking-widest flex items-center gap-1.5">
            <Volume2 className="w-3.5 h-3.5 text-blue-400" /> Hook Retensi YouTube (0:00 - 0:03 Detik)
          </label>
          <button
            onClick={() => handleCopy(activeData.hook, 'hook')}
            className="flex items-center gap-1 px-2.5 py-1 rounded-md bg-brand/20 hover:bg-brand/30 text-brand-light text-[10px] font-black transition-all"
          >
            {copiedKey === 'hook' ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
            {copiedKey === 'hook' ? 'TERSALIN' : 'SALIN HOOK'}
          </button>
        </div>
        <p className="text-xs text-gray-200 font-medium leading-relaxed bg-black/40 p-2.5 rounded-lg border border-white/5 select-all">
          "{activeData.hook}"
        </p>
      </div>

      {/* Description / Caption (YouTube SEO Structured) */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <div>
            <label className="text-[11px] font-black text-gray-400 uppercase tracking-widest flex items-center gap-1.5">
              <FileText className="w-3.5 h-3.5 text-brand-light" /> Deskripsi Video YouTube (Format Algoritma)
            </label>
            <span className="text-[10px] text-gray-500 block">
              150 karakter awal (Above Fold) &bull; Bab Timestamps &bull; CTA Subscribe &bull; Hashtag
            </span>
          </div>
          <button
            onClick={() => handleCopy(activeData.description, 'description', 'Deskripsi YouTube berhasil disalin!')}
            className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-red-600 hover:bg-red-700 text-white text-[10px] font-black transition-all shadow-md shadow-red-600/20"
          >
            {copiedKey === 'description' ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
            {copiedKey === 'description' ? 'Tersalin!' : 'Salin Deskripsi YouTube'}
          </button>
        </div>
        <div className="bg-black/50 border border-white/10 rounded-xl p-3 text-xs text-gray-300 leading-relaxed font-sans whitespace-pre-wrap max-h-48 overflow-y-auto select-all custom-scrollbar">
          {activeData.description}
        </div>
      </div>

      {/* Hashtags & YouTube Studio Tags */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        {/* Hashtags (YouTube rule: 3-5 tags only) */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <div>
              <label className="text-[11px] font-black text-gray-400 uppercase tracking-widest flex items-center gap-1">
                <Hash className="w-3 h-3 text-brand-light" /> Hashtag YouTube (Maks 3-5)
              </label>
              <span className="text-[9px] text-gray-500 block">Aturan anti-spam YouTube</span>
            </div>
            <button
              onClick={() => handleCopy(activeData.hashtags.join(' '), 'all_hashtags')}
              className="text-[10px] text-brand-light hover:underline font-bold"
            >
              {copiedKey === 'all_hashtags' ? 'Tersalin!' : 'Salin Semua'}
            </button>
          </div>
          <div className="flex flex-wrap gap-1.5 bg-black/40 p-2.5 rounded-xl border border-white/5">
            {activeData.hashtags.map((tag, i) => (
              <span
                key={i}
                onClick={() => handleCopy(tag, `tag_${i}`)}
                className="px-2 py-0.5 rounded-md bg-blue-500/10 hover:bg-brand/20 hover:text-brand-light text-blue-300 text-[11px] font-mono cursor-pointer transition-colors border border-blue-500/20"
                title="Klik untuk salin"
              >
                {tag.startsWith('#') ? tag : `#${tag}`}
              </span>
            ))}
          </div>
        </div>

        {/* YouTube Studio Keyword Tags */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <div>
              <label className="text-[11px] font-black text-gray-400 uppercase tracking-widest flex items-center gap-1">
                <Tag className="w-3 h-3 text-red-500" /> Tag YouTube Studio
              </label>
              <span className="text-[9px] text-gray-500 block">Format koma siap tempel</span>
            </div>
            <button
              onClick={() => handleCopy(activeData.tags.join(', '), 'all_tags', 'Tag YouTube Studio siap ditempel!')}
              className="px-2.5 py-1 rounded bg-red-600/20 hover:bg-red-600/30 text-red-400 text-[10px] font-black transition-all border border-red-500/30"
            >
              {copiedKey === 'all_tags' ? 'Tersalin!' : 'Salin Format Studio (Koma)'}
            </button>
          </div>
          <div className="flex flex-wrap gap-1.5 bg-black/40 p-2.5 rounded-xl border border-white/5 max-h-24 overflow-y-auto custom-scrollbar">
            {activeData.tags.map((kw, i) => (
              <span
                key={i}
                onClick={() => handleCopy(kw, `kw_${i}`)}
                className="px-2 py-0.5 rounded-md bg-white/5 hover:bg-white/10 text-gray-300 text-[10px] cursor-pointer transition-colors border border-white/5"
                title="Klik untuk salin"
              >
                {kw}
              </span>
            ))}
          </div>
        </div>
      </div>

      {/* Content Pillars & YouTube Category */}
      <div className="bg-white/[0.02] border border-white/5 rounded-xl p-3 flex flex-wrap items-center justify-between gap-3 text-xs">
        <div className="flex items-center gap-2">
          <Layers className="w-4 h-4 text-brand-light" />
          <span className="text-[11px] font-bold text-gray-400 uppercase">Pilar YouTube:</span>
          <div className="flex flex-wrap gap-1.5">
            {(activeData.contentPillars || []).map((pillar, i) => (
              <span key={i} className="px-2 py-0.5 rounded bg-brand/10 text-brand-light text-[10px] font-bold border border-brand/20">
                {pillar}
              </span>
            ))}
          </div>
        </div>

        {activeData.category && (
          <div className="text-[11px] text-gray-400">
            Kategori YouTube: <span className="text-white font-bold">{activeData.category}</span>
          </div>
        )}
      </div>
    </div>
  );
};
