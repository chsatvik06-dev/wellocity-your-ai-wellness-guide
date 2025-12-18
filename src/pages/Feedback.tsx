import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { Star, MessageSquare, ThumbsUp, ThumbsDown, Send } from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";
import { useToast } from "@/hooks/use-toast";

const feedbackCategories = [
  { id: "diet", label: "Diet Plans", rating: 4 },
  { id: "workout", label: "Workout Routines", rating: 5 },
  { id: "ai", label: "AI Recommendations", rating: 4 },
  { id: "tracking", label: "Health Tracking", rating: 5 },
  { id: "period", label: "Period Tracker", rating: 4 },
  { id: "app", label: "Overall App", rating: 4 },
];

const recentFeedback = [
  {
    date: "Dec 10",
    category: "Diet Plans",
    rating: 5,
    comment: "Love the personalized meal suggestions! Really helped me stay on track.",
  },
  {
    date: "Dec 8",
    category: "Workout Routines",
    rating: 4,
    comment: "Great variety of exercises. Would love more yoga options.",
  },
  {
    date: "Dec 5",
    category: "AI Recommendations",
    rating: 5,
    comment: "The AI really understands my preferences and adapts well.",
  },
];

export default function Feedback() {
  const { toast } = useToast();
  const [selectedCategory, setSelectedCategory] = useState("");
  const [rating, setRating] = useState(0);
  const [hoverRating, setHoverRating] = useState(0);
  const [comment, setComment] = useState("");
  const [comfort, setComfort] = useState<"comfortable" | "neutral" | "uncomfortable" | null>(null);

  const handleSubmit = () => {
    if (!selectedCategory || rating === 0) {
      toast({
        title: "Missing information",
        description: "Please select a category and provide a rating.",
        variant: "destructive",
      });
      return;
    }

    toast({
      title: "Feedback submitted!",
      description: "Thank you for helping us improve your experience.",
    });

    // Reset form
    setSelectedCategory("");
    setRating(0);
    setComment("");
    setComfort(null);
  };

  return (
    <DashboardLayout>
      <div className="space-y-8">
        {/* Header */}
        <div>
          <h1 className="font-display text-3xl font-bold mb-2">Feedback & Reviews</h1>
          <p className="text-muted-foreground">Help us personalize your wellness journey</p>
        </div>

        {/* New Feedback Form */}
        <div className="glass rounded-2xl p-6">
          <h3 className="font-display text-xl font-semibold mb-6">Share Your Feedback</h3>

          {/* Category Selection */}
          <div className="mb-6">
            <label className="text-sm text-muted-foreground mb-3 block">What would you like to rate?</label>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
              {feedbackCategories.map((cat) => (
                <button
                  key={cat.id}
                  onClick={() => setSelectedCategory(cat.id)}
                  className={cn(
                    "p-4 rounded-xl border transition-all duration-200",
                    selectedCategory === cat.id
                      ? "bg-primary/20 border-primary"
                      : "bg-secondary/50 border-border hover:border-primary/50"
                  )}
                >
                  <span className="font-medium text-sm">{cat.label}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Star Rating */}
          <div className="mb-6">
            <label className="text-sm text-muted-foreground mb-3 block">How would you rate it?</label>
            <div className="flex gap-2">
              {[1, 2, 3, 4, 5].map((star) => (
                <button
                  key={star}
                  onClick={() => setRating(star)}
                  onMouseEnter={() => setHoverRating(star)}
                  onMouseLeave={() => setHoverRating(0)}
                  className="transition-transform hover:scale-110"
                >
                  <Star
                    className={cn(
                      "w-10 h-10 transition-colors",
                      (hoverRating || rating) >= star
                        ? "fill-primary text-primary"
                        : "text-muted-foreground"
                    )}
                  />
                </button>
              ))}
            </div>
          </div>

          {/* Comfort Level */}
          <div className="mb-6">
            <label className="text-sm text-muted-foreground mb-3 block">Comfort & Satisfaction Level</label>
            <div className="flex gap-3">
              {[
                { id: "comfortable", label: "Comfortable", icon: ThumbsUp, color: "text-green-400" },
                { id: "neutral", label: "Neutral", icon: MessageSquare, color: "text-yellow-400" },
                { id: "uncomfortable", label: "Needs Adjustment", icon: ThumbsDown, color: "text-red-400" },
              ].map((option) => (
                <button
                  key={option.id}
                  onClick={() => setComfort(option.id as any)}
                  className={cn(
                    "flex-1 p-4 rounded-xl border transition-all duration-200 flex flex-col items-center gap-2",
                    comfort === option.id
                      ? "bg-primary/20 border-primary"
                      : "bg-secondary/50 border-border hover:border-primary/50"
                  )}
                >
                  <option.icon className={cn("w-6 h-6", comfort === option.id ? "text-primary" : option.color)} />
                  <span className="text-sm font-medium">{option.label}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Comment */}
          <div className="mb-6">
            <label className="text-sm text-muted-foreground mb-3 block">Additional Comments (Optional)</label>
            <Textarea
              placeholder="Tell us more about your experience..."
              className="min-h-[120px] bg-secondary border-border resize-none"
              value={comment}
              onChange={(e) => setComment(e.target.value)}
            />
          </div>

          <Button variant="hero" className="w-full gap-2" onClick={handleSubmit}>
            <Send className="w-4 h-4" />
            Submit Feedback
          </Button>
        </div>

        {/* Current Ratings Overview */}
        <div className="glass rounded-2xl p-6">
          <h3 className="font-display text-xl font-semibold mb-6">Your Ratings Overview</h3>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            {feedbackCategories.map((cat) => (
              <div key={cat.id} className="p-4 rounded-xl bg-secondary/50">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium">{cat.label}</span>
                  <span className="text-sm text-primary font-bold">{cat.rating}/5</span>
                </div>
                <div className="flex gap-1">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <Star
                      key={star}
                      className={cn(
                        "w-4 h-4",
                        star <= cat.rating ? "fill-primary text-primary" : "text-muted-foreground"
                      )}
                    />
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Recent Feedback */}
        <div className="glass rounded-2xl p-6">
          <h3 className="font-display text-xl font-semibold mb-6">Your Recent Feedback</h3>
          <div className="space-y-4">
            {recentFeedback.map((feedback, index) => (
              <div key={index} className="p-4 rounded-xl bg-secondary/50">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-3">
                    <span className="px-2 py-1 rounded-md bg-primary/20 text-primary text-xs font-medium">
                      {feedback.category}
                    </span>
                    <div className="flex gap-0.5">
                      {[1, 2, 3, 4, 5].map((star) => (
                        <Star
                          key={star}
                          className={cn(
                            "w-3 h-3",
                            star <= feedback.rating ? "fill-primary text-primary" : "text-muted-foreground"
                          )}
                        />
                      ))}
                    </div>
                  </div>
                  <span className="text-xs text-muted-foreground">{feedback.date}</span>
                </div>
                <p className="text-sm text-muted-foreground">{feedback.comment}</p>
              </div>
            ))}
          </div>
        </div>

        {/* AI Note */}
        <div className="p-4 rounded-xl bg-primary/10 border border-primary/30">
          <p className="text-sm text-center">
            <Star className="w-4 h-4 inline mr-2 text-primary" />
            Your feedback directly improves our AI recommendations. The more you share, the better we personalize your experience!
          </p>
        </div>
      </div>
    </DashboardLayout>
  );
}
