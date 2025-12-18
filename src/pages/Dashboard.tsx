import { useState, useEffect } from "react";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { Activity, TrendingUp, Utensils, Moon, Flame, Droplets, Heart, ChevronRight } from "lucide-react";
import { Link } from "react-router-dom";
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, AreaChart, Area } from "recharts";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";

const weightData = [
  { day: "Mon", weight: 72 },
  { day: "Tue", weight: 71.8 },
  { day: "Wed", weight: 71.5 },
  { day: "Thu", weight: 71.7 },
  { day: "Fri", weight: 71.2 },
  { day: "Sat", weight: 70.8 },
  { day: "Sun", weight: 70.8 },
];

const calorieData = [
  { day: "Mon", calories: 1850 },
  { day: "Tue", calories: 2100 },
  { day: "Wed", calories: 1920 },
  { day: "Thu", calories: 2050 },
  { day: "Fri", calories: 1800 },
  { day: "Sat", calories: 2200 },
  { day: "Sun", calories: 1950 },
];

const quickStats = [
  { label: "Current Weight", value: "70.8 kg", icon: Activity, change: "-1.2 kg this week", positive: true },
  { label: "BMI", value: "24.5", icon: Heart, change: "Normal range", positive: true },
  { label: "Calories Today", value: "1,450", icon: Flame, change: "of 2,000 goal" },
  { label: "Water Intake", value: "1.8L", icon: Droplets, change: "of 3L goal" },
];

const quickActions = [
  { label: "Log Meal", path: "/nutrition", icon: Utensils },
  { label: "Start Workout", path: "/fitness", icon: Activity },
  { label: "Track Sleep", path: "/health", icon: Moon },
  { label: "View Progress", path: "/health", icon: TrendingUp },
];

function getGreeting() {
  const hour = new Date().getHours();
  if (hour < 12) return "Good morning";
  if (hour < 17) return "Good afternoon";
  return "Good evening";
}

export default function Dashboard() {
  const { user } = useAuth();
  const [userName, setUserName] = useState("");

  useEffect(() => {
    async function fetchProfile() {
      if (!user) return;

      const { data } = await supabase
        .from("profiles")
        .select("name")
        .eq("user_id", user.id)
        .maybeSingle();

      if (data?.name) {
        setUserName(data.name.split(" ")[0]); // Use first name
      }
    }
    fetchProfile();
  }, [user]);

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
                <p className="text-sm text-muted-foreground">Last 7 days</p>
              </div>
              <Link to="/health" className="text-primary text-sm hover:underline flex items-center gap-1">
                View All <ChevronRight className="w-4 h-4" />
              </Link>
            </div>
            <div className="h-48">
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
              {[
                { meal: "Breakfast", items: "Oatmeal with berries, Greek yogurt", calories: 450 },
                { meal: "Lunch", items: "Grilled chicken salad, quinoa", calories: 550 },
                { meal: "Dinner", items: "Salmon, roasted vegetables", calories: 600 },
                { meal: "Snacks", items: "Almonds, apple", calories: 250 },
              ].map((meal) => (
                <div key={meal.meal} className="flex items-center justify-between p-3 rounded-lg bg-secondary/50">
                  <div>
                    <p className="font-medium text-sm">{meal.meal}</p>
                    <p className="text-xs text-muted-foreground">{meal.items}</p>
                  </div>
                  <span className="text-sm text-primary font-medium">{meal.calories} cal</span>
                </div>
              ))}
            </div>
          </div>

          {/* Workout Plan */}
          <div className="glass rounded-xl p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-display text-lg font-semibold">Today's Workout</h3>
              <Link to="/fitness" className="text-primary text-sm hover:underline flex items-center gap-1">
                Full Plan <ChevronRight className="w-4 h-4" />
              </Link>
            </div>
            <div className="space-y-3">
              {[
                { exercise: "Warm-up", duration: "5 min", type: "Cardio" },
                { exercise: "Push-ups", duration: "3 sets x 15", type: "Upper Body" },
                { exercise: "Squats", duration: "3 sets x 12", type: "Lower Body" },
                { exercise: "Plank", duration: "3 sets x 45s", type: "Core" },
                { exercise: "Cool-down", duration: "5 min", type: "Stretch" },
              ].map((exercise) => (
                <div key={exercise.exercise} className="flex items-center justify-between p-3 rounded-lg bg-secondary/50">
                  <div>
                    <p className="font-medium text-sm">{exercise.exercise}</p>
                    <p className="text-xs text-muted-foreground">{exercise.type}</p>
                  </div>
                  <span className="text-sm text-primary font-medium">{exercise.duration}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
