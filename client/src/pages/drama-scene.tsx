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
    situation: "You're dining at an upscale restaurant",
    userRole: "Customer", 
    characterRole: "Professional Server",
    objective: "Have a natural dining experience with proper etiquette",
    expressions: ["Good evening, welcome to our restaurant", "May I recommend our chef's special?", "How would you like that cooked?", "Would you care for dessert?"]
  },
  airport: {
    background: "linear-gradient(135deg, #87CEEB 0%, #4682B4 50%, #2F4F4F 100%)",
    situation: "You're checking in for an international business class flight",
    userRole: "Business Traveler",
    characterRole: "Flight Attendant",
    objective: "Complete check-in and receive premium service guidance",
    expressions: ["Welcome aboard, may I see your boarding pass?", "Would you like champagne or orange juice?", "Our meal service begins shortly", "Please let me know if you need anything"]
  },
  coffee_shop: {
    background: "linear-gradient(135deg, #8B4513 0%, #D2691E 50%, #654321 100%)",
    situation: "You're at a trendy local coffee shop meeting a friend",
    userRole: "Customer",
    characterRole: "Friendly Barista",
    objective: "Order specialty coffee and engage in casual conversation",
    expressions: ["Hey there! What can I craft for you today?", "That's our signature blend", "Would you like to try our new seasonal latte?", "Are you meeting someone special today?"]
  },
  business_meeting: {
    background: "linear-gradient(135deg, #2F4F4F 0%, #708090 50%, #B0C4DE 100%)",
    situation: "You're in a corporate meeting discussing a new project",
    userRole: "Project Manager",
    characterRole: "Senior Executive",
    objective: "Present ideas professionally and negotiate terms",
    expressions: ["Thank you for joining today's meeting", "What's your take on the market analysis?", "I'd like to propose an alternative approach", "When can we expect the deliverables?"]
  },
  hotel: {
    background: "linear-gradient(135deg, #DAA520 0%, #B8860B 50%, #8B7355 100%)",
    situation: "You're checking into a luxury hotel",
    userRole: "Hotel Guest",
    characterRole: "Concierge",
    objective: "Get personalized recommendations and luxury service",
    expressions: ["Welcome to our hotel, how was your journey?", "I'd be happy to arrange restaurant reservations", "Our spa services are highly recommended", "Is there anything special we can arrange for your stay?"]
  },
  // Additional scenarios for student audience
  cafeteria: {
    background: "linear-gradient(135deg, #87CEEB 0%, #98FB98 50%, #F0E68C 100%)",
    situation: "You're in the school cafeteria ordering lunch",
    userRole: "Student",
    characterRole: "Cafeteria Staff",
    objective: "Order lunch and practice casual conversation",
    expressions: ["What would you like for lunch today?", "Would you like fries with that?", "Here's your meal, enjoy!", "Have a great day!"]
  },
  club: {
    background: "linear-gradient(135deg, #FFB6C1 0%, #98FB98 50%, #87CEEB 100%)",
    situation: "You're joining a school club activity",
    userRole: "New Member",
    characterRole: "Club Leader",
    objective: "Introduce yourself and learn about club activities",
    expressions: ["Welcome to our club!", "What are you interested in?", "We meet every Tuesday", "Looking forward to working with you!"]
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
    // Get scenario config with fallback
    const scenarioKey = scenario.presetKey || 'restaurant';
    const scenarioConfig = SCENARIOS[scenarioKey] || SCENARIOS['restaurant'];
    
    console.log('Available scenarios:', Object.keys(SCENARIOS));
    console.log('Requested scenario:', scenarioKey);
    console.log('Using scenario config:', scenarioConfig);
    
    setCurrentScenario(scenarioConfig);
    
    // Start the scene with character introduction
    if (scenarioConfig) {
      startScenario(scenarioConfig);
    }
  };

  const startScenario = async (scenarioConfig: ScenarioConfig) => {
    console.log('Starting scenario with config:', scenarioConfig);
    const openingLine = generateOpeningLine(scenarioConfig);
    console.log('Generated opening line:', openingLine);
    
    try {
      console.log('Calling TTS API...');
      // Generate character's opening dialogue with TTS
      const voiceId = getVoiceForCharacter(character.gender, scenarioConfig.characterRole);
      console.log(`Using voice: ${voiceId} for ${character.gender} ${scenarioConfig.characterRole}`);
      
      const ttsResponse: any = await apiRequest('POST', '/api/tts', {
        text: openingLine,
        voiceId: voiceId,
        character: {
          style: character.style,
          gender: character.gender,
          role: scenarioConfig.characterRole
        },
        emotion: 'friendly'
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
        text: `🎬 Scene: ${scenarioConfig?.situation || 'English practice'}\nYour role: ${scenarioConfig?.userRole || 'Student'}\n${character.name}'s role: ${scenarioConfig?.characterRole || 'Teacher'}`
      };
      
      console.log('Setting dialogue history...');
      setDialogueHistory([systemTurn, openingTurn]);
      setSceneProgress(10);
      
      // Auto-play opening line with fallback
      setTimeout(() => {
        playAudioWithFallback(openingLine, ttsResponse?.audioUrl);
        toast({
          title: `🎭 ${character.name} is speaking!`,
          description: "The scene has begun. Listen and respond when ready."
        });
      }, 1500);
      
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
        text: `🎬 Scene: ${scenarioConfig?.situation || 'English practice'}\nYour role: ${scenarioConfig?.userRole || 'Student'}\n${character.name}'s role: ${scenarioConfig?.characterRole || 'Teacher'}`
      };
      
      setDialogueHistory([systemTurn, openingTurn]);
      setSceneProgress(10);
    }
  };

  const generateOpeningLine = (scenarioConfig: ScenarioConfig): string => {
    const openings: Record<string, string[]> = {
      restaurant: [
        "Good evening! Welcome to our restaurant. I'm Sarah, and I'll be taking care of you tonight. Have you dined with us before?",
        "Hello! Thank you for choosing our restaurant this evening. May I start you with our sommelier's wine recommendation?",
        "Welcome! I'm delighted you're here. Our chef has prepared some exceptional specials tonight - would you like to hear about them?"
      ],
      airport: [
        "Good afternoon! Welcome aboard our business class service. I'm Jennifer, your flight attendant. May I offer you a welcome drink?",
        "Hello! Thank you for flying with us today. I see you're in 3A - one of our premium seats. How was your airport experience?",
        "Welcome aboard! I'm here to ensure you have a comfortable flight. Would you like me to hang up your jacket?"
      ],
      coffee_shop: [
        "Hey there! Welcome to our little coffee haven. I'm Mike - what can I create for you today?",
        "Good morning! Love the weather today, isn't it perfect for our outdoor seating? What sounds good to you?",
        "Hi! First time here? You've got to try our signature cold brew - it's locally roasted and absolutely amazing!"
      ],
      business_meeting: [
        "Good morning everyone. Thank you for making time for today's meeting. I'm excited to discuss our new initiative with you.",
        "Hello team. I appreciate you all being here. Shall we begin with a quick overview of where we stand?",
        "Welcome! Before we dive into the agenda, how did the preliminary research go on your end?"
      ],
      hotel: [
        "Welcome to the Grand Plaza! I'm Alexandra, your personal concierge. How was your journey here?",
        "Good afternoon! We're so pleased to have you staying with us. Is this your first visit to our city?",
        "Hello! Welcome to our hotel. I see you've booked our executive suite - excellent choice. May I arrange anything special for your stay?"
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

  const getVoiceForCharacter = (gender: string, role: string) => {
    if (gender === 'female') {
      if (role === 'Server' || role === 'Cafeteria Staff') return 'alloy';
      if (role === 'Flight Attendant') return 'nova';
      if (role === 'Concierge') return 'shimmer';
      return 'alloy'; // default female voice
    } else {
      if (role === 'Barista') return 'onyx';
      if (role === 'Business Executive') return 'echo';
      return 'echo'; // default male voice
    }
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
          
          // Generate TTS for character response with character info
          const voiceId = getVoiceForCharacter(character.gender, currentScenario?.characterRole || 'Teacher');
          const ttsResponse: any = await apiRequest('POST', '/api/tts', {
            text: contextualResponse.text,
            voiceId: voiceId,
            character: {
              style: character.style,
              gender: character.gender,
              role: currentScenario?.characterRole
            },
            emotion: contextualResponse.emotion || 'friendly'
          });
          
          const characterResponse: DialogueTurn = {
            speaker: 'character',
            text: contextualResponse.text,
            audioUrl: ttsResponse.audioUrl,
            feedback: contextualResponse.feedback,
            emotion: (contextualResponse.emotion as 'neutral' | 'happy' | 'concerned' | 'professional') || 'professional'
          };
          
          setDialogueHistory(prev => [...prev, characterResponse]);
          setSceneProgress(prev => Math.min(prev + 15, 100));
          
          // Play character response with fallback
          setTimeout(() => {
            playAudioWithFallback(contextualResponse.text, ttsResponse?.audioUrl);
          }, 500);
          
          // Show feedback with better expression suggestions
          if (contextualResponse.feedback) {
            const { accuracy, pronunciation, betterExpression } = contextualResponse.feedback;
            
            toast({
              title: `🎭 표현력 점수: ${accuracy}%`,
              description: betterExpression ? 
                `더 자연스러운 표현: "${betterExpression}"` :
                pronunciation === 'excellent' ? "완벽한 발음이에요!" : 
                pronunciation === 'good' ? "훌륭해요!" : "발음 연습을 더 해보세요!",
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
      // Handle Korean custom scenarios
      const scenarioContext = currentScenario ? 
        `${currentScenario.situation}` : 
        scenario.freeText || 'English conversation practice';
      
      const characterRole = currentScenario?.characterRole || 'English conversation partner';
      const userRole = currentScenario?.userRole || 'English learner';
      
      const prompt = `You are ${character.name}, playing the role of ${characterRole} in this scenario: "${scenarioContext}"

The user (${userRole}) just said: "${userInput}"

Please respond naturally as the ${characterRole} would, advancing the conversation. Also provide helpful feedback.

If the user's expression could be improved, suggest a more natural or appropriate alternative.

Respond in JSON format:
{
  "text": "Your natural response as the character (in English)",
  "feedback": {
    "accuracy": 85,
    "pronunciation": "good", 
    "suggestions": ["Helpful tips for improvement"],
    "betterExpression": "A more natural alternative expression"
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

  const playAudioWithFallback = (text: string, audioUrl?: string) => {
    // Try Supertone audio first
    if (audioUrl && audioRef.current) {
      console.log('Playing Supertone audio');
      audioRef.current.src = audioUrl;
      audioRef.current.play()
        .then(() => console.log('Supertone audio played'))
        .catch(error => {
          console.error('Supertone audio failed, using browser TTS:', error);
          speakWithBrowserTTS(text);
        });
    } else {
      // Fallback to browser TTS
      console.log('Using browser TTS fallback');
      speakWithBrowserTTS(text);
    }
  };

  const speakWithBrowserTTS = (text: string) => {
    if ('speechSynthesis' in window) {
      // Cancel any ongoing speech
      speechSynthesis.cancel();
      
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.lang = 'en-US';
      utterance.rate = 0.85;
      utterance.pitch = character.gender === 'female' ? 1.2 : 0.9;
      utterance.volume = 0.9;
      
      // Select appropriate voice based on character gender
      const voices = speechSynthesis.getVoices();
      let selectedVoice;
      
      if (character.gender === 'female') {
        selectedVoice = voices.find(voice => 
          voice.name.toLowerCase().includes('female') || 
          voice.name.toLowerCase().includes('woman') ||
          voice.name.toLowerCase().includes('samantha') ||
          voice.name.toLowerCase().includes('karen') ||
          voice.name.toLowerCase().includes('zira') ||
          voice.name.toLowerCase().includes('susan')
        );
      } else {
        selectedVoice = voices.find(voice => 
          voice.name.toLowerCase().includes('male') || 
          voice.name.toLowerCase().includes('man') ||
          voice.name.toLowerCase().includes('david') ||
          voice.name.toLowerCase().includes('mark') ||
          voice.name.toLowerCase().includes('paul')
        );
      }
      
      if (selectedVoice) {
        utterance.voice = selectedVoice;
      }
      
      utterance.onstart = () => console.log('Browser TTS started');
      utterance.onend = () => console.log('Browser TTS finished');
      utterance.onerror = (error) => console.error('Browser TTS error:', error);
      
      speechSynthesis.speak(utterance);
      
      toast({
        title: "Using Browser Voice",
        description: "External voice service unavailable, using system voice.",
      });
    } else {
      console.error('Browser TTS not supported');
      toast({
        title: "Voice Not Available",
        description: "Your browser doesn't support text-to-speech.",
        variant: "destructive"
      });
    }
  };

  const playAudio = (turn: DialogueTurn) => {
    playAudioWithFallback(turn.text, turn.audioUrl);
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
                  className="w-48 h-64 rounded-lg object-cover object-top border-4 border-white shadow-lg"
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
                  {character.imageUrl ? (
                    <img 
                      src={character.imageUrl} 
                      alt={character.name}
                      className="w-16 h-20 rounded-lg object-cover object-top border-2 border-purple-500 shadow-md"
                    />
                  ) : (
                    <div className="w-10 h-10 rounded-full bg-purple-500 flex items-center justify-center">
                      <span className="text-white font-bold text-sm">{character.name[0]}</span>
                    </div>
                  )}
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