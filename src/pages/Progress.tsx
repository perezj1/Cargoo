import { type CSSProperties, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress as ProgressBar } from "@/components/ui/progress";
import { ArrowLeft, TrendingUp, Target, Award } from "lucide-react";
import { Button } from "@/components/ui/button";
import BottomNav from "@/components/BottomNav";
import { useI18n } from "@/contexts/I18nContext";
import { CATEGORIES, getCategoryIcon, getCategoryById, getCategoryName } from "@/lib/categories";

interface CategoryStats {
  category: string;
  total: number;
  completed: number;
  percentage: number;
}

const Progress = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { t, locale } = useI18n();
  
  const [categoryStats, setCategoryStats] = useState<CategoryStats[]>([]);
  const [totalCompleted, setTotalCompleted] = useState(0);
  const [totalTasks, setTotalTasks] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) {
      navigate("/auth");
      return;
    }
    loadProgress();
  }, [user, navigate, locale]);

  const loadProgress = async () => {
    try {
      // Get all categories (not just active)
      const { data: userCategories } = await supabase
        .from("user_categories")
        .select("category")
        .eq("user_id", user?.id);

      if (!userCategories || userCategories.length === 0) {
        setLoading(false);
        return;
      }

      const allCategories = userCategories.map((uc) => uc.category);

      // Get all tasks for all categories
      const { data: tasksData } = await supabase
        .from("tasks")
        .select("*")
        .in("category", allCategories);

      // Get all completed/skipped tasks
      const { data: completedData } = await supabase
        .from("completed_tasks")
        .select("task_id, skipped")
        .eq("user_id", user?.id);

      if (!tasksData || !completedData) {
        setLoading(false);
        return;
      }

      // Calculate stats per category based on completion rate (completed vs skipped)
      const stats: CategoryStats[] = [];
      let totalCompletedCount = 0;
      let totalInteractionsCount = 0;

      for (const category of allCategories) {
        const categoryTaskIds = tasksData.filter(t => t.category === category).map(t => t.id);
        const categoryInteractions = completedData.filter(ct => categoryTaskIds.includes(ct.task_id));
        
        const totalInteractions = categoryInteractions.length;
        const completedCount = categoryInteractions.filter(ct => !ct.skipped).length;
        const percentage = totalInteractions > 0 ? Math.round((completedCount / totalInteractions) * 100) : 0;

        if (totalInteractions > 0) {
          stats.push({
            category,
            total: totalInteractions,
            completed: completedCount,
            percentage
          });
          totalCompletedCount += completedCount;
          totalInteractionsCount += totalInteractions;
        }
      }

      setCategoryStats(stats);
      setTotalTasks(totalInteractionsCount);
      setTotalCompleted(totalCompletedCount);

    } catch (error) {
      console.error("Error loading progress:", error);
    } finally {
      setLoading(false);
    }
  };

  const overallPercentage = totalTasks > 0 ? Math.round((totalCompleted / totalTasks) * 100) : 0;

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background pb-20">
      {/* Header */}
      <div className="bg-gradient-hero text-white p-6 shadow-lg">
        <div className="max-w-2xl mx-auto">
          <div className="flex items-center gap-4 mb-6">
            <Button
              variant="ghost"
              size="icon"
              className="text-white hover:bg-white/20"
              onClick={() => navigate("/home")}
            >
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <h1 className="text-2xl font-bold">{t("my_progress")}</h1>
          </div>

          {/* Summary Stats */}
          <div className="grid grid-cols-2 gap-4">
            <Card className="bg-white/10 backdrop-blur border-white/20">
              <CardContent className="p-4 text-center">
                <TrendingUp className="h-6 w-6 mx-auto mb-2 text-yellow" />
                <div className="text-3xl font-bold">{totalCompleted}</div>
                <div className="text-sm text-white/80">{t("completed_challenges")}</div>
              </CardContent>
            </Card>
            <Card className="bg-white/10 backdrop-blur border-white/20">
              <CardContent className="p-4 text-center">
                <Target className="h-6 w-6 mx-auto mb-2 text-mint" />
                <div className="text-3xl font-bold">{categoryStats.length}</div>
                <div className="text-sm text-white/80">{t("active_goals")}</div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>

      <div className="max-w-2xl mx-auto p-6 space-y-6">
        {/* Overall Progress */}
        <Card className="shadow-card">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Award className="h-5 w-5 text-primary" />
              {t("completion_rate")}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">{totalCompleted} / {totalTasks} tareas</span>
                <span className="font-semibold">{overallPercentage.toFixed(0)}%</span>
              </div>
              <ProgressBar value={overallPercentage} className="h-3" />
            </div>
          </CardContent>
        </Card>

        {/* Category Progress */}
        <Card className="shadow-card">
          <CardHeader>
            <CardTitle>{t("categories")}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {categoryStats.map((stat) => {
              const category = getCategoryById(stat.category);
              return (
                <div key={stat.category} className="space-y-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <span className="text-2xl">{getCategoryIcon(stat.category)}</span>
                      <div>
                        <div className="font-medium">{getCategoryName(stat.category, locale)}</div>
                        <div className="text-sm text-muted-foreground">
                          {stat.completed} / {stat.total} tareas
                        </div>
                      </div>
                    </div>
                    <span className="font-semibold" style={{ color: category?.color }}>
                      {stat.percentage.toFixed(0)}%
                    </span>
                  </div>
                  <ProgressBar
                    value={stat.percentage}
                    className="h-2"
                    style={
                      category?.color
                        ? ({ ["--progress-background" as string]: category.color } as CSSProperties)
                        : undefined
                    }
                  />
                </div>
              );
            })}
          </CardContent>
        </Card>
      </div>

      <BottomNav />
    </div>
  );
};

export default Progress;
