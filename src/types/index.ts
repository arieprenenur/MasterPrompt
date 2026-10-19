export interface TargetCountryAnalysis {
  country: string;
  code: string;
  flag: string;
  language: string;
  langCode: string;
  fitScore: number;
  reasoning: string;
  cpmTier: string;
  targetAudience: string;
  bestPostingTime: string;
}

export interface LocalizedMetadata {
  languageName: string;
  titleA: string;
  titleA_type: string;
  titleA_explanation: string;
  titleB: string;
  titleB_type: string;
  titleB_explanation: string;
  hook: string;
  description: string;
  hashtags: string[];
  tags: string[];
  category: string;
  contentPillars: string[];
}

export interface ContentDna {
  visualStyle: string;
  colorPalette: string[];
  lighting: string;
  atmosphere: string;
  targetNiche: string;
  formatRecommendation: string;
}

export interface FullAnalysisResult {
  prompt: string;
  i2vPrompt: string;
  contentDna: ContentDna;
  targetCountries: TargetCountryAnalysis[];
  primaryTargetCountry: string;
  primaryLanguage: string;
  bilingual: {
    en: LocalizedMetadata;
    target: LocalizedMetadata;
  };
}

export interface CalendarDayPlan {
  day: number;
  dayTitle: string;
  pillar: string;
  title_en: string;
  title_target: string;
  hook_en: string;
  hook_target: string;
  visualPrompt: string;
  i2vPrompt?: string;
  format: string;
  cta: string;
  status: 'todo' | 'in_progress' | 'done';
}

export interface ContentCalendar {
  id: string;
  name: string;
  preset_id?: string;
  preset_name?: string;
  days_count: 7 | 30;
  target_country: string;
  target_language: string;
  created_at: string;
  days: CalendarDayPlan[];
}

export interface ContentDnaPreset {
  id: string;
  name: string;
  description?: string;
  thumbnail?: string;
  target_country: string;
  target_language: string;
  visual_prompt: string;
  i2v_prompt?: string;
  content_dna: ContentDna;
  bilingual_metadata: {
    en: LocalizedMetadata;
    target: LocalizedMetadata;
  };
  created_at: string;
}

export interface HistoryItem {
  id: number;
  type: 'image' | 'video' | 'youtube';
  preview: string;
  prompt: string;
  i2vPrompt?: string;
  timestamp: string;
  fullData?: FullAnalysisResult;
}
