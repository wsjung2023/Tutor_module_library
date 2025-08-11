import { useState, useRef, useEffect } from 'react';
import { useAppStore } from '@/store/useAppStore';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { apiRequest } from '@/lib/queryClient';
import { useToast } from '@/hooks/use-toast';
import { Mic, MicOff, Volume2, RotateCcw, Play } from 'lucide-react';

interface ScenarioConfig {
  background: string;
  situation: string;
  userRole: string;
  characterRole: string;
  objective: string;
  expressions: string[];
}

const SCENARIOS: Record<string, ScenarioConfig> = {
  restaurant: {
    background: "linear-gradient(135deg, #8B4513 0%, #D2691E 50%, #CD853F 100%)",
    situation: "You're at a restaurant and need to order food",
    userRole: "Customer",
    characterRole: "Waitress", 
    objective: "Successfully order a meal with good pronunciation",
    expressions: ["May I take your order?", "What would you recommend?", "I'd like to order...", "Could I have the bill, please?"]
  },
  airport: {
    background: "linear-gradient(135deg, #87CEEB 0%, #4682B4 50%, #2F4F4F 100%)",
    situation: "You're at the airport check-in counter",
    userRole: "Passenger",
    characterRole: "Check-in Staff",
    objective: "Complete check-in process with clear communication",
    expressions: ["May I see your passport?", "Which seat would you prefer?", "Do you have any luggage to check?", "Here's your boarding pass"]
  },
  coffee_shop: {
    background: "linear-gradient(135deg, #8B4513 0%, #D2691E 50%, #654321 100%)",
    situation: "You're ordering coffee at a café",
    userRole: "Customer",
    characterRole: "Barista",
    objective: "Order your perfect coffee with confidence",
    expressions: ["What can I get for you?", "Would you like that iced or hot?", "What size would you like?", "That'll be ready in a few minutes"]
  }
};

interface DialogueTurn {
  speaker: 'character' | 'user' | 'system';
  text: string;
  audioUrl?: string;
  feedback?: {
    accuracy: number;
    pronunciation: string;
    suggestions: string[];
  };
  emotion?: 'neutral' | 'happy' | 'concerned' | 'professional';
}

export default function DramaScene() {
  const { character, scenario, audience, setCurrentPage } = useAppStore();
  const { toast } = useToast();
  
  // Scene state
  const [currentScenario, setCurrentScenario] = useState<ScenarioConfig | null>(null);
  const [dialogueHistory, setDialogueHistory] = useState<DialogueTurn[]>([]);
  const [isListening, setIsListening] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [sceneProgress, setSceneProgress] = useState(0);
  const [audioLevel, setAudioLevel] = useState(0);
  const [autoListenMode, setAutoListenMode] = useState(false);
  
  // Audio refs
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const streamRef = useRef<MediaStream | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const audioRef = useRef<HTMLAudioElement>(null);

  useEffect(() => {
    console.log('Drama scene effect triggered:', { 
      characterName: character.name, 
      scenarioKey: scenario.presetKey,
      historyLength: dialogueHistory.length 
    });
    
    if (character.name && scenario.presetKey && dialogueHistory.length === 0) {
      console.log('Initializing scene...');
      initializeScene();
    }
  }, [character.name, scenario.presetKey, dialogueHistory.length]);

  const initializeScene = () => {
    // Get scenario config
    const scenarioConfig = SCENARIOS[scenario.presetKey || 'restaurant'];
    setCurrentScenario(scenarioConfig);
    
    // Start the scene with character introduction
    startScenario(scenarioConfig);
  };

  const startScenario = async (scenarioConfig: ScenarioConfig) => {
    console.log('Starting scenario with config:', scenarioConfig);
    const openingLine = generateOpeningLine(scenarioConfig);
    console.log('Generated opening line:', openingLine);
    
    try {
      console.log('Calling TTS API...');
      // Generate character's opening dialogue with TTS
      const ttsResponse: any = await apiRequest('POST', '/api/tts', {
        text: openingLine,
        voiceId: 'female_friendly'
      });
      
      console.log('TTS Response received:', ttsResponse ? 'Success' : 'Failed');
      
      const openingTurn: DialogueTurn = {
        speaker: 'character',
        text: openingLine,
        audioUrl: ttsResponse?.audioUrl,
        emotion: 'professional'
      };
      
      // Add system message about the scenario
      const systemTurn: DialogueTurn = {
        speaker: 'system',
        text: `🎬 Scene: ${scenarioConfig.situation}\nYour role: ${scenarioConfig.userRole}\n${character.name}'s role: ${scenarioConfig.characterRole}`
      };
      
      console.log('Setting dialogue history...');
      setDialogueHistory([systemTurn, openingTurn]);
      setSceneProgress(10);
      
      // Auto-play opening line
      if (ttsResponse?.audioUrl) {
        setTimeout(() => {
          if (audioRef.current) {
            console.log('Playing opening audio:', ttsResponse.audioUrl.substring(0, 50) + '...');
            audioRef.current.src = ttsResponse.audioUrl;
            audioRef.current.play()
              .then(() => {
                console.log('Audio playback started');
                toast({
                  title: `🎭 ${character.name} is speaking!`,
                  description: "The scene has begun. Listen and respond when ready."
                });
              })
              .catch(error => {
                console.error('Audio playback failed:', error);
                toast({
                  title: "Audio Issue",
                  description: "Click the replay button to hear the character.",
                });
              });
          }
        }, 1500);
      } else {
        toast({
          title: "Scene Started",
          description: `${character.name} is ready! Use the replay button for audio.`,
        });
      }
      
    } catch (error) {
      console.error('Failed to start scenario:', error);
      toast({
        title: "Scene Setup Error",
        description: "Starting without audio. You can still practice the conversation!",
        variant: "destructive"
      });
      
      // Still create the dialogue even if TTS fails
      const openingTurn: DialogueTurn = {
        speaker: 'character',
        text: openingLine,
        emotion: 'professional'
      };
      
      const systemTurn: DialogueTurn = {
        speaker: 'system',
        text: `🎬 Scene: ${scenarioConfig.situation}\nYour role: ${scenarioConfig.userRole}\n${character.name}'s role: ${scenarioConfig.characterRole}`
      };
      
      setDialogueHistory([systemTurn, openingTurn]);
      setSceneProgress(10);
    }
  };

  const generateOpeningLine = (scenarioConfig: ScenarioConfig): string => {
    const openings: Record<string, string[]> = {
      restaurant: [
        "Good evening! Welcome to our restaurant. I'm your server for tonight. Have you had a chance to look at our menu?",
        "Hi there! Thanks for choosing our restaurant. Can I start you off with something to drink?",
        "Welcome! I'm so glad you're here tonight. Are you ready to order or do you need a few more minutes?"
      ],
      airport: [
        "Good morning! Welcome to the check-in counter. May I please see your passport and booking confirmation?",
        "Hello! I'll be helping you with your check-in today. Which flight are you taking?",
        "Hi there! Let's get you checked in for your flight. Do you have any bags to check today?"
      ],
      coffee_shop: [
        "Good morning! Welcome to our café. What can I get started for you today?",
        "Hi! Thanks for coming in. Are you looking for something hot or cold today?",
        "Hello there! I love your energy this morning. What's your usual order?"
      ]
    };
    
    const scenarioKey = scenario.presetKey || 'restaurant';
    const lines = openings[scenarioKey] || openings.restaurant;
    return lines[Math.floor(Math.random() * lines.length)];
  };

  const startListening = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ 
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          sampleRate: 44100
        } 
      });
      
      streamRef.current = stream;
      
      // Audio visualization
      audioContextRef.current = new AudioContext();
      analyserRef.current = audioContextRef.current.createAnalyser();
      const source = audioContextRef.current.createMediaStreamSource(stream);
      source.connect(analyserRef.current);
      
      visualizeAudio();
      
      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;
      audioChunksRef.current = [];
      
      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };
      
      mediaRecorder.onstop = processUserResponse;
      
      mediaRecorder.start();
      setIsListening(true);
      
    } catch (error) {
      console.error('Microphone error:', error);
      toast({
        title: "Microphone Access Denied",
        description: "Please allow microphone access to practice speaking.",
        variant: "destructive",
      });
    }
  };

  const stopListening = () => {
    if (mediaRecorderRef.current?.state === 'recording') {
      mediaRecorderRef.current.stop();
    }
    
    streamRef.current?.getTracks().forEach(track => track.stop());
    audioContextRef.current?.close();
    
    setIsListening(false);
    setAudioLevel(0);
  };

  const visualizeAudio = () => {
    if (!analyserRef.current) return;
    
    const dataArray = new Uint8Array(analyserRef.current.frequencyBinCount);
    
    const animate = () => {
      if (!analyserRef.current || !isListening) return;
      
      analyserRef.current.getByteFrequencyData(dataArray);
      const average = dataArray.reduce((a, b) => a + b, 0) / dataArray.length;
      setAudioLevel(Math.min(100, (average / 255) * 100));
      
      requestAnimationFrame(animate);
    };
    
    animate();
  };

  const processUserResponse = async () => {
    setIsProcessing(true);
    
    try {
      const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
      const reader = new FileReader();
      
      reader.onloadend = async () => {
        try {
          const base64Audio = (reader.result as string).split(',')[1];
          
          // Speech recognition
          const speechResponse: any = await apiRequest('POST', '/api/speech-recognition', {
            audioBlob: base64Audio,
            language: 'en'
          });
          
          const userText = speechResponse.text?.trim() || '';
          
          if (!userText) {
            toast({
              title: "Didn't catch that",
              description: "Could you speak a bit louder and clearer?",
              variant: "destructive",
            });
            setIsProcessing(false);
            return;
          }
          
          // Add user response
          const userTurn: DialogueTurn = {
            speaker: 'user',
            text: userText
          };
          
          setDialogueHistory(prev => [...prev, userTurn]);
          
          // Generate character's contextual response
          const contextualResponse = await generateContextualResponse(userText);
          
          // Generate TTS for character response
          const ttsResponse: any = await apiRequest('POST', '/api/tts', {
            text: contextualResponse.text,
            voiceId: 'female_friendly'
          });
          
          const characterResponse: DialogueTurn = {
            speaker: 'character',
            text: contextualResponse.text,
            audioUrl: ttsResponse.audioUrl,
            feedback: contextualResponse.feedback,
            emotion: contextualResponse.emotion
          };
          
          setDialogueHistory(prev => [...prev, characterResponse]);
          setSceneProgress(prev => Math.min(prev + 15, 100));
          
          // Play character response
          setTimeout(() => {
            if (audioRef.current && ttsResponse.audioUrl) {
              console.log('Playing character response audio');
              audioRef.current.src = ttsResponse.audioUrl;
              audioRef.current.play()
                .then(() => console.log('Character response audio played'))
                .catch(error => {
                  console.error('Character audio failed:', error);
                  toast({
                    title: "Audio Playback Issue",
                    description: "Use the replay button if needed.",
                  });
                });
            }
          }, 500);
          
          // Show feedback
          if (contextualResponse.feedback) {
            const { accuracy, pronunciation } = contextualResponse.feedback;
            toast({
              title: `🎭 Acting Score: ${accuracy}%`,
              description: pronunciation === 'excellent' ? "Perfect delivery!" : 
                          pronunciation === 'good' ? "Great job!" : "Keep practicing your pronunciation!",
            });
          }
          
        } catch (error) {
          console.error('Processing error:', error);
          toast({
            title: "Scene Error",
            description: "Something went wrong during the scene. Let's continue!",
            variant: "destructive",
          });
        }
      };
      
      reader.readAsDataURL(audioBlob);
      
    } catch (error) {
      console.error('Recording processing failed:', error);
    } finally {
      setIsProcessing(false);
    }
  };

  const generateContextualResponse = async (userInput: string) => {
    try {
      const prompt = `You are ${character.name}, a ${character.style} ${currentScenario?.characterRole} in a ${currentScenario?.situation} scenario.

The user (${currentScenario?.userRole}) just said: "${userInput}"

Scenario context: ${currentScenario?.situation}
Common expressions: ${currentScenario?.expressions.join(', ')}

Respond naturally as the ${currentScenario?.characterRole} would, advancing the scenario. Also provide pronunciation feedback.

Respond in JSON format:
{
  "text": "Your natural response as the character",
  "feedback": {
    "accuracy": 85,
    "pronunciation": "good",
    "suggestions": ["Helpful pronunciation tips"]
  },
  "emotion": "professional"
}`;

      const response: any = await apiRequest('POST', '/api/conversation-response', {
        userInput,
        conversationHistory: dialogueHistory.map(turn => ({
          speaker: turn.speaker,
          text: turn.text
        })),
        character: {
          name: character.name,
          style: character.style
        },
        topic: currentScenario?.situation || "English conversation"
      });
      
      return {
        text: response.response || "That's interesting! Please continue.",
        feedback: response.feedback || { accuracy: 80, pronunciation: 'good', suggestions: [] },
        emotion: 'professional'
      };
      
    } catch (error) {
      console.error('Failed to generate contextual response:', error);
      return {
        text: "I see! Please tell me more about that.",
        feedback: { accuracy: 75, pronunciation: 'good', suggestions: ['Keep practicing!'] },
        emotion: 'neutral'
      };
    }
  };

  const playAudio = (turn: DialogueTurn) => {
    if (turn.audioUrl && audioRef.current) {
      console.log('Manual play audio triggered');
      audioRef.current.src = turn.audioUrl;
      audioRef.current.play()
        .then(() => console.log('Manual audio playback successful'))
        .catch(error => {
          console.error('Manual audio playback failed:', error);
          toast({
            title: "Audio Playback Failed",
            description: "Try refreshing the page or check your audio settings.",
            variant: "destructive"
          });
        });
    }
  };

  const startContinuousListening = async () => {
    if (!autoListenMode) return;
    
    try {
      await startListening();
    } catch (error) {
      console.error('Auto listen failed:', error);
      setAutoListenMode(false);
    }
  };

  // Auto-listen after character finishes speaking
  useEffect(() => {
    if (autoListenMode && dialogueHistory.length > 0) {
      const lastTurn = dialogueHistory[dialogueHistory.length - 1];
      if (lastTurn.speaker === 'character' && !isListening && !isProcessing) {
        // Start listening 2 seconds after character finishes
        const timeout = setTimeout(() => {
          if (autoListenMode && !isListening && !isProcessing) {
            startListening();
          }
        }, 2000);
        
        return () => clearTimeout(timeout);
      }
    }
  }, [dialogueHistory, autoListenMode, isListening, isProcessing]);

  const resetScene = () => {
    setDialogueHistory([]);
    setSceneProgress(0);
    setAutoListenMode(false);
    if (currentScenario) {
      startScenario(currentScenario);
    }
  };

  if (!character.name || !scenario.presetKey) {
    return (
      <div className="container mx-auto px-4 py-8">
        <Card>
          <CardContent className="p-8 text-center">
            <h2 className="text-2xl font-bold mb-4">Setup Required</h2>
            <p className="text-gray-600 mb-6">Please create your character and select a scenario first.</p>
            <div className="space-x-4">
              <Button onClick={() => setCurrentPage('character')}>
                Create Character
              </Button>
              <Button onClick={() => setCurrentPage('scenario')} variant="outline">
                Choose Scenario
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!currentScenario) {
    return <div className="flex items-center justify-center h-screen">Loading scene...</div>;
  }

  return (
    <div 
      className="min-h-screen relative"
      style={{ 
        background: currentScenario.background,
        backgroundSize: 'cover',
        backgroundPosition: 'center'
      }}
    >
      {/* Overlay for readability */}
      <div className="absolute inset-0 bg-black bg-opacity-30"></div>
      
      <div className="relative z-10 container mx-auto px-4 py-4 h-screen flex flex-col">
        {/* Scene Header */}
        <div className="flex items-center justify-between mb-4 bg-black bg-opacity-50 rounded-lg p-4">
          <div className="flex items-center gap-4">
            {character.imageUrl && (
              <div className="relative">
                <img 
                  src={character.imageUrl} 
                  alt={character.name}
                  className="w-16 h-16 rounded-full object-cover border-4 border-white shadow-lg"
                />
                <div className="absolute -bottom-1 -right-1 w-5 h-5 bg-green-500 rounded-full border-2 border-white"></div>
              </div>
            )}
            <div>
              <h1 className="text-white text-xl font-bold">{character.name}</h1>
              <p className="text-gray-300 text-sm">{currentScenario.characterRole}</p>
              <Badge variant="secondary" className="mt-1">
                {currentScenario.situation}
              </Badge>
            </div>
          </div>
          
          <div className="text-right">
            <Progress value={sceneProgress} className="w-32 mb-2" />
            <p className="text-white text-sm">Scene Progress: {sceneProgress}%</p>
            <Button variant="ghost" size="sm" onClick={resetScene} className="text-white">
              <RotateCcw className="w-4 h-4" />
            </Button>
          </div>
        </div>

        {/* Dialogue History */}
        <div className="flex-1 overflow-y-auto mb-4 space-y-4">
          {dialogueHistory.map((turn, index) => (
            <div key={index}>
              {turn.speaker === 'system' && (
                <Card className="bg-blue-900 bg-opacity-80 border-blue-500">
                  <CardContent className="p-4">
                    <pre className="text-white text-sm whitespace-pre-wrap">{turn.text}</pre>
                  </CardContent>
                </Card>
              )}
              
              {turn.speaker === 'character' && (
                <div className="flex items-start gap-3">
                  <div className="w-10 h-10 rounded-full bg-purple-500 flex items-center justify-center">
                    <span className="text-white font-bold text-sm">{character.name[0]}</span>
                  </div>
                  <div className="flex-1">
                    <Card className="bg-white bg-opacity-90">
                      <CardContent className="p-4">
                        <p className="text-gray-800">{turn.text}</p>
                        {turn.audioUrl && (
                          <Button 
                            variant="ghost" 
                            size="sm" 
                            onClick={() => playAudio(turn)}
                            className="mt-2 text-purple-600 hover:text-purple-800"
                          >
                            <Play className="w-4 h-4 mr-1" />
                            Replay
                          </Button>
                        )}
                      </CardContent>
                    </Card>
                  </div>
                </div>
              )}
              
              {turn.speaker === 'user' && (
                <div className="flex items-start gap-3 justify-end">
                  <div className="flex-1 text-right">
                    <Card className="bg-blue-500 bg-opacity-90 inline-block">
                      <CardContent className="p-4">
                        <p className="text-white">{turn.text}</p>
                        {turn.feedback && (
                          <div className="mt-2 text-xs text-blue-100">
                            <p>Accuracy: {turn.feedback.accuracy}%</p>
                            {turn.feedback.pronunciation && (
                              <p>Pronunciation: {turn.feedback.pronunciation}</p>
                            )}
                          </div>
                        )}
                      </CardContent>
                    </Card>
                  </div>
                  <div className="w-10 h-10 rounded-full bg-blue-500 flex items-center justify-center">
                    <span className="text-white font-bold text-sm">You</span>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>

        {/* Voice Input */}
        <div className="bg-black bg-opacity-50 rounded-lg p-4">
          {isListening && (
            <div className="mb-4 text-center">
              <p className="text-white text-sm mb-2">🎤 Acting in progress... Speak your lines!</p>
              <Progress value={audioLevel} className="w-64 mx-auto" />
            </div>
          )}

          {isProcessing && (
            <div className="mb-4 text-center">
              <p className="text-white text-sm">🎭 Analyzing your performance...</p>
            </div>
          )}

          <div className="flex justify-center gap-4">
            {!isListening && !isProcessing && (
              <>
                <Button
                  size="lg"
                  onClick={startListening}
                  className="bg-red-600 hover:bg-red-700 text-white rounded-full px-8 py-4"
                >
                  <Mic className="w-5 h-5 mr-2" />
                  🎬 ACTION!
                </Button>
                
                <Button
                  size="lg"
                  onClick={() => {
                    setAutoListenMode(!autoListenMode);
                    if (!autoListenMode) {
                      startContinuousListening();
                    }
                  }}
                  variant={autoListenMode ? "destructive" : "outline"}
                  className="rounded-full px-6 py-4"
                >
                  <Mic className="w-4 h-4 mr-2" />
                  {autoListenMode ? "Stop Auto" : "Auto Listen"}
                </Button>
              </>
            )}

            {isListening && (
              <Button
                size="lg"
                onClick={stopListening}
                variant="destructive"
                className="rounded-full px-8 py-4"
              >
                <MicOff className="w-5 h-5 mr-2" />
                Stop
              </Button>
            )}

            {isProcessing && (
              <Button size="lg" disabled className="rounded-full px-8 py-4">
                Processing...
              </Button>
            )}
          </div>

          <div className="text-center mt-4">
            <p className="text-white text-sm">
              🎭 You're the {currentScenario.userRole}. Respond naturally to {character.name}!
            </p>
            <p className="text-gray-300 text-xs mt-1">
              Objective: {currentScenario.objective}
            </p>
          </div>
        </div>

        {/* Audio element with controls for debugging */}
        <audio 
          ref={audioRef} 
          controls={false}
          preload="auto"
          onError={(e) => console.error('Audio element error:', e)}
          onCanPlay={() => console.log('Audio can play')}
          onPlay={() => console.log('Audio started playing')}
          onPause={() => console.log('Audio paused')}
        />
        
        {/* Debug audio player - remove this later */}
        <div className="fixed bottom-2 left-2 bg-black bg-opacity-75 text-white p-2 rounded text-xs">
          <div>Audio Debug</div>
          {dialogueHistory.filter(d => d.audioUrl).length > 0 && (
            <audio 
              controls 
              src={dialogueHistory.filter(d => d.audioUrl)[0]?.audioUrl}
              className="w-32 h-6"
            />
          )}
        </div>
      </div>
    </div>
  );
}