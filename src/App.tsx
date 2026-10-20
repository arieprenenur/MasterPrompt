import React, { useState, useEffect, useRef } from 'react';
import {
  Upload,
  Copy,
  RefreshCcw,
  RotateCcw,
  History as HistoryIcon,
  Sparkles,
  Check,
  Trash2,
  FileText,
  Zap,
  Youtube,
  ImageIcon,
  Settings,
  X,
  Plus,
  Edit2,
  Save,
  Globe,
  Calendar,
  Layers,
  Bookmark,
  FolderOpen,
  Video,
  Camera,
  Repeat,
  ArrowRight,
  PlaySquare,
  ChevronLeft,
  ChevronDown,
  Share2,
  Key
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import {
  FullAnalysisResult,
  TargetCountryAnalysis,
  ContentDnaPreset,
  ContentCalendar,
  CalendarDayPlan,
  HistoryItem,
} from './types';
import { TargetCountryPanel } from './components/TargetCountryPanel';
import { BilingualMetadataPanel } from './components/BilingualMetadataPanel';
import { ContentDnaModal } from './components/ContentDnaModal';
import { CalendarModal } from './components/CalendarModal';
import { CalendarView } from './components/CalendarView';
import { PresetsDrawer } from './components/PresetsDrawer';

const App = () => {
  const [activeTab, setActiveTab] = useState<'file' | 'youtube'>('file');
  const [activeAppView, setActiveAppView] = useState<'studio' | 'calendar' | 'presets'>('studio');
  const [resultSubTab, setResultSubTab] = useState<'prompt' | 'i2v' | 'market' | 'metadata' | 'dna'>('prompt');

  // API Key & Settings
  const [apiKey, setApiKey] = useState('');
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);

  // File States
  const [file, setFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [fileType, setFileType] = useState<'image' | 'video' | null>(null);
  const [extraInstructions, setExtraInstructions] = useState('');
  const [negativePrompt, setNegativePrompt] = useState('');
  const [result, setResult] = useState('');
  const [isEditingResult, setIsEditingResult] = useState(false);
  const [editedResult, setEditedResult] = useState('');
  const [isGeneratingPrompt, setIsGeneratingPrompt] = useState(false);

  // I2V Prompt States
  const [i2vResult, setI2vResult] = useState('');
  const [isEditingI2v, setIsEditingI2v] = useState(false);
  const [editedI2v, setEditedI2v] = useState('');

  // Active production session
  const [activeProductionPlan, setActiveProductionPlan] = useState<{
    day: CalendarDayPlan;
    calendar: ContentCalendar;
  } | null>(null);

  // YT States
  const [ytFile, setYtFile] = useState<File | null>(null);
  const [ytPreviewUrl, setYtPreviewUrl] = useState<string | null>(null);
  const [ytExtraInstructions, setYtExtraInstructions] = useState('');
  const [ytNegativePrompt, setYtNegativePrompt] = useState('');
  const [ytResult, setYtResult] = useState('');
  const [isYtEditingResult, setIsYtEditingResult] = useState(false);
  const [ytEditedResult, setYtEditedResult] = useState('');
  const [isYtGeneratingPrompt, setIsYtGeneratingPrompt] = useState(false);

  const [youtubeUrl, setYoutubeUrl] = useState('');
  const [isFetchingThumbnail, setIsFetchingThumbnail] = useState(false);

  // Advanced Analysis & Strategy States
  const [fullAnalysis, setFullAnalysis] = useState<FullAnalysisResult | null>(null);
  const [selectedCountry, setSelectedCountry] = useState<TargetCountryAnalysis | null>(null);

  // Presets & Calendar States
  const [presets, setPresets] = useState<ContentDnaPreset[]>([]);
  const [calendars, setCalendars] = useState<ContentCalendar[]>([]);
  const [activeCalendar, setActiveCalendar] = useState<ContentCalendar | null>(null);

  // Modals & Drawers
  const [isDnaModalOpen, setIsDnaModalOpen] = useState(false);
  const [isCalendarModalOpen, setIsCalendarModalOpen] = useState(false);
  const [isPresetsDrawerOpen, setIsPresetsDrawerOpen] = useState(false);
  const [presetForCalendar, setPresetForCalendar] = useState<ContentDnaPreset | null>(null);

  const [error, setError] = useState<string | null>(null);
  const [history, setHistory] = useState<HistoryItem[]>([]);
  const [copied, setCopied] = useState(false);
  const [copiedI2v, setCopiedI2v] = useState(false);
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' | 'info' } | null>(null);
  const [showCongrats, setShowCongrats] = useState(false);

  const [mobileStudioTab, setMobileStudioTab] = useState<'input' | 'output' | 'history'>('input');
  const [isMobileCalPickerOpen, setIsMobileCalPickerOpen] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Load everything from LocalStorage on mount
  useEffect(() => {
    // 1. API Key
    const savedKey = localStorage.getItem('vtp_gemini_key');
    if (savedKey) setApiKey(savedKey);
    else setIsSettingsOpen(true); // Open settings if no key found

    // 2. History
    const savedHistory = localStorage.getItem('vtp_history_v2');
    if (savedHistory) {
      try { setHistory(JSON.parse(savedHistory)); } catch (e) {}
    }

    // 3. Presets
    const savedPresets = localStorage.getItem('vtp_dna_presets');
    if (savedPresets) {
      try { setPresets(JSON.parse(savedPresets)); } catch (e) {}
    }

    // 4. Calendars
    const savedCalendars = localStorage.getItem('vtp_calendars');
    if (savedCalendars) {
      try {
        const parsed = JSON.parse(savedCalendars);
        setCalendars(parsed);
        if (parsed.length > 0) setActiveCalendar(parsed[0]);
      } catch (e) {}
    }
  }, []);

  // Save history to localStorage automatically
  useEffect(() => {
    localStorage.setItem('vtp_history_v2', JSON.stringify(history));
  }, [history]);

  // Handle Clipboard Paste
  useEffect(() => {
    const handlePaste = (event: ClipboardEvent) => {
      if (activeTab !== 'file') return;
      const items = event.clipboardData?.items;
      if (!items) return;
      for (let i = 0; i < items.length; i++) {
        const item = items[i];
        if (item.kind === 'file') {
          const blob = item.getAsFile();
          if (blob) processSelectedFile(blob);
        }
      }
    };
    window.addEventListener('paste', handlePaste);
    return () => window.removeEventListener('paste', handlePaste);
  }, [activeTab]);

  const showToast = (message: string, type: 'success' | 'error' | 'info' = 'success') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3000);
  };

  const processSelectedFile = (selectedFile: File | Blob) => {
    if (!selectedFile) return;
    setError(null);
    setResult('');
    setI2vResult('');
    setFullAnalysis(null);

    const isImage = selectedFile.type.startsWith('image/');
    const isVideo = selectedFile.type.startsWith('video/');

    if (!isImage && !isVideo) {
      setError('Format file tidak didukung. Gunakan JPG, PNG, atau WEBP.');
      return;
    }

    const type = isVideo ? 'video' : 'image';
    if (selectedFile.size > 20 * 1024 * 1024) {
      setError('Ukuran file terlalu besar. Maksimum 20MB.');
      return;
    }

    const fileToSet = selectedFile instanceof File
        ? selectedFile
        : new File([selectedFile], `pasted-image-${Date.now()}.png`, { type: selectedFile.type });

    setFile(fileToSet);
    setFileType(type);
    const url = URL.createObjectURL(selectedFile);
    setPreviewUrl(url);
    showToast('File visual berhasil dimuat!');
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      processSelectedFile(e.target.files[0]);
    }
  };

  const fetchYoutubeThumbnail = async () => {
    const regex = /(?:youtube\.com\/(?:[^\/]+\/.+\/|(?:v|e(?:mbed)?|live|shorts)\/|.*[?&]v=)|youtu\.be\/)([^"&?\/\s]{11})/i;
    const match = youtubeUrl.match(regex);
    const videoId = match ? match[1] : null;

    if (!videoId) {
      setError('URL YouTube tidak valid!');
      return;
    }

    setIsFetchingThumbnail(true);
    setError(null);
    setFullAnalysis(null);

    const thumbUrl = `https://img.youtube.com/vi/${videoId}/maxresdefault.jpg`;
    setYtPreviewUrl(thumbUrl);

    try {
      const response = await fetch(thumbUrl);
      if (!response.ok) throw new Error('Gagal mengambil thumbnail HD');
      const blob = await response.blob();
      const thumbFile = new File([blob], 'youtube_thumb.jpg', { type: 'image/jpeg' });
      setYtFile(thumbFile);
      showToast('Thumbnail YouTube berhasil dimuat!');
    } catch (err) {
      const fallbackUrl = `https://img.youtube.com/vi/${videoId}/hqdefault.jpg`;
      try {
        const resFallback = await fetch(fallbackUrl);
        const blobFallback = await resFallback.blob();
        const thumbFile = new File([blobFallback], 'youtube_thumb.jpg', { type: 'image/jpeg' });
        setYtFile(thumbFile);
        setYtPreviewUrl(URL.createObjectURL(blobFallback));
        showToast('Thumbnail YouTube (HQ) berhasil dimuat!');
      } catch (e) {
        setError('Gagal memuat gambar thumbnail YouTube.');
      }
    } finally {
      setIsFetchingThumbnail(false);
    }
  };

  const toBase64 = (file: File): Promise<string> =>
    new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = () => {
        const res = reader.result as string;
        resolve(res.split(',')[1]);
      };
      reader.onerror = (error) => reject(error);
    });

  // Client-Side Direct Generation
  const generatePrompt = async () => {
    if (!apiKey) {
      showToast('Silakan masukkan API Key Gemini di Pengaturan!', 'error');
      setIsSettingsOpen(true);
      return;
    }

    const curFile = activeTab === 'file' ? file : ytFile;
    const curExtra = activeTab === 'file' ? extraInstructions : ytExtraInstructions;
    const curNegative = activeTab === 'file' ? negativePrompt : ytNegativePrompt;
    const setRes = activeTab === 'file' ? setResult : setYtResult;
    const setEdited = activeTab === 'file' ? setEditedResult : setYtEditedResult;
    const setIsGen = activeTab === 'file' ? setIsGeneratingPrompt : setIsYtGeneratingPrompt;
    const setIsEdit = activeTab === 'file' ? setIsEditingResult : setIsYtEditingResult;

    if (!curFile) return;
    setIsGen(true);
    setError(null);
    setRes('');
    setI2vResult('');
    setIsEdit(false);
    setFullAnalysis(null);

    try {
      const base64Data = await toBase64(curFile);
      const mimeType = curFile.type || 'image/jpeg';

      const systemPrompt = `You are an elite YouTube Growth Strategist, YouTube SEO Master, and Visual AI Prompt Engineer. 
Produce a highly technical visual prompt, a perfect looping static camera I2V motion prompt, content DNA analysis, target market prediction, and bilingual SEO metadata (English + Native language).
${curExtra ? `USER INSTRUCTIONS: ${curExtra}` : ""}
${curNegative ? `NEGATIVE PROMPT: ${curNegative}` : ""}

RESPOND STRICTLY IN VALID JSON using this exact structure:
{
  "prompt": "Full visual AI prompt...",
  "i2vPrompt": "Static locked tripod camera, perfect seamless looping animation...",
  "contentDna": {
    "visualStyle": "...",
    "colorPalette": ["#hex", "#hex"],
    "lighting": "...",
    "atmosphere": "...",
    "targetNiche": "...",
    "formatRecommendation": "YouTube Shorts (9:16) or YouTube Video (16:9)"
  },
  "targetCountries": [{ "country": "...", "code": "...", "flag": "...", "language": "...", "langCode": "...", "fitScore": 95, "reasoning": "...", "cpmTier": "...", "targetAudience": "...", "bestPostingTime": "..." }],
  "primaryTargetCountry": "...",
  "primaryLanguage": "...",
  "bilingual": {
    "en": { "languageName": "English", "titleA": "...", "titleA_type": "Viral Hook", "titleA_explanation": "...", "titleB": "...", "titleB_type": "SEO", "titleB_explanation": "...", "hook": "...", "description": "...", "hashtags": ["#tag1"], "tags": ["tag1"], "category": "...", "contentPillars": ["...", "..."] },
    "target": { "languageName": "...", "titleA": "...", "titleA_type": "Viral Hook", "titleA_explanation": "...", "titleB": "...", "titleB_type": "SEO", "titleB_explanation": "...", "hook": "...", "description": "...", "hashtags": ["#tag1"], "tags": ["tag1"], "category": "...", "contentPillars": ["...", "..."] }
  }
}`;

      // Call Google Gemini directly from Browser
      const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-3.8-flash:generateContent?key=${apiKey}`, {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    contents: [
      {
        parts: [
          { text: systemPrompt },
          { inline_data: { mime_type: mimeType, data: base64Data } }
        ]
      }
    ],
    generationConfig: { responseMimeType: "application/json" }
  })
});

      const rawData = await response.json();
      if (!response.ok) {
        throw new Error(rawData.error?.message || 'Gagal terhubung ke Gemini API.');
      }

      const generatedTextRaw = rawData.candidates?.[0]?.content?.parts?.[0]?.text;
      if (!generatedTextRaw) throw new Error('Respons AI kosong.');

      const data = JSON.parse(generatedTextRaw.trim());
      const defaultI2vPrompt = data.i2vPrompt || `Static locked tripod camera, completely fixed stable angle. Perfect seamless looping video.`;

      setRes(data.prompt);
      setEdited(data.prompt);
      setI2vResult(defaultI2vPrompt);
      setEditedI2v(defaultI2vPrompt);
      setFullAnalysis(data);

      if (data.targetCountries && data.targetCountries.length > 0) {
        setSelectedCountry(data.targetCountries[0]);
      }

      setShowCongrats(true);
      if ('speechSynthesis' in window) {
        const message = new SpeechSynthesisUtterance('SUDAH BERES BOSKU! SIAP PRODUKSI KANG');
        message.lang = 'id-ID';
        window.speechSynthesis.speak(message);
      }
      setTimeout(() => setShowCongrats(false), 5000);

      const currentPreview = (activeTab === 'file' ? previewUrl : ytPreviewUrl) || '';
      const newHistoryItem: HistoryItem = {
        id: Date.now(),
        type: activeTab === 'file' ? fileType || 'image' : 'youtube',
        preview: currentPreview,
        prompt: data.prompt,
        i2vPrompt: defaultI2vPrompt,
        timestamp: new Date().toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' }),
        fullData: data,
      };

      setHistory((prev) => [newHistoryItem, ...prev.slice(0, 19)]);
      setMobileStudioTab('output');
      showToast('Master Mind Konten berhasil dianalisa!');
    } catch (err: any) {
      console.error(err);
      setError(`Kesalahan: ${err.message || 'Gagal menganalisis visual'}`);
    } finally {
      setIsGen(false);
    }
  };

  const copyToClipboard = (text: string, isI2v = false) => {
    navigator.clipboard.writeText(text).then(() => {
      if (isI2v) {
        setCopiedI2v(true);
        setTimeout(() => setCopiedI2v(false), 2000);
      } else {
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
      }
      showToast('Tersalin ke papan klip!');
    });
  };

  const handleSendCalendarDayToStudio = (day: CalendarDayPlan, cal: ContentCalendar) => {
    setActiveProductionPlan({ day, calendar: cal });
    setResult(day.visualPrompt);
    setEditedResult(day.visualPrompt);
    const i2vMotion = day.i2vPrompt || `Static locked tripod camera. Perfect seamless looping video.`;
    setI2vResult(i2vMotion);
    setEditedI2v(i2vMotion);

    setFullAnalysis({
      prompt: day.visualPrompt,
      i2vPrompt: i2vMotion,
      contentDna: {
        visualStyle: day.pillar || 'Cinematic Production',
        colorPalette: ['#3b82f6', '#60a5fa'],
        lighting: 'Cinematic High Contrast',
        atmosphere: 'High Engagement',
        targetNiche: cal.name,
        formatRecommendation: day.format,
      },
      targetCountries: [
        {
          country: cal.target_country,
          code: 'TARGET',
          flag: '🌐',
          language: cal.target_language,
          langCode: 'native',
          fitScore: 98,
          reasoning: `Berasal dari Kalender Konten ${cal.name} Hari ${day.day}.`,
          cpmTier: 'Tier 1 / High Engagement',
          targetAudience: 'Target Audience Kalender',
          bestPostingTime: 'Jam Tayang Utama',
        },
      ],
      primaryTargetCountry: cal.target_country,
      primaryLanguage: cal.target_language,
      bilingual: {
        en: {
          languageName: 'English', titleA: day.title_en, titleA_type: 'Viral Hook', titleA_explanation: 'High attention retention', titleB: day.title_en, titleB_type: 'Search SEO', titleB_explanation: 'Algorithmic alignment', hook: day.hook_en, description: `Day ${day.day}: ${day.title_en}. Format: ${day.format}. Call to Action: ${day.cta} #shorts #viral`, hashtags: ['#viral', '#trending'], tags: ['content production'], category: 'Entertainment', contentPillars: [day.pillar],
        },
        target: {
          languageName: cal.target_language, titleA: day.title_target || day.title_en, titleA_type: 'Viral Hook', titleA_explanation: 'Localized hook', titleB: day.title_target || day.title_en, titleB_type: 'Search SEO', titleB_explanation: 'Localized SEO', hook: day.hook_target || day.hook_en, description: `Hari ${day.day}: ${day.title_target || day.title_en}. Format: ${day.format}. CTA: ${day.cta} #shorts #viral`, hashtags: ['#viral', '#kreator'], tags: ['konten'], category: 'Entertainment', contentPillars: [day.pillar],
        },
      },
    });

    setActiveAppView('studio');
    setMobileStudioTab('output');
    setResultSubTab('prompt');
    showToast(`Konten Hari ${day.day} siap diproduksi di Studio!`);
  };

  const resetAll = () => {
    if (activeTab === 'file') {
      setFile(null); setPreviewUrl(null); setFileType(null); setResult(''); setExtraInstructions(''); setNegativePrompt(''); setIsEditingResult(false); setIsGeneratingPrompt(false);
    } else {
      setYtFile(null); setYtPreviewUrl(null); setYtResult(''); setYoutubeUrl(''); setYtExtraInstructions(''); setYtNegativePrompt(''); setIsYtEditingResult(false); setIsYtGeneratingPrompt(false);
    }
    setMobileStudioTab('input');
    setI2vResult(''); setEditedI2v(''); setActiveProductionPlan(null); setFullAnalysis(null); setSelectedCountry(null); setError(null);
  };

  const currentResult = activeTab === 'file' ? result : ytResult;
  const currentPreview = activeTab === 'file' ? previewUrl : ytPreviewUrl;
  const activeTargetCountryName = selectedCountry?.country || fullAnalysis?.primaryTargetCountry || 'Target Pasar';
  const activeTargetLanguageName = selectedCountry?.language || fullAnalysis?.primaryLanguage || 'Bahasa Target';

  return (
    <div className="h-[100dvh] flex flex-col overflow-hidden bg-bg-app">
      <div className="fixed inset-0 grid-glow pointer-events-none" aria-hidden="true" />

      {/* Header */}
      <header className="h-14 md:h-18 border-b border-stroke bg-bg-card sticky top-0 z-40 px-3 md:px-8 flex items-center justify-between shadow-xl shrink-0">
        <div className="flex items-center gap-2.5 md:gap-3">
          <div className="w-9 h-9 md:w-11 md:h-11 bg-gradient-to-tr from-brand-dim via-brand to-brand-light rounded-xl md:rounded-2xl flex items-center justify-center text-white border border-brand/40 shadow-lg shrink-0">
            <Sparkles className="w-5 h-5 md:w-6 md:h-6 animate-pulse" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-base sm:text-xl md:text-2xl font-display uppercase tracking-wider text-brand-light leading-none">Master Mind Konten</h1>
              <span className="px-2 py-0.5 rounded-full bg-blue-500/20 border border-blue-400/40 text-[8px] md:text-[9px] font-black text-blue-300 uppercase tracking-wider shrink-0">Oleh Kang AI</span>
            </div>
            <p className="hidden sm:block text-[10px] uppercase tracking-[0.2em] text-gray-400 font-extrabold mt-0.5">Visual Prompt &bull; I2V Seamless Loop &bull; Analisa Pasar &bull; Kalender Produksi</p>
          </div>
        </div>

        {/* Desktop View Switcher Tabs */}
        <div className="hidden md:flex items-center bg-black/60 p-1.5 rounded-2xl border border-white/10 gap-1">
          <button onClick={() => setActiveAppView('studio')} className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-black uppercase tracking-wider transition-all ${activeAppView === 'studio' ? 'bg-brand text-white shadow-lg' : 'text-gray-400 hover:text-white hover:bg-white/5'}`}>
            <Sparkles className="w-3.5 h-3.5" /> Studio Produksi
            {activeProductionPlan && <span className="w-2 h-2 rounded-full bg-cyan-400 animate-ping" />}
          </button>
          <button onClick={() => setActiveAppView('calendar')} className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-black uppercase tracking-wider transition-all relative ${activeAppView === 'calendar' ? 'bg-brand text-white shadow-lg' : 'text-gray-400 hover:text-white hover:bg-white/5'}`}>
            <Calendar className="w-3.5 h-3.5" /> Kalender Konten
            {calendars.length > 0 && <span className="w-4 h-4 rounded-full bg-blue-500 text-white text-[9px] flex items-center justify-center font-mono">{calendars.length}</span>}
          </button>
          <button onClick={() => setIsPresetsDrawerOpen(true)} className="flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-black uppercase tracking-wider text-gray-400 hover:text-white hover:bg-white/5 transition-all">
            <FolderOpen className="w-3.5 h-3.5 text-blue-400" /> Presets DNA
            {presets.length > 0 && <span className="w-4 h-4 rounded-full bg-blue-500 text-white text-[9px] flex items-center justify-center font-mono font-bold">{presets.length}</span>}
          </button>
        </div>

        {/* Right Header Actions */}
        <div className="flex items-center gap-2 md:gap-3">
          <button onClick={() => setIsSettingsOpen(true)} className="p-2 bg-white/5 hover:bg-white/10 text-gray-300 border border-white/10 rounded-xl transition-all" title="Pengaturan API Key">
            <Key className="w-4 h-4" />
          </button>
          <button onClick={resetAll} className="flex items-center gap-1.5 px-3 md:px-4 py-2 bg-red-500/10 hover:bg-red-500/20 text-red-400 border border-red-500/20 rounded-xl transition-all font-black text-[10px] md:text-xs tracking-widest uppercase" title="Reset Studio">
            <RotateCcw className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">RESET</span>
          </button>
        </div>
      </header>

      {/* Main Workspace */}
      <main className="flex-1 max-w-[1700px] mx-auto w-full p-2.5 sm:p-4 md:p-6 pb-20 lg:pb-6 lg:h-[calc(100vh-4.5rem)] min-h-0 overflow-hidden flex flex-col">
        {activeAppView === 'calendar' ? (
          <div className="h-full flex flex-col min-h-0">
            {calendars.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center text-center p-8 vtp-card">
                <Calendar className="w-16 h-16 text-brand mb-4 opacity-50" />
                <h3 className="text-xl font-display uppercase tracking-wider text-white">Belum Ada Kalender Konten</h3>
                <p className="text-xs text-gray-400 mt-1 max-w-md">Analisis gambar visual di Studio Produksi atau gunakan Preset Content DNA yang tersimpan untuk membuat roadmap 7 hari atau 30 hari.</p>
                <div className="flex items-center gap-3 mt-6">
                  <button onClick={() => setActiveAppView('studio')} className="vtp-btn-primary px-5 py-2.5 text-xs flex items-center gap-2 font-black">
                    <Sparkles className="w-4 h-4" /> Buka Studio Produksi
                  </button>
                  {presets.length > 0 && (
                    <button onClick={() => { setPresetForCalendar(presets[0]); setIsCalendarModalOpen(true); }} className="px-5 py-2.5 bg-white/10 hover:bg-white/20 text-white rounded-xl text-xs font-bold transition-all border border-white/10 flex items-center gap-2">
                      <FolderOpen className="w-4 h-4 text-blue-400" /> Gunakan Preset Tersimpan
                    </button>
                  )}
                </div>
              </div>
            ) : (
              <div className="h-full flex flex-col min-h-0">
                {/* Mobile Calendar Quick Selector Bar */}
                <div className="lg:hidden mb-2 bg-bg-card border border-stroke rounded-xl p-2.5 flex items-center justify-between gap-2 shrink-0">
                  <div className="flex items-center gap-2 min-w-0 flex-1">
                    <button onClick={() => setIsMobileCalPickerOpen(true)} className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-brand/20 border border-brand/40 text-brand-light font-black text-xs min-w-0 truncate active:scale-95 transition-transform">
                      <Calendar className="w-3.5 h-3.5 shrink-0" />
                      <span className="truncate">{activeCalendar?.name || 'Pilih Kalender'}</span>
                      <ChevronDown className="w-3.5 h-3.5 shrink-0 ml-0.5 text-blue-300" />
                    </button>
                    <span className="px-2 py-0.5 rounded-md bg-white/10 text-[10px] font-bold text-gray-300 shrink-0">{activeCalendar?.days_count}H</span>
                  </div>
                  <div className="flex items-center gap-1.5 shrink-0">
                    <button onClick={() => setIsMobileCalPickerOpen(true)} className="px-2.5 py-1.5 rounded-lg bg-white/10 text-gray-200 text-xs font-bold hover:bg-white/15">Daftar ({calendars.length})</button>
                    <button onClick={() => { setPresetForCalendar(null); setIsCalendarModalOpen(true); }} className="p-1.5 rounded-lg bg-brand text-white shadow-md shadow-blue-500/20 active:scale-95 transition-transform" title="Buat Kalender Baru">
                      <Plus className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                <div className="h-full grid grid-cols-1 lg:grid-cols-4 gap-4 min-h-0 flex-1">
                  {/* Calendar Selector Sidebar (Desktop only) */}
                  <div className="hidden lg:flex vtp-card p-4 flex-col h-full min-h-0 overflow-hidden">
                    <div className="flex items-center justify-between pb-3 border-b border-stroke">
                      <h3 className="text-sm font-display uppercase tracking-wider text-gray-300 flex items-center gap-2"><Calendar className="w-4 h-4 text-brand" /> Daftar Kalender ({calendars.length})</h3>
                      <button onClick={() => { setPresetForCalendar(presets[0] || null); setIsCalendarModalOpen(true); }} className="p-1.5 rounded-lg bg-brand/20 text-brand-light hover:bg-brand/30 transition-colors" title="Buat Kalender Baru">
                        <Plus className="w-4 h-4" />
                      </button>
                    </div>
                    <div className="flex-1 overflow-y-auto pt-3 space-y-2.5 custom-scrollbar">
                      {calendars.map((cal) => (
                        <div key={cal.id} onClick={() => setActiveCalendar(cal)} className={`p-3 rounded-xl border cursor-pointer transition-all ${activeCalendar?.id === cal.id ? 'bg-brand/15 border-brand ring-1 ring-brand shadow-lg' : 'bg-black/40 border-white/5 hover:border-white/20'}`}>
                          <div className="flex items-center justify-between text-[10px] mb-1">
                            <span className="font-black text-brand-light uppercase">{cal.days_count} Hari</span>
                            <span className="text-gray-500 font-mono">{cal.target_country}</span>
                          </div>
                          <h4 className="text-xs font-bold text-white line-clamp-1">{cal.name}</h4>
                          <div className="flex items-center justify-between text-[10px] text-gray-400 mt-2 pt-2 border-t border-white/5">
                            <span>{cal.days?.length || 0} Konten</span>
                            <span className="text-blue-400 font-bold">{cal.days?.filter((d) => d.status === 'done').length || 0} Selesai</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Calendar Active Content Grid */}
                  <div className="lg:col-span-3 h-full min-h-0 overflow-hidden flex flex-col">
                    {activeCalendar && (
                      <CalendarView
                        calendar={activeCalendar}
                        onUpdateCalendar={(updated) => {
                          setActiveCalendar(updated);
                          const updatedArr = calendars.map((c) => (c.id === updated.id ? updated : c));
                          setCalendars(updatedArr);
                          localStorage.setItem('vtp_calendars', JSON.stringify(updatedArr));
                        }}
                        onDeleteCalendar={(id) => {
                          const remaining = calendars.filter((c) => c.id !== id);
                          setCalendars(remaining);
                          localStorage.setItem('vtp_calendars', JSON.stringify(remaining));
                          setActiveCalendar(remaining.length > 0 ? remaining[0] : null);
                          showToast('Kalender berhasil dihapus!');
                        }}
                        onSendToStudio={handleSendCalendarDayToStudio}
                        onToast={showToast}
                      />
                    )}
                  </div>
                </div>
              </div>
            )}
          </div>
        ) : (
          /* Studio Produksi 3-Column View */
          <div className="flex flex-col h-full min-h-0 gap-3">
            {/* Active Production Banner */}
            {activeProductionPlan && (
              <div className="px-4 py-2.5 rounded-xl bg-blue-500/15 border border-blue-400/30 flex items-center justify-between shrink-0 animate-in fade-in duration-300">
                <div className="flex items-center gap-2.5">
                  <div className="w-7 h-7 rounded-lg bg-brand flex items-center justify-center text-white text-xs font-black">D{activeProductionPlan.day.day}</div>
                  <div>
                    <span className="text-[10px] uppercase font-black text-blue-300 tracking-wider flex items-center gap-1"><PlaySquare className="w-3 h-3 text-cyan-400" /> Sesi Produksi: {activeProductionPlan.calendar.name}</span>
                    <h4 className="text-xs font-bold text-white">Hari {activeProductionPlan.day.day}: {activeProductionPlan.day.title_en}</h4>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <button onClick={() => setActiveAppView('calendar')} className="px-3 py-1 rounded-lg bg-white/10 hover:bg-white/20 text-white text-[10px] font-bold transition-all flex items-center gap-1"><ChevronLeft className="w-3 h-3" /> Kembali ke Kalender</button>
                  <button onClick={() => setActiveProductionPlan(null)} className="p-1 rounded-lg text-gray-400 hover:text-white" title="Tutup Sesi Produksi"><X className="w-4 h-4" /></button>
                </div>
              </div>
            )}

            {/* Mobile Studio Tabs Switcher */}
            <div className="grid grid-cols-3 lg:hidden bg-black/60 p-1 rounded-xl border border-white/10 shrink-0 gap-1">
              <button onClick={() => setMobileStudioTab('input')} className={`py-2 text-center text-xs font-black rounded-lg transition-all ${mobileStudioTab === 'input' ? 'bg-brand text-white shadow-md' : 'text-gray-400 hover:text-white'}`}>📷 Input Visual</button>
              <button onClick={() => setMobileStudioTab('output')} className={`py-2 text-center text-xs font-black rounded-lg transition-all relative ${mobileStudioTab === 'output' ? 'bg-brand text-white shadow-md' : 'text-gray-400 hover:text-white'}`}>⚡ Hasil & I2V {currentResult && <span className="w-2 h-2 rounded-full bg-cyan-400 absolute top-1.5 right-2 animate-pulse" />}</button>
              <button onClick={() => setMobileStudioTab('history')} className={`py-2 text-center text-xs font-black rounded-lg transition-all ${mobileStudioTab === 'history' ? 'bg-brand text-white shadow-md' : 'text-gray-400 hover:text-white'}`}>📜 Riwayat</button>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 flex-1 min-h-0 overflow-hidden">
              {/* Column 1: Visual Input Source */}
              <section className={`lg:col-span-4 vtp-card flex flex-col h-full min-h-0 ${mobileStudioTab === 'input' ? 'flex' : 'hidden lg:flex'} overflow-hidden`}>
                <div className="p-3.5 border-b border-stroke bg-white/[0.02] flex items-center justify-between shrink-0">
                  <h2 className="text-base font-display uppercase tracking-widest flex items-center gap-2 text-brand-light"><ImageIcon className="w-4 h-4" /> Sumber Visual</h2>
                  <div className="bg-black/50 p-1 rounded-xl flex gap-1 border border-white/5">
                    <button onClick={() => setActiveTab('file')} className={`flex items-center gap-1.5 px-3 py-1 rounded-lg text-[10px] font-black transition-all ${activeTab === 'file' ? 'bg-brand text-white shadow-md' : 'text-gray-400 hover:text-white'}`}><Upload className="w-3 h-3" /> File</button>
                    <button onClick={() => setActiveTab('youtube')} className={`flex items-center gap-1.5 px-3 py-1 rounded-lg text-[10px] font-black transition-all ${activeTab === 'youtube' ? 'bg-red-600 text-white shadow-md' : 'text-gray-400 hover:text-white'}`}><Youtube className="w-3 h-3" /> YouTube</button>
                  </div>
                </div>

                <div className="flex-1 overflow-y-auto p-4 flex flex-col gap-4 custom-scrollbar">
                  <div>
                    {!currentPreview ? (
                      <div className="animate-in fade-in zoom-in-95 duration-200">
                        {activeTab === 'file' ? (
                          <div onClick={() => fileInputRef.current?.click()} className="group aspect-[16/10] border-2 border-dashed border-white/10 rounded-2xl flex flex-col items-center justify-center cursor-pointer hover:border-brand/50 hover:bg-brand/5 transition-all duration-300 p-4">
                            <div className="bg-white/5 p-3.5 rounded-2xl mb-2 group-hover:scale-110 transition-transform border border-white/10 text-brand-light"><Upload className="w-7 h-7" /></div>
                            <p className="text-gray-200 text-xs font-bold">Pilih File atau Tempel (Ctrl+V)</p>
                            <p className="text-gray-500 text-[9px] mt-1 text-center uppercase tracking-wider font-bold">JPG, PNG, WEBP &bull; Maks 20MB</p>
                          </div>
                        ) : (
                          <div className="space-y-3">
                            <div className="relative">
                              <input type="text" value={youtubeUrl} onChange={(e) => setYoutubeUrl(e.target.value)} placeholder="https://www.youtube.com/watch?v=..." className="vtp-input w-full pl-11 h-12 text-xs" />
                              <Youtube className="absolute left-3.5 top-1/2 -translate-y-1/2 text-red-500 w-5 h-5" />
                            </div>
                            <button onClick={fetchYoutubeThumbnail} disabled={isFetchingThumbnail || !youtubeUrl} className="w-full h-11 bg-red-600 hover:bg-red-700 text-white font-black rounded-xl shadow-lg transition-all flex items-center justify-center gap-2 text-xs disabled:opacity-50">
                              {isFetchingThumbnail ? <RefreshCcw className="animate-spin w-4 h-4" /> : <><Plus className="w-4 h-4" /> Ambil Thumbnail YouTube</>}
                            </button>
                          </div>
                        )}
                      </div>
                    ) : (
                      <motion.div layoutId="preview" className="relative group aspect-video rounded-xl overflow-hidden bg-black ring-1 ring-white/10 shadow-xl">
                        <img src={currentPreview} className="w-full h-full object-contain" alt="Preview" referrerPolicy="no-referrer" />
                        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                        <button onClick={() => { if (activeTab === 'file') { setPreviewUrl(null); setFile(null); } else { setYtPreviewUrl(null); setYtFile(null); } setFullAnalysis(null); }} className="absolute top-3 right-3 p-2 bg-red-600 hover:bg-red-700 text-white rounded-full shadow-lg transition-colors" title="Hapus Visual"><Trash2 className="w-4 h-4" /></button>
                        <div className="absolute bottom-3 left-3 flex gap-2"><span className="px-2.5 py-0.5 bg-brand text-white font-black text-[9px] rounded-md uppercase tracking-wider">{activeTab === 'youtube' ? 'YouTube HD' : fileType || 'Image'}</span></div>
                      </motion.div>
                    )}
                  </div>

                  <div className="space-y-3">
                    <div className="space-y-1.5">
                      <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest flex items-center gap-1.5"><Zap className="w-3 h-3 text-brand-light" /> Instruksi Tambahan / Fokus Angle</label>
                      <textarea value={activeTab === 'file' ? extraInstructions : ytExtraInstructions} onChange={(e) => activeTab === 'file' ? setExtraInstructions(e.target.value) : setYtExtraInstructions(e.target.value)} placeholder="Contoh: Fokus pada gaya cyberpunk, warna neon kontras tinggi, ekspresi dramatis..." className="vtp-input w-full h-20 resize-none text-xs leading-relaxed" />
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest flex items-center gap-1.5"><X className="w-3 h-3 text-red-500" /> Negative Styling (Hindari)</label>
                      <textarea value={activeTab === 'file' ? negativePrompt : ytNegativePrompt} onChange={(e) => activeTab === 'file' ? setNegativePrompt(e.target.value) : setYtNegativePrompt(e.target.value)} placeholder="Low quality, blurry, watermark, distorted hands..." className="vtp-input w-full h-16 resize-none text-xs leading-relaxed" />
                    </div>
                  </div>
                  {error && <div className="p-3 bg-red-500/10 border border-red-500/20 rounded-xl text-red-400 text-xs flex items-center gap-2"><X className="w-4 h-4 shrink-0" /><span>{error}</span></div>}
                </div>

                <div className="p-3 sm:p-4 border-t border-stroke bg-bg-card shrink-0">
                  <button disabled={!(activeTab === 'file' ? file : ytFile) || (activeTab === 'file' ? isGeneratingPrompt : isYtGeneratingPrompt)} onClick={generatePrompt} className="w-full h-12 vtp-btn-primary rounded-xl font-black text-xs md:text-sm flex items-center justify-center gap-2.5 active:scale-[0.98] disabled:opacity-50 shadow-lg">
                    {(activeTab === 'file' ? isGeneratingPrompt : isYtGeneratingPrompt) ? <><RefreshCcw className="animate-spin w-4 h-4" /><span>Menganalisis Visual & Pasar...</span></> : <><Sparkles className="w-4 h-4" /><span>Hasilkan Prompt & Analisa Pasar</span></>}
                  </button>
                  {!(activeTab === 'file' ? file : ytFile) && <p className="text-[10px] text-gray-500 text-center mt-1 font-medium">Pilih visual atau masukkan link YouTube di atas</p>}
                </div>
              </section>

              {/* Column 2: Analysis & Output Center */}
              <section className={`lg:col-span-5 vtp-card flex flex-col h-full min-h-0 ${mobileStudioTab === 'output' ? 'flex' : 'hidden lg:flex'} overflow-hidden`}>
                <div className="p-3 border-b border-stroke bg-white/[0.02] flex items-center justify-between shrink-0 flex-wrap gap-2">
                  <div className="flex items-center gap-1 bg-black/40 p-1 rounded-xl border border-white/5 overflow-x-auto">
                    <button onClick={() => setResultSubTab('prompt')} className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-black transition-all ${resultSubTab === 'prompt' ? 'bg-brand text-white shadow-md' : 'text-gray-400 hover:text-white'}`}><FileText className="w-3.5 h-3.5" /> Prompt T2I</button>
                    <button onClick={() => setResultSubTab('i2v')} className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-black transition-all ${resultSubTab === 'i2v' ? 'bg-cyan-600 text-white shadow-md' : 'text-gray-400 hover:text-white'}`}><Video className="w-3.5 h-3.5 text-cyan-300" /> Prompt I2V</button>
                    <button onClick={() => setResultSubTab('market')} className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-black transition-all ${resultSubTab === 'market' ? 'bg-brand text-white shadow-md' : 'text-gray-400 hover:text-white'}`}><Globe className="w-3.5 h-3.5" /> Negara Target</button>
                    <button onClick={() => setResultSubTab('metadata')} className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-black transition-all ${resultSubTab === 'metadata' ? 'bg-brand text-white shadow-md' : 'text-gray-400 hover:text-white'}`}><Zap className="w-3.5 h-3.5" /> A/B Metadata</button>
                    <button onClick={() => setResultSubTab('dna')} className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-black transition-all ${resultSubTab === 'dna' ? 'bg-brand text-white shadow-md' : 'text-gray-400 hover:text-white'}`}><Sparkles className="w-3.5 h-3.5" /> DNA</button>
                  </div>
                  {currentResult && (
                    <div className="flex items-center gap-1.5">
                      <button onClick={() => setIsDnaModalOpen(true)} className="px-2.5 py-1.5 rounded-lg bg-blue-500/10 hover:bg-blue-500/20 text-blue-300 border border-blue-500/20 text-[10px] font-black uppercase tracking-wider flex items-center gap-1 transition-all"><Bookmark className="w-3 h-3" /> Simpan DNA</button>
                      <button onClick={() => { setPresetForCalendar(null); setIsCalendarModalOpen(true); }} className="px-2.5 py-1.5 rounded-lg bg-brand hover:bg-brand-light text-white text-[10px] font-black uppercase tracking-wider flex items-center gap-1 transition-all shadow-md"><Calendar className="w-3 h-3" /> Buat Kalender</button>
                    </div>
                  )}
                </div>

                <div className="flex-1 overflow-y-auto p-4 custom-scrollbar bg-black/30">
                  {(activeTab === 'file' ? isGeneratingPrompt : isYtGeneratingPrompt) ? (
                    <div className="h-full flex flex-col items-center justify-center text-center p-8">
                      <div className="relative mb-8">
                        <motion.div animate={{ rotate: 360 }} transition={{ duration: 8, repeat: Infinity, ease: 'linear' }} className="w-28 h-28 border-2 border-dashed border-brand/20 rounded-full" />
                        <motion.div animate={{ rotate: -360 }} transition={{ duration: 5, repeat: Infinity, ease: 'linear' }} className="absolute inset-3 border-2 border-dashed border-cyan-400/40 rounded-full" />
                        <motion.div animate={{ scale: [1, 1.1, 1], rotate: [0, 90, 180, 270, 360] }} transition={{ duration: 4, repeat: Infinity, ease: 'easeInOut' }} className="absolute inset-0 flex items-center justify-center"><Settings className="w-8 h-8 text-brand-light" /></motion.div>
                      </div>
                      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-3">
                        <p className="text-brand-light font-black text-lg italic tracking-tight">MASTER MIND KONTEN SEDANG DIRACIK...</p>
                        <div className="flex flex-col gap-1">
                          <p className="text-white font-bold text-xs tracking-[0.3em] uppercase opacity-70">Bismillah SUGEH</p>
                          <motion.p animate={{ scale: [1, 1.15, 1], opacity: [0.6, 1, 0.6] }} transition={{ duration: 1, repeat: Infinity }} className="text-cyan-400 font-display text-4xl tracking-[0.2em]">AMIN</motion.p>
                        </div>
                      </motion.div>
                    </div>
                  ) : !currentResult ? (
                    <div className="h-full flex flex-col items-center justify-center text-center opacity-30 p-6">
                      <Sparkles className="w-12 h-12 mb-3 text-brand" />
                      <p className="text-xs font-bold uppercase tracking-[0.2em]">Menunggu Input Visual...</p>
                      <p className="text-[11px] text-gray-500 mt-1 max-w-xs">Pilih gambar atau masukkan URL YouTube untuk menghasilkan prompt visual, prompt animasi I2V seamless loop, analisa target pasar global, dan kalender konten.</p>
                    </div>
                  ) : (
                    <>
                      {resultSubTab === 'prompt' && (
                        <div className="space-y-3">
                          <div className="flex items-center justify-between pb-2 border-b border-white/5">
                            <span className="text-[11px] font-black uppercase tracking-wider text-gray-400 flex items-center gap-1.5"><FileText className="w-3.5 h-3.5 text-brand-light" /> Master Prompt Visual</span>
                            <div className="flex items-center gap-1.5">
                              {(activeTab === 'file' ? isEditingResult : isYtEditingResult) ? (
                                <>
                                  <button onClick={() => { if (activeTab === 'file') { setResult(editedResult); setIsEditingResult(false); } else { setYtResult(ytEditedResult); setIsYtEditingResult(false); } showToast('Prompt disimpan!'); }} className="p-1.5 bg-blue-500/20 text-blue-300 rounded-lg"><Save className="w-4 h-4" /></button>
                                  <button onClick={() => { if (activeTab === 'file') { setEditedResult(result); setIsEditingResult(false); } else { setYtEditedResult(ytResult); setIsYtEditingResult(false); } }} className="p-1.5 bg-red-500/10 text-red-400 rounded-lg"><X className="w-4 h-4" /></button>
                                </>
                              ) : (
                                <>
                                  <button onClick={() => { if (activeTab === 'file') setIsEditingResult(true); else setIsYtEditingResult(true); }} className="p-1.5 bg-white/5 text-gray-400 hover:text-white rounded-lg"><Edit2 className="w-3.5 h-3.5" /></button>
                                  <button onClick={() => copyToClipboard(currentResult, false)} className={`flex items-center gap-1 px-3 py-1.5 rounded-full text-[10px] font-black transition-all ${copied ? 'bg-blue-500 text-white' : 'bg-brand text-white shadow-md'}`}>
                                    {copied ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />} {copied ? 'TERSALIN' : 'SALIN PROMPT'}
                                  </button>
                                </>
                              )}
                            </div>
                          </div>
                          {(activeTab === 'file' ? isEditingResult : isYtEditingResult) ? (
                            <textarea value={activeTab === 'file' ? editedResult : ytEditedResult} onChange={(e) => activeTab === 'file' ? setEditedResult(e.target.value) : setYtEditedResult(e.target.value)} className="vtp-input w-full h-[400px] font-mono text-xs leading-relaxed" />
                          ) : (
                            <div className="bg-black/40 border border-white/5 rounded-xl p-4 text-xs font-mono text-gray-200 leading-relaxed whitespace-pre-wrap select-all">{currentResult}</div>
                          )}
                        </div>
                      )}
                      {resultSubTab === 'i2v' && (
                        <div className="space-y-3.5">
                          <div className="bg-gradient-to-r from-cyan-950/40 via-blue-950/30 to-black p-3 rounded-xl border border-cyan-500/30 flex flex-wrap items-center justify-between gap-2">
                            <div>
                              <span className="text-[10px] font-black uppercase tracking-wider text-cyan-300 flex items-center gap-1.5"><Video className="w-3.5 h-3.5 text-cyan-400" /> Prompt I2V (Kling &bull; Runway &bull; Luma)</span>
                              <div className="flex flex-wrap gap-1.5 mt-1">
                                <span className="px-2 py-0.5 rounded bg-blue-500/20 text-blue-300 text-[10px] font-black flex items-center gap-1 border border-blue-500/30"><Camera className="w-3 h-3" /> Static Locked Tripod</span>
                                <span className="px-2 py-0.5 rounded bg-cyan-500/20 text-cyan-300 text-[10px] font-black flex items-center gap-1 border border-cyan-500/30"><Repeat className="w-3 h-3" /> Perfect Seamless Looping</span>
                              </div>
                            </div>
                            <button onClick={() => copyToClipboard(i2vResult || editedI2v, true)} className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-black transition-all ${copiedI2v ? 'bg-cyan-500 text-black font-extrabold' : 'bg-cyan-600 hover:bg-cyan-500 text-white shadow-lg'}`}>
                              {copiedI2v ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />} {copiedI2v ? 'TERSALIN' : 'SALIN PROMPT I2V'}
                            </button>
                          </div>
                          <div className="space-y-2">
                            <div className="flex items-center justify-between">
                              <span className="text-[11px] font-black uppercase tracking-wider text-gray-400">Motion Script Prompt</span>
                              <button onClick={() => setIsEditingI2v(!isEditingI2v)} className="text-[10px] text-cyan-400 hover:underline font-bold">{isEditingI2v ? 'Simpan Edit' : 'Edit Motion Prompt'}</button>
                            </div>
                            {isEditingI2v ? (
                              <textarea value={editedI2v} onChange={(e) => setEditedI2v(e.target.value)} className="vtp-input w-full h-[320px] font-mono text-xs leading-relaxed" />
                            ) : (
                              <div className="bg-black/50 border border-cyan-500/20 rounded-xl p-4 text-xs font-mono text-cyan-100 leading-relaxed whitespace-pre-wrap select-all">{editedI2v || i2vResult}</div>
                            )}
                          </div>
                        </div>
                      )}
                      {resultSubTab === 'market' && fullAnalysis && <TargetCountryPanel countries={fullAnalysis.targetCountries} selectedCountry={activeTargetCountryName} onSelectCountry={(c) => setSelectedCountry(c)} />}
                      {resultSubTab === 'metadata' && fullAnalysis && <BilingualMetadataPanel enMetadata={fullAnalysis.bilingual.en} targetMetadata={fullAnalysis.bilingual.target} targetCountryName={activeTargetCountryName} targetLanguageName={activeTargetLanguageName} contentDna={fullAnalysis.contentDna} onToast={showToast} />}
                      {resultSubTab === 'dna' && fullAnalysis?.contentDna && (
                        <div className="bg-black/50 border border-brand/20 rounded-xl p-4 space-y-3">
                          <div className="flex items-center justify-between">
                            <span className="text-xs font-black uppercase text-brand-light flex items-center gap-1.5"><Sparkles className="w-4 h-4" /> Blueprint Content DNA</span>
                            <button onClick={() => setIsDnaModalOpen(true)} className="px-3 py-1 rounded-lg bg-brand text-white text-[10px] font-black">Simpan Preset DNA</button>
                          </div>
                          <div className="grid grid-cols-2 gap-2 text-xs">
                            <div className="p-2.5 rounded-lg bg-white/[0.02] border border-white/5"><span className="text-[10px] text-gray-500 font-bold block mb-0.5">Gaya Visual:</span><span className="text-white font-bold">{fullAnalysis.contentDna.visualStyle}</span></div>
                            <div className="p-2.5 rounded-lg bg-white/[0.02] border border-white/5"><span className="text-[10px] text-gray-500 font-bold block mb-0.5">Niche & Industri:</span><span className="text-white font-bold">{fullAnalysis.contentDna.targetNiche}</span></div>
                            <div className="p-2.5 rounded-lg bg-white/[0.02] border border-white/5"><span className="text-[10px] text-gray-500 font-bold block mb-0.5">Pencahayaan:</span><span className="text-gray-300 font-medium">{fullAnalysis.contentDna.lighting}</span></div>
                            <div className="p-2.5 rounded-lg bg-white/[0.02] border border-white/5"><span className="text-[10px] text-gray-500 font-bold block mb-0.5">Format Optimal:</span><span className="text-brand-light font-bold">{fullAnalysis.contentDna.formatRecommendation}</span></div>
                          </div>
                          {fullAnalysis.contentDna.colorPalette && (
                            <div className="pt-2 border-t border-white/5">
                              <span className="text-[10px] text-gray-400 font-bold">Palet Warna DNA:</span>
                              <div className="flex flex-wrap gap-1.5 mt-1">{fullAnalysis.contentDna.colorPalette.map((col, idx) => <span key={idx} className="px-2 py-0.5 rounded bg-white/10 text-gray-200 text-[10px] font-mono">{col}</span>)}</div>
                            </div>
                          )}
                        </div>
                      )}
                    </>
                  )}
                </div>
              </section>

              {/* Column 3: History */}
              <section className={`lg:col-span-3 vtp-card flex flex-col h-full min-h-0 ${mobileStudioTab === 'history' ? 'flex' : 'hidden lg:flex'} overflow-hidden`}>
                <div className="p-3.5 border-b border-stroke bg-white/[0.02] flex items-center justify-between shrink-0">
                  <h2 className="text-base font-display uppercase tracking-widest flex items-center gap-2 text-gray-300"><HistoryIcon className="w-4 h-4 text-brand-light" /> Riwayat Analisis</h2>
                  {history.length > 0 && <button onClick={() => { setHistory([]); localStorage.removeItem('vtp_history_v2'); }} className="text-[9px] font-black text-gray-500 hover:text-red-400 uppercase tracking-widest">Hapus</button>}
                </div>
                <div className="flex-1 overflow-y-auto custom-scrollbar p-3">
                  {history.length === 0 ? (
                    <div className="h-full flex flex-col items-center justify-center text-center opacity-20"><HistoryIcon className="w-10 h-10 mb-2" /><p className="text-[9px] font-black uppercase tracking-widest">Kosong</p></div>
                  ) : (
                    <div className="flex flex-col gap-2.5">
                      {history.map((item) => (
                        <div key={item.id} onClick={() => { const mode = item.type === 'youtube' ? 'youtube' : 'file'; setActiveTab(mode); if (mode === 'file') { setResult(item.prompt); setPreviewUrl(item.preview); setFile(new File([], 'history')); } else { setYtResult(item.prompt); setYtPreviewUrl(item.preview); setYtFile(new File([], 'history')); } if (item.i2vPrompt) { setI2vResult(item.i2vPrompt); setEditedI2v(item.i2vPrompt); } if (item.fullData) { setFullAnalysis(item.fullData); if (item.fullData.targetCountries?.[0]) setSelectedCountry(item.fullData.targetCountries[0]); } }} className="bg-white/[0.02] border border-white/5 rounded-xl p-2.5 flex gap-2.5 group hover:bg-white/[0.06] hover:border-brand/40 transition-all cursor-pointer">
                          <div className="w-16 h-12 rounded-lg bg-black flex-shrink-0 relative overflow-hidden ring-1 ring-white/10">
                            <img src={item.preview} className="w-full h-full object-cover opacity-80" alt="History" referrerPolicy="no-referrer" />
                            <div className="absolute top-1 right-1">{item.type === 'youtube' ? <Youtube className="w-2.5 h-2.5 text-red-500" /> : <ImageIcon className="w-2.5 h-2.5 text-brand" />}</div>
                          </div>
                          <div className="flex-1 min-w-0 flex flex-col justify-between">
                            <div className="flex items-center justify-between gap-1"><span className="text-[9px] font-mono text-gray-500 uppercase">{item.timestamp}</span></div>
                            <p className="text-[10px] text-gray-400 font-medium line-clamp-2 leading-snug">{item.prompt}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </section>
            </div>
          </div>
        )}
      </main>

      {/* Mobile Navigation Bar */}
      <nav className="lg:hidden fixed bottom-0 left-0 right-0 h-16 bg-bg-card/95 backdrop-blur-2xl border-t border-stroke z-50 flex items-center justify-around px-2 shadow-2xl">
        <button onClick={() => { setActiveAppView('studio'); if (mobileStudioTab === 'history') setMobileStudioTab(currentResult ? 'output' : 'input'); }} className={`flex-1 h-full flex flex-col items-center justify-center gap-0.5 transition-all ${activeAppView === 'studio' && mobileStudioTab !== 'history' ? 'text-brand-light font-black' : 'text-gray-400 hover:text-white'}`}><Sparkles className="w-5 h-5" /><span className="text-[10px] uppercase font-bold tracking-wider">Studio</span></button>
        <button onClick={() => setActiveAppView('calendar')} className={`flex-1 h-full flex flex-col items-center justify-center gap-0.5 transition-all relative ${activeAppView === 'calendar' ? 'text-brand-light font-black' : 'text-gray-400 hover:text-white'}`}><Calendar className="w-5 h-5" /><span className="text-[10px] uppercase font-bold tracking-wider">Kalender</span></button>
        <button onClick={() => setIsPresetsDrawerOpen(true)} className="flex-1 h-full flex flex-col items-center justify-center gap-0.5 text-gray-400 hover:text-white transition-all"><FolderOpen className="w-5 h-5 text-blue-400" /><span className="text-[10px] uppercase font-bold tracking-wider">DNA Preset</span></button>
        <button onClick={() => { setActiveAppView('studio'); setMobileStudioTab('history'); }} className={`flex-1 h-full flex flex-col items-center justify-center gap-0.5 transition-all relative ${activeAppView === 'studio' && mobileStudioTab === 'history' ? 'text-brand-light font-black' : 'text-gray-400 hover:text-white'}`}><HistoryIcon className="w-5 h-5" /><span className="text-[10px] uppercase font-bold tracking-wider">Riwayat</span></button>
      </nav>

      {/* API Key Modal (NEW) */}
      {isSettingsOpen && (
        <div className="fixed inset-0 z-[300] bg-black/80 backdrop-blur-md flex items-center justify-center p-4">
          <div className="bg-bg-card border border-stroke rounded-2xl p-6 w-full max-w-md shadow-2xl relative">
            <button onClick={() => setIsSettingsOpen(false)} className="absolute top-4 right-4 text-gray-400 hover:text-white"><X className="w-5 h-5" /></button>
            <div className="flex items-center gap-3 mb-6">
              <div className="w-10 h-10 rounded-xl bg-blue-500/20 text-blue-400 flex items-center justify-center border border-blue-500/30"><Key className="w-5 h-5" /></div>
              <div>
                <h3 className="text-white text-lg font-bold">API Key Gemini</h3>
                <p className="text-xs text-gray-400">Penyimpanan kunci lokal & privat.</p>
              </div>
            </div>
            <p className="text-xs text-gray-300 mb-4 bg-white/5 p-3 rounded-lg border border-white/10">
              Aplikasi ini sekarang berjalan mandiri. Semua data 100% aman dan hanya tersimpan di perangkat Anda. Silakan masukkan <a href="https://aistudio.google.com/app/apikey" target="_blank" rel="noreferrer" className="text-brand-light hover:underline font-bold">API Key Gemini</a> Anda untuk mulai meracik konten.
            </p>
            <input type="password" value={apiKey} onChange={e => setApiKey(e.target.value)} placeholder="AIzaSy..." className="w-full vtp-input h-12 text-sm mb-6" />
            <div className="flex gap-3">
              <button onClick={() => setIsSettingsOpen(false)} className="flex-1 py-3 text-gray-400 font-bold hover:bg-white/5 rounded-xl transition-all">Batal</button>
              <button onClick={() => { localStorage.setItem('vtp_gemini_key', apiKey); setIsSettingsOpen(false); showToast('API Key Berhasil Disimpan!'); }} className="flex-1 py-3 bg-brand text-white font-black rounded-xl shadow-lg hover:scale-95 transition-all">Simpan Kunci</button>
            </div>
          </div>
        </div>
      )}

      {/* Other Drawers & Modals (DNA/Calendar) */}
      {fullAnalysis && (
        <ContentDnaModal
          isOpen={isDnaModalOpen} onClose={() => setIsDnaModalOpen(false)} visualPrompt={currentResult} i2vPrompt={i2vResult || fullAnalysis.i2vPrompt} contentDna={fullAnalysis.contentDna} bilingualMetadata={fullAnalysis.bilingual} targetCountry={activeTargetCountryName} targetLanguage={activeTargetLanguageName} thumbnail={currentPreview || ''}
          onSaved={(newPreset) => {
            const updated = [newPreset, ...presets.filter((p) => p.id !== newPreset.id)];
            setPresets(updated);
            localStorage.setItem('vtp_dna_presets', JSON.stringify(updated)); // Force Save to Browser
          }}
          onOpenCalendarGenerator={(preset) => { setPresetForCalendar(preset); setIsCalendarModalOpen(true); }}
          onToast={showToast}
        />
      )}

      <CalendarModal
        isOpen={isCalendarModalOpen} onClose={() => setIsCalendarModalOpen(false)} preset={presetForCalendar} contentDna={fullAnalysis?.contentDna} visualPrompt={currentResult} targetCountry={activeTargetCountryName} targetLanguage={activeTargetLanguageName}
        onCalendarGenerated={(newCal) => {
          const updated = [newCal, ...calendars.filter((c) => c.id !== newCal.id)];
          setCalendars(updated);
          localStorage.setItem('vtp_calendars', JSON.stringify(updated)); // Force Save to Browser
          setActiveCalendar(newCal);
          setActiveAppView('calendar');
        }}
        onToast={showToast}
      />

      <PresetsDrawer
        isOpen={isPresetsDrawerOpen} onClose={() => setIsPresetsDrawerOpen(false)} presets={presets}
        onSelectPreset={(preset) => {
          setResult(preset.visual_prompt); setEditedResult(preset.visual_prompt); if (preset.i2v_prompt) { setI2vResult(preset.i2v_prompt); setEditedI2v(preset.i2v_prompt); }
          if (preset.bilingual_metadata) {
            setFullAnalysis({ prompt: preset.visual_prompt, i2vPrompt: preset.i2v_prompt || '', contentDna: preset.content_dna, targetCountries: [{ country: preset.target_country, code: 'TARGET', flag: '🌐', language: preset.target_language, langCode: 'native', fitScore: 98, reasoning: 'Loaded from locked DNA.', cpmTier: 'Tier 1', targetAudience: 'Content DNA', bestPostingTime: 'Peak Hours' }], primaryTargetCountry: preset.target_country, primaryLanguage: preset.target_language, bilingual: preset.bilingual_metadata });
          }
          setActiveAppView('studio'); setResultSubTab('prompt'); showToast(`Preset "${preset.name}" diterapkan!`);
        }}
        onOpenCalendar={(preset) => { setPresetForCalendar(preset); setIsCalendarModalOpen(true); }}
        onDeletePreset={(id) => {
          const updated = presets.filter((p) => p.id !== id);
          setPresets(updated);
          localStorage.setItem('vtp_dna_presets', JSON.stringify(updated)); // Force Delete from Browser
          showToast('Preset berhasil dihapus!');
        }}
        onToast={showToast}
      />

      <AnimatePresence>
        {toast && (
          <motion.div initial={{ opacity: 0, y: 100, x: '-50%' }} animate={{ opacity: 1, y: 0, x: '-50%' }} exit={{ opacity: 0, y: 20, x: '-50%' }} className="fixed bottom-20 lg:bottom-10 left-1/2 z-[150] px-5 py-2.5 bg-brand text-white font-black text-xs rounded-full shadow-2xl border border-blue-400/30 whitespace-nowrap">
            {toast.message.toUpperCase()}
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {showCongrats && (
          <div className="fixed inset-0 z-[200] pointer-events-none flex items-center justify-center overflow-hidden">
            <motion.div initial={{ opacity: 0, scale: 0.6 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.8 }} className="relative z-10 p-10 md:p-14 rounded-[2rem] bg-black border-2 border-brand shadow-2xl text-center backdrop-blur-2xl">
              <h2 className="text-5xl md:text-7xl font-display text-brand-light leading-none tracking-tight">SUDAH BERES BOSKU!</h2>
              <p className="text-cyan-400 font-bold tracking-[0.25em] mt-3 uppercase text-xs md:text-sm">Master Mind Konten &bull; Siap Produksi</p>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      <input type="file" ref={fileInputRef} onChange={handleFileChange} className="hidden" accept="image/*,video/mp4" />
    </div>
  );
};

export default App;
