import * as SQLite from 'expo-sqlite';
import { WorkoutSet, Workout, PersonalRecord } from '../types';

const db = SQLite.openDatabaseSync('gymtracker.db');

export function initDatabase() {
  db.execSync(`
    CREATE TABLE IF NOT EXISTS workouts (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      date TEXT NOT NULL,
      notes TEXT DEFAULT ''
    );

    CREATE TABLE IF NOT EXISTS workout_sets (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      workout_id INTEGER NOT NULL,
      exercise_id INTEGER NOT NULL,
      exercise_name TEXT NOT NULL,
      set_number INTEGER NOT NULL,
      reps INTEGER NOT NULL,
      weight_lbs REAL NOT NULL,
      created_at TEXT NOT NULL,
      FOREIGN KEY (workout_id) REFERENCES workouts(id)
    );

    CREATE TABLE IF NOT EXISTS personal_records (
      exercise_id INTEGER NOT NULL,
      exercise_name TEXT NOT NULL,
      weight_lbs REAL NOT NULL,
      reps INTEGER NOT NULL,
      date TEXT NOT NULL,
      PRIMARY KEY (exercise_id)
    );
  `);
}

export function createWorkout(date: string, notes = ''): number {
  const result = db.runSync(
    'INSERT INTO workouts (date, notes) VALUES (?, ?)',
    date, notes
  );
  return result.lastInsertRowId;
}

export function getWorkouts(): Workout[] {
  return db.getAllSync<Workout>(
    'SELECT id, date, notes FROM workouts ORDER BY date DESC'
  );
}

export function addSet(
  workoutId: number,
  exerciseId: number,
  exerciseName: string,
  setNumber: number,
  reps: number,
  weightLbs: number
): void {
  const now = new Date().toISOString();
  db.runSync(
    `INSERT INTO workout_sets
     (workout_id, exercise_id, exercise_name, set_number, reps, weight_lbs, created_at)
     VALUES (?, ?, ?, ?, ?, ?, ?)`,
    workoutId, exerciseId, exerciseName, setNumber, reps, weightLbs, now
  );
  updatePR(exerciseId, exerciseName, weightLbs, reps, now);
}

function updatePR(
  exerciseId: number,
  exerciseName: string,
  weightLbs: number,
  reps: number,
  date: string
) {
  const existing = db.getFirstSync<PersonalRecord>(
    'SELECT weight_lbs, reps FROM personal_records WHERE exercise_id = ?',
    exerciseId
  );
  const isNewPR =
    !existing ||
    weightLbs > existing.weightLbs ||
    (weightLbs === existing.weightLbs && reps > existing.reps);

  if (isNewPR) {
    db.runSync(
      `INSERT INTO personal_records (exercise_id, exercise_name, weight_lbs, reps, date)
       VALUES (?, ?, ?, ?, ?)
       ON CONFLICT(exercise_id) DO UPDATE SET
         weight_lbs = excluded.weight_lbs,
         reps = excluded.reps,
         date = excluded.date,
         exercise_name = excluded.exercise_name`,
      exerciseId, exerciseName, weightLbs, reps, date
    );
  }
}

export function getSetsForWorkout(workoutId: number): WorkoutSet[] {
  return db.getAllSync<WorkoutSet>(
    `SELECT id, workout_id as workoutId, exercise_id as exerciseId,
            exercise_name as exerciseName, set_number as setNumber,
            reps, weight_lbs as weightLbs, created_at as createdAt
     FROM workout_sets WHERE workout_id = ? ORDER BY exercise_name, set_number`,
    workoutId
  );
}

export function getPersonalRecords(): PersonalRecord[] {
  return db.getAllSync<PersonalRecord>(
    `SELECT exercise_id as exerciseId, exercise_name as exerciseName,
            weight_lbs as weightLbs, reps, date
     FROM personal_records ORDER BY exercise_name`
  );
}

export function getProgressForExercise(
  exerciseName: string
): { date: string; maxWeight: number }[] {
  return db.getAllSync(
    `SELECT w.date, MAX(ws.weight_lbs) as maxWeight
     FROM workout_sets ws
     JOIN workouts w ON ws.workout_id = w.id
     WHERE ws.exercise_name = ?
     GROUP BY w.date
     ORDER BY w.date ASC`,
    exerciseName
  );
}
