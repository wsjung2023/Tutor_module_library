import React, { useState, useRef, useEffect } from 'react';
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
    pronunciation?: string;
    suggestions?: string[];
    needsCorrection?: boolean;
    koreanExplanation?: string;
    betterExpression?: string;
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
  const [conversationEnded, setConversationEnded] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [recordedConversation, setRecordedConversation] = useState<string[]>([]);
  const [awaitingRetry, setAwaitingRetry] = useState(false);
  
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
      
      const ttsResponseRaw = await apiRequest('POST', '/api/tts', {
        text: openingLine,
        voiceId: voiceId,
        character: {
          style: character.style,
          gender: character.gender,
          role: scenarioConfig.characterRole
        },
        emotion: 'friendly'
      });
      
      const ttsResponse = await ttsResponseRaw.json();
      
      console.log('TTS Response received:', ttsResponse ? 'Success' : 'Failed');
      console.log('TTS full response:', ttsResponse);
      console.log('TTS audioUrl:', ttsResponse?.audioUrl ? 'Available' : 'Missing');
      
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
        if (ttsResponse?.audioUrl) {
          console.log('Playing TTS audio:', ttsResponse.audioUrl.substring(0, 50) + '...');
          playAudioWithFallback(openingLine, ttsResponse.audioUrl);
        } else {
          console.warn('No audio URL available, playing with browser TTS fallback');
          playAudioWithFallback(openingLine);
        }
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
        `Good evening! Welcome to our restaurant. I'm ${character.name}, and I'll be taking care of you tonight. Have you dined with us before?`,
        `Hello! Thank you for choosing our restaurant this evening. I'm ${character.name}. May I start you with our sommelier's wine recommendation?`,
        `Welcome! I'm ${character.name}, and I'm delighted you're here. Our chef has prepared some exceptional specials tonight - would you like to hear about them?`
      ],
      airport: [
        `Good afternoon! Welcome aboard our business class service. I'm ${character.name}, your flight attendant. May I offer you a welcome drink?`,
        `Hello! Thank you for flying with us today. I'm ${character.name}. I see you're in 3A - one of our premium seats. How was your airport experience?`,
        `Welcome aboard! I'm ${character.name}, and I'm here to ensure you have a comfortable flight. Would you like me to hang up your jacket?`
      ],
      coffee_shop: [
        `Hey there! Welcome to our little coffee haven. I'm ${character.name} - what can I create for you today?`,
        `Good morning! I'm ${character.name}. Love the weather today, isn't it perfect for our outdoor seating? What sounds good to you?`,
        `Hi! I'm ${character.name}. First time here? You've got to try our signature cold brew - it's locally roasted and absolutely amazing!`
      ],
      business_meeting: [
        `Good morning everyone. I'm ${character.name}. Thank you for making time for today's meeting. I'm excited to discuss our new initiative with you.`,
        `Hello team. I'm ${character.name}, and I appreciate you all being here. Shall we begin with a quick overview of where we stand?`,
        `Welcome! I'm ${character.name}. Before we dive into the agenda, how did the preliminary research go on your end?`
      ],
      hotel: [
        `Welcome to the Grand Plaza! I'm ${character.name}, your personal concierge. How was your journey here?`,
        `Good afternoon! I'm ${character.name}, and we're so pleased to have you staying with us. Is this your first visit to our city?`,
        `Hello! I'm ${character.name}. Welcome to our hotel. I see you've booked our executive suite - excellent choice. May I arrange anything special for your stay?`
      ],
      cafeteria: [
        `Hi there! I'm ${character.name}, and welcome to our cafeteria! What would you like for lunch today?`,
        `Good afternoon! I'm ${character.name}. Our daily special looks amazing today - would you like to hear about it?`,
        `Hey! I'm ${character.name}. First time in our cafeteria? Let me help you find something delicious!`
      ],
      club: [
        `Welcome to our club! I'm ${character.name}, the club leader. We're so excited to have you join us!`,
        `Hi there! I'm ${character.name}. Thanks for coming to our club meeting - what brings you here today?`,
        `Hello! I'm ${character.name}, and welcome to our weekly gathering. What are you most interested in learning about?`
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
          const speechResponseRaw = await apiRequest('POST', '/api/speech-recognition', {
            audioBlob: base64Audio,
            language: 'en'
          });
          
          const speechResponse = await speechResponseRaw.json();
          
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
          
          // Record user input for session replay
          setRecordedConversation(prev => [...prev, `You: ${userText}`]);
          
          // Generate character's contextual response
          const contextualResponse = await generateContextualResponse(userText);
          
          // Check if correction is needed
          if (contextualResponse.feedback?.needsCorrection) {
            setAwaitingRetry(true);
            toast({
              title: "💬 표현 교정",
              description: contextualResponse.feedback.koreanExplanation || "다시 한번 말해보세요!",
              variant: "default",
            });
            
            // Don't add character response, wait for user to retry
            setIsProcessing(false);
            return;
          }
          
          // Record character response
          setRecordedConversation(prev => [...prev, `${character.name}: ${contextualResponse.text}`]);
          
          // Check if conversation should end
          if (contextualResponse.shouldEndConversation) {
            setConversationEnded(true);
            toast({
              title: "🎬 시나리오 완료",
              description: "대화가 자연스럽게 마무리되었습니다!",
            });
          }
          
          // Generate TTS for character response with character info
          const voiceId = getVoiceForCharacter(character.gender, currentScenario?.characterRole || 'Teacher');
          const ttsResponseRaw = await apiRequest('POST', '/api/tts', {
            text: contextualResponse.text,
            voiceId: voiceId,
            character: {
              style: character.style,
              gender: character.gender,
              role: currentScenario?.characterRole
            },
            emotion: contextualResponse.emotion || 'friendly'
          });
          
          const ttsResponse = await ttsResponseRaw.json();
          
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
          if (contextualResponse.feedback && !contextualResponse.feedback.needsCorrection) {
            const { accuracy, betterExpression } = contextualResponse.feedback;
            
            if (betterExpression) {
              toast({
                title: `💡 더 자연스러운 표현 (${accuracy}점)`,
                description: `"${betterExpression}" 이렇게 말하면 더 좋아요!`,
              });
            } else if (accuracy >= 90) {
              toast({
                title: "✨ 완벽해요!",
                description: `정확도 ${accuracy}% - 훌륭한 표현입니다!`,
              });
            }
          }
          
          setAwaitingRetry(false);
          
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

      const responseRaw = await apiRequest('POST', '/api/conversation-response', {
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
      
      const response = await responseRaw.json();
      console.log('Generated response:', response.response);
      
      return {
        text: response.response || "That's interesting! Please continue.",
        feedback: response.feedback || { accuracy: 80, pronunciation: 'good', suggestions: [] },
        emotion: 'professional',
        shouldEndConversation: response.shouldEndConversation || false
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
    // Only use OpenAI TTS - no browser TTS fallback
    if (audioUrl && audioRef.current) {
      console.log('Playing OpenAI TTS audio');
      audioRef.current.src = audioUrl;
      audioRef.current.oncanplaythrough = () => {
        audioRef.current?.play()
          .then(() => {
            console.log('OpenAI TTS audio played successfully');
          })
          .catch(error => {
            console.error('OpenAI TTS audio playback failed:', error);
            toast({
              title: "Audio Error",
              description: "Failed to play audio",
              variant: "destructive"
            });
          });
      };
      audioRef.current.onerror = (error) => {
        console.error('Audio loading error:', error);
        toast({
          title: "Audio Error", 
          description: "Failed to load audio",
          variant: "destructive"
        });
      };
      // Start loading the audio
      audioRef.current.load();
    } else {
      console.warn('No audio URL provided - skipping audio playback');
      // No toast notification for missing audio to avoid spam
    }
  };

  // Browser TTS completely removed - only OpenAI TTS is used

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
      
      <div className="relative z-10 px-4 py-2 h-screen flex flex-col max-w-md mx-auto">
        {/* Mobile Scene Header */}
        <div className="bg-black bg-opacity-60 rounded-lg p-3 mb-3">
          <div className="flex items-center gap-3">
            {character.imageUrl && (
              <div className="relative">
                <img 
                  src={character.imageUrl} 
                  alt={character.name}
                  className="w-16 h-20 rounded-lg object-cover object-top border-2 border-white shadow-lg"
                />
                <div className="absolute -bottom-1 -right-1 w-3 h-3 bg-green-500 rounded-full border border-white"></div>
              </div>
            )}
            <div className="flex-1">
              <h1 className="text-white text-lg font-bold">{character.name}</h1>
              <p className="text-gray-300 text-xs">{currentScenario.characterRole}</p>
              <div className="flex items-center justify-between mt-1">
                <span className="text-gray-400 text-xs">{currentScenario.situation}</span>
                <div className="text-right">
                  <Progress value={sceneProgress} className="w-20 h-1 mb-1" />
                  <p className="text-white text-xs">{sceneProgress}%</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Mobile Chat History */}
        <div className="flex-1 overflow-y-auto mb-3 space-y-2">
          {dialogueHistory.map((turn, index) => (
            <div key={index}>
              {turn.speaker === 'system' && (
                <div className="bg-blue-900 bg-opacity-70 rounded-lg p-2 mx-4">
                  <pre className="text-white text-xs whitespace-pre-wrap text-center">{turn.text}</pre>
                </div>
              )}
              
              {turn.speaker === 'character' && (
                <div className="flex items-start gap-2">
                  <img 
                    src={character.imageUrl} 
                    alt={character.name}
                    className="w-8 h-10 rounded object-cover object-top border border-purple-300"
                  />
                  <div className="flex-1 max-w-xs">
                    <div className="bg-white bg-opacity-95 rounded-lg p-3 shadow-sm">
                      <p className="text-gray-800 text-sm">{turn.text}</p>
                      {turn.audioUrl && (
                        <Button 
                          variant="ghost" 
                          size="sm" 
                          onClick={() => playAudio(turn)}
                          className="mt-1 p-1 h-6 text-purple-600"
                        >
                          <Play className="w-3 h-3 mr-1" />
                          Replay
                        </Button>
                      )}
                    </div>
                  </div>
                </div>
              )}
              
              {turn.speaker === 'user' && (
                <div className="flex items-start gap-2 justify-end">
                  <div className="flex-1 max-w-xs">
                    <div className="bg-blue-500 text-white rounded-lg p-3 ml-8">
                      <p className="text-sm">{turn.text}</p>
                      {turn.feedback && (
                        <div className="mt-1 text-xs text-blue-100">
                          Score: {turn.feedback.accuracy}%
                        </div>
                      )}
                    </div>
                  </div>
                  <div className="w-8 h-8 rounded-full bg-blue-500 flex items-center justify-center">
                    <span className="text-white font-bold text-xs">You</span>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>

        {/* Mobile Voice Input */}
        <div className="bg-black bg-opacity-60 rounded-lg p-3">
          {isListening && (
            <div className="mb-3 text-center">
              <p className="text-white text-xs mb-2">🎤 Listening... Speak clearly!</p>
              <Progress value={audioLevel} className="w-full h-2" />
            </div>
          )}

          {isProcessing && (
            <div className="mb-3 text-center">
              <p className="text-white text-xs">🎭 Processing...</p>
            </div>
          )}

          <div className="flex justify-center gap-2 flex-wrap">
            {!conversationEnded && !isListening && !isProcessing && (
              <>
                <Button
                  size="sm"
                  onClick={startListening}
                  className={`rounded-full px-4 py-2 ${awaitingRetry ? 'bg-orange-600 hover:bg-orange-700' : 'bg-red-600 hover:bg-red-700'} text-white`}
                >
                  <Mic className="w-4 h-4 mr-1" />
                  {awaitingRetry ? "다시 말하기" : "ACTION"}
                </Button>
                
                <Button
                  size="sm"
                  onClick={() => {
                    const script = currentScenario?.expressions || [];
                    if (script.length > 0) {
                      toast({
                        title: "📝 Example Script",
                        description: script.join(" • "),
                      });
                    }
                  }}
                  variant="secondary"
                  className="rounded-full px-3 py-2"
                >
                  📝 Script
                </Button>
                
                <Button
                  size="sm"
                  onClick={() => {
                    setIsRecording(!isRecording);
                    toast({
                      title: isRecording ? "🔴 녹음 시작" : "⏹️ 녹음 중지",
                      description: isRecording ? "대화가 녹음됩니다" : "녹음이 중지되었습니다",
                    });
                  }}
                  variant={isRecording ? "destructive" : "outline"}
                  className="rounded-full px-3 py-2"
                >
                  {isRecording ? "🔴" : "⚫"} 녹음
                </Button>
              </>
            )}

            {conversationEnded && (
              <div className="flex gap-2">
                <Button
                  size="sm"
                  onClick={resetScene}
                  className="bg-green-600 hover:bg-green-700 text-white rounded-full px-4 py-2"
                >
                  🔄 다시 시작
                </Button>
                
                <Button
                  size="sm"
                  onClick={() => {
                    const conversation = recordedConversation.join('\n');
                    toast({
                      title: "📝 대화 기록",
                      description: `${recordedConversation.length}개의 대화가 기록되었습니다`,
                    });
                    console.log("Full conversation:", conversation);
                  }}
                  variant="secondary"
                  className="rounded-full px-3 py-2"
                >
                  📝 대화보기
                </Button>
              </div>
            )}

            {isListening && (
              <Button
                size="sm"
                onClick={stopListening}
                variant="destructive"
                className="rounded-full px-4 py-2"
              >
                <MicOff className="w-4 h-4 mr-1" />
                Stop
              </Button>
            )}

            {isProcessing && (
              <Button size="sm" disabled className="rounded-full px-4 py-2">
                {awaitingRetry ? "교정 중..." : "Processing..."}
              </Button>
            )}
          </div>

          <div className="text-center mt-2">
            {conversationEnded ? (
              <p className="text-green-400 text-xs">
                🎬 시나리오 완료! 총 {recordedConversation.length}개의 대화 교환
              </p>
            ) : awaitingRetry ? (
              <p className="text-orange-400 text-xs">
                💬 표현을 교정했습니다. 다시 말해보세요!
              </p>
            ) : (
              <p className="text-white text-xs">
                🎭 You: {currentScenario.userRole} | {character.name}: {currentScenario.characterRole}
              </p>
            )}
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