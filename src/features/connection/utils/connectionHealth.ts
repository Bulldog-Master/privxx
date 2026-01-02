/**
 * Connection Health Scoring
 * 
 * Combines latency quality with success rate from history
 * to produce an overall connection health score (0-100).
 */

import { getConnectionQuality, type ConnectionQuality } from "./connectionQuality";
import type { ConnectionHistoryEntry } from "../hooks/useConnectionHistory";

export interface ConnectionHealthScore {
  /** Overall health score (0-100) */
  score: number;
  /** Health grade label */
  grade: "excellent" | "good" | "fair" | "poor" | "critical";
  /** Latency component score (0-100) */
  latencyScore: number;
  /** Success rate component score (0-100) */
  successScore: number;
  /** Quality grade from latest connection */
  qualityGrade: ConnectionQuality;
  /** Number of history entries used */
  sampleSize: number;
}

/**
 * Calculate connection health from latency and history
 */
export function calculateConnectionHealth(
  latency: number | undefined,
  history: ConnectionHistoryEntry[],
  recentCount: number = 10
): ConnectionHealthScore {
  // Get recent history for success rate calculation
  const recentHistory = history.slice(0, recentCount);
  const sampleSize = recentHistory.length;
  
  // Calculate success rate (0-100)
  const successCount = recentHistory.filter(e => e.success).length;
  const successScore = sampleSize > 0 
    ? Math.round((successCount / sampleSize) * 100) 
    : 100; // Default to 100 if no history
  
  // Get quality grade from latency
  const qualityGrade = getConnectionQuality(latency);
  
  // Convert quality grade to score (0-100)
  const latencyScoreMap: Record<ConnectionQuality, number> = {
    excellent: 100,
    good: 80,
    fair: 60,
    poor: 40,
    unknown: 50,
  };
  const latencyScore = latencyScoreMap[qualityGrade];
  
  // Weighted combination: 40% latency, 60% success rate
  // Success rate is more important for overall health
  const rawScore = latencyScore * 0.4 + successScore * 0.6;
  const score = Math.round(rawScore);
  
  // Determine overall grade
  const grade = getHealthGrade(score);
  
  return {
    score,
    grade,
    latencyScore,
    successScore,
    qualityGrade,
    sampleSize,
  };
}

/**
 * Get health grade from score
 */
function getHealthGrade(score: number): ConnectionHealthScore["grade"] {
  if (score >= 90) return "excellent";
  if (score >= 70) return "good";
  if (score >= 50) return "fair";
  if (score >= 30) return "poor";
  return "critical";
}

/**
 * Get color class for health grade
 */
export function getHealthColorClass(grade: ConnectionHealthScore["grade"]): string {
  switch (grade) {
    case "excellent":
      return "text-emerald-500";
    case "good":
      return "text-teal-500";
    case "fair":
      return "text-amber-500";
    case "poor":
      return "text-orange-500";
    case "critical":
      return "text-destructive";
  }
}

/**
 * Get background color class for health grade
 */
export function getHealthBgClass(grade: ConnectionHealthScore["grade"]): string {
  switch (grade) {
    case "excellent":
      return "bg-emerald-500/20";
    case "good":
      return "bg-teal-500/20";
    case "fair":
      return "bg-amber-500/20";
    case "poor":
      return "bg-orange-500/20";
    case "critical":
      return "bg-destructive/20";
  }
}
