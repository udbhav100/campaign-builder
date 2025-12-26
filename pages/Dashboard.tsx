
import React, { useEffect, useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, Search, ExternalLink, Activity, MousePointer2, DollarSign, Eye, Info, X, CheckCircle, AlertTriangle, TrendingUp, Copy, RefreshCw, Smartphone, ShoppingCart, MapPin, Globe, MessageCircle, Clock, ChevronDown, ChevronUp, ShieldCheck, Zap, Lightbulb } from 'lucide-react';
import toast from 'react-hot-toast';
import { Container, Button, Card, Badge } from '../components/Common';
import { getCampaigns, generateSuggestionsFromUrl } from '../utils';
import { Campaign, OBJECTIVES, OBJECTIVES_CONFIG, AdCopy } from '../types';
import { generateRealCampaignSuggestions } from '../services/gemini';

// --- Types ---
interface TimelineEvent {
  id: string;
  time: string;
  message: string;
  type: 'system' | 'action' | 'alert';
}

// --- Tracking Fix Modal ---
const TrackingFixModal: React.FC<{ isOpen: boolean; onClose: () => void; onVerify: () => void }> = ({ isOpen, onClose, onVerify }) => {
  const [step, setStep] = useState(1);
  const [isVerifying, setIsVerifying] = useState(false);

  if (!isOpen) return null;

  const handleVerify = () => {
    setIsVerifying(true);
    setTimeout(() => {
      setIsVerifying(false);
      onVerify();
      setStep(1); // Reset for next time
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

// --- Health Check Strip ---
const HealthCheckStrip: React.FC<{ trackingStatus: string; onTrackingClick: () => void }> = ({ trackingStatus, onTrackingClick }) => {
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

// --- Live Campaign Panel (Ticker + Recommendations + Timeline) ---
const LiveCampaignPanel: React.FC<{ campaign: Campaign }> = ({ campaign }) => {
  // Session State
  const [metrics, setMetrics] = useState({
    impressions: 0,
    clicks: 0,
    spend: 0, 
    results: 0
  });
  const [isActive, setIsActive] = useState(true);
  const [recoLoading, setRecoLoading] = useState(false);
  const [trackingStatus, setTrackingStatus] = useState<'Active'|'Action Needed'>('Action Needed');
  const [timeline, setTimeline] = useState<TimelineEvent[]>([]);
  const [showTrackingModal, setShowTrackingModal] = useState(false);
  const [showWhy, setShowWhy] = useState(false);

  // Session Edits (Overrides)
  const [sessionAdCopies, setSessionAdCopies] = useState<AdCopy[]>([]);
  const [sessionKeywords, setSessionKeywords] = useState<string[]>([]);

  // Simulation Refs
  const intervalRef = useRef<any>(null);
  const timeoutRef = useRef<any>(null);

  // Objective Config
  const resultLabelMap: Record<string, string> = {
      'website_visits': 'Visitors',
      'online_sales': 'Orders',
      'get_calls': 'Calls',
      'whatsapp_leads': 'Chats',
      'store_visits': 'Store Visits'
  };
  const resultLabel = resultLabelMap[campaign.objective] || 'Results';
  
  const getConversionRate = (obj: string) => {
      switch(obj) {
          case 'online_sales': return 0.03; 
          case 'get_calls': return 0.10; 
          case 'whatsapp_leads': return 0.12; 
          case 'store_visits': return 0.06; 
          case 'website_visits': default: return 0.70; 
      }
  };

  // --- Helpers ---
  const addTimelineEvent = (message: string, type: TimelineEvent['type'] = 'system') => {
      setTimeline(prev => [{
          id: Math.random().toString(36).substr(2, 9),
          time: 'Just now',
          message,
          type
      }, ...prev].slice(0, 8)); // Keep last 8
  };

  // --- Initialization & Simulation ---
  useEffect(() => {
    // Reset Session State on Campaign Change
    setSessionAdCopies([...campaign.adCopies]);
    setSessionKeywords([...campaign.keywordThemes]);
    setTrackingStatus('Action Needed');
    setTimeline([
        { id: 'init', time: 'Just now', message: 'Campaign simulation initialized.', type: 'system' }
    ]);
    setShowWhy(false);

    const conversionRate = getConversionRate(campaign.objective);
    
    // Initial Metrics
    setMetrics({
      impressions: 1200 + Math.floor(Math.random() * 500),
      clicks: 45 + Math.floor(Math.random() * 15),
      spend: 525,
      results: Math.floor((45 + Math.floor(Math.random() * 15)) * conversionRate)
    });
    setIsActive(true);

    // Simulation Loop
    intervalRef.current = setInterval(() => {
      setMetrics(prev => {
        // Random increment logic
        const addImp = Math.floor(Math.random() * 25) + 5;
        const addClick = Math.random() > 0.6 ? 1 : 0; // slower clicks
        const addSpend = addClick * (15 + Math.random() * 5); // ~20rs cpc
        const addResult = (addClick && Math.random() < conversionRate) ? 1 : 0;
        
        return {
          impressions: prev.impressions + addImp,
          clicks: prev.clicks + addClick,
          spend: prev.spend + addSpend,
          results: prev.results + addResult
        };
      });

      // Random Timeline Events
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

    // Stop after 45s
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


  // --- Derived Metrics ---
  const ctr = metrics.impressions > 0 ? ((metrics.clicks / metrics.impressions) * 100).toFixed(2) : '0.00';
  const cpc = metrics.clicks > 0 ? (metrics.spend / metrics.clicks).toFixed(1) : '0.0';
  const cpa = metrics.results > 0 ? (metrics.spend / metrics.results).toFixed(1) : '0.0';

  // --- Recommendation Logic ---
  let recoTitle = "Optimization Opportunity";
  let recoText = "Spending is stable. Consider expanding your reach to find new customers.";
  let recoWhy = "Your metrics are healthy, but volume could be higher.";
  let recoActions: { label: string; action: () => void; icon: any }[] = [];

  // Rules
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
      // Low CTR
      recoTitle = "Ad Fatigue Risk";
      recoText = "Impressions are high but clicks are low. Your ad might be stale.";
      recoWhy = "Low CTR (Click-Through-Rate) increases costs. Fresh copy usually helps.";
      recoActions.push({ label: "Generate new headlines", action: handleGenerateHeadlines, icon: RefreshCw });
  } else if (metrics.clicks > 60 && metrics.results < 4) {
      // Low CR
      recoTitle = "Low Conversion Rate";
      recoText = "People are clicking but not converting. Refine your intent.";
      recoWhy = "Broad keywords bring low-intent traffic. Differentiating helps filter them.";
      recoActions.push({ label: "Differentiate keywords", action: handleDifferentiate, icon: Zap });
  } else if (metrics.spend > 1500 && parseFloat(cpc) > 25) {
      // High Cost
      recoTitle = "Rising Costs";
      recoText = "Cost per click is higher than average.";
      recoWhy = "Competition is high. Targeting competitor terms specifically can sometimes lower costs.";
      recoActions.push({ label: "Apply competitor match", action: handleCompetitorMatch, icon: Copy });
  } else {
      // Default
      recoTitle = "Scale Up";
      recoText = "Performance is stable. Good time to grow.";
      recoWhy = "CPA and CPC are within targets. Expanding radius captures more volume.";
      recoActions.push({ label: "Expand reach (+2km)", action: handleExpandReach, icon: MapPin });
  }

  // --- Handlers ---

  async function handleGenerateHeadlines() {
      setRecoLoading(true);
      addTimelineEvent("Analyzing landing page for new hooks...", 'system');
      
      try {
        // Use service or fallback to mock
        let newAds: AdCopy[] = [];
        try {
            const res = await generateRealCampaignSuggestions(campaign.url, campaign.objective, 'Urgent');
            newAds = res.adCopies;
        } catch {
            // Mock fallback
            const m = generateSuggestionsFromUrl(campaign.url, campaign.businessName, campaign.city, 'Urgent');
            newAds = m.adCopies;
        }

        // Simulate network delay
        await new Promise(r => setTimeout(r, 1500));
        
        // Merge unique headlines (keep 3 max)
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
    Globe; // Default

  // --- Render ---
  return (
    <div className="animate-fade-in">
        <HealthCheckStrip trackingStatus={trackingStatus} onTrackingClick={() => setShowTrackingModal(true)} />

        <div className="bg-white rounded-xl border border-blue-100 shadow-sm overflow-hidden mb-6">
            {/* Header */}
            <div className="bg-blue-50/50 px-4 py-3 border-b border-blue-100 flex justify-between items-center">
                <div className="flex items-center gap-2">
                    <span className="relative flex h-2.5 w-2.5">
                        {isActive && <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>}
                        <span className="relative inline-flex rounded-full h-2.5 w-2.5 ${isActive ? 'bg-green-500' : 'bg-slate-400'}"></span>
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

            {/* KPI Grid */}
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

            {/* Recommendation Engine */}
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
            
            {/* Activity Timeline */}
            <div className="border-t border-slate-100 bg-slate-50 p-4 max-h-[200px] overflow-y-auto">
                <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wide mb-3 flex items-center gap-1">
                    <Clock size={10}/> Recent Activity
                </div>
                <div className="space-y-3 pl-1">
                    {timeline.map((evt) => (
                        <div key={evt.id} className="flex gap-3 text-xs relative animate-fade-in-up">
                            {/* Line connector */}
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

        {/* Right Rail Data: Session-based */}
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
        </div>

        <TrackingFixModal 
            isOpen={showTrackingModal} 
            onClose={() => setShowTrackingModal(false)}
            onVerify={handleVerifyTracking} 
        />
    </div>
  );
};


const DashboardPage: React.FC = () => {
  const navigate = useNavigate();
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [selectedCampaign, setSelectedCampaign] = useState<Campaign | null>(null);

  useEffect(() => {
    const loaded = getCampaigns().reverse(); // Newest first
    setCampaigns(loaded);
    if (loaded.length > 0) {
        setSelectedCampaign(loaded[0]);
    }
  }, []);

  const getDisplayName = (c: Campaign) => {
    if (c.businessName && c.businessName.trim() !== '') return c.businessName;
    if (c.url.toLowerCase().includes('facebook.com')) return 'Facebook Campaign';
    return c.url;
  };

  const getDisplayUrl = (url: string) => {
    try {
        const u = new URL(url.startsWith('http') ? url : `https://${url}`);
        return u.hostname;
    } catch {
        return url;
    }
  }

  return (
    <div className="min-h-screen bg-slate-50 py-8">
      <Container>
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
          <h1 className="text-3xl font-bold text-slate-900">Dashboard</h1>
          <Button onClick={() => navigate('/builder')}>
            <Plus size={18} className="mr-2" /> Create New Campaign
          </Button>
        </div>

        {campaigns.length === 0 ? (
          <div className="text-center py-20 bg-white rounded-2xl border border-dashed border-slate-300">
            <div className="mx-auto w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mb-4">
              <Search className="text-slate-400" size={32} />
            </div>
            <h3 className="text-lg font-medium text-slate-900 mb-1">No campaigns yet</h3>
            <p className="text-slate-500 mb-6">Get started by creating your first ad campaign.</p>
            <Button variant="outline" onClick={() => navigate('/builder')}>
              Start Building
            </Button>
          </div>
        ) : (
          <div className="space-y-8">
            {/* 1. Campaign List (Grid Layout) */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
               {campaigns.map(c => {
                 const objLabel = OBJECTIVES.find(o => o.id === c.objective)?.label || c.objective;
                 const displayName = getDisplayName(c);
                 const isSelected = selectedCampaign?.id === c.id;

                 return (
                   <Card 
                     key={c.id} 
                     onClick={() => setSelectedCampaign(c)}
                     className={`p-5 flex items-center justify-between transition-all cursor-pointer ${isSelected ? 'ring-2 ring-blue-500 border-transparent shadow-md' : 'hover:shadow-md'}`}
                   >
                     <div className="flex items-center gap-4 overflow-hidden">
                       <div className={`w-12 h-12 rounded-lg flex-shrink-0 flex items-center justify-center font-bold text-lg overflow-hidden ${isSelected ? 'bg-blue-600 text-white' : 'bg-blue-100 text-blue-600'}`}>
                         {c.snapshot?.faviconUrl ? (
                             <img src={c.snapshot.faviconUrl} className="w-full h-full object-cover" alt="icon" onError={(e) => (e.currentTarget.style.display='none')}/>
                         ) : (
                             displayName.charAt(0).toUpperCase()
                         )}
                       </div>
                       <div className="min-w-0">
                         <h3 className="font-bold text-slate-900 truncate" title={displayName}>{displayName}</h3>
                         <div className="flex items-center gap-2 mt-1">
                            <span className="text-xs text-slate-500 flex-shrink-0">{new Date(c.createdAt).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}</span>
                            <span className="text-slate-300 flex-shrink-0">•</span>
                            <span className="text-xs text-slate-600 truncate">{objLabel}</span>
                         </div>
                       </div>
                     </div>
                     <div className="flex flex-col items-end gap-1 flex-shrink-0 ml-2">
                       <Badge color={c.status === 'Live' ? 'green' : 'gray'}>{c.status}</Badge>
                       {isSelected && <Activity size={16} className="text-blue-500 mt-1" />}
                     </div>
                   </Card>
                 );
               })}
            </div>

            {/* 2. Details Panel (Full Width) */}
            {selectedCampaign ? (
              <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6 animate-fade-in scroll-mt-24" id="details-view">
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 pb-6 border-b border-slate-100 gap-4">
                  <div className="min-w-0 flex-1">
                    <h2 className="text-2xl font-bold text-slate-900 truncate" title={getDisplayName(selectedCampaign)}>
                      {getDisplayName(selectedCampaign)}
                    </h2>
                    <a 
                      href={selectedCampaign.url.startsWith('http') ? selectedCampaign.url : `https://${selectedCampaign.url}`} 
                      target="_blank" 
                      rel="noreferrer" 
                      className="text-sm text-blue-600 hover:underline flex items-center gap-1 mt-1 group w-fit"
                      title={selectedCampaign.url}
                    >
                      <span className="truncate max-w-[300px]">{selectedCampaign.url}</span> 
                      <ExternalLink size={12} className="flex-shrink-0 opacity-0 group-hover:opacity-100 transition-opacity"/>
                    </a>
                  </div>
                  <div className="flex gap-2">
                     <Button size="sm" variant="outline" onClick={() => navigate('/builder')}>Edit Campaign</Button>
                  </div>
                </div>

                <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">
                   {/* Left Col: Main Metrics (2/3) */}
                   <div className="xl:col-span-2">
                        {selectedCampaign.status === 'Live' ? (
                            <LiveCampaignPanel campaign={selectedCampaign} />
                        ) : (
                            <div className="mb-6">
                              <div className="text-xs uppercase font-semibold text-slate-500 mb-2">Pre-Launch Estimates</div>
                              <div className="bg-slate-50 p-6 rounded-lg border border-slate-100 grid grid-cols-2 gap-8">
                                <div>
                                  <div className="text-sm text-slate-600 mb-1">Weekly Volume</div>
                                  <div className="text-2xl font-bold text-slate-900">
                                    {selectedCampaign.estimates?.visitorsMin ?? 0} - {selectedCampaign.estimates?.visitorsMax ?? 0}
                                  </div>
                                </div>
                                <div>
                                  <div className="text-sm text-slate-600 mb-1">Est. Cost</div>
                                  <div className="text-2xl font-bold text-slate-900">
                                   ₹{selectedCampaign.estimates?.cplMin ?? 0} - ₹{selectedCampaign.estimates?.cplMax ?? 0}
                                  </div>
                                </div>
                              </div>
                            </div>
                        )}
                   </div>

                   {/* Right Col: Smart Assistant (1/3) */}
                   <div className="space-y-6 h-full border-l border-slate-100 pl-8 hidden xl:block">
                        {/* Card A: Opportunity */}
                        <div className="bg-white rounded-xl border border-amber-200 shadow-sm overflow-hidden">
                            <div className="bg-amber-50 px-4 py-3 border-b border-amber-100 flex items-center gap-2">
                                <Lightbulb size={16} className="text-amber-600 fill-amber-100" />
                                <span className="font-bold text-amber-800 text-sm uppercase tracking-wide">Opportunity Detected</span>
                            </div>
                            <div className="p-5">
                                <h3 className="font-bold text-slate-900 mb-2">Creative Fatigue Warning</h3>
                                <p className="text-sm text-slate-600 mb-4 leading-relaxed">
                                    Your CTR has dropped by 5% in the last hour. Consider rotating your ad headlines.
                                </p>
                                <Button 
                                    size="sm" 
                                    className="w-full bg-amber-600 hover:bg-amber-700 border-transparent text-white shadow-none"
                                    onClick={() => toast.success("Creative auto-rotated", { icon: '🔄' })}
                                >
                                    Auto-Rotate Creative
                                </Button>
                            </div>
                        </div>

                        {/* Card B: Activity Log */}
                        <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
                            <div className="bg-slate-50 px-4 py-3 border-b border-slate-100 flex items-center justify-between">
                                <h3 className="font-bold text-slate-900 text-sm flex items-center gap-2">
                                    <Zap size={16} className="text-slate-400" /> System Events
                                </h3>
                            </div>
                            <div className="divide-y divide-slate-50">
                                {[
                                    { time: "Just now", msg: "Budget pacing check passed." },
                                    { time: "2m ago", msg: "Competitor 'Joe's Pizza' increased bids." },
                                    { time: "15m ago", msg: "New 'High Intent' visitor detected." },
                                    { time: "1h ago", msg: "Campaign started." }
                                ].map((evt, i) => (
                                    <div key={i} className="p-3 flex gap-3 hover:bg-slate-50 transition-colors group">
                                        <div className="flex flex-col items-center mt-1.5">
                                            <div className="w-1.5 h-1.5 rounded-full bg-slate-300 group-hover:bg-blue-400 transition-colors"></div>
                                        </div>
                                        <div>
                                            <p className="text-sm text-slate-700 font-medium leading-tight">{evt.msg}</p>
                                            <p className="text-[10px] text-slate-400 mt-1">{evt.time}</p>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                   </div>
                </div>
              </div>
            ) : (
              <div className="h-64 flex flex-col items-center justify-center p-8 bg-slate-50 rounded-xl border border-dashed border-slate-300 text-slate-400 mt-8">
                <MousePointer2 size={32} className="mb-2 opacity-50"/>
                <p>Select a campaign above to view performance details</p>
              </div>
            )}
          </div>
        )}
      </Container>
    </div>
  );
};

export default DashboardPage;
