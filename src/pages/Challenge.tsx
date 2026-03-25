import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import confetti from 'canvas-confetti';
import { ArrowLeft, Check, SkipForward } from 'lucide-react';
import BottomNav from '@/components/BottomNav';
import { useI18n } from '@/contexts/I18nContext';
import { getTaskTranslation } from '@/lib/taskTranslations';

interface ChallengeRecord {
  id: string;
  text: string;
  minutes: number;
  kind: string;
}

interface TaskRecord {
  id: string;
  title: string;
  description: string;
}

interface GoalRecord {
  id: string;
  xp: number;
  streak: number;
  hearts: number;
}

const Challenge = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { locale } = useI18n();
  const [challenge, setChallenge] = useState<ChallengeRecord | null>(null);
  const [task, setTask] = useState<TaskRecord | null>(null);
  const [goal, setGoal] = useState<GoalRecord | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadChallenge();
  }, [user]);

  const loadChallenge = async () => {
    try {
      const { data: goals } = await supabase
        .from('goals')
        .select('*')
        .eq('user_id', user?.id)
        .eq('active', true)
        .single();

      if (!goals) return navigate('/home');
      setGoal(goals);

      const today = new Date().toISOString().split('T')[0];
      const { data: challenges } = await supabase
        .from('challenges')
        .select('*')
        .eq('goal_id', goals.id)
        .eq('day', today)
        .single();

      if (challenges) {
        // Load task details
        const { data: taskData } = await supabase
          .from('tasks')
          .select('*')
          .eq('id', challenges.text)
          .single();
        
        setTask(taskData);
      }

      setChallenge(challenges);
    } catch (error) {
      console.error('Error:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleComplete = async () => {
    try {
      await supabase.from('challenges').update({ status: 'done' }).eq('id', challenge.id);
      await supabase.from('goals').update({
        xp: goal.xp + 10,
        streak: goal.streak + 1,
        hearts: Math.min(goal.hearts + 1, 3)
      }).eq('id', goal.id);

      confetti({ particleCount: 100, spread: 70 });
      toast.success('¡Excelente! +10 XP y racha +1 🔥');
      setTimeout(() => navigate('/home'), 1500);
    } catch (error) {
      toast.error('Error al guardar');
    }
  };

  const handleSkip = async () => {
    try {
      await supabase.from('challenges').update({ status: 'skipped' }).eq('id', challenge.id);
      await supabase.from('goals').update({ hearts: Math.max(goal.hearts - 1, 0) }).eq('id', goal.id);
      
      toast.error('Perdiste 1 vida ❤️');
      navigate('/home');
    } catch (error) {
      toast.error('Error');
    }
  };

  if (loading) return <div className="min-h-screen flex items-center justify-center"><div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div></div>;
  if (!challenge || !task) {
    navigate('/home');
    return null;
  }

  const translation = getTaskTranslation(task.id, locale);
  const displayTitle = translation?.title || task.title;
  const displayDescription = translation?.description || task.description;

  return (
    <div className="min-h-screen p-6 pb-20">
      <Button variant="ghost" onClick={() => navigate('/home')} className="mb-6">
        <ArrowLeft className="h-4 w-4 mr-2" /> Volver
      </Button>

      <Card className="shadow-card">
        <CardContent className="p-8">
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold mb-3">{displayTitle}</h1>
            <div className="flex gap-2 justify-center">
              <Badge variant="secondary">{challenge.minutes} min</Badge>
              <Badge variant="outline">{challenge.kind}</Badge>
            </div>
          </div>

          <div className="bg-gradient-hero/10 rounded-2xl p-8 mb-8">
            <p className="text-xl text-center leading-relaxed">{displayDescription}</p>
          </div>

          <div className="space-y-3">
            <Button onClick={handleComplete} className="w-full h-14 text-lg shadow-button">
              <Check className="mr-2 h-5 w-5" /> ¡Hecho!
            </Button>
            <Button onClick={handleSkip} variant="ghost" className="w-full">
              <SkipForward className="mr-2 h-4 w-4" /> Saltar por hoy
            </Button>
          </div>
        </CardContent>
      </Card>
      <BottomNav />
    </div>
  );
};

export default Challenge;
