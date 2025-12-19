import { useState, useEffect } from "react";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { Activity, TrendingUp, Utensils, Moon, Flame, Droplets, Heart, ChevronRight } from "lucide-react";
import { Link } from "react-router-dom";
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, AreaChart, Area } from "recharts";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";

const quickActions = [
  { label: "Log Meal", path: "/nutrition", icon: Utensils },
  { label: "Start Workout", path: "/fitness", icon: Activity },
  { label: "Track Health", path: "/health", icon: Heart },
  { label: "View Progress", path: "/health", icon: TrendingUp },
];

function getGreeting() {
  const hour = new Date().getHours();
  if (hour < 12) return "Good morning";
  if (hour < 17) return "Good afternoon";
  return "Good evening";
}

interface DashboardStats {
  currentWeight: number | null;
  bmi: number | null;
  caloriesLogged: number;
  workoutsCompleted: number;
}

interface WeightDataPoint {
  day: string;
  weight: number;
}

interface CalorieDataPoint {
  day: string;
  calories: number;
}

export default function Dashboard() {
  const { user } = useAuth();
  const [userName, setUserName] = useState("");
  const [stats, setStats] = useState<DashboardStats>({
    currentWeight: null,
    bmi: null,
    caloriesLogged: 0,
    workoutsCompleted: 0,
  });
  const [weightData, setWeightData] = useState<WeightDataPoint[]>([]);
  const [calorieData, setCalorieData] = useState<CalorieDataPoint[]>([]);
  const [todayMeals, setTodayMeals] = useState<{ meal: string; items: string; calories: number }[]>([]);
  const [todayWorkouts, setTodayWorkouts] = useState<{ exercise: string; duration: string; type: string }[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function fetchDashboardData() {
      if (!user) return;
      setIsLoading(true);

      // Fetch profile
      const { data: profile } = await supabase
        .from("profiles")
        .select("name, weight, height")
        .eq("user_id", user.id)
        .maybeSingle();

      if (profile?.name) {
        setUserName(profile.name.split(" ")[0]);
      }

      let bmi = null;
      if (profile?.weight && profile?.height) {
        bmi = Number(profile.weight) / Math.pow(Number(profile.height) / 100, 2);
      }

      // Fetch weight history (last 7 days)
      const { data: weightHistory } = await supabase
        .from("weight_history")
        .select("weight, recorded_at")
        .eq("user_id", user.id)
        .order("recorded_at", { ascending: false })
        .limit(7);

      if (weightHistory && weightHistory.length > 0) {
        const formattedWeight = weightHistory.reverse().map((entry) => ({
          day: new Date(entry.recorded_at).toLocaleDateString("en-US", { weekday: "short" }),
          weight: Number(entry.weight),
        }));
        setWeightData(formattedWeight);
      }

      // Fetch today's nutrition logs
      const today = new Date();
      today.setHours(0, 0, 0, 0);

      const { data: nutritionLogs } = await supabase
        .from("nutrition_logs")
        .select("*")
        .eq("user_id", user.id)
        .gte("logged_at", today.toISOString());

      let todayCalories = 0;
      const mealsByType: Record<string, { items: string[]; calories: number }> = {};

      if (nutritionLogs) {
        nutritionLogs.forEach((log) => {
          todayCalories += log.calories || 0;
          if (!mealsByType[log.meal_type]) {
            mealsByType[log.meal_type] = { items: [], calories: 0 };
          }
          mealsByType[log.meal_type].items.push(log.food_name);
          mealsByType[log.meal_type].calories += log.calories || 0;
        });

        const mealsArray = Object.entries(mealsByType).map(([meal, data]) => ({
          meal: meal.charAt(0).toUpperCase() + meal.slice(1),
          items: data.items.join(", ") || "No items logged",
          calories: data.calories,
        }));
        setTodayMeals(mealsArray);
      }

      // Fetch last 7 days calories
      const weekAgo = new Date();
      weekAgo.setDate(weekAgo.getDate() - 7);

      const { data: weekNutrition } = await supabase
        .from("nutrition_logs")
        .select("calories, logged_at")
        .eq("user_id", user.id)
        .gte("logged_at", weekAgo.toISOString());

      if (weekNutrition) {
        const dailyCalories: Record<string, number> = {};
        weekNutrition.forEach((log) => {
          const day = new Date(log.logged_at).toLocaleDateString("en-US", { weekday: "short" });
          dailyCalories[day] = (dailyCalories[day] || 0) + (log.calories || 0);
        });
        
        const days = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
        const todayIndex = new Date().getDay();
        const orderedDays = [];
        for (let i = 6; i >= 0; i--) {
          const dayIndex = (todayIndex - i + 7) % 7;
          orderedDays.push(days[dayIndex]);
        }
        
        const calorieArray = orderedDays.map((day) => ({
          day,
          calories: dailyCalories[day] || 0,
        }));
        setCalorieData(calorieArray);
      }

      // Fetch today's workouts
      const { data: workoutLogs } = await supabase
        .from("workout_logs")
        .select("*")
        .eq("user_id", user.id)
        .gte("completed_at", today.toISOString());

      if (workoutLogs) {
        const workoutsArray = workoutLogs.map((log) => ({
          exercise: log.workout_type,
          duration: log.duration_minutes ? `${log.duration_minutes} min` : "—",
          type: log.notes || "Workout",
        }));
        setTodayWorkouts(workoutsArray);
      }

      setStats({
        currentWeight: profile?.weight ? Number(profile.weight) : null,
        bmi,
        caloriesLogged: todayCalories,
        workoutsCompleted: workoutLogs?.length || 0,
      });

      setIsLoading(false);
    }
    fetchDashboardData();
  }, [user]);

  const quickStats = [
    { label: "Current Weight", value: stats.currentWeight ? `${stats.currentWeight} kg` : "—", icon: Activity, change: weightData.length > 1 ? `${(weightData[0].weight - weightData[weightData.length - 1].weight).toFixed(1)} kg this week` : "No data yet", positive: true },
    { label: "BMI", value: stats.bmi ? stats.bmi.toFixed(1) : "—", icon: Heart, change: stats.bmi ? (stats.bmi < 25 ? "Normal range" : "Review health") : "Set height/weight", positive: stats.bmi !== null && stats.bmi < 25 },
    { label: "Calories Today", value: stats.caloriesLogged.toLocaleString(), icon: Flame, change: "of 2,000 goal" },
    { label: "Workouts Today", value: String(stats.workoutsCompleted), icon: Activity, change: stats.workoutsCompleted > 0 ? "Great job!" : "Start a workout" },
  ];

  if (isLoading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center min-h-[60vh]">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="space-y-8">
        {/* Header */}
        <div>
          <h1 className="font-display text-3xl font-bold mb-2">
            {getGreeting()}, {userName || "there"}!
          </h1>
          <p className="text-muted-foreground">Here's your wellness overview for today.</p>
        </div>

        {/* Quick Stats */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {quickStats.map((stat) => (
            <div key={stat.label} className="glass rounded-xl p-5 hover:glow-sm transition-all duration-300">
              <div className="flex items-center justify-between mb-3">
                <span className="text-sm text-muted-foreground">{stat.label}</span>
                <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center">
                  <stat.icon className="w-4 h-4 text-primary" />
                </div>
              </div>
              <p className="text-2xl font-display font-bold mb-1">{stat.value}</p>
              <p className={`text-xs ${stat.positive ? "text-green-400" : "text-muted-foreground"}`}>
                {stat.change}
              </p>
            </div>
          ))}
        </div>

        {/* Charts */}
        <div className="grid lg:grid-cols-2 gap-6">
          {/* Weight Chart */}
          <div className="glass rounded-xl p-6">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h3 className="font-display text-lg font-semibold">Weight Progress</h3>
                <p className="text-sm text-muted-foreground">Last 7 entries</p>
              </div>
              <Link to="/health" className="text-primary text-sm hover:underline flex items-center gap-1">
                View All <ChevronRight className="w-4 h-4" />
              </Link>
            </div>
            <div className="h-48">
              {weightData.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={weightData}>
                    <defs>
                      <linearGradient id="weightGradient" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="hsl(0, 85%, 50%)" stopOpacity={0.3} />
                        <stop offset="95%" stopColor="hsl(0, 85%, 50%)" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <XAxis 
                      dataKey="day" 
                      axisLine={false} 
                      tickLine={false} 
                      tick={{ fill: 'hsl(0, 0%, 60%)', fontSize: 12 }}
                    />
                    <YAxis 
                      domain={['dataMin - 1', 'dataMax + 1']} 
                      axisLine={false} 
                      tickLine={false}
                      tick={{ fill: 'hsl(0, 0%, 60%)', fontSize: 12 }}
                    />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: 'hsl(0, 0%, 7%)',
                        border: '1px solid hsl(0, 0%, 18%)',
                        borderRadius: '8px',
                        color: 'hsl(0, 0%, 95%)',
                      }}
                    />
                    <Area
                      type="monotone"
                      dataKey="weight"
                      stroke="hsl(0, 85%, 50%)"
                      strokeWidth={2}
                      fill="url(#weightGradient)"
                    />
                  </AreaChart>
                </ResponsiveContainer>
              ) : (
                <div className="flex items-center justify-center h-full text-muted-foreground">
                  <p>No weight data yet. <Link to="/health" className="text-primary hover:underline">Log your first weight</Link></p>
                </div>
              )}
            </div>
          </div>

          {/* Calories Chart */}
          <div className="glass rounded-xl p-6">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h3 className="font-display text-lg font-semibold">Calorie Intake</h3>
                <p className="text-sm text-muted-foreground">Last 7 days</p>
              </div>
              <Link to="/nutrition" className="text-primary text-sm hover:underline flex items-center gap-1">
                View All <ChevronRight className="w-4 h-4" />
              </Link>
            </div>
            <div className="h-48">
              {calorieData.some(d => d.calories > 0) ? (
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={calorieData}>
                    <XAxis 
                      dataKey="day" 
                      axisLine={false} 
                      tickLine={false}
                      tick={{ fill: 'hsl(0, 0%, 60%)', fontSize: 12 }}
                    />
                    <YAxis 
                      axisLine={false} 
                      tickLine={false}
                      tick={{ fill: 'hsl(0, 0%, 60%)', fontSize: 12 }}
                    />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: 'hsl(0, 0%, 7%)',
                        border: '1px solid hsl(0, 0%, 18%)',
                        borderRadius: '8px',
                        color: 'hsl(0, 0%, 95%)',
                      }}
                    />
                    <Line
                      type="monotone"
                      dataKey="calories"
                      stroke="hsl(0, 85%, 50%)"
                      strokeWidth={2}
                      dot={{ fill: 'hsl(0, 85%, 50%)', strokeWidth: 0, r: 4 }}
                    />
                  </LineChart>
                </ResponsiveContainer>
              ) : (
                <div className="flex items-center justify-center h-full text-muted-foreground">
                  <p>No calorie data yet. <Link to="/nutrition" className="text-primary hover:underline">Log your first meal</Link></p>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Quick Actions */}
        <div>
          <h3 className="font-display text-lg font-semibold mb-4">Quick Actions</h3>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            {quickActions.map((action) => (
              <Link
                key={action.label}
                to={action.path}
                className="glass rounded-xl p-5 flex flex-col items-center justify-center gap-3 hover:glow-sm hover:bg-card/90 transition-all duration-300 group"
              >
                <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center group-hover:bg-primary/20 transition-colors">
                  <action.icon className="w-6 h-6 text-primary" />
                </div>
                <span className="font-medium text-sm">{action.label}</span>
              </Link>
            ))}
          </div>
        </div>

        {/* Today's Plan */}
        <div className="grid lg:grid-cols-2 gap-6">
          {/* Nutrition Plan */}
          <div className="glass rounded-xl p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-display text-lg font-semibold">Today's Nutrition</h3>
              <Link to="/nutrition" className="text-primary text-sm hover:underline flex items-center gap-1">
                Full Plan <ChevronRight className="w-4 h-4" />
              </Link>
            </div>
            <div className="space-y-3">
              {todayMeals.length > 0 ? (
                todayMeals.map((meal) => (
                  <div key={meal.meal} className="flex items-center justify-between p-3 rounded-lg bg-secondary/50">
                    <div>
                      <p className="font-medium text-sm">{meal.meal}</p>
                      <p className="text-xs text-muted-foreground truncate max-w-[200px]">{meal.items}</p>
                    </div>
                    <span className="text-sm text-primary font-medium">{meal.calories} cal</span>
                  </div>
                ))
              ) : (
                <div className="text-center py-8 text-muted-foreground">
                  <Utensils className="w-8 h-8 mx-auto mb-2 opacity-50" />
                  <p className="text-sm">No meals logged today</p>
                  <Link to="/nutrition" className="text-primary text-sm hover:underline">Log your first meal</Link>
                </div>
              )}
            </div>
          </div>

          {/* Workout Plan */}
          <div className="glass rounded-xl p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-display text-lg font-semibold">Today's Workouts</h3>
              <Link to="/fitness" className="text-primary text-sm hover:underline flex items-center gap-1">
                Full Plan <ChevronRight className="w-4 h-4" />
              </Link>
            </div>
            <div className="space-y-3">
              {todayWorkouts.length > 0 ? (
                todayWorkouts.map((exercise, idx) => (
                  <div key={idx} className="flex items-center justify-between p-3 rounded-lg bg-secondary/50">
                    <div>
                      <p className="font-medium text-sm">{exercise.exercise}</p>
                      <p className="text-xs text-muted-foreground">{exercise.type}</p>
                    </div>
                    <span className="text-sm text-primary font-medium">{exercise.duration}</span>
                  </div>
                ))
              ) : (
                <div className="text-center py-8 text-muted-foreground">
                  <Activity className="w-8 h-8 mx-auto mb-2 opacity-50" />
                  <p className="text-sm">No workouts logged today</p>
                  <Link to="/fitness" className="text-primary text-sm hover:underline">Start a workout</Link>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
