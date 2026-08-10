import { BarChart3Icon } from "lucide-react";

interface ScoreBadgeProps {
  score?: number;
  stage?: string;
  size?: "sm" | "lg";
}

// resume_score is 0-100. Traffic-light bands, green (great match) to red
// (poor match), so the color alone tells the story at a glance.
function getScoreColorClasses(score: number) {
  if (score >= 80) return "bg-green-100 text-green-800 border-transparent";
  if (score >= 60) return "bg-yellow-100 text-yellow-800 border-transparent";
  if (score >= 40) return "bg-orange-100 text-orange-800 border-transparent";
  return "bg-red-100 text-red-800 border-transparent";
}

export default function ScoreBadge({ score, stage, size = "sm" }: ScoreBadgeProps) {
  if (score === undefined || score === null) return null;

  if (size === "sm") {
    return (
      <div
        className={`flex-shrink-0 px-2.5 py-0.5 rounded-full text-xs font-medium border ${getScoreColorClasses(
          score
        )}`}
        aria-label={`Resume match score: ${score} out of 100`}
      >
        {score}
      </div>
    );
  }

  return (
    <div className="flex items-center space-x-1.5 bg-earth-100 border border-earth-200 px-3 py-2 rounded-lg">
      <BarChart3Icon className="h-4 w-4 text-earth-600" />
      <div>
        <div className="flex items-baseline">
          <span className="text-lg font-semibold text-earth-900">{score}</span>
          <span className="ml-1 text-xs text-earth-500">/100</span>
        </div>
        {stage && (
          <span className="text-xs text-earth-500 block capitalize">
            {stage}
          </span>
        )}
      </div>
    </div>
  );
}
