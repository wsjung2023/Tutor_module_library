import { useState, useCallback } from 'react';
import { useAppStore } from '@/store/useAppStore';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { apiRequest } from '@/lib/queryClient';
import { useToast } from '@/hooks/use-toast';

export default function Character() {
  const { 
    character, 
    audience, 
    setCharacter, 
    setCurrentPage, 
    isLoading, 
    setLoading, 
    setError 
  } = useAppStore();
  const { toast } = useToast();
  const [isGeneratingImage, setIsGeneratingImage] = useState(false);

  // 한글 입력 처리를 위한 핸들러
  const handleNameChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setCharacter({ name: value });
  }, [setCharacter]);

  const handleGenerateCharacter = async () => {
    if (!character.name || !character.gender || !character.style || !audience) {
      toast({
        title: "Missing Information",
        description: "Please fill in all character details before generating.",
        variant: "destructive",
      });
      return;
    }

    setIsGeneratingImage(true);
    setLoading(true, 'Generating your AI tutor...');

    try {
      const response = await apiRequest(
        'POST',
        '/api/generate-image',
        {
          name: character.name,
          gender: character.gender,
          style: character.style,
          audience: audience,
        }
      );

      const result = await response.json();
      setCharacter({ imageUrl: result.imageUrl });
      
      toast({
        title: "Character Generated!",
        description: "Your AI tutor is ready to help you learn.",
      });
    } catch (error) {
      console.error('Character generation failed:', error);
      setError('Failed to generate character. Please try again.');
      toast({
        title: "Generation Failed",
        description: "Could not generate character image. Please check your connection and try again.",
        variant: "destructive",
      });
    } finally {
      setIsGeneratingImage(false);
      setLoading(false);
    }
  };

  const handleNext = () => {
    if (!character.name || !character.gender || !character.style) {
      toast({
        title: "Incomplete Information",
        description: "Please fill in all character details to continue.",
        variant: "destructive",
      });
      return;
    }
    setCurrentPage('scenario');
  };

  const handleBack = () => {
    setCurrentPage('home');
  };

  return (
    <div className="animate-slide-up">
      <div className="text-center mb-8">
        <h2 className="text-3xl font-poppins font-bold text-gray-900 mb-4">
          Create Your AI English Tutor
        </h2>
        <p className="text-gray-600">Design a personalized tutor that matches your learning style</p>
      </div>

      <div className="max-w-2xl mx-auto">
        <div className="bg-white rounded-2xl shadow-lg p-8">
          <div className="grid md:grid-cols-2 gap-8">
            {/* Character Preview */}
            <div className="text-center">
              <div className="w-48 h-48 mx-auto mb-4 bg-gray-100 rounded-2xl flex items-center justify-center character-image overflow-hidden">
                {character.imageUrl ? (
                  <img 
                    src={character.imageUrl} 
                    alt={`AI Tutor ${character.name}`}
                    className="w-full h-full object-cover rounded-2xl"
                  />
                ) : (
                  <div className="text-center">
                    <i className="fas fa-robot text-6xl text-gray-400 mb-2"></i>
                    <p className="text-sm text-gray-500">Character Preview</p>
                  </div>
                )}
              </div>
              <Button 
                onClick={handleGenerateCharacter}
                disabled={isGeneratingImage || isLoading}
                className="bg-purple-600 hover:bg-purple-700"
              >
                {isGeneratingImage ? (
                  <>
                    <i className="fas fa-spinner fa-spin mr-2"></i>
                    Generating...
                  </>
                ) : (
                  <>
                    <i className="fas fa-magic mr-2"></i>
                    Generate Character
                  </>
                )}
              </Button>
            </div>

            {/* Character Form */}
            <div className="space-y-6">
              <div>
                <Label htmlFor="name" className="text-sm font-semibold text-gray-700 mb-2">
                  Character Name
                </Label>
                <Input
                  id="name"
                  value={character.name}
                  onChange={handleNameChange}
                  placeholder="Enter tutor name..."
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                />
              </div>

              <div>
                <Label className="text-sm font-semibold text-gray-700 mb-2">Gender</Label>
                <RadioGroup 
                  value={character.gender} 
                  onValueChange={(value: 'male' | 'female') => setCharacter({ gender: value })}
                  className="flex space-x-4 mt-2"
                >
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="male" id="male" />
                    <Label htmlFor="male">Male</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="female" id="female" />
                    <Label htmlFor="female">Female</Label>
                  </div>
                </RadioGroup>
              </div>

              <div>
                <Label className="text-sm font-semibold text-gray-700 mb-2">Teaching Style</Label>
                <Select 
                  value={character.style} 
                  onValueChange={(value: 'cheerful' | 'calm' | 'strict') => setCharacter({ style: value })}
                >
                  <SelectTrigger className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent">
                    <SelectValue placeholder="Select style..." />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="cheerful">Cheerful & Encouraging</SelectItem>
                    <SelectItem value="calm">Calm & Patient</SelectItem>
                    <SelectItem value="strict">Strict & Focused</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="flex space-x-4">
                <Button 
                  variant="outline" 
                  onClick={handleBack}
                  className="flex-1"
                >
                  <i className="fas fa-arrow-left mr-2"></i>
                  Back
                </Button>
                <Button 
                  onClick={handleNext}
                  className="flex-1 bg-blue-600 hover:bg-blue-700"
                >
                  Next: Choose Scenario
                </Button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
