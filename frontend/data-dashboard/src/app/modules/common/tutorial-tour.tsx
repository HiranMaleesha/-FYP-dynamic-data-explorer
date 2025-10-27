'use client';

import { useState, useEffect } from 'react';
import { TourProvider, useTour, components } from '@reactour/tour';
import { Button } from './button';
import { X, ChevronLeft, ChevronRight, Play } from 'lucide-react';

const CustomClose = ({ onClick }: { onClick: () => void }) => (
  <button
    onClick={onClick}
    className="absolute top-2 right-2 p-1 hover:bg-gray-100 rounded-full transition-colors"
  >
    <X className="w-4 h-4" />
  </button>
);

const CustomNavigation = ({
  currentStep,
  stepsLength,
  setCurrentStep,
  setIsOpen
}: {
  currentStep: number;
  stepsLength: number;
  setCurrentStep: (step: number) => void;
  setIsOpen: (open: boolean) => void;
}) => (
  <div className="flex items-center justify-between mt-4">
    <Button
      variant="outline"
      size="sm"
      onClick={() => setCurrentStep(currentStep - 1)}
      disabled={currentStep === 0}
      className="flex items-center gap-1"
    >
      <ChevronLeft className="w-4 h-4" />
      Previous
    </Button>

    <div className="flex gap-1">
      {Array.from({ length: stepsLength }, (_, i) => (
        <div
          key={i}
          className={`w-2 h-2 rounded-full ${
            i === currentStep ? 'bg-blue-600' : 'bg-gray-300'
          }`}
        />
      ))}
    </div>

    <Button
      variant="outline"
      size="sm"
      onClick={() => {
        if (currentStep === stepsLength - 1) {
          setIsOpen(false);
        } else {
          setCurrentStep(currentStep + 1);
        }
      }}
      className="flex items-center gap-1"
    >
      {currentStep === stepsLength - 1 ? 'Finish' : 'Next'}
      <ChevronRight className="w-4 h-4" />
    </Button>
  </div>
);

const TutorialContent = () => {
  const { setIsOpen, setCurrentStep, currentStep, steps } = useTour();

  const currentStepData = steps[currentStep] as any;

  return (
    <div className="relative">
      <CustomClose onClick={() => setIsOpen(false)} />
      <div className="pr-8">
        <h3 className="text-lg font-semibold text-gray-900 mb-2">
          {currentStepData?.title}
        </h3>
        <p className="text-gray-600 text-sm leading-relaxed">
          {typeof currentStepData?.content === 'string' ? currentStepData.content : ''}
        </p>
      </div>
      <CustomNavigation
        currentStep={currentStep}
        stepsLength={steps.length}
        setCurrentStep={setCurrentStep}
        setIsOpen={setIsOpen}
      />
    </div>
  );
};

const TutorialButton = ({ page }: { page: 'home' | 'dashboard' }) => {
  const [hasSeenTutorial, setHasSeenTutorial] = useState(false);
  const { setIsOpen, setSteps } = useTour();

  useEffect(() => {
    const seen = localStorage.getItem(`tutorial-seen-${page}`);
    setHasSeenTutorial(!!seen);
  }, [page]);

  const startTutorial = () => {
    let tutorialSteps: any[] = [];

    if (page === 'home') {
      tutorialSteps = [
        {
          selector: '[data-tutorial="navbar"]',
          content: 'Welcome to Dynamic Data Explorer! This navigation bar helps you move between different sections of the app.',
          title: 'Navigation Bar'
        },
        {
          selector: '[data-tutorial="upload"]',
          content: 'Start by uploading your CSV or Excel file here. We support files up to 10MB with various data formats.',
          title: 'Upload Your Data'
        }
      ];
    } else if (page === 'dashboard') {
      tutorialSteps = [
        {
          selector: '[data-tutorial="dashboard"]',
          content: 'Welcome to your data dashboard! Here you can explore insights and visualizations from your uploaded data.',
          title: 'Dashboard Overview'
        },
        {
          selector: '[data-tutorial="summary-cards"]',
          content: 'These summary cards show key metrics from your data like total vehicles, profit, and average prices.',
          title: 'Summary Statistics'
        },
        {
          selector: '[data-tutorial="charts"]',
          content: 'Explore your data through interactive charts. Click the expand button to see charts in full detail.',
          title: 'Interactive Charts'
        },
        {
          selector: '[data-tutorial="chat"]',
          content: 'Ask questions about your data in natural language. Our AI will analyze your data and provide insights.',
          title: 'AI-Powered Chat'
        }
      ];
    }

    setSteps?.(tutorialSteps);
    setIsOpen(true);
    localStorage.setItem(`tutorial-seen-${page}`, 'true');
    setHasSeenTutorial(true);
  };

  if (hasSeenTutorial) {
    return (
      <button
        onClick={startTutorial}
        className="fixed bottom-6 right-6 bg-blue-600 text-white p-3 rounded-full shadow-lg hover:bg-blue-700 transition-colors z-40"
        title="Start Tutorial"
      >
        <Play className="w-5 h-5" />
      </button>
    );
  }

  return (
    <button
      onClick={startTutorial}
      className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2"
    >
      <Play className="w-4 h-4" />
      Take Tutorial
    </button>
  );
};

export const TutorialTour = ({ children, page }: { children: React.ReactNode; page: 'home' | 'dashboard' }) => {
  return (
    <TourProvider
      steps={[]}
      components={{
        ...components,
        Badge: () => null,
        Close: () => null,
        Content: TutorialContent,
        Navigation: () => null,
      }}
      styles={{
        popover: (base) => ({
          ...base,
          backgroundColor: 'white',
          color: 'black',
          borderRadius: '8px',
          padding: '20px',
          boxShadow: '0 10px 25px rgba(0, 0, 0, 0.1)',
          maxWidth: '300px',
        }),
        maskArea: (base) => ({
          ...base,
          rx: 8,
        }),
        maskWrapper: (base) => ({
          ...base,
          color: 'rgba(0, 0, 0, 0.7)',
        }),
      }}
      showDots={false}
      showCloseButton={false}
      showNavigation={false}
      showBadge={false}
    >
      {children}
      <TutorialButton page={page} />
    </TourProvider>
  );
};

export default TutorialTour;