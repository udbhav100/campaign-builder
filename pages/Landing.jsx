
import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Button, Container } from '../components/Common.jsx';
import { Rocket, Zap, BarChart, Target } from 'lucide-react';

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

export default LandingPage;
