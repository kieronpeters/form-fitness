import type { BodyEntry, Goal, Profile, WorkoutSession } from '../types';
import { goalProgress, type GoalProgress } from './goals';

export function getGoalProgressSummary(
  goals: Goal[],
  sessions: WorkoutSession[],
  bodyEntries: BodyEntry[],
  profile: Profile,
): Array<{ goal: Goal; progress: GoalProgress }> {
  const context = { sessions, bodyEntries, profile };
  return goals
    .map((goal) => ({ goal, progress: goalProgress(goal, context) }))
    .sort((a, b) => {
      if (a.progress.done !== b.progress.done) return a.progress.done ? 1 : -1;
      return b.progress.percent - a.progress.percent;
    });
}
