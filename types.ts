
export interface AdCopy {
  headline: string;
  description: string;
}

export interface Estimates {
  visitorsMin: number;
  visitorsMax: number;
  cplMin: number;
  cplMax: number;
}

export type StrategyType = 'match' | 'differentiate' | 'none';
export type ToneType = 'Neutral' | 'Premium' | 'Affordable' | 'Urgent' | 'Friendly';

export interface BusinessSnapshot {
  domain: string;
  category: string;
  confidence: 'High' | 'Med' | 'Low';
  faviconUrl: string;
  isSocial: boolean;
}

export interface Campaign {
  id: string;
  createdAt: string;
  name: string; // Derived from business name or domain
  status: 'Draft' | 'Live';
  
  // Step 1
  objective: string;
  
  // Step 2
  url: string;
  businessName?: string;
  city?: string;
  snapshot?: BusinessSnapshot;
  
  // Step 3 (Auto Setup)
  landingPage: string;
  keywordThemes: string[];
  adCopies: AdCopy[];
  tone: ToneType;
  checks: {
    cta: 'Low' | 'Med' | 'High';
    brand: 'Low' | 'Med' | 'High';
    policy: 'Low' | 'Med' | 'High';
  };
  // Store AI generated extra data here
  aiInsights?: {
    competitorTerms: string[];
    differentiateTerms: string[];
  };
  
  // Step 4
  goalSlider: number; // 0-100
  estimates: Estimates;
  
  // Step 5
  strategy: StrategyType;

  // Step 6
  negativeKeywords?: string[];
}

export const OBJECTIVES_CONFIG: Record<string, { label: string, icon: string, outcomeLabel: string, unit: string, efficiencyLabel: string }> = {
  'website_visits': { 
    label: 'Website Visits', 
    icon: 'Globe', 
    outcomeLabel: 'More Visitors ↔ Higher-Intent Visitors',
    efficiencyLabel: 'Est. cost per visit',
    unit: 'visit'
  },
  'online_sales': { 
    label: 'Online Sales', 
    icon: 'ShoppingCart', 
    outcomeLabel: 'More Orders ↔ Lower Cost per Order',
    efficiencyLabel: 'Est. cost per order',
    unit: 'order'
  },
  'get_calls': { 
    label: 'Get Calls', 
    icon: 'Phone', 
    outcomeLabel: 'More Leads ↔ Better Quality Leads',
    efficiencyLabel: 'Est. cost per inquiry',
    unit: 'inquiry'
  },
  'whatsapp_leads': { 
    label: 'WhatsApp Leads', 
    icon: 'MessageCircle', 
    outcomeLabel: 'More Leads ↔ Better Quality Leads',
    efficiencyLabel: 'Est. cost per inquiry',
    unit: 'inquiry'
  },
  'store_visits': { 
    label: 'Store Visits', 
    icon: 'MapPin', 
    outcomeLabel: 'More Footfall ↔ More Ready-to-buy',
    efficiencyLabel: 'Est. cost per store visit',
    unit: 'store visit'
  },
};

export const OBJECTIVES = Object.keys(OBJECTIVES_CONFIG).map(key => ({ id: key, ...OBJECTIVES_CONFIG[key] }));

export const INITIAL_CAMPAIGN_STATE: Campaign = {
  id: '',
  createdAt: '',
  name: '',
  status: 'Draft',
  objective: '',
  url: '',
  businessName: '',
  city: '',
  landingPage: '',
  keywordThemes: [],
  adCopies: [],
  tone: 'Neutral',
  checks: { cta: 'Med', brand: 'Med', policy: 'Low' },
  goalSlider: 50,
  estimates: { visitorsMin: 0, visitorsMax: 0, cplMin: 0, cplMax: 0 },
  strategy: 'none',
  // negativeKeywords undefined by default to trigger auto-population in Step 6
};