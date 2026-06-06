export interface Exercise {
  id: number;
  name: string;
  muscleGroup: string;
}

export interface WorkoutSet {
  id: number;
  workoutId: number;
  exerciseId: number;
  exerciseName: string;
  setNumber: number;
  reps: number;
  weightLbs: number;
  createdAt: string;
}

export interface Workout {
  id: number;
  date: string;
  notes: string;
}

export interface PersonalRecord {
  exerciseId: number;
  exerciseName: string;
  weightLbs: number;
  reps: number;
  date: string;
}
