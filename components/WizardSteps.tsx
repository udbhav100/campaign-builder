
import React, { useState, useEffect } from 'react';
import { Globe, ShoppingCart, Phone, MessageCircle, MapPin, X, Plus, AlertCircle, TrendingUp, Users, Target, Shield, Copy, Wand2, RefreshCw, Eye, Edit2, CheckCircle2, AlertTriangle, ExternalLink, Sparkles, Trash2, Ban } from 'lucide-react';
import toast from 'react-hot-toast';
import { Card, Button, Input, Badge } from './Common';
import { Campaign, OBJECTIVES, AdCopy, StrategyType, ToneType, OBJECTIVES_CONFIG } from '../types';
import { generateSuggestionsFromUrl } from '../utils';
import { generateRealCampaignSuggestions } from '../services/gemini';

// --- Step 1: Objective ---
export const StepObjective: React.FC<{ 
  value: string; 
  onChange: (val: string) => void; 
}> = ({ value, onChange }) => {
  const icons: Record<string, any> = { Globe, ShoppingCart, Phone, MessageCircle, MapPin };
  
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

// --- Step 2: URL ---
export const StepUrl: React.FC<{ 
  url: string; setUrl: (s: string) => void;
  name: string; setName: (s: string) => void;
  city: string; setCity: (s: string) => void;
  campaign: Campaign;
  updateCampaign: (u: Partial<Campaign>) => void;
}> = ({ url, setUrl, name, setName, city, setCity, campaign, updateCampaign }) => {
  const [error, setError] = useState('');
  
  // Debounce parsing to avoid flicker
  useEffect(() => {
    const timer = setTimeout(() => {
       if (url && url.includes('.')) {
          // Keep deterministic snapshot logic as it's just meta extraction
          const suggestions = generateSuggestionsFromUrl(url, name, city, 'Neutral');
          updateCampaign({ snapshot: suggestions.snapshot });
       }
    }, 800);
    return () => clearTimeout(timer);
  }, [url, name, city]);

  const handleChangeUrl = (val: string) => {
    setUrl(val);
    if (val && !val.includes('.')) setError('Please enter a valid URL (e.g. example.com)');
    else setError('');
  }

  return (
    <div className="space-y-8 animate-fade-in">
      <div>
        <h2 className="text-2xl font-bold text-slate-900">Where should people go?</h2>
        <p className="text-slate-600">Enter your business website and details.</p>
      </div>

      <div className="grid md:grid-cols-2 gap-8">
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
            placeholder="New York" 
            value={city}
            onChange={(e) => setCity(e.target.value)}
            />
        </div>

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
  );
};

// --- Step 3: Auto Setup ---
// Helper for Ad Strength Score
const calculateAdStrength = (headline: string, description: string, keywords: string[]) => {
  let score = 0;
  let tip = "Great job! Your ad is strong.";
  const lowerHead = headline.toLowerCase();
  const lowerDesc = description.toLowerCase();

  // 1. Length checks
  if (headline.length > 15) score += 20;
  
  if (description.length > 30) score += 30;

  // 2. Keyword match
  // Ensure we have active keywords to check against
  const activeKeywords = keywords.filter(k => k.length > 0);
  const hasKeyword = activeKeywords.some(k => lowerHead.includes(k.toLowerCase()));
  if (hasKeyword) {
      score += 30;
  } 

  // 3. Power words
  const powerWords = ["best", "#1", "sale", "now", "official", "expert", "free", "review", "top", "exclusive", "deal"];
  const hasPower = powerWords.some(w => lowerHead.includes(w) || lowerDesc.includes(w));
  if (hasPower) score += 20;

  // Determine Tip
  if (!hasKeyword && activeKeywords.length > 0) {
      tip = `Tip: Add the keyword '${activeKeywords[0]}' to your headline.`;
  } else if (headline.length <= 15) {
      tip = "Tip: Make your headline a bit longer for better visibility.";
  } else if (!hasPower) {
      tip = "Tip: Add a power word (e.g., Best, Sale, Expert) to grab attention.";
  } else if (description.length <= 30) {
      tip = "Tip: Elaborate in your description to persuade customers.";
  }

  return { score, tip };
};

export const StepAutoSetup: React.FC<{ 
  campaign: Campaign; 
  updateCampaign: (updates: Partial<Campaign>) => void; 
}> = ({ campaign, updateCampaign }) => {
  const [loading, setLoading] = useState(true);
  const [newKeyword, setNewKeyword] = useState('');
  const [editingAdIndex, setEditingAdIndex] = useState<number | null>(null);
  const [isAiGenerated, setIsAiGenerated] = useState(false);

  // Tones
  const tones: ToneType[] = ['Neutral', 'Premium', 'Affordable', 'Urgent', 'Friendly'];

  const regenerate = async (selectedTone: ToneType) => {
    setLoading(true);
    
    const useFallback = (reason?: string) => {
        const result = generateSuggestionsFromUrl(campaign.url, campaign.businessName, campaign.city, selectedTone);
        updateCampaign({
            adCopies: result.adCopies,
            tone: selectedTone,
            keywordThemes: result.keywords
        });
        setIsAiGenerated(false);
        // Toast for fallback
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
    } catch (e: any) {
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
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Safety valve: prevent indefinite loading
  useEffect(() => {
    let safetyTimer: any;
    if (loading) {
        // Increased to 35s to account for longer API timeouts
        safetyTimer = setTimeout(() => {
            setLoading(false);
            if (!campaign.adCopies.length) {
                // If we timed out and have nothing, force fallback
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

  const handleAddKeyword = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && newKeyword.trim()) {
        updateCampaign({ keywordThemes: [...campaign.keywordThemes, newKeyword.trim()] });
        setNewKeyword('');
        // Added visual feedback
        toast.success("Audience expanded.", { icon: '📈', duration: 2000, style: { fontSize: '12px' } });
    }
  };

  const removeKeyword = (idx: number) => {
    const newKws = [...campaign.keywordThemes];
    newKws.splice(idx, 1);
    updateCampaign({ keywordThemes: newKws });
    // Added visual feedback
    toast("Audience narrowed (Higher intent).", { icon: '🎯', duration: 2000, style: { fontSize: '12px' } });
  };

  const updateAdCopy = (idx: number, field: keyof AdCopy, val: string) => {
    const newCopies = [...campaign.adCopies];
    newCopies[idx] = { ...newCopies[idx], [field]: val };
    updateCampaign({ adCopies: newCopies });
  };

  const removeAdCopy = (idx: number, e: React.MouseEvent) => {
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
    const newAd: AdCopy = { 
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
        <p className="text-xs text-slate-400">This may take a few seconds...</p>
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

      {/* Tone Selector */}
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

      {/* Ad Copies (Variants) */}
      <section>
        <div className="mb-4">
            <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wide">Review Ad Variants (A/B Test)</h3>
            <p className="text-sm text-slate-500 mt-1">
                We generated {campaign.adCopies.length} options. Your campaign will automatically rotate these ads to find the best performer. 
                Delete any you don't like.
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
                  {/* Header Toggle */}
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
                          
                          {/* Real-time Ad Strength Meter */}
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
                          {/* Search Ad Preview */}
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
          
          {/* Add Variant Card */}
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

      {/* Keywords */}
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

// --- Step 4: Slider ---
export const StepGoalSlider: React.FC<{ 
  value: number; 
  onChange: (val: number) => void;
  estimates: any;
  objective: string;
}> = ({ value, onChange, estimates, objective }) => {
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

// --- Step 5: Competitor Decision ---
export const StepCompetitor: React.FC<{ 
  strategy: StrategyType;
  onChange: (s: StrategyType) => void;
  campaign: Campaign;
  updateCampaign: (u: Partial<Campaign>) => void;
}> = ({ strategy, onChange, campaign, updateCampaign }) => {
  const [addedChips, setAddedChips] = useState<string[]>([]);
  
  // Use AI insights if available, otherwise fallback to local scraper
  const suggestions = campaign.aiInsights 
    ? { competitorTerms: campaign.aiInsights.competitorTerms, differentiateTerms: campaign.aiInsights.differentiateTerms } 
    : generateSuggestionsFromUrl(campaign.url, campaign.businessName, campaign.city, 'Neutral');

  const handleSelect = (newStrategy: StrategyType) => {
    let newKeywords = [...campaign.keywordThemes];
    // Filter out previous added chips to avoid duplicates/mess
    newKeywords = newKeywords.filter(k => !addedChips.includes(k));

    let chipsToAdd: string[] = [];
    if (newStrategy === 'match') {
        chipsToAdd = suggestions.competitorTerms || [];
    } else if (newStrategy === 'differentiate') {
        chipsToAdd = suggestions.differentiateTerms || [];
    }

    // Add unique
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

// --- Step 6: Review ---
export const StepReview: React.FC<{ 
    campaign: Campaign; 
    onEditStep: (step: number) => void;
    confirmed: boolean;
    setConfirmed: (b: boolean) => void;
    updateCampaign: (u: Partial<Campaign>) => void;
}> = ({ campaign, onEditStep, confirmed, setConfirmed, updateCampaign }) => {
  const objective = OBJECTIVES.find(o => o.id === campaign.objective);
  const objConfig = OBJECTIVES_CONFIG[campaign.objective] || OBJECTIVES_CONFIG['website_visits'];
  const [newNegKeyword, setNewNegKeyword] = useState('');

  // Initialize Negative Keywords if not present
  useEffect(() => {
    if (campaign.negativeKeywords === undefined) {
      const defaults = ["free", "cheap", "diy", "jobs", "hiring"];
      if (campaign.objective === 'online_sales') defaults.push("repair", "used", "refurbished");
      if (campaign.objective === 'get_calls') defaults.push("address", "customer care number");
      updateCampaign({ negativeKeywords: defaults });
    }
  }, [campaign.objective, campaign.negativeKeywords, updateCampaign]);

  const addNegativeKeyword = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && newNegKeyword.trim()) {
        const current = campaign.negativeKeywords || [];
        updateCampaign({ negativeKeywords: [...current, newNegKeyword.trim()] });
        setNewNegKeyword('');
    }
  };

  const removeNegativeKeyword = (idx: number) => {
    const current = campaign.negativeKeywords || [];
    const updated = [...current];
    updated.splice(idx, 1);
    updateCampaign({ negativeKeywords: updated });
  };

  const ReviewSection: React.FC<{ title: string; step: number; children: React.ReactNode }> = ({ title, step, children }) => (
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
        
        {/* Step 1 & 2 combined roughly */}
        <ReviewSection title="Objective & Destination" step={1}>
            <div className="flex items-start gap-4">
                <div className="p-2 bg-blue-100 text-blue-600 rounded-lg">
                    {objective?.icon && React.createElement(objective.icon as any, {size: 20})}
                </div>
                <div>
                    <div className="font-semibold text-slate-900">{objective?.label}</div>
                    <div className="text-sm text-slate-500 mt-1 flex items-center gap-1">
                        <ExternalLink size={12}/> {campaign.url}
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

        {/* New Feature: Budget Protection */}
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
