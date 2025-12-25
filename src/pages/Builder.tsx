import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, ArrowRight, Check } from 'lucide-react';
import toast from 'react-hot-toast';
import { Container, Button } from '../components/Common';
import { 
  StepObjective, StepUrl, StepAutoSetup, StepGoalSlider, StepCompetitor, StepReview 
} from '../components/WizardSteps';
import { Campaign, INITIAL_CAMPAIGN_STATE } from '../types';
import { saveCampaign, calculateEstimates } from '../utils';

// --- Named Progress Component ---
const WizardProgress: React.FC<{ currentStep: number; steps: string[] }> = ({ currentStep, steps }) => {
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

const BuilderPage: React.FC = () => {
  const navigate = useNavigate();
  const [currentStep, setCurrentStep] = useState(1);
  const [reviewConfirmed, setReviewConfirmed] = useState(false);
  const [campaign, setCampaign] = useState<Campaign>({ 
    ...INITIAL_CAMPAIGN_STATE, 
    id: crypto.randomUUID(),
    createdAt: new Date().toISOString() 
  });

  const STEPS = ["Goal", "Website", "AI Draft", "Outcomes", "Competitors", "Review"];

  // Helper to update campaign state
  const updateCampaign = (updates: Partial<Campaign>) => {
    setCampaign(prev => ({ ...prev, ...updates }));
  };

  // Live estimate calculation when slider or objective changes
  useEffect(() => {
      const estimates = calculateEstimates(campaign.goalSlider, campaign.objective);
      updateCampaign({ estimates });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [campaign.goalSlider, campaign.objective]);

  const handleNext = () => {
    if (currentStep < STEPS.length) {
      setCurrentStep(curr => curr + 1);
      window.scrollTo(0,0);
    } else {
      // Launch
      const finalCampaign = { ...campaign, status: 'Live' as const };
      saveCampaign(finalCampaign);
      toast.success('Campaign launched successfully!');
      navigate('/dashboard');
    }
  };

  const handleBack = () => {
    if (currentStep > 1) setCurrentStep(curr => curr - 1);
    else navigate('/');
  };

  // Validation for Next button
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

      {/* Sticky Footer */}
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

export default BuilderPage;