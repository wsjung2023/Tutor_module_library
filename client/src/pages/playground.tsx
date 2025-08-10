import { useState, useRef } from 'react';
import { useAppStore } from '@/store/useAppStore';
import { VOICE_OPTIONS, SCENARIO_PRESETS } from '@/constants/presets';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Progress } from '@/components/ui/progress';
import { apiRequest } from '@/lib/queryClient';
import { useToast } from '@/hooks/use-toast';

export default function Playground() {
  const {
    audience,
    character,
    scenario,
    dialogue,
    audioUrls,
    focusPhrases,
    currentPlayingLine,
    isLoading,
    setDialogue,
    setAudioUrls,
    setFocusPhrases,
    setCurrentPlayingLine,
    setLoading,
    setError,
    setCurrentPage,
  } = useAppStore();

  const { toast } = useToast();
  const [selectedVoice, setSelectedVoice] = useState('female_friendly');
  const [isGeneratingDialogue, setIsGeneratingDialogue] = useState(false);
  const [isGeneratingCharacter, setIsGeneratingCharacter] = useState(false);
  const audioRef = useRef<HTMLAudioElement>(null);

  const getScenarioDescription = () => {
    if (scenario.freeText) {
      return scenario.freeText;
    }
    if (scenario.presetKey && audience) {
      const preset = SCENARIO_PRESETS[audience].find(p => p.key === scenario.presetKey);
      return preset ? `${preset.title}: ${preset.description}` : 'Custom scenario';
    }
    return 'No scenario selected';
  };

  const handleGenerateDialogue = async () => {
    if (!audience || !character.name || !character.gender || !character.style) {
      toast({
        title: "Missing Information",
        description: "Please complete character setup first.",
        variant: "destructive",
      });
      return;
    }

    setIsGeneratingDialogue(true);
    setLoading(true, 'Generating conversation...');

    try {
      const response = await apiRequest(
        'POST',
        '/api/generate-dialogue',
        {
          audience,
          character: {
            name: character.name,
            gender: character.gender,
            style: character.style,
          },
          scenario: {
            presetKey: scenario.presetKey,
            freeText: scenario.freeText,
          },
        }
      );

      const result = await response.json();
      setDialogue(result.lines || []);
      setFocusPhrases(result.focus_phrases || []);
      setAudioUrls([]); // Reset audio URLs when new dialogue is generated

      toast({
        title: "Dialogue Generated!",
        description: "Your conversation is ready. Click play buttons to hear audio.",
      });
    } catch (error) {
      console.error('Dialogue generation failed:', error);
      setError('Failed to generate dialogue. Please try again.');
      toast({
        title: "Generation Failed",
        description: "Could not generate dialogue. Please check your connection and try again.",
        variant: "destructive",
      });
    } finally {
      setIsGeneratingDialogue(false);
      setLoading(false);
    }
  };

  const handleRegenerateCharacter = async () => {
    if (!audience || !character.name || !character.gender || !character.style) {
      return;
    }

    setIsGeneratingCharacter(true);
    setLoading(true, 'Creating new character look...');

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
      useAppStore.getState().setCharacter({ imageUrl: result.imageUrl });
      
      toast({
        title: "New Look Generated!",
        description: "Your AI tutor has a fresh new appearance.",
      });
    } catch (error) {
      console.error('Character regeneration failed:', error);
      toast({
        title: "Generation Failed",
        description: "Could not generate new character look. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsGeneratingCharacter(false);
      setLoading(false);
    }
  };

  const handlePlayAudio = async (lineIndex: number) => {
    if (currentPlayingLine === lineIndex) {
      // Stop current audio
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current.currentTime = 0;
      }
      setCurrentPlayingLine(null);
      return;
    }

    const text = dialogue[lineIndex];
    if (!text) return;

    // Check if we already have audio for this line
    if (audioUrls[lineIndex]) {
      playAudioFromUrl(audioUrls[lineIndex], lineIndex);
      return;
    }

    // Generate new audio
    try {
      setCurrentPlayingLine(lineIndex);
      
      const response = await apiRequest(
        'POST',
        '/api/tts',
        {
          text,
          voiceId: selectedVoice,
        }
      );

      const result = await response.json();
      
      // Update audio URLs array
      const newAudioUrls = [...audioUrls];
      newAudioUrls[lineIndex] = result.audioUrl;
      setAudioUrls(newAudioUrls);

      playAudioFromUrl(result.audioUrl, lineIndex);
    } catch (error) {
      console.error('TTS generation failed:', error);
      setCurrentPlayingLine(null);
      toast({
        title: "Audio Failed",
        description: "Could not generate audio. Please try again.",
        variant: "destructive",
      });
    }
  };

  const playAudioFromUrl = (url: string, lineIndex: number) => {
    if (audioRef.current) {
      audioRef.current.src = url;
      audioRef.current.onended = () => setCurrentPlayingLine(null);
      audioRef.current.onpause = () => setCurrentPlayingLine(null);
      audioRef.current.play().catch(error => {
        console.error('Audio playback failed:', error);
        setCurrentPlayingLine(null);
      });
      setCurrentPlayingLine(lineIndex);
    }
  };

  const handleBack = () => {
    setCurrentPage('scenario');
  };

  const handleTryAgain = () => {
    setDialogue([]);
    setAudioUrls([]);
    setFocusPhrases([]);
    setCurrentPlayingLine(null);
  };

  const progress = dialogue.length > 0 ? 65 : 0;

  return (
    <div className="animate-slide-up">
      <audio ref={audioRef} style={{ display: 'none' }} />
      
      <div className="text-center mb-8">
        <h2 className="text-3xl font-poppins font-bold text-gray-900 mb-2">
          Learning Playground
        </h2>
        <p className="text-gray-600">Practice English conversation with your AI tutor</p>
      </div>

      <div className="grid lg:grid-cols-3 gap-8">
        {/* Character & Controls */}
        <div className="lg:col-span-1">
          <div className="bg-white rounded-2xl shadow-lg p-6 sticky top-24">
            {/* Character Image */}
            <div className="text-center mb-6">
              <div className="w-48 h-48 mx-auto mb-4 bg-gradient-to-br from-purple-100 to-pink-100 rounded-2xl flex items-center justify-center character-image overflow-hidden">
                {character.imageUrl ? (
                  <img 
                    src={character.imageUrl} 
                    alt={`AI Tutor ${character.name}`}
                    className={`w-full h-full object-cover rounded-2xl transition-transform duration-300 ${
                      currentPlayingLine !== null ? 'speaking-animation' : ''
                    }`}
                  />
                ) : (
                  <div className="text-center">
                    <i className="fas fa-robot text-6xl text-gray-400 mb-2"></i>
                    <p className="text-sm text-gray-500">AI Tutor</p>
                  </div>
                )}
              </div>
              <h3 className="text-xl font-poppins font-semibold text-gray-900">
                {character.name || 'AI Tutor'}
              </h3>
              <p className="text-sm text-gray-600 capitalize">
                {character.style} & {character.gender}
              </p>
            </div>

            {/* Voice Controls */}
            <div className="mb-6">
              <label className="block text-sm font-semibold text-gray-700 mb-2">Voice Style</label>
              <Select value={selectedVoice} onValueChange={setSelectedVoice}>
                <SelectTrigger className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {VOICE_OPTIONS.map((voice) => (
                    <SelectItem key={voice.id} value={voice.id}>
                      {voice.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Generation Controls */}
            <div className="space-y-3">
              <Button 
                onClick={handleGenerateDialogue}
                disabled={isGeneratingDialogue || isLoading}
                className="w-full bg-blue-600 hover:bg-blue-700"
              >
                {isGeneratingDialogue ? (
                  <>
                    <i className="fas fa-spinner fa-spin mr-2"></i>
                    Generating...
                  </>
                ) : (
                  <>
                    <i className="fas fa-comments mr-2"></i>
                    Generate Dialogue
                  </>
                )}
              </Button>
              
              <Button 
                onClick={handleRegenerateCharacter}
                disabled={isGeneratingCharacter || isLoading}
                variant="outline"
                className="w-full"
              >
                {isGeneratingCharacter ? (
                  <>
                    <i className="fas fa-spinner fa-spin mr-2"></i>
                    Generating...
                  </>
                ) : (
                  <>
                    <i className="fas fa-sync-alt mr-2"></i>
                    New Character Look
                  </>
                )}
              </Button>
            </div>
          </div>
        </div>

        {/* Dialogue & Learning Area */}
        <div className="lg:col-span-2 space-y-6">
          {/* Scenario Context */}
          <div className="bg-gradient-to-r from-blue-50 to-purple-50 rounded-2xl p-6">
            <h4 className="font-semibold text-gray-900 mb-2">
              <i className="fas fa-scenario mr-2 text-blue-600"></i>Current Scenario
            </h4>
            <p className="text-gray-700">
              {getScenarioDescription()}
            </p>
          </div>

          {/* Dialogue Section */}
          <div className="bg-white rounded-2xl shadow-lg p-6">
            <h4 className="text-lg font-semibold text-gray-900 mb-4">
              <i className="fas fa-comments mr-2 text-green-600"></i>Conversation
            </h4>

            {dialogue.length > 0 ? (
              <div className="space-y-4">
                {dialogue.map((line, index) => (
                  <div 
                    key={index}
                    className={`dialogue-line p-4 bg-gray-50 rounded-lg border-l-4 transition-all duration-300 cursor-pointer hover:bg-gray-100 ${
                      currentPlayingLine === index 
                        ? 'active border-purple-500 bg-gradient-to-r from-blue-500 to-purple-500 text-white' 
                        : index % 2 === 0 
                          ? 'border-blue-500' 
                          : 'border-green-500'
                    }`}
                  >
                    <div className="flex items-start space-x-3">
                      <button 
                        onClick={() => handlePlayAudio(index)}
                        className={`flex-shrink-0 w-10 h-10 rounded-full flex items-center justify-center transition-colors ${
                          currentPlayingLine === index
                            ? 'bg-white text-purple-600'
                            : index % 2 === 0
                              ? 'bg-blue-600 hover:bg-blue-700 text-white'
                              : 'bg-green-600 hover:bg-green-700 text-white'
                        }`}
                      >
                        <i className={`fas ${currentPlayingLine === index ? 'fa-pause' : 'fa-play'} text-sm`}></i>
                      </button>
                      <div className="flex-1">
                        <p className={`font-medium ${currentPlayingLine === index ? 'text-white' : 'text-gray-900'}`}>
                          {line}
                        </p>
                        <p className={`text-xs mt-1 ${currentPlayingLine === index ? 'text-purple-100' : 'text-gray-500'}`}>
                          {index % 2 === 0 ? 'Tutor' : 'Your response'} • Click to highlight • Press play to hear
                        </p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-12 text-gray-500">
                <i className="fas fa-comments text-4xl mb-4"></i>
                <p>Click "Generate Dialogue" to start your conversation practice!</p>
              </div>
            )}
          </div>

          {/* Focus Phrases */}
          {focusPhrases.length > 0 && (
            <div className="bg-white rounded-2xl shadow-lg p-6">
              <h4 className="text-lg font-semibold text-gray-900 mb-4">
                <i className="fas fa-star mr-2 text-yellow-600"></i>Key Expressions to Learn
              </h4>
              
              <div className="grid md:grid-cols-3 gap-4">
                {focusPhrases.slice(0, 3).map((phrase, index) => (
                  <div 
                    key={index}
                    className={`rounded-lg p-4 text-center border ${
                      index === 0 ? 'bg-yellow-50 border-yellow-200' :
                      index === 1 ? 'bg-green-50 border-green-200' :
                      'bg-blue-50 border-blue-200'
                    }`}
                  >
                    <p className={`font-semibold ${
                      index === 0 ? 'text-yellow-800' :
                      index === 1 ? 'text-green-800' :
                      'text-blue-800'
                    }`}>
                      "{phrase}"
                    </p>
                    <p className={`text-sm mt-1 ${
                      index === 0 ? 'text-yellow-600' :
                      index === 1 ? 'text-green-600' :
                      'text-blue-600'
                    }`}>
                      Native expression
                    </p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Progress & Actions */}
          <div className="bg-white rounded-2xl shadow-lg p-6">
            <div className="flex items-center justify-between mb-4">
              <h4 className="text-lg font-semibold text-gray-900">
                <i className="fas fa-trophy mr-2 text-orange-600"></i>Session Progress
              </h4>
              <div className="flex space-x-2">
                <Button 
                  onClick={handleTryAgain}
                  variant="outline"
                  size="sm"
                >
                  <i className="fas fa-redo mr-1"></i>Try Again
                </Button>
                <Button 
                  onClick={handleBack}
                  variant="outline"
                  size="sm"
                >
                  <i className="fas fa-arrow-left mr-1"></i>Back
                </Button>
              </div>
            </div>
            
            <Progress value={progress} className="mb-3" />
            <p className="text-sm text-gray-600">Practice Progress: {progress}% Complete</p>
          </div>
        </div>
      </div>
    </div>
  );
}
