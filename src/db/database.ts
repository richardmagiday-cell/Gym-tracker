import * as SQLite from 'expo-sqlite';
import { WorkoutSet, Workout, PersonalRecord } from '../types';

const db = SQLite.openDatabaseSync('gymtracker.db');

export interface Program {
  id: number;
  name: string;
  isActive: boolean;
}

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

    CREATE TABLE IF NOT EXISTS programs (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      is_active INTEGER NOT NULL DEFAULT 0
    );

    CREATE TABLE IF NOT EXISTS schedules (
      program_id INTEGER NOT NULL,
      day_of_week INTEGER NOT NULL,
      template_key TEXT NOT NULL,
      PRIMARY KEY (program_id, day_of_week),
      FOREIGN KEY (program_id) REFERENCES programs(id)
    );
  `);

  const count = db.getFirstSync<{ count: number }>('SELECT COUNT(*) as count FROM programs');
  if (!count || count.count === 0) {
    seedDefaultProgram();
  }
}

function seedDefaultProgram() {
  const result = db.runSync(
    'INSERT INTO programs (name, is_active) VALUES (?, 1)',
    'TEAMTOORAW Gains'
  );
  const id = result.lastInsertRowId;
  const defaultSchedule: Record<number, string> = {
    0: 'rest',
    1: 'pull_a',
    2: 'push_a',
    3: 'legs_a',
    4: 'push_b',
    5: 'pull_b',
    6: 'legs_b',
  };
  for (const [day, key] of Object.entries(defaultSchedule)) {
    db.runSync(
      'INSERT INTO schedules (program_id, day_of_week, template_key) VALUES (?, ?, ?)',
      id, parseInt(day), key
    );
  }
}

// ─── Program management ──────────────────────────────────────────────────────

export function getPrograms(): Program[] {
  return db.getAllSync<{ id: number; name: string; is_active: number }>(
    'SELECT id, name, is_active FROM programs ORDER BY id'
  ).map(p => ({ id: p.id, name: p.name, isActive: p.is_active === 1 }));
}

export function getActiveSchedule(): Record<number, string> {
  const rows = db.getAllSync<{ day_of_week: number; template_key: string }>(
    `SELECT s.day_of_week, s.template_key
     FROM schedules s
     JOIN programs p ON s.program_id = p.id
     WHERE p.is_active = 1`
  );
  const schedule: Record<number, string> = {};
  rows.forEach(r => { schedule[r.day_of_week] = r.template_key; });
  return schedule;
}

export function getScheduleForProgram(programId: number): Record<number, string> {
  const rows = db.getAllSync<{ day_of_week: number; template_key: string }>(
    'SELECT day_of_week, template_key FROM schedules WHERE program_id = ?',
    programId
  );
  const schedule: Record<number, string> = {};
  rows.forEach(r => { schedule[r.day_of_week] = r.template_key; });
  return schedule;
}

export function setActiveProgram(id: number): void {
  db.runSync('UPDATE programs SET is_active = 0');
  db.runSync('UPDATE programs SET is_active = 1 WHERE id = ?', id);
}

export function createProgram(name: string, schedule: Record<number, string>): number {
  const result = db.runSync(
    'INSERT INTO programs (name, is_active) VALUES (?, 0)',
    name
  );
  const programId = result.lastInsertRowId;
  for (const [day, key] of Object.entries(schedule)) {
    db.runSync(
      'INSERT INTO schedules (program_id, day_of_week, template_key) VALUES (?, ?, ?)',
      programId, parseInt(day), key
    );
  }
  return programId;
}

export function updateSchedule(programId: number, schedule: Record<number, string>): void {
  db.runSync('DELETE FROM schedules WHERE program_id = ?', programId);
  for (const [day, key] of Object.entries(schedule)) {
    db.runSync(
      'INSERT INTO schedules (program_id, day_of_week, template_key) VALUES (?, ?, ?)',
      programId, parseInt(day), key
    );
  }
}

export function renameProgram(id: number, name: string): void {
  db.runSync('UPDATE programs SET name = ? WHERE id = ?', name, id);
}

export function deleteProgram(id: number): void {
  db.runSync('DELETE FROM schedules WHERE program_id = ?', id);
  db.runSync('DELETE FROM programs WHERE id = ?', id);
}

// ─── Workout logging ─────────────────────────────────────────────────────────

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

// Returns each set from the most recent session that logged this exercise.
export function getLastSetsForExercise(
  exerciseName: string
): { setNumber: number; reps: number; weightLbs: number }[] {
  return db.getAllSync(
    `SELECT ws.set_number as setNumber, ws.reps, ws.weight_lbs as weightLbs
     FROM workout_sets ws
     WHERE ws.exercise_name = ?
       AND ws.workout_id = (
         SELECT workout_id FROM workout_sets
         WHERE exercise_name = ?
         ORDER BY created_at DESC
         LIMIT 1
       )
     ORDER BY ws.set_number ASC`,
    exerciseName, exerciseName
  );
}

export function getWorkoutsOnDates(dates: string[]): string[] {
  if (dates.length === 0) return [];
  const placeholders = dates.map(() => '?').join(',');
  return db.getAllSync<{ date: string }>(
    `SELECT DISTINCT date FROM workouts WHERE date IN (${placeholders})`,
    ...dates
  ).map(r => r.date);
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
