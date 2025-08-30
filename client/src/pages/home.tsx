import { useAppStore } from '@/store/useAppStore';
import { AUDIENCE_THEMES } from '@/constants/presets';
import AudienceCard from '@/components/audience-card';

export default function Home() {
  const { setAudience, setCurrentPage } = useAppStore();

  const handleAudienceSelect = (audience: 'student' | 'general' | 'business') => {
    setAudience(audience);
    setCurrentPage('scenario');
  };

  return (
    <div className="animate-slide-up">
      <div className="text-center mb-12">
        <h2 className="text-4xl font-poppins font-bold text-gray-900 mb-4">
          Choose Your Learning Journey
        </h2>
        <p className="text-lg text-gray-600 max-w-2xl mx-auto">
          Select your level to get personalized English conversation practice with your AI tutor
        </p>
      </div>

      <div className="grid md:grid-cols-3 gap-8 mb-12">
        <AudienceCard
          audience="student"
          title="Middle/High School"
          description="Fun, interactive learning with school-life scenarios"
          icon="fas fa-school"
          scenarios={[
            { icon: 'fas fa-utensils', text: 'Cafeteria conversations' },
            { icon: 'fas fa-users', text: 'Club activities' },
            { icon: 'fas fa-map-marked-alt', text: 'School trips' },
          ]}
          cefr="A2-B1"
          theme={AUDIENCE_THEMES.student}
          onClick={() => handleAudienceSelect('student')}
        />

        <AudienceCard
          audience="general"
          title="College/General"
          description="Real-life situations for everyday conversations"
          icon="fas fa-coffee"
          scenarios={[
            { icon: 'fas fa-plane', text: 'Travel conversations' },
            { icon: 'fas fa-briefcase', text: 'Job interviews (basic)' },
            { icon: 'fas fa-home', text: 'Roommate chats' },
          ]}
          cefr="B1-B2"
          theme={AUDIENCE_THEMES.general}
          onClick={() => handleAudienceSelect('general')}
        />

        <AudienceCard
          audience="business"
          title="Business"
          description="Professional communication for workplace success"
          icon="fas fa-building"
          scenarios={[
            { icon: 'fas fa-handshake', text: 'Meeting openers' },
            { icon: 'fas fa-chart-line', text: 'Negotiations' },
            { icon: 'fas fa-clock', text: 'Deadline follow-ups' },
          ]}
          cefr="B2-C1"
          theme={AUDIENCE_THEMES.business}
          onClick={() => handleAudienceSelect('business')}
        />
      </div>
    </div>
  );
}
