import { useState } from 'react';
import { useAppStore } from '@/store/useAppStore';
import { SCENARIO_PRESETS } from '@/constants/presets';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';

export default function Scenario() {
  const { 
    audience, 
    scenario, 
    setScenario, 
    setCurrentPage 
  } = useAppStore();
  const { toast } = useToast();
  const [selectedPreset, setSelectedPreset] = useState<string | null>(scenario.presetKey || null);

  const presets = audience ? SCENARIO_PRESETS[audience] : [];

  const handlePresetSelect = (presetKey: string) => {
    setSelectedPreset(presetKey);
    setScenario({ presetKey, freeText: '' });
  };

  const handleCustomTextChange = (text: string) => {
    setScenario({ freeText: text, presetKey: undefined });
    setSelectedPreset(null);
  };

  const handleNext = () => {
    if (!scenario.presetKey && !scenario.freeText?.trim()) {
      toast({
        title: "Scenario Required",
        description: "Please select a preset scenario or write a custom one.",
        variant: "destructive",
      });
      return;
    }
    setCurrentPage('playground');
  };

  const handleBack = () => {
    setCurrentPage('character');
  };

  return (
    <div className="animate-slide-up">
      <div className="text-center mb-8">
        <h2 className="text-3xl font-poppins font-bold text-gray-900 mb-4">
          Choose Your Learning Scenario
        </h2>
        <p className="text-gray-600">Pick a situation to practice or create your own custom scenario</p>
      </div>

      <div className="max-w-4xl mx-auto">
        <div className="bg-white rounded-2xl shadow-lg p-8">
          <div className="grid md:grid-cols-2 gap-8">
            {/* Preset Scenarios */}
            <div>
              <h3 className="text-xl font-semibold text-gray-900 mb-6">
                <i className="fas fa-list-ul mr-2 text-blue-600"></i>Preset Scenarios
              </h3>
              <div className="space-y-3">
                {presets.map((preset) => (
                  <button
                    key={preset.key}
                    onClick={() => handlePresetSelect(preset.key)}
                    className={`w-full text-left p-4 border rounded-lg transition-colors ${
                      selectedPreset === preset.key
                        ? 'border-blue-500 bg-blue-50'
                        : 'border-gray-200 hover:border-blue-500 hover:bg-blue-50'
                    }`}
                  >
                    <div className="flex items-center space-x-3">
                      <i className={`${preset.icon} text-blue-600`}></i>
                      <div>
                        <p className="font-medium text-gray-900">{preset.title}</p>
                        <p className="text-sm text-gray-600">{preset.description}</p>
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            </div>

            {/* Custom Scenario */}
            <div>
              <h3 className="text-xl font-semibold text-gray-900 mb-6">
                <i className="fas fa-edit mr-2 text-purple-600"></i>Custom Scenario
              </h3>
              <div className="bg-gray-50 rounded-lg p-6">
                <Label htmlFor="custom-scenario" className="block text-sm font-semibold text-gray-700 mb-2">
                  Describe your situation
                </Label>
                <Textarea
                  id="custom-scenario"
                  value={scenario.freeText || ''}
                  onChange={(e) => handleCustomTextChange(e.target.value)}
                  rows={6}
                  placeholder="Describe a specific situation you'd like to practice... For example: 'I want to practice asking for directions at the airport' or 'Help me with small talk at a coffee shop'"
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent resize-none"
                />
                <p className="text-xs text-gray-500 mt-2">
                  Be specific about the context, people involved, and what you want to achieve
                </p>
              </div>
            </div>
          </div>

          <div className="mt-8 flex justify-between">
            <Button 
              variant="outline" 
              onClick={handleBack}
              className="px-6 py-3"
            >
              <i className="fas fa-arrow-left mr-2"></i>Back to Character
            </Button>
            <Button 
              onClick={handleNext}
              className="px-6 py-3 bg-blue-600 hover:bg-blue-700"
            >
              Start Learning Playground <i className="fas fa-arrow-right ml-2"></i>
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
