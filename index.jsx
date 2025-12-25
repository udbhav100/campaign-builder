
import React, { useState, useEffect, useRef } from 'react';
import { createRoot } from 'react-dom/client';
import { HashRouter, Routes, Route, useNavigate } from 'react-router-dom';
import { Toaster, toast } from 'react-hot-toast';
import { 
  Rocket, Zap, BarChart, Target, ArrowLeft, ArrowRight, Check, 
  Globe, ShoppingCart, Phone, MessageCircle, MapPin, X, Plus, 
  AlertCircle, TrendingUp, Users, Shield, Copy, Wand2, RefreshCw, 
  Eye, Edit2, CheckCircle2, AlertTriangle, ExternalLink, Sparkles, 
  Trash2, Ban, Search, Activity, MousePointer2, DollarSign, Info, 
  CheckCircle, ShieldCheck, Clock, ChevronDown, ChevronUp, Calendar, Smartphone 
} from 'lucide-react';
import { GoogleGenAI, Type } from "@google/genai";

// ==========================================
// TYPES & CONSTANTS
// ==========================================

const OBJECTIVES_CONFIG = {
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

const OBJECTIVES = Object.keys(OBJECTIVES_CONFIG).map(key => ({ id: key, ...OBJECTIVES_CONFIG[key] }));

const INITIAL_CAMPAIGN_STATE = {
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
};

// ==========================================
// UTILS
// ==========================================

const STORAGE_KEY = 'adbuilder_campaigns';

const getCampaigns = () => {
  try {
    const data = localStorage.getItem(STORAGE_KEY);
    return data ? JSON.parse(data) : [];
  } catch (e) {
    console.error("Failed to load campaigns", e);
    return [];
  }
};

const saveCampaign = (campaign) => {
  const campaigns = getCampaigns();
  const existingIndex = campaigns.findIndex(c => c.id === campaign.id);
  if (existingIndex >= 0) {
    campaigns[existingIndex] = campaign;
  } else {
    campaigns.push(campaign);
  }
  localStorage.setItem(STORAGE_KEY, JSON.stringify(campaigns));
};

const KEYWORD_MAPPINGS = {
  'salon': { 
    type: 'Beauty Salon', 
    keywords: ['haircut', 'styling', 'beauty salon', 'hair treatment', 'bridal makeup'], 
    emoji: '💇‍♀️',
    competitors: ['cheap haircuts', 'walk-in salon', 'super cuts'],
    differentiate: ['organic hair dye', 'private styling suite', 'celebrity stylist']
  },
  'clinic': { 
    type: 'Medical Clinic', 
    keywords: ['doctor appointment', 'health checkup', 'specialist', 'urgent care', 'medical center'], 
    emoji: '🏥',
    competitors: ['general hospital', 'city clinic', '24h urgent care'],
    differentiate: ['holistic medicine', 'concierge doctor', 'no-wait appointments']
  },
  'dent': { 
    type: 'Dental Clinic', 
    keywords: ['teeth whitening', 'dental implants', 'root canal', 'dentist near me', 'braces'], 
    emoji: '🦷',
    competitors: ['affordable braces', 'family dentistry', 'dental chain'],
    differentiate: ['sedation dentistry', 'painless veneers', 'laser gum treatment']
  },
  'hotel': { 
    type: 'Hotel', 
    keywords: ['luxury rooms', 'hotel booking', 'vacation stay', 'resort', 'accommodation'], 
    emoji: '🏨',
    competitors: ['booking.com', 'expedia', 'cheap motels'],
    differentiate: ['eco-resort', 'pet friendly suites', 'historic boutique']
  },
  'travel': { 
    type: 'Travel Agency', 
    keywords: ['holiday packages', 'flight booking', 'tour guide', 'honeymoon trips', 'adventure travel'], 
    emoji: '✈️',
    competitors: ['tripadvisor', 'cheap flights', 'package deals'],
    differentiate: ['antarctica expeditions', 'culinary tours', 'private jet charter']
  },
  'coach': { 
    type: 'Coaching Center', 
    keywords: ['exam prep', 'online classes', 'tutor', 'skills training', 'certification'], 
    emoji: '🎓',
    competitors: ['udemy', 'coursera', 'khan academy'],
    differentiate: ['1-on-1 mentorship', 'guaranteed placement', 'live workshops']
  },
  'cafe': { 
    type: 'Cafe', 
    keywords: ['coffee shop', 'breakfast', 'pastries', 'latte art', 'cozy cafe'], 
    emoji: '☕',
    competitors: ['starbucks', 'dunkin', 'mcdonalds coffee'],
    differentiate: ['single origin beans', 'cat cafe', 'vegan bakery']
  },
  'food': { 
    type: 'Restaurant', 
    keywords: ['dining', 'food delivery', 'gourmet', 'family restaurant', 'local cuisine'], 
    emoji: '🍽️',
    competitors: ['uber eats', 'doordash', 'fast food'],
    differentiate: ['farm to table', 'molecular gastronomy', 'chef\'s table']
  },
  'pizza': { 
    type: 'Pizza Place', 
    keywords: ['pepperoni', 'cheese pizza', 'delivery', 'slice', 'italian food'], 
    emoji: '🍕',
    competitors: ['dominos', 'pizza hut', 'papa johns'],
    differentiate: ['wood fired', 'authentic napolitan', 'gluten free cauliflower crust']
  },
  'law': { 
    type: 'Legal Services', 
    keywords: ['lawyer', 'legal advice', 'attorney', 'consultation', 'litigation'], 
    emoji: '⚖️',
    competitors: ['legalzoom', 'public defender', 'legal aid'],
    differentiate: ['boutique litigation', 'international ip law', 'high net worth estate']
  },
};

const DEFAULT_TYPE = { 
  type: 'Local Business', 
  keywords: ['best service', 'near me', 'affordable', 'top rated', 'professional'], 
  emoji: '🏢',
  competitors: ['big chain store', 'online marketplace', 'discount services'],
  differentiate: ['handcrafted', 'family owned since 1980', 'premium concierge']
};

const generateSuggestionsFromUrl = (url, businessName, city, tone = 'Neutral') => {
  const lowerUrl = url ? url.toLowerCase() : '';
  
  let detected = DEFAULT_TYPE;
  let confidence = 'Low';
  
  for (const key in KEYWORD_MAPPINGS) {
    if (lowerUrl.includes(key)) {
      detected = KEYWORD_MAPPINGS[key];
      confidence = 'High';
      break;
    }
  }

  let extractedNoun = '';
  let domain = url;
  try {
    const urlObj = new URL(url.startsWith('http') ? url : `https://${url}`);
    domain = urlObj.hostname;
    const parts = domain.split('.');
    const mainPart = parts.length > 2 ? parts[1] : parts[0];
    
    if (detected === DEFAULT_TYPE) {
      if (mainPart.includes('shop')) { extractedNoun = 'Shop'; detected = { ...DEFAULT_TYPE, type: 'Shop' }; confidence = 'Med'; }
      else if (mainPart.includes('tech')) { extractedNoun = 'Tech'; detected = { ...DEFAULT_TYPE, type: 'Tech Services' }; confidence = 'Med'; }
      else { extractedNoun = mainPart.charAt(0).toUpperCase() + mainPart.slice(1); }
    }
  } catch (e) {
    extractedNoun = 'Service';
  }

  const businessType = detected.type;
  const keywords = [...detected.keywords];

  const locationText = city ? ` in ${city}` : '';
  const nameText = businessName || (extractedNoun || 'Us');

  const prefixes = {
    'Neutral': ['Best', 'Top Rated', 'Quality'],
    'Premium': ['Exclusive', 'Luxury', 'Premium'],
    'Affordable': ['Affordable', 'Cheap', 'Best Value'],
    'Urgent': ['Hurry', 'Last Chance', 'Limited Time'],
    'Friendly': ['Welcome to', 'Your Neighborhood', 'Friendly'],
  };

  const descriptions = {
    'Neutral': `Visit ${nameText} for top-rated service. Book your appointment or order online today!`,
    'Premium': `Experience the finest ${businessType} services. Unmatched quality and attention to detail.`,
    'Affordable': `Get premium quality at prices you'll love. Save big with ${nameText} today.`,
    'Urgent': `Don't miss out! Special offers on ${businessType} services end soon. Book now!`,
    'Friendly': `We love our customers! Come visit ${nameText} for a warm and welcoming experience.`
  };

  const adCopies = [
    {
      headline: `${prefixes[tone][0]} ${businessType}${locationText}`,
      description: descriptions[tone]
    },
    {
      headline: `${detected.emoji} ${prefixes[tone][1]} ${businessType}`,
      description: `Looking for quality? We offer the best experience. Click to learn more.`
    },
    {
      headline: `${prefixes[tone][2]} ${businessType} Services`,
      description: `See why everyone is talking about ${nameText}. Satisfaction guaranteed.`
    }
  ];

  const score = (str) => str.length % 3;
  const levels = ['Low', 'Med', 'High'];
  
  const checks = {
    cta: levels[score(url || '')],
    brand: levels[score(businessType)],
    policy: 'Low',
  };

  const isSocial = domain.includes('facebook.com') || domain.includes('instagram.com') || domain.includes('linkedin.com');
  
  const snapshot = {
    domain: domain,
    category: businessType,
    confidence: confidence,
    faviconUrl: `https://www.google.com/s2/favicons?domain=${domain}&sz=64`,
    isSocial
  };

  return {
    businessType,
    keywords,
    adCopies,
    checks,
    landingPage: url,
    detectedName: extractedNoun,
    snapshot,
    competitorTerms: detected.competitors,
    differentiateTerms: detected.differentiate
  };
};

const calculateEstimates = (sliderValue, objective) => {
  const factor = sliderValue / 100;

  let maxVisitors = 1000;
  let minVisitors = 200;
  let minCpl = 150; 
  let maxCpl = 800;

  if (objective === 'online_sales') {
     maxVisitors = 500; minVisitors = 50; 
     minCpl = 500; maxCpl = 2500; 
  } else if (objective === 'get_calls') {
     maxVisitors = 300; minVisitors = 80;
     minCpl = 200; maxCpl = 1200;
  }

  const estVisitorsBase = maxVisitors - ((maxVisitors - minVisitors) * factor);
  const estCplBase = minCpl + ((maxCpl - minCpl) * factor);

  const vRange = Math.floor(estVisitorsBase * 0.1);
  const cRange = Math.floor(estCplBase * 0.1);

  return {
    visitorsMin: Math.floor(estVisitorsBase - vRange),
    visitorsMax: Math.floor(estVisitorsBase + vRange),
    cplMin: Math.floor(estCplBase - cRange),
    cplMax: Math.floor(estCplBase + cRange),
  };
};

// ==========================================
// GEMINI SERVICE
// ==========================================

async function generateRealCampaignSuggestions(url, objective, tone) {
  const apiKey = process.env.API_KEY;

  const getFallback = () => {
     const mock = generateSuggestionsFromUrl(url, undefined, undefined, tone);
     return {
         keywordThemes: mock.keywords,
         adCopies: mock.adCopies,
         competitorTerms: mock.competitorTerms,
         differentiateTerms: mock.differentiateTerms
     };
  };

  if (!apiKey) {
    console.warn("No API Key found. Using Mock Data.");
    return getFallback();
  }

  try {
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
    
    const promptText = `
      You are an expert AdTech copywriter.
      Business URL: ${url}
      Objective: ${objective}
      Tone: ${tone}
      
      CRITICAL: The first headline MUST include the first keyword theme verbatim to ensure a high relevance score.
    `;

    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: promptText,
      config: {
        responseMimeType: 'application/json',
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            keywordThemes: {
              type: Type.ARRAY,
              items: { type: Type.STRING },
              description: "5 short keywords"
            },
            adCopies: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  headline: { type: Type.STRING, description: "30 chars max" },
                  description: { type: Type.STRING, description: "90 chars max" }
                }
              }
            },
            competitorTerms: {
              type: Type.ARRAY,
              items: { type: Type.STRING },
              description: "3 brand names"
            },
            differentiateTerms: {
              type: Type.ARRAY,
              items: { type: Type.STRING },
              description: "3 niche terms"
            }
          }
        }
      }
    });

    if (response.text) {
      return JSON.parse(response.text);
    }
    throw new Error("Empty response from Gemini");

  } catch (error) {
    console.error("Gemini Failed, switching to Mock:", error);
    return getFallback();
  }
}

// ==========================================
// COMMON COMPONENTS
// ==========================================

const Button = ({ children, variant = 'primary', size = 'md', isLoading, icon: Icon, className = '', ...props }) => {
  const baseStyles = "inline-flex items-center justify-center rounded-lg font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed";
  
  const variants = {
    primary: "bg-blue-600 text-white hover:bg-blue-700 focus:ring-blue-500 shadow-sm",
    secondary: "bg-slate-800 text-white hover:bg-slate-900 focus:ring-slate-500 shadow-sm",
    outline: "border border-slate-300 bg-white text-slate-700 hover:bg-slate-50 focus:ring-slate-500",
    ghost: "text-slate-600 hover:bg-slate-100 hover:text-slate-900 focus:ring-slate-500"
  };

  const sizes = {
    sm: "px-3 py-1.5 text-sm",
    md: "px-4 py-2 text-base",
    lg: "px-6 py-3 text-lg"
  };

  return (
    <button 
      className={`${baseStyles} ${variants[variant]} ${sizes[size]} ${className}`}
      disabled={isLoading || props.disabled}
      {...props}
    >
      {isLoading ? (
        <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-current" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
        </svg>
      ) : Icon ? <Icon className="w-4 h-4 mr-2" /> : null}
      {children}
    </button>
  );
};

const Input = ({ label, error, className = '', ...props }) => {
  return (
    <div className="w-full">
      {label && <label className="block text-sm font-medium text-slate-700 mb-1">{label}</label>}
      <input
        className={`w-full rounded-lg border ${error ? 'border-red-500 focus:ring-red-500' : 'border-slate-300 focus:ring-blue-500'} bg-slate-50 px-3 py-2 text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 transition-shadow ${className}`}
        {...props}
      />
      {error && <p className="mt-1 text-sm text-red-600">{error}</p>}
    </div>
  );
};

const Card = ({ children, className = '', onClick }) => {
  return (
    <div 
      onClick={onClick}
      className={`bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden ${onClick ? 'cursor-pointer hover:border-blue-300 transition-colors' : ''} ${className}`}
    >
      {children}
    </div>
  );
};

const Badge = ({ children, color = 'gray' }) => {
  const colors = {
    green: "bg-emerald-100 text-emerald-800 border border-emerald-200",
    yellow: "bg-amber-100 text-amber-800 border border-amber-200",
    red: "bg-rose-100 text-rose-800 border border-rose-200",
    blue: "bg-blue-100 text-blue-800 border border-blue-200",
    gray: "bg-slate-100 text-slate-800 border border-slate-200",
    purple: "bg-purple-100 text-purple-800 border border-purple-200",
  };
  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${colors[color]}`}>
      {children}
    </span>
  );
};

const Container = ({ children, className = '' }) => (
  <div className={`max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 ${className}`}>
    {children}
  </div>
);

// ==========================================
// WIZARD STEP COMPONENTS
// ==========================================

const StepObjective = ({ value, onChange }) => {
  const icons = { Globe, ShoppingCart, Phone, MessageCircle, MapPin };
  
  return (
    <div className="space-y-4 animate-fade-in">
      <h2 className="text-2xl font-bold text-slate-900">What is your main goal?</h2>
      <p className="text-slate-600">Choose the outcome you want most from this campaign.</p>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-6">
        {OBJECTIVES.map((obj) => {
          const Icon = icons[obj.icon];
          const isSelected = value === obj.id;
          return (
            <div 
              key={obj.id}
              onClick={() => onChange(obj.id)}
              className={`
                relative p-6 rounded-xl border-2 cursor-pointer transition-all duration-200 group
                ${isSelected 
                  ? 'border-blue-600 bg-blue-50 shadow-md ring-1 ring-blue-600' 
                  : 'border-slate-200 bg-white hover:border-blue-400 hover:shadow-md'}
              `}
            >
              <div className="flex items-center gap-4">
                <div className={`p-3 rounded-lg transition-colors ${isSelected ? 'bg-blue-600 text-white' : 'bg-slate-100 text-slate-600 group-hover:bg-blue-100 group-hover:text-blue-700'}`}>
                  <Icon size={24} />
                </div>
                <span className={`font-semibold text-lg ${isSelected ? 'text-blue-900' : 'text-slate-900'}`}>
                  {obj.label}
                </span>
              </div>
              {isSelected && (
                <div className="absolute top-4 right-4 text-blue-600">
                  <CheckCircle2 className="w-6 h-6 fill-blue-100" />
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};

const StepUrl = ({ url, setUrl, name, setName, city, setCity, campaign, updateCampaign }) => {
  const [error, setError] = useState('');
  
  useEffect(() => {
    const timer = setTimeout(() => {
       if (url && url.includes('.')) {
          const suggestions = generateSuggestionsFromUrl(url, name, city, 'Neutral');
          updateCampaign({ snapshot: suggestions.snapshot });
       }
    }, 800);
    return () => clearTimeout(timer);
  }, [url, name, city]);

  const handleChangeUrl = (val) => {
    setUrl(val);
    if (val && !val.includes('.')) setError('Please enter a valid URL (e.g. example.com)');
    else setError('');
  }

  return (
    <div className="space-y-8 animate-fade-in">
      <div>
        <h2 className="text-2xl font-bold text-slate-900">Where should people go?</h2>
        <p className="text-slate-600">Enter your business details.</p>
      </div>

      <div className="grid md:grid-cols-2 gap-8">
        <div className="space-y-6">
            <div className="space-y-4">
                <Input 
                label="Website URL *" 
                placeholder="www.yourbusiness.com" 
                value={url}
                onChange={(e) => handleChangeUrl(e.target.value)}
                error={error}
                autoFocus
                />
                <Input 
                label="Business Name (Optional)" 
                placeholder="Joe's Pizza" 
                value={name}
                onChange={(e) => setName(e.target.value)}
                />
                <Input 
                  label="City (Optional)" 
                  placeholder="e.g. New York, NY" 
                  value={city}
                  onChange={(e) => setCity(e.target.value)}
                />
            </div>
        </div>

        <div className="space-y-4">
            {campaign.snapshot && !error && url.length > 3 && (
                <div className="animate-fade-in-up">
                    <div className="text-sm font-semibold text-slate-500 mb-2 uppercase tracking-wide">Business Snapshot</div>
                    <Card className="p-6 border-blue-200 bg-blue-50/50">
                        <div className="flex items-start gap-4">
                            <img 
                            src={campaign.snapshot.faviconUrl} 
                            alt="favicon" 
                            className="w-12 h-12 rounded-lg bg-white p-1 border border-slate-200 shadow-sm"
                            onError={(e) => (e.currentTarget.src = 'https://via.placeholder.com/48?text=Site')}
                            />
                            <div>
                                <h3 className="font-bold text-lg text-slate-900">{campaign.snapshot.domain}</h3>
                                <div className="flex items-center gap-2 mt-1">
                                    <Badge color={campaign.snapshot.confidence === 'High' ? 'green' : 'yellow'}>
                                        {campaign.snapshot.category}
                                    </Badge>
                                    {campaign.snapshot.confidence === 'Low' && <span className="text-xs text-slate-500">Unsure?</span>}
                                </div>
                            </div>
                        </div>
                        {campaign.snapshot.isSocial && (
                            <div className="mt-4 flex items-start gap-2 text-sm text-amber-700 bg-amber-50 p-3 rounded-md border border-amber-200">
                                <AlertTriangle size={16} className="mt-0.5 flex-shrink-0" />
                                <p>Works best with your own website. Social pages may limit our AI suggestions.</p>
                            </div>
                        )}
                    </Card>
                </div>
            )}
        </div>
      </div>
    </div>
  );
};

const calculateAdStrength = (headline, description, keywords) => {
  let score = 0;
  let tip = "Great job! Your ad is strong.";
  const lowerHead = headline.toLowerCase();
  const lowerDesc = description.toLowerCase();

  if (headline.length > 15) score += 20;
  if (description.length > 30) score += 30;

  const stopWords = ['in', 'the', 'at', 'on', 'of', 'for', 'to', 'a', 'an', 'and', 'me', 'my'];
  const activeKeywords = keywords.filter(k => k.length > 0);
  const keywordTokens = new Set();
  activeKeywords.forEach(k => {
     k.toLowerCase().split(/\s+/).forEach(word => {
        const cleaned = word.replace(/[^a-z0-9]/g, '');
        if (cleaned.length > 2 && !stopWords.includes(cleaned)) {
            keywordTokens.add(cleaned);
        }
     });
  });

  const headlineWords = lowerHead.split(/\s+/).map(w => w.replace(/[^a-z0-9]/g, ''));
  const hasKeyword = headlineWords.some(w => keywordTokens.has(w));
  if (hasKeyword) score += 30;

  const powerWords = ["best", "#1", "sale", "now", "official", "expert", "free", "review", "top", "exclusive", "deal"];
  const hasPower = powerWords.some(w => lowerHead.includes(w) || lowerDesc.includes(w));
  if (hasPower) score += 20;

  if (!hasKeyword && activeKeywords.length > 0) {
      const simplerKw = activeKeywords[0].split(' ')[0] || activeKeywords[0];
      tip = `Tip: Add a word like '${simplerKw}' to your headline.`;
  } else if (headline.length <= 15) {
      tip = "Tip: Make your headline a bit longer for better visibility.";
  } else if (!hasPower) {
      tip = "Tip: Add a power word (e.g., Best, Sale, Expert) to grab attention.";
  } else if (description.length <= 30) {
      tip = "Tip: Elaborate in your description to persuade customers.";
  }

  return { score, tip };
};

const StepAutoSetup = ({ campaign, updateCampaign }) => {
  const [loading, setLoading] = useState(true);
  const [newKeyword, setNewKeyword] = useState('');
  const [editingAdIndex, setEditingAdIndex] = useState(null);
  const [isAiGenerated, setIsAiGenerated] = useState(false);
  const tones = ['Neutral', 'Premium', 'Affordable', 'Urgent', 'Friendly'];

  const regenerate = async (selectedTone) => {
    setLoading(true);
    
    const useFallback = (reason) => {
        const result = generateSuggestionsFromUrl(campaign.url, campaign.businessName, campaign.city, selectedTone);
        updateCampaign({
            adCopies: result.adCopies,
            tone: selectedTone,
            keywordThemes: result.keywords
        });
        setIsAiGenerated(false);
        toast('Offline Mode: ' + (reason || 'Suggestions generated locally'), { 
          icon: '⚠️',
          style: { background: '#fef3c7', color: '#92400e' }
        });
    };

    try {
        const aiData = await generateRealCampaignSuggestions(campaign.url, campaign.objective, selectedTone);
        updateCampaign({
            adCopies: aiData.adCopies,
            tone: selectedTone,
            keywordThemes: aiData.keywordThemes,
            aiInsights: {
                competitorTerms: aiData.competitorTerms,
                differentiateTerms: aiData.differentiateTerms
            }
        });
        setIsAiGenerated(true);
        toast.success('Generated with Gemini AI ⚡');
    } catch (e) {
        if (e.message === 'SDK_NOT_LOADED' || e.message?.includes('SDK_NOT_LOADED')) {
           useFallback('AI SDK failed to load');
        } else if (e.message?.includes('API_KEY')) {
           useFallback('API Key missing');
        } else if (e.message === 'API_TIMEOUT') {
           useFallback('Connection timed out');
        } else {
           console.error("AI Generation Error:", e);
           useFallback('AI unavailable');
        }
    } finally {
        setLoading(false);
    }
  };

  useEffect(() => {
    if (campaign.adCopies.length === 0) {
        regenerate(campaign.tone);
    } else {
        setLoading(false);
    }
  }, []);

  useEffect(() => {
    let safetyTimer;
    if (loading) {
        safetyTimer = setTimeout(() => {
            setLoading(false);
            if (!campaign.adCopies.length) {
                const result = generateSuggestionsFromUrl(campaign.url, campaign.businessName, campaign.city, campaign.tone);
                updateCampaign({
                    adCopies: result.adCopies,
                    tone: campaign.tone,
                    keywordThemes: result.keywords
                });
                toast('Offline Mode: Request timed out', { icon: '⚠️' });
            }
        }, 35000); 
    }
    return () => clearTimeout(safetyTimer);
  }, [loading]);

  const handleAddKeyword = (e) => {
    if (e.key === 'Enter' && newKeyword.trim()) {
        updateCampaign({ keywordThemes: [...campaign.keywordThemes, newKeyword.trim()] });
        setNewKeyword('');
        toast.success("Audience expanded.", { icon: '📈', duration: 2000, style: { fontSize: '12px' } });
    }
  };

  const removeKeyword = (idx) => {
    const newKws = [...campaign.keywordThemes];
    newKws.splice(idx, 1);
    updateCampaign({ keywordThemes: newKws });
    toast("Audience narrowed (Higher intent).", { icon: '🎯', duration: 2000, style: { fontSize: '12px' } });
  };

  const updateAdCopy = (idx, field, val) => {
    const newCopies = [...campaign.adCopies];
    newCopies[idx] = { ...newCopies[idx], [field]: val };
    updateCampaign({ adCopies: newCopies });
  };

  const removeAdCopy = (idx, e) => {
    e.stopPropagation();
    if (campaign.adCopies.length <= 1) {
        toast.error("You need at least 1 ad to launch.", { icon: '🚫' });
        return;
    }
    const newCopies = [...campaign.adCopies];
    newCopies.splice(idx, 1);
    updateCampaign({ adCopies: newCopies });
    if (editingAdIndex === idx) setEditingAdIndex(null);
  };

  const addAdCopy = () => {
    const newAd = { 
        headline: 'New Special Offer', 
        description: `Visit ${campaign.businessName || 'us'} today for great deals and professional service.` 
    };
    const newIndex = campaign.adCopies.length;
    updateCampaign({ adCopies: [...campaign.adCopies, newAd] });
    setEditingAdIndex(newIndex);
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-24 text-center space-y-4">
        <div className="relative">
          <div className="w-16 h-16 border-4 border-blue-100 border-t-blue-600 rounded-full animate-spin"></div>
          <div className="absolute inset-0 flex items-center justify-center">
            <Wand2 className="w-6 h-6 text-blue-600 animate-pulse" />
          </div>
        </div>
        <h3 className="text-xl font-semibold text-slate-800">Drafting your campaign...</h3>
        <p className="text-slate-500">Writing ads and finding keywords based on your site.</p>
      </div>
    );
  }

  return (
    <div className="space-y-8 animate-fade-in">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
            <h2 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
            <Wand2 className="text-blue-600" /> AI Draft
            </h2>
            <div className="flex items-center gap-2 text-slate-600">
                <p>Review our suggestions. You can edit everything.</p>
                {isAiGenerated && (
                    <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-blue-100 text-blue-800 border border-blue-200">
                        <Sparkles size={12} className="mr-1" /> Powered by Gemini
                    </span>
                )}
            </div>
        </div>
        <Button variant="outline" size="sm" onClick={() => regenerate(campaign.tone)}>
            <RefreshCw size={14} className="mr-2"/> Regenerate
        </Button>
      </div>

      <div className="flex items-center gap-2 overflow-x-auto pb-2">
        <span className="text-sm font-medium text-slate-700 mr-2">Tone:</span>
        {tones.map(t => (
            <button
                key={t}
                onClick={() => regenerate(t)}
                className={`px-3 py-1 rounded-full text-xs font-medium border transition-colors whitespace-nowrap
                    ${campaign.tone === t 
                        ? 'bg-blue-600 text-white border-blue-600' 
                        : 'bg-white text-slate-600 border-slate-200 hover:border-slate-300'}`}
            >
                {t}
            </button>
        ))}
      </div>

      <section>
        <div className="mb-4">
            <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wide">Review Ad Variants (A/B Test)</h3>
            <p className="text-sm text-slate-500 mt-1">
                We generated {campaign.adCopies.length} options. Your campaign will automatically rotate these ads to find the best performer.
            </p>
        </div>
        
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {campaign.adCopies.map((copy, i) => {
            const { score, tip } = calculateAdStrength(copy.headline, copy.description, campaign.keywordThemes);
            const scoreColor = score >= 70 ? 'bg-green-500' : score >= 40 ? 'bg-yellow-500' : 'bg-red-500';
            const scoreLabel = score >= 70 ? 'Excellent!' : score >= 40 ? 'Good' : 'Weak';

            return (
              <Card 
                  key={i} 
                  className={`flex flex-col bg-slate-50 border-slate-200 h-full relative group cursor-pointer hover:border-blue-400 transition-colors ${editingAdIndex === i ? 'ring-2 ring-blue-500 border-transparent bg-white shadow-lg' : ''}`}
                  onClick={() => { if (editingAdIndex !== i) setEditingAdIndex(i); }}
              >
                  <div className="absolute top-2 right-2 flex bg-white rounded-lg border border-slate-200 shadow-sm z-10 p-0.5" onClick={(e) => e.stopPropagation()}>
                       <button 
                          onClick={() => setEditingAdIndex(editingAdIndex === i ? null : i)}
                          className={`p-1.5 rounded-md transition-colors ${editingAdIndex === i ? 'bg-blue-100 text-blue-700' : 'text-slate-400 hover:text-slate-700 hover:bg-slate-100'}`}
                          title={editingAdIndex === i ? "Preview" : "Edit"}
                       >
                          {editingAdIndex === i ? <Eye size={14} /> : <Edit2 size={14} />}
                       </button>
                       <div className="w-[1px] bg-slate-200 my-0.5 mx-0.5"></div>
                       <button 
                          onClick={(e) => removeAdCopy(i, e)}
                          className="p-1.5 rounded-md text-slate-400 hover:text-red-600 hover:bg-red-50 transition-colors"
                          title="Delete Ad"
                       >
                          <Trash2 size={14} />
                       </button>
                  </div>

                  {editingAdIndex === i ? (
                       <div className="p-4 flex-grow space-y-3 cursor-default" onClick={(e) => e.stopPropagation()}>
                          <div>
                              <label className="text-xs text-slate-500 font-bold uppercase">Headline</label>
                              <input 
                                  className="w-full mt-1 px-2 py-1.5 text-sm border border-slate-300 rounded focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none bg-slate-50 text-slate-900"
                                  value={copy.headline}
                                  onChange={(e) => updateAdCopy(i, 'headline', e.target.value)}
                                  maxLength={30}
                                  autoFocus
                              />
                              <div className="text-right text-[10px] text-slate-400 mt-1">{copy.headline.length}/30</div>
                          </div>
                          <div>
                              <label className="text-xs text-slate-500 font-bold uppercase">Description</label>
                              <textarea 
                                  className="w-full mt-1 px-2 py-1.5 text-sm border border-slate-300 rounded focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none resize-none min-h-[80px] bg-slate-50 text-slate-900"
                                  value={copy.description}
                                  onChange={(e) => updateAdCopy(i, 'description', e.target.value)}
                                  maxLength={90}
                              />
                              <div className="text-right text-[10px] text-slate-400 mt-1">{copy.description.length}/90</div>
                          </div>
                          
                          <div className="bg-slate-50 rounded-lg p-3 border border-slate-100 mt-2">
                             <div className="flex justify-between items-center mb-1">
                                <span className="text-xs font-bold text-slate-600">Ad Strength</span>
                                <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${score >= 70 ? 'bg-green-100 text-green-700' : score >= 40 ? 'bg-yellow-100 text-yellow-700' : 'bg-red-100 text-red-700'}`}>
                                    {scoreLabel}
                                </span>
                             </div>
                             <div className="w-full bg-slate-200 rounded-full h-1.5 mb-2">
                                <div className={`h-1.5 rounded-full transition-all duration-300 ${scoreColor}`} style={{ width: `${score}%` }}></div>
                             </div>
                             <div className="text-[10px] text-slate-500 leading-tight">
                                {tip}
                             </div>
                          </div>

                          <div className="pt-2">
                               <Button size="sm" className="w-full text-xs" onClick={() => setEditingAdIndex(null)}>
                                  Done Editing
                               </Button>
                          </div>
                       </div>
                  ) : (
                      <div className="p-4 flex-grow flex flex-col justify-center">
                          <div className="mb-1 flex items-center gap-1">
                               <span className="font-bold text-black text-xs">Ad</span>
                               <span className="text-xs text-slate-500">· {campaign.snapshot?.domain || 'example.com'}</span>
                          </div>
                          <div className="text-blue-800 text-lg leading-snug font-medium hover:underline mb-1">
                              {copy.headline}
                          </div>
                          <div className="text-slate-600 text-sm leading-relaxed">
                              {copy.description}
                          </div>
                          <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-xs text-slate-400 opacity-0 group-hover:opacity-100 transition-opacity">
                              <span>Click to edit</span>
                          </div>
                      </div>
                  )}
              </Card>
            );
          })}
          
          <button 
            onClick={addAdCopy}
            className="flex flex-col items-center justify-center p-6 rounded-xl border-2 border-dashed border-slate-300 hover:border-blue-400 hover:bg-blue-50/30 transition-all text-slate-500 hover:text-blue-600 h-full min-h-[200px]"
          >
            <div className="w-12 h-12 bg-slate-100 rounded-full flex items-center justify-center mb-3 group-hover:bg-blue-100 transition-colors">
                <Plus size={24} />
            </div>
            <span className="font-semibold text-sm">+ Add Custom Ad</span>
          </button>
        </div>
      </section>

      <section>
        <div className="mb-3">
             <h3 className="text-sm font-semibold text-slate-900 uppercase tracking-wide">Keywords</h3>
             <p className="text-xs text-slate-500 mt-1">Your ad will appear when customers search for these terms on Google/Bing.</p>
        </div>
        <div className="flex flex-wrap gap-2 items-center">
          {campaign.keywordThemes.map((kw, i) => (
            <span key={i} className="inline-flex items-center px-3 py-1.5 rounded-full bg-white text-slate-700 border border-slate-200 text-sm shadow-sm hover:border-blue-300 transition-colors">
              {kw}
              <button onClick={() => removeKeyword(i)} className="ml-2 text-slate-400 hover:text-red-500"><X size={14}/></button>
            </span>
          ))}
          <div className="relative">
             <input 
                type="text"
                placeholder="+ Add theme"
                className="inline-flex items-center px-3 py-1.5 rounded-full border border-dashed border-slate-300 text-sm focus:outline-none focus:border-blue-500 focus:border-solid focus:ring-1 focus:ring-blue-500 w-32 bg-transparent placeholder-slate-500"
                value={newKeyword}
                onChange={(e) => setNewKeyword(e.target.value)}
                onKeyDown={handleAddKeyword}
             />
          </div>
        </div>
      </section>
    </div>
  );
};

const StepGoalSlider = ({ value, onChange, estimates, objective }) => {
  const config = OBJECTIVES_CONFIG[objective] || OBJECTIVES_CONFIG['website_visits'];

  return (
    <div className="space-y-8 animate-fade-in">
      <div>
        <h2 className="text-2xl font-bold text-slate-900">{config.outcomeLabel}</h2>
        <p className="text-slate-600">Use the slider to prioritize volume or quality.</p>
      </div>

      <div className="py-8 px-6 bg-white rounded-xl border border-slate-200 shadow-sm">
        <div className="mb-8">
           <div className="flex justify-between text-sm font-bold text-slate-700 mb-4">
            <span className="flex items-center gap-2 text-blue-600"><Users size={18}/> Max Volume</span>
            <span className="flex items-center gap-2 text-green-600">Max Quality <Target size={18}/></span>
           </div>
           
           <input 
            type="range" 
            min="0" 
            max="100" 
            value={value} 
            onChange={(e) => onChange(parseInt(e.target.value))}
            className="w-full h-3 bg-slate-100 rounded-lg appearance-none cursor-pointer accent-blue-600 hover:accent-blue-700 ring-1 ring-slate-200"
           />
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <div className="p-5 bg-blue-50 rounded-xl border border-blue-100 text-center">
            <div className="text-xs text-blue-600 font-bold uppercase tracking-wider mb-2">Estimated Results</div>
            <div className="text-3xl font-extrabold text-slate-900">
              {estimates.visitorsMin} - {estimates.visitorsMax}
            </div>
            <div className="text-sm font-medium text-slate-500 mt-1">{config.unit}s / week</div>
          </div>
          
          <div className="p-5 bg-green-50 rounded-xl border border-green-100 text-center">
            <div className="text-xs text-green-600 font-bold uppercase tracking-wider mb-2">{config.efficiencyLabel}</div>
            <div className="text-3xl font-extrabold text-slate-900">
              ₹{estimates.cplMin} - ₹{estimates.cplMax}
            </div>
            <div className="text-sm font-medium text-slate-500 mt-1">approximate</div>
          </div>
        </div>
      </div>
    </div>
  );
};

const StepCompetitor = ({ strategy, onChange, campaign, updateCampaign }) => {
  const [addedChips, setAddedChips] = useState([]);
  
  const suggestions = campaign.aiInsights 
    ? { competitorTerms: campaign.aiInsights.competitorTerms, differentiateTerms: campaign.aiInsights.differentiateTerms } 
    : generateSuggestionsFromUrl(campaign.url, campaign.businessName, campaign.city, 'Neutral');

  const handleSelect = (newStrategy) => {
    let newKeywords = [...campaign.keywordThemes];
    newKeywords = newKeywords.filter(k => !addedChips.includes(k));

    let chipsToAdd = [];
    if (newStrategy === 'match') {
        chipsToAdd = suggestions.competitorTerms || [];
    } else if (newStrategy === 'differentiate') {
        chipsToAdd = suggestions.differentiateTerms || [];
    }

    const finalToAdd = chipsToAdd.filter(k => !newKeywords.includes(k));
    setAddedChips(finalToAdd);
    updateCampaign({ keywordThemes: [...newKeywords, ...finalToAdd] });
    onChange(newStrategy);
  };

  return (
    <div className="space-y-6 animate-fade-in">
       <div>
        <h2 className="text-2xl font-bold text-slate-900">Competitor Strategy</h2>
        <p className="text-slate-600">How do you want to position yourself in the market?</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Match Option */}
        <div 
          onClick={() => handleSelect('match')}
          className={`
            cursor-pointer p-6 rounded-xl border-2 transition-all relative
            ${strategy === 'match' ? 'border-blue-600 bg-blue-50 ring-1 ring-blue-600' : 'border-slate-200 bg-white hover:border-slate-300'}
          `}
        >
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-bold text-lg text-slate-900">Match Competitors</h3>
            <Copy size={20} className={strategy === 'match' ? 'text-blue-600' : 'text-slate-400'} />
          </div>
          <div className="flex flex-wrap gap-2 mb-4">
            {(suggestions.competitorTerms || []).slice(0,3).map((k, i) => (
                <span key={i} className="text-xs bg-white border border-slate-200 text-slate-500 px-2 py-1 rounded-full">{k}</span>
            ))}
          </div>
          <p className="text-sm text-slate-600 mb-2">Bid on terms your competitors use.</p>
          <div className="mt-auto pt-4 border-t border-slate-200/50">
             <Badge color="green">Safe Bet</Badge> <span className="text-xs text-slate-500 ml-2">Capture existing demand</span>
          </div>
          {strategy === 'match' && addedChips.length > 0 && (
              <div className="absolute -bottom-12 left-0 text-xs text-blue-700 bg-blue-100 px-3 py-1 rounded-full flex items-center animate-fade-in">
                 <Plus size={12} className="mr-1"/> Added {addedChips.length} terms to your keywords
              </div>
          )}
        </div>

        {/* Differentiate Option */}
        <div 
          onClick={() => handleSelect('differentiate')}
          className={`
            cursor-pointer p-6 rounded-xl border-2 transition-all relative
            ${strategy === 'differentiate' ? 'border-purple-600 bg-purple-50 ring-1 ring-purple-600' : 'border-slate-200 bg-white hover:border-slate-300'}
          `}
        >
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-bold text-lg text-slate-900">Differentiate</h3>
            <Shield size={20} className={strategy === 'differentiate' ? 'text-purple-600' : 'text-slate-400'} />
          </div>
          <div className="flex flex-wrap gap-2 mb-4">
            {(suggestions.differentiateTerms || []).slice(0,3).map((k, i) => (
                <span key={i} className="text-xs bg-white border border-slate-200 text-slate-500 px-2 py-1 rounded-full">{k}</span>
            ))}
          </div>
          <p className="text-sm text-slate-600 mb-2">Target niche terms others miss.</p>
          <div className="mt-auto pt-4 border-t border-slate-200/50">
             <Badge color="purple">High Reward</Badge> <span className="text-xs text-slate-500 ml-2">Less competition</span>
          </div>
           {strategy === 'differentiate' && addedChips.length > 0 && (
              <div className="absolute -bottom-12 left-0 text-xs text-purple-700 bg-purple-100 px-3 py-1 rounded-full flex items-center animate-fade-in">
                 <Plus size={12} className="mr-1"/> Added {addedChips.length} terms to your keywords
              </div>
          )}
        </div>
      </div>
      
      <div className="flex items-center justify-center gap-2 mt-16 text-xs text-slate-400">
         <AlertCircle size={12} /> Based on aggregated market patterns, not specific competitor tracking.
      </div>
    </div>
  );
};

const StepReview = ({ campaign, onEditStep, confirmed, setConfirmed, updateCampaign }) => {
  const objective = OBJECTIVES.find(o => o.id === campaign.objective);
  const objConfig = OBJECTIVES_CONFIG[campaign.objective] || OBJECTIVES_CONFIG['website_visits'];
  const [newNegKeyword, setNewNegKeyword] = useState('');

  useEffect(() => {
    if (campaign.negativeKeywords === undefined) {
      const defaults = ["free", "cheap", "diy", "jobs", "hiring"];
      if (campaign.objective === 'online_sales') defaults.push("repair", "used", "refurbished");
      if (campaign.objective === 'get_calls') defaults.push("address", "customer care number");
      updateCampaign({ negativeKeywords: defaults });
    }
  }, [campaign.objective, campaign.negativeKeywords, updateCampaign]);

  const addNegativeKeyword = (e) => {
    if (e.key === 'Enter' && newNegKeyword.trim()) {
        const current = campaign.negativeKeywords || [];
        updateCampaign({ negativeKeywords: [...current, newNegKeyword.trim()] });
        setNewNegKeyword('');
    }
  };

  const removeNegativeKeyword = (idx) => {
    const current = campaign.negativeKeywords || [];
    const updated = [...current];
    updated.splice(idx, 1);
    updateCampaign({ negativeKeywords: updated });
  };

  const ReviewSection = ({ title, step, children }) => (
    <div className="p-5 hover:bg-slate-50 transition-colors group">
        <div className="flex justify-between items-center mb-3">
            <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wide">{title}</h3>
            <button 
                onClick={() => onEditStep(step)}
                className="text-sm text-blue-600 font-medium opacity-0 group-hover:opacity-100 hover:underline transition-opacity flex items-center"
            >
                Edit <Edit2 size={12} className="ml-1"/>
            </button>
        </div>
        {children}
    </div>
  );

  return (
    <div className="space-y-6 animate-fade-in">
       <div>
        <h2 className="text-2xl font-bold text-slate-900">Review & Launch</h2>
        <p className="text-slate-600">Double check everything before we go live.</p>
      </div>

      <div className="bg-white rounded-xl border border-slate-200 shadow-sm divide-y divide-slate-100 overflow-hidden">
        
        <ReviewSection title="Objective & Destination" step={1}>
            <div className="flex items-start gap-4">
                <div className="p-2 bg-blue-100 text-blue-600 rounded-lg">
                    {objective?.icon && React.createElement(icons[objective.icon] || Globe, {size: 20})}
                </div>
                <div className="flex-1">
                    <div className="font-semibold text-slate-900">{objective?.label}</div>
                    <div className="text-sm text-slate-500 mt-1 flex items-center gap-1">
                        <ExternalLink size={12}/> {campaign.url}
                    </div>
                    {/* Location Summary */}
                    <div className="mt-2 flex items-center gap-2 text-xs text-slate-600 bg-slate-50 px-2 py-1 rounded w-fit">
                        <MapPin size={12} />
                        <span>{campaign.city || 'Anywhere'}</span>
                    </div>
                </div>
            </div>
        </ReviewSection>

        {/* Step 3 */}
        <ReviewSection title="Ad Creative" step={3}>
            <div className="bg-slate-50 p-4 rounded-lg border border-slate-200 mb-3">
                <div className="text-blue-700 font-medium text-sm mb-1">{campaign.adCopies[0]?.headline}</div>
                <div className="text-slate-600 text-sm">{campaign.adCopies[0]?.description}</div>
            </div>
            <div className="flex flex-wrap gap-2">
                {campaign.keywordThemes.slice(0, 5).map((k, i) => (
                    <span key={i} className="text-xs bg-slate-100 px-2 py-1 rounded text-slate-600 border border-slate-200">{k}</span>
                ))}
                {campaign.keywordThemes.length > 5 && <span className="text-xs text-slate-400 px-2 py-1">+{campaign.keywordThemes.length - 5} more</span>}
            </div>
        </ReviewSection>

        {/* Step 4 & 5 */}
        <ReviewSection title="Strategy & Estimates" step={4}>
            <div className="grid grid-cols-2 gap-4">
                <div>
                    <div className="text-xs text-slate-400 mb-1">Strategy</div>
                    <Badge color={campaign.strategy === 'match' ? 'green' : 'purple'}>
                        {campaign.strategy === 'match' ? 'Match Competitors' : 'Differentiate'}
                    </Badge>
                </div>
                <div>
                     <div className="text-xs text-slate-400 mb-1">Results</div>
                     <span className="text-sm font-semibold text-slate-900">{campaign.estimates.visitorsMin} - {campaign.estimates.visitorsMax} {objConfig.unit}s/wk</span>
                </div>
            </div>
        </ReviewSection>

        {/* Budget Protection */}
        <div className="p-5 hover:bg-slate-50 transition-colors group">
            <div className="flex justify-between items-center mb-3">
                <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wide flex items-center gap-2">
                    <Ban size={14} className="text-rose-500"/> Budget Protection
                </h3>
            </div>
            <p className="text-sm text-slate-500 mb-3">We automatically block search terms that waste your money.</p>
            <div className="flex flex-wrap gap-2">
                {(campaign.negativeKeywords || []).map((k, i) => (
                    <span key={i} className="inline-flex items-center px-2.5 py-1 rounded-md bg-rose-50 text-rose-700 border border-rose-100 text-xs font-medium group/chip">
                        <span className="mr-1 opacity-50 select-none">no</span> {k}
                        <button onClick={() => removeNegativeKeyword(i)} className="ml-1.5 text-rose-400 hover:text-rose-600 opacity-0 group-hover/chip:opacity-100 transition-opacity"><X size={12}/></button>
                    </span>
                ))}
                <input 
                    type="text"
                    placeholder="+ Block term"
                    className="inline-flex items-center px-2.5 py-1 rounded-md border border-dashed border-slate-300 text-xs focus:outline-none focus:border-rose-400 w-24 bg-transparent placeholder-slate-400"
                    value={newNegKeyword}
                    onChange={(e) => setNewNegKeyword(e.target.value)}
                    onKeyDown={addNegativeKeyword}
                />
            </div>
        </div>
      </div>

      <div className="flex items-center gap-3 p-4 bg-blue-50 border border-blue-100 rounded-lg">
         <input 
            type="checkbox" 
            id="confirm" 
            className="w-5 h-5 text-blue-600 rounded focus:ring-blue-500 border-slate-300"
            checked={confirmed}
            onChange={(e) => setConfirmed(e.target.checked)}
         />
         <label htmlFor="confirm" className="text-sm text-slate-700 select-none cursor-pointer font-medium">
             I have reviewed the campaign details and am ready to launch.
         </label>
      </div>
    </div>
  );
};

// ==========================================
// PAGES
// ==========================================

const LandingPage = () => {
  const navigate = useNavigate();

  return (
    <div className="flex flex-col items-center justify-center min-h-[calc(100vh-64px)] bg-gradient-to-b from-blue-50 to-white">
      <Container className="text-center py-20">
        <h1 className="text-4xl md:text-6xl font-extrabold text-slate-900 tracking-tight mb-6">
          Ad Campaigns made <span className="text-blue-600">Simple</span>.
        </h1>
        <p className="text-lg md:text-xl text-slate-600 mb-10 max-w-2xl mx-auto">
          Create a professional ad campaign in 3 minutes. No marketing jargon, no complex settings. Just enter your URL and goal.
        </p>
        
        <div className="flex justify-center gap-4 mb-16">
          <Button size="lg" onClick={() => navigate('/builder')} className="shadow-lg shadow-blue-200">
            Start Campaign <Rocket className="ml-2 w-5 h-5"/>
          </Button>
          <Button size="lg" variant="outline" onClick={() => navigate('/dashboard')}>
            View Dashboard
          </Button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 text-left">
          <div className="p-6 bg-white rounded-xl shadow-sm border border-slate-100">
            <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center text-blue-600 mb-4">
              <Zap size={20} />
            </div>
            <h3 className="font-bold text-slate-900 mb-2">AI-Powered Setup</h3>
            <p className="text-slate-600 text-sm">We scan your website to generate keywords and ad copy automatically.</p>
          </div>
          <div className="p-6 bg-white rounded-xl shadow-sm border border-slate-100">
            <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center text-green-600 mb-4">
              <Target size={20} />
            </div>
            <h3 className="font-bold text-slate-900 mb-2">Objective First</h3>
            <p className="text-slate-600 text-sm">Focus on business goals like Sales or Calls, not CPCs or CPMs.</p>
          </div>
          <div className="p-6 bg-white rounded-xl shadow-sm border border-slate-100">
            <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center text-purple-600 mb-4">
              <BarChart size={20} />
            </div>
            <h3 className="font-bold text-slate-900 mb-2">Smart Estimates</h3>
            <p className="text-slate-600 text-sm">See real-time estimates for traffic and cost before you spend a dime.</p>
          </div>
        </div>
      </Container>
    </div>
  );
};

const WizardProgress = ({ currentStep, steps }) => {
    return (
        <div className="mb-8 overflow-x-auto pb-2">
            <div className="flex items-center min-w-[600px] md:min-w-0">
                {steps.map((label, index) => {
                    const stepNum = index + 1;
                    const isCompleted = stepNum < currentStep;
                    const isCurrent = stepNum === currentStep;
                    
                    return (
                        <div key={label} className="flex-1 flex items-center relative">
                            <div className="flex flex-col items-center relative z-10 w-full">
                                <div className={`
                                    w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm transition-all duration-300
                                    ${isCompleted ? 'bg-green-500 text-white' : isCurrent ? 'bg-blue-600 text-white shadow-lg shadow-blue-200' : 'bg-slate-200 text-slate-500'}
                                `}>
                                    {isCompleted ? <Check size={16}/> : stepNum}
                                </div>
                                <span className={`text-xs font-medium mt-2 uppercase tracking-wide ${isCurrent ? 'text-blue-700' : 'text-slate-400'}`}>
                                    {label}
                                </span>
                            </div>
                            {stepNum < steps.length && (
                                <div className={`absolute top-4 left-1/2 w-full h-[2px] -z-0 ${stepNum < currentStep ? 'bg-green-500' : 'bg-slate-200'}`} />
                            )}
                        </div>
                    );
                })}
            </div>
        </div>
    );
};

const BuilderPage = () => {
  const navigate = useNavigate();
  const [currentStep, setCurrentStep] = useState(1);
  const [reviewConfirmed, setReviewConfirmed] = useState(false);
  const [campaign, setCampaign] = useState({ 
    ...INITIAL_CAMPAIGN_STATE, 
    id: crypto.randomUUID(),
    createdAt: new Date().toISOString() 
  });

  const STEPS = ["Goal", "Website", "AI Draft", "Outcomes", "Competitors", "Review"];

  const updateCampaign = (updates) => {
    setCampaign(prev => ({ ...prev, ...updates }));
  };

  useEffect(() => {
      const estimates = calculateEstimates(campaign.goalSlider, campaign.objective);
      updateCampaign({ estimates });
  }, [campaign.goalSlider, campaign.objective]);

  const handleNext = () => {
    if (currentStep < STEPS.length) {
      setCurrentStep(curr => curr + 1);
      window.scrollTo(0,0);
    } else {
      const finalCampaign = { ...campaign, status: 'Live' };
      saveCampaign(finalCampaign);
      toast.success('Campaign launched successfully!');
      navigate('/dashboard');
    }
  };

  const handleBack = () => {
    if (currentStep > 1) setCurrentStep(curr => curr - 1);
    else navigate('/');
  };

  const isStepValid = () => {
    switch (currentStep) {
      case 1: return !!campaign.objective;
      case 2: return !!campaign.url && campaign.url.includes('.');
      case 3: return campaign.keywordThemes.length > 0;
      case 4: return true; 
      case 5: return campaign.strategy !== 'none';
      case 6: return reviewConfirmed;
      default: return false;
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 py-10 pb-32 relative">
      <Container>
        <div className="flex items-center justify-between mb-8">
          <button onClick={handleBack} className="text-slate-500 hover:text-slate-900 flex items-center text-sm font-medium">
             <ArrowLeft size={16} className="mr-1"/> Back
          </button>
        </div>

        <WizardProgress currentStep={currentStep} steps={STEPS} />

        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6 md:p-10 min-h-[500px] transition-all duration-300">
          {currentStep === 1 && (
            <StepObjective value={campaign.objective} onChange={(val) => updateCampaign({ objective: val })} />
          )}
          {currentStep === 2 && (
            <StepUrl 
              url={campaign.url} setUrl={(val) => updateCampaign({ url: val })}
              name={campaign.businessName || ''} setName={(val) => updateCampaign({ businessName: val })}
              city={campaign.city || ''} setCity={(val) => updateCampaign({ city: val })}
              campaign={campaign} updateCampaign={updateCampaign}
            />
          )}
          {currentStep === 3 && (
            <StepAutoSetup campaign={campaign} updateCampaign={updateCampaign} />
          )}
          {currentStep === 4 && (
            <StepGoalSlider 
              value={campaign.goalSlider} 
              onChange={(val) => updateCampaign({ goalSlider: val })} 
              estimates={campaign.estimates}
              objective={campaign.objective}
            />
          )}
          {currentStep === 5 && (
            <StepCompetitor 
              strategy={campaign.strategy} 
              onChange={(val) => updateCampaign({ strategy: val })} 
              campaign={campaign}
              updateCampaign={updateCampaign}
            />
          )}
          {currentStep === 6 && (
            <StepReview 
              campaign={campaign} 
              onEditStep={(step) => setCurrentStep(step)}
              confirmed={reviewConfirmed}
              setConfirmed={setReviewConfirmed}
              updateCampaign={updateCampaign}
            />
          )}
        </div>
      </Container>

      <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-slate-200 p-4 z-40 shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.05)]">
        <Container className="flex justify-between items-center">
           <div className="hidden sm:block text-slate-500 text-sm">
             {currentStep === STEPS.length ? 'Ready to launch?' : 'Draft saved automatically'}
           </div>
           <div className="flex gap-4 ml-auto">
             <Button variant="ghost" onClick={handleBack}>
               {currentStep === 1 ? 'Cancel' : 'Back'}
             </Button>
             <Button 
               onClick={handleNext} 
               disabled={!isStepValid()} 
               className="w-32"
             >
               {currentStep === STEPS.length ? 'Launch' : 'Next'}
               {currentStep === STEPS.length ? <RocketIcon /> : <ArrowRight size={16} className="ml-2"/>}
             </Button>
           </div>
        </Container>
      </div>
    </div>
  );
};

const RocketIcon = () => <svg className="ml-2 w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M4.5 16.5c-1.5 1.26-2 5-2 5s3.74-.5 5-2c.71-.84.7-2.13-.09-2.91a2.18 2.18 0 0 0-2.91-.09z"></path><path d="M12 15l-3-3a22 22 0 0 1 2-3.95A12.88 12.88 0 0 1 22 2c0 2.72-.78 7.5-6 11a22.35 22.35 0 0 1-4 2z"></path><path d="M9 12H4s.55-3.03 2-4c1.62-1.08 5 0 5 0"></path><path d="M12 15v5s3.03-.55 4-2c1.08-1.62 0-5 0-5"></path></svg>;

// --- Dashboard Helpers ---
const TrackingFixModal = ({ isOpen, onClose, onVerify }) => {
  const [step, setStep] = useState(1);
  const [isVerifying, setIsVerifying] = useState(false);

  if (!isOpen) return null;

  const handleVerify = () => {
    setIsVerifying(true);
    setTimeout(() => {
      setIsVerifying(false);
      onVerify();
      setStep(1);
    }, 1500);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm animate-fade-in">
      <div className="bg-white rounded-xl shadow-2xl max-w-md w-full m-4 overflow-hidden">
        <div className="flex justify-between items-center p-4 border-b border-slate-100">
          <h3 className="font-bold text-lg text-slate-900">Fix Tracking Pixel</h3>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600"><X size={20} /></button>
        </div>
        
        <div className="p-6">
          {step === 1 && (
            <div className="space-y-4 animate-fade-in">
              <p className="text-sm text-slate-600">What do you want to track on your website?</p>
              <div className="space-y-2">
                {['Page Views (Visitors)', 'Lead Form Submissions', 'Purchase / Checkout'].map((opt) => (
                  <label key={opt} className="flex items-center gap-3 p-3 border border-slate-200 rounded-lg hover:bg-slate-50 cursor-pointer">
                    <input type="radio" name="track_type" className="w-4 h-4 text-blue-600" defaultChecked={opt.includes('Page')} />
                    <span className="text-sm font-medium text-slate-900">{opt}</span>
                  </label>
                ))}
              </div>
              <Button className="w-full mt-4" onClick={() => setStep(2)}>Next: Get Code</Button>
            </div>
          )}

          {step === 2 && (
            <div className="space-y-4 animate-fade-in">
              <div className="p-3 bg-blue-50 text-blue-800 text-sm rounded-lg flex items-start gap-2">
                <Info size={16} className="mt-0.5 flex-shrink-0"/>
                Paste this into the <code>&lt;head&gt;</code> of your website.
              </div>
              <div className="relative group">
                <pre className="bg-slate-900 text-slate-300 p-4 rounded-lg text-xs font-mono overflow-x-auto">
{`<script>
  window.adbuilder = window.adbuilder || [];
  function gtag(){adbuilder.push(arguments);}
  gtag('js', new Date());
  gtag('config', 'AW-${Math.floor(Math.random()*100000000)}');
</script>`}
                </pre>
                <button 
                    onClick={() => toast.success("Code copied to clipboard")}
                    className="absolute top-2 right-2 p-1.5 bg-white/10 text-white rounded hover:bg-white/20"
                >
                    <Copy size={14} />
                </button>
              </div>
              <div className="flex gap-3 mt-4">
                  <Button variant="outline" onClick={() => setStep(1)}>Back</Button>
                  <Button className="flex-1" onClick={handleVerify} isLoading={isVerifying}>
                    {isVerifying ? 'Verifying...' : 'Verify Installation'}
                  </Button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

const HealthCheckStrip = ({ trackingStatus, onTrackingClick }) => {
  const items = [
    { 
        label: 'Tracking', 
        status: trackingStatus, 
        color: trackingStatus === 'Active' ? 'text-green-700 bg-green-50 border-green-200' : 'text-amber-700 bg-amber-50 border-amber-200', 
        icon: trackingStatus === 'Active' ? CheckCircle : AlertTriangle, 
        onClick: trackingStatus === 'Active' ? undefined : onTrackingClick,
        clickable: trackingStatus !== 'Active'
    },
    { label: 'Landing Page', status: 'Active', color: 'text-green-700 bg-green-50 border-green-200', icon: CheckCircle },
    { label: 'Audience Size', status: 'Good', color: 'text-green-700 bg-green-50 border-green-200', icon: CheckCircle },
    { label: 'Policy Risk', status: 'Low', color: 'text-green-700 bg-green-50 border-green-200', icon: ShieldCheck },
  ];

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-2">
      {items.map((item, i) => (
        <div 
            key={i} 
            onClick={item.onClick}
            className={`flex items-center gap-3 p-3 rounded-lg border text-sm font-medium transition-all ${item.color} ${item.clickable ? 'cursor-pointer hover:brightness-95 hover:shadow-sm' : 'cursor-default'}`}
        >
          <item.icon size={18} />
          <div className="flex flex-col leading-tight">
             <span className="font-bold text-xs uppercase opacity-80">{item.label}</span>
             <span className="font-bold">{item.status}</span>
          </div>
        </div>
      ))}
    </div>
  );
};

const LiveCampaignPanel = ({ campaign }) => {
  const [metrics, setMetrics] = useState({
    impressions: 0,
    clicks: 0,
    spend: 0, 
    results: 0
  });
  const [isActive, setIsActive] = useState(true);
  const [recoLoading, setRecoLoading] = useState(false);
  const [trackingStatus, setTrackingStatus] = useState('Action Needed');
  const [timeline, setTimeline] = useState([]);
  const [showTrackingModal, setShowTrackingModal] = useState(false);
  const [showWhy, setShowWhy] = useState(false);

  const [sessionAdCopies, setSessionAdCopies] = useState([]);
  const [sessionKeywords, setSessionKeywords] = useState([]);

  const intervalRef = useRef(null);
  const timeoutRef = useRef(null);

  const resultLabelMap = {
      'website_visits': 'Visitors',
      'online_sales': 'Orders',
      'get_calls': 'Calls',
      'whatsapp_leads': 'Chats',
      'store_visits': 'Store Visits'
  };
  const resultLabel = resultLabelMap[campaign.objective] || 'Results';
  
  const getConversionRate = (obj) => {
      switch(obj) {
          case 'online_sales': return 0.03; 
          case 'get_calls': return 0.10; 
          case 'whatsapp_leads': return 0.12; 
          case 'store_visits': return 0.06; 
          case 'website_visits': default: return 0.70; 
      }
  };

  const addTimelineEvent = (message, type = 'system') => {
      setTimeline(prev => [{
          id: Math.random().toString(36).substr(2, 9),
          time: 'Just now',
          message,
          type
      }, ...prev].slice(0, 8));
  };

  useEffect(() => {
    setSessionAdCopies([...campaign.adCopies]);
    setSessionKeywords([...campaign.keywordThemes]);
    setTrackingStatus('Action Needed');
    setTimeline([
        { id: 'init', time: 'Just now', message: 'Campaign simulation initialized.', type: 'system' }
    ]);
    setShowWhy(false);

    const conversionRate = getConversionRate(campaign.objective);
    
    setMetrics({
      impressions: 1200 + Math.floor(Math.random() * 500),
      clicks: 45 + Math.floor(Math.random() * 15),
      spend: 525,
      results: Math.floor((45 + Math.floor(Math.random() * 15)) * conversionRate)
    });
    setIsActive(true);

    intervalRef.current = setInterval(() => {
      setMetrics(prev => {
        const addImp = Math.floor(Math.random() * 25) + 5;
        const addClick = Math.random() > 0.6 ? 1 : 0; 
        const addSpend = addClick * (15 + Math.random() * 5); 
        const addResult = (addClick && Math.random() < conversionRate) ? 1 : 0;
        
        return {
          impressions: prev.impressions + addImp,
          clicks: prev.clicks + addClick,
          spend: prev.spend + addSpend,
          results: prev.results + addResult
        };
      });

      if (Math.random() > 0.92) {
          const events = [
              "Bid strategy updated automatically.",
              "Audience segment verified.",
              "Budget pacing optimal.",
              "System check passed.",
              "New impression opportunity found."
          ];
          addTimelineEvent(events[Math.floor(Math.random() * events.length)], 'system');
      }

    }, 1500);

    timeoutRef.current = setTimeout(() => {
        clearInterval(intervalRef.current);
        setIsActive(false);
        addTimelineEvent("Simulation paused. Session limit reached.", 'alert');
    }, 45000);

    return () => {
        clearInterval(intervalRef.current);
        clearTimeout(timeoutRef.current);
    };
  }, [campaign.id, campaign.objective]);

  const ctr = metrics.impressions > 0 ? ((metrics.clicks / metrics.impressions) * 100).toFixed(2) : '0.00';
  const cpc = metrics.clicks > 0 ? (metrics.spend / metrics.clicks).toFixed(1) : '0.0';
  const cpa = metrics.results > 0 ? (metrics.spend / metrics.results).toFixed(1) : '0.0';

  let recoTitle = "Optimization Opportunity";
  let recoText = "Spending is stable. Consider expanding your reach to find new customers.";
  let recoWhy = "Your metrics are healthy, but volume could be higher.";
  let recoActions = [];

  if (trackingStatus === 'Action Needed') {
      recoTitle = "Critical Issue Detected";
      recoText = "We aren't tracking results yet. Fix this to measure success.";
      recoWhy = "Without a pixel, we cannot count simulated conversions.";
      recoActions.push({ 
          label: "Fix tracking", 
          action: () => setShowTrackingModal(true), 
          icon: AlertTriangle 
      });
  } else if (metrics.impressions > 1500 && metrics.clicks < 30) {
      recoTitle = "Ad Fatigue Risk";
      recoText = "Impressions are high but clicks are low. Your ad might be stale.";
      recoWhy = "Low CTR (Click-Through-Rate) increases costs. Fresh copy usually helps.";
      recoActions.push({ label: "Generate new headlines", action: handleGenerateHeadlines, icon: RefreshCw });
  } else if (metrics.clicks > 60 && metrics.results < 4) {
      recoTitle = "Low Conversion Rate";
      recoText = "People are clicking but not converting. Refine your intent.";
      recoWhy = "Broad keywords bring low-intent traffic. Differentiating helps filter them.";
      recoActions.push({ label: "Differentiate keywords", action: handleDifferentiate, icon: Zap });
  } else if (metrics.spend > 1500 && parseFloat(cpc) > 25) {
      recoTitle = "Rising Costs";
      recoText = "Cost per click is higher than average.";
      recoWhy = "Competition is high. Targeting competitor terms specifically can sometimes lower costs.";
      recoActions.push({ label: "Apply competitor match", action: handleCompetitorMatch, icon: Copy });
  } else {
      recoTitle = "Scale Up";
      recoText = "Performance is stable. Good time to grow.";
      recoWhy = "CPA and CPC are within targets. Expanding radius captures more volume.";
      recoActions.push({ label: "Expand reach (+2km)", action: handleExpandReach, icon: MapPin });
  }

  async function handleGenerateHeadlines() {
      setRecoLoading(true);
      addTimelineEvent("Analyzing landing page for new hooks...", 'system');
      
      try {
        let newAds = [];
        try {
            const res = await generateRealCampaignSuggestions(campaign.url, campaign.objective, 'Urgent');
            newAds = res.adCopies;
        } catch {
            const m = generateSuggestionsFromUrl(campaign.url, campaign.businessName, campaign.city, 'Urgent');
            newAds = m.adCopies;
        }

        await new Promise(r => setTimeout(r, 1500));
        
        const combined = [...newAds, ...sessionAdCopies].slice(0, 3);
        setSessionAdCopies(combined);
        
        toast.success("New headlines generated");
        addTimelineEvent("Generated 3 new high-intent headline variants.", 'action');

      } catch (e) {
          toast.error("Failed to generate headlines");
      } finally {
          setRecoLoading(false);
      }
  }

  async function handleCompetitorMatch() {
      setRecoLoading(true);
      await new Promise(r => setTimeout(r, 1000));
      const terms = campaign.aiInsights?.competitorTerms || ['competitor A', 'competitor B', 'market leader'];
      const newKws = Array.from(new Set([...sessionKeywords, ...terms]));
      setSessionKeywords(newKws);
      toast.success("Competitor terms added");
      addTimelineEvent(`Added ${terms.length} competitor keywords to strategy.`, 'action');
      setRecoLoading(false);
  }

  async function handleDifferentiate() {
      setRecoLoading(true);
      await new Promise(r => setTimeout(r, 1000));
      const terms = campaign.aiInsights?.differentiateTerms || ['premium service', 'exclusive offer', 'niche specialist'];
      const newKws = Array.from(new Set([...sessionKeywords, ...terms]));
      setSessionKeywords(newKws);
      toast.success("Niche terms added");
      addTimelineEvent(`Added ${terms.length} differentiation keywords.`, 'action');
      setRecoLoading(false);
  }

  async function handleExpandReach() {
      setRecoLoading(true);
      await new Promise(r => setTimeout(r, 800));
      toast.success("Radius expanded");
      addTimelineEvent("Targeting radius increased by +2km (Simulated).", 'action');
      setRecoLoading(false);
  }

  function handleVerifyTracking() {
      setTrackingStatus('Active');
      setShowTrackingModal(false);
      toast.success("Tracking verified");
      addTimelineEvent("Pixel installation verified successfully.", 'alert');
  }

  const ResultIcon = 
    campaign.objective === 'online_sales' ? ShoppingCart :
    campaign.objective === 'get_calls' ? Smartphone :
    campaign.objective === 'whatsapp_leads' ? MessageCircle :
    campaign.objective === 'store_visits' ? MapPin :
    Globe; 

  return (
    <div className="animate-fade-in">
        <HealthCheckStrip trackingStatus={trackingStatus} onTrackingClick={() => setShowTrackingModal(true)} />

        <div className="bg-white rounded-xl border border-blue-100 shadow-sm overflow-hidden mb-6">
            <div className="bg-blue-50/50 px-4 py-3 border-b border-blue-100 flex justify-between items-center">
                <div className="flex items-center gap-2">
                    <span className="relative flex h-2.5 w-2.5">
                        {isActive && <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>}
                        <span className={`relative inline-flex rounded-full h-2.5 w-2.5 ${isActive ? 'bg-green-500' : 'bg-slate-400'}`}></span>
                    </span>
                    <span className="text-sm font-bold text-blue-900 uppercase tracking-wide">Live Performance</span>
                </div>
                <div className="group relative flex items-center cursor-help">
                    <Info size={14} className="text-blue-400 hover:text-blue-600" />
                    <div className="absolute right-0 bottom-6 w-64 p-2 bg-slate-800 text-white text-xs rounded shadow-lg opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-10">
                        Simulated projection based on your target audience.
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 divide-x divide-y md:divide-y-0 divide-slate-100">
                <div className="p-4 text-center">
                    <div className="flex items-center justify-center gap-1 text-[10px] text-slate-500 mb-1 uppercase tracking-wide">
                        <Eye size={10}/> Impressions
                    </div>
                    <div className="text-2xl font-bold text-slate-900 tabular-nums">
                        {metrics.impressions.toLocaleString()}
                    </div>
                    <div className="text-[10px] text-slate-400 mt-1">
                        CTR: <span className="text-slate-600 font-medium">{ctr}%</span>
                    </div>
                </div>
                <div className="p-4 text-center">
                    <div className="flex items-center justify-center gap-1 text-[10px] text-slate-500 mb-1 uppercase tracking-wide">
                        <MousePointer2 size={10}/> Clicks
                    </div>
                    <div className="text-2xl font-bold text-slate-900 tabular-nums">
                        {metrics.clicks.toLocaleString()}
                    </div>
                    <div className="text-[10px] text-slate-400 mt-1">
                        CPC: <span className="text-slate-600 font-medium">₹{cpc}</span>
                    </div>
                </div>
                <div className="p-4 text-center bg-blue-50/20">
                    <div className="flex items-center justify-center gap-1 text-[10px] text-blue-600 mb-1 uppercase tracking-wide font-bold">
                        <ResultIcon size={10}/> {resultLabel}
                    </div>
                    <div className="text-2xl font-bold text-blue-700 tabular-nums">
                        {metrics.results.toLocaleString()}
                    </div>
                    <div className="text-[10px] text-slate-400 mt-1">
                        Cost/{resultLabel.slice(0,3)}.: <span className="text-blue-700 font-medium">₹{cpa}</span>
                    </div>
                </div>
                <div className="p-4 text-center">
                    <div className="flex items-center justify-center gap-1 text-[10px] text-slate-500 mb-1 uppercase tracking-wide">
                        <DollarSign size={10}/> Spend
                    </div>
                    <div className="text-2xl font-bold text-slate-900 tabular-nums">
                        ₹{Math.floor(metrics.spend).toLocaleString()}
                    </div>
                </div>
            </div>

            <div className="p-5 border-t border-blue-100 bg-gradient-to-r from-white to-blue-50/30">
                <div className="flex flex-col sm:flex-row items-start gap-4">
                    <div className="p-2 bg-amber-100 text-amber-600 rounded-full mt-1 flex-shrink-0">
                        <TrendingUp size={20} />
                    </div>
                    <div className="flex-1 w-full">
                        <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wide mb-1">{recoTitle}</h4>
                        <p className="text-sm text-slate-800 font-medium mb-3 leading-relaxed">
                            {recoText}
                        </p>
                        
                        <div className="flex flex-wrap gap-2 mb-3">
                            {recoActions.map((act, idx) => (
                                <button 
                                    key={idx}
                                    onClick={act.action}
                                    disabled={recoLoading}
                                    className="text-xs flex items-center bg-blue-600 text-white px-3 py-1.5 rounded hover:bg-blue-700 transition-colors disabled:opacity-70 shadow-sm"
                                >
                                    {recoLoading ? <RefreshCw size={12} className="animate-spin mr-1"/> : <act.icon size={12} className="mr-1"/>}
                                    {act.label}
                                </button>
                            ))}
                        </div>
                        
                        <button 
                            onClick={() => setShowWhy(!showWhy)}
                            className="text-[10px] text-slate-400 hover:text-blue-600 flex items-center gap-1 transition-colors"
                        >
                            Why this? {showWhy ? <ChevronUp size={10}/> : <ChevronDown size={10}/>}
                        </button>
                        
                        {showWhy && (
                            <div className="mt-2 text-xs text-slate-600 bg-slate-50 p-2 rounded border border-slate-100">
                                {recoWhy}
                            </div>
                        )}
                    </div>
                </div>
            </div>
            
            <div className="border-t border-slate-100 bg-slate-50 p-4 max-h-[200px] overflow-y-auto">
                <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wide mb-3 flex items-center gap-1">
                    <Clock size={10}/> Recent Activity
                </div>
                <div className="space-y-3 pl-1">
                    {timeline.map((evt) => (
                        <div key={evt.id} className="flex gap-3 text-xs relative animate-fade-in-up">
                            <div className="absolute left-[5px] top-4 bottom-[-16px] w-[1px] bg-slate-200 last:hidden"></div>
                            
                            <div className={`
                                w-2.5 h-2.5 rounded-full flex-shrink-0 mt-1 ring-2 ring-white
                                ${evt.type === 'action' ? 'bg-blue-500' : evt.type === 'alert' ? 'bg-green-500' : 'bg-slate-300'}
                            `}></div>
                            <div className="flex-1">
                                <span className="text-slate-800 font-medium">{evt.message}</span>
                                <span className="text-slate-400 ml-2 text-[10px]">{evt.time}</span>
                            </div>
                        </div>
                    ))}
                    {timeline.length === 0 && <div className="text-xs text-slate-400 italic">No activity yet.</div>}
                </div>
            </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="bg-slate-50 p-5 rounded-xl border border-slate-200">
                <div className="text-xs uppercase font-semibold text-slate-500 mb-3 flex items-center gap-2">
                    <Search size={12}/> Top Keywords
                </div>
                <div className="flex flex-wrap gap-2">
                    {sessionKeywords.slice(0, 10).map((k, i) => (
                    <span key={i} className="text-xs bg-white border border-slate-200 px-2.5 py-1.5 rounded-full text-slate-700 shadow-sm">{k}</span>
                    ))}
                    {sessionKeywords.length > 10 && (
                        <span className="text-xs text-slate-400 px-2 py-1">+{sessionKeywords.length - 10} more</span>
                    )}
                </div>
            </div>

            <div className="bg-slate-50 p-5 rounded-xl border border-slate-200">
                <div className="text-xs uppercase font-semibold text-slate-500 mb-3 flex items-center gap-2">
                    <Eye size={12}/> Ad Preview (Currently Live)
                </div>
                {sessionAdCopies.slice(0, 1).map((copy, i) => (
                    <div key={i} className="border border-slate-200 rounded-lg p-4 bg-white hover:border-blue-300 transition-colors shadow-sm">
                        <div className="text-blue-700 font-medium text-base mb-1 truncate">{copy.headline}</div>
                        <div className="text-green-700 text-xs mb-1.5 font-semibold truncate flex items-center gap-1">
                            <span className="bg-green-600 text-white px-1 rounded text-[10px]">Ad</span> {campaign.snapshot?.domain || 'example.com'}
                        </div>
                        <div className="text-slate-600 text-sm line-clamp-3">{copy.description}</div>
                    </div>
                ))}
            </div>
            
            <div className="bg-slate-50 p-5 rounded-xl border border-slate-200 lg:col-span-2">
                <div className="text-xs uppercase font-semibold text-slate-500 mb-3 flex items-center gap-2">
                    <Zap size={12}/> Campaign Settings
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="flex items-center gap-3">
                         <div className="w-8 h-8 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center">
                             <MapPin size={16}/>
                         </div>
                         <div>
                             <div className="text-xs text-slate-500">Targeting</div>
                             <div className="text-sm font-medium text-slate-900">{campaign.city || 'Anywhere'}</div>
                         </div>
                    </div>
                </div>
            </div>
        </div>

        <TrackingFixModal 
            isOpen={showTrackingModal} 
            onClose={() => setShowTrackingModal(false)}
            onVerify={handleVerifyTracking} 
        />
    </div>
  );
};

// ==========================================
// APP ROOT
// ==========================================

const App = () => {
  return (
    <HashRouter>
      <div className="min-h-screen flex flex-col">
        <header className="bg-white border-b border-slate-200 sticky top-0 z-50">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
                <svg className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
              </div>
              <span className="font-bold text-xl tracking-tight text-slate-800">AdBuilder<span className="text-blue-600">.ai</span></span>
            </div>
          </div>
        </header>

        <main className="flex-grow">
          <Routes>
            <Route path="/" element={<LandingPage />} />
            <Route path="/builder" element={<BuilderPage />} />
            <Route path="/dashboard" element={<DashboardPage />} />
          </Routes>
        </main>
        
        <Toaster position="bottom-center" />
      </div>
    </HashRouter>
  );
};

// Render
const rootElement = document.getElementById('root');
const root = createRoot(rootElement);
root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
