import * as SQLite from 'expo-sqlite';
import { WorkoutSet, Workout, PersonalRecord } from '../types';
import { WORKOUT_TEMPLATES, getTemplateByKey, WorkoutTemplate, TemplateExercise } from '../data/program';

const db = SQLite.openDatabaseSync('gymtracker.db');

export interface Program {
  id: number;
  name: string;
  isActive: boolean;
}

export interface DBTemplateExercise {
  id: number;
  exerciseId: number;
  name: string;
  muscleGroup: string;
  notes: string;
  sortOrder: number;
  sets: DBTemplateSet[];
}

export interface DBTemplateSet {
  id: number;
  setNumber: number;
  targetReps: string;
  prevWeight: string;
  notes: string;
}

// ─── Init ────────────────────────────────────────────────────────────────────

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

    CREATE TABLE IF NOT EXISTS template_exercises (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      program_id INTEGER NOT NULL,
      template_key TEXT NOT NULL,
      exercise_id INTEGER NOT NULL,
      exercise_name TEXT NOT NULL,
      muscle_group TEXT NOT NULL,
      exercise_notes TEXT DEFAULT '',
      sort_order INTEGER NOT NULL DEFAULT 0,
      FOREIGN KEY (program_id) REFERENCES programs(id)
    );

    CREATE TABLE IF NOT EXISTS template_sets (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      template_exercise_id INTEGER NOT NULL,
      set_number INTEGER NOT NULL,
      target_reps TEXT NOT NULL,
      prev_weight TEXT DEFAULT '',
      notes TEXT DEFAULT '',
      FOREIGN KEY (template_exercise_id) REFERENCES template_exercises(id)
    );
  `);

  // Seed default program if none exist
  const count = db.getFirstSync<{ count: number }>('SELECT COUNT(*) as count FROM programs');
  if (!count || count.count === 0) {
    seedDefaultProgram();
  }

  // Migrate old template key references
  db.runSync(`UPDATE schedules SET template_key = 'pull' WHERE template_key IN ('pull_a', 'pull_b')`);

  // Re-seed push_b if it was seeded with wrong exercises (Pull Ups as first exercise)
  const programs = db.getAllSync<{ id: number }>('SELECT id FROM programs');
  for (const prog of programs) {
    const firstPushB = db.getFirstSync<{ exercise_name: string }>(
      `SELECT exercise_name FROM template_exercises
       WHERE program_id = ? AND template_key = 'push_b'
       ORDER BY sort_order ASC LIMIT 1`,
      prog.id
    );
    if (firstPushB?.exercise_name === 'Pull Ups') {
      const exRows = db.getAllSync<{ id: number }>(
        `SELECT id FROM template_exercises WHERE program_id = ? AND template_key = 'push_b'`,
        prog.id
      );
      for (const ex of exRows) {
        db.runSync('DELETE FROM template_sets WHERE template_exercise_id = ?', ex.id);
      }
      db.runSync(
        `DELETE FROM template_exercises WHERE program_id = ? AND template_key = 'push_b'`,
        prog.id
      );
      const pushB = WORKOUT_TEMPLATES.find(t => t.key === 'push_b');
      if (pushB) {
        for (let i = 0; i < pushB.exercises.length; i++) {
          const ex = pushB.exercises[i];
          const result = db.runSync(
            `INSERT INTO template_exercises
             (program_id, template_key, exercise_id, exercise_name, muscle_group, exercise_notes, sort_order)
             VALUES (?, ?, ?, ?, ?, ?, ?)`,
            prog.id, 'push_b', ex.exerciseId, ex.name,
            ex.muscleGroup, ex.exerciseNotes ?? '', i
          );
          for (const s of ex.sets) {
            db.runSync(
              `INSERT INTO template_sets (template_exercise_id, set_number, target_reps, prev_weight, notes)
               VALUES (?, ?, ?, ?, ?)`,
              result.lastInsertRowId, s.setNumber, s.targetReps, s.prevWeight, s.notes ?? ''
            );
          }
        }
      }
    }
  }

  // Seed shoulder_strengthening if it was left empty (placeholder)
  for (const prog of programs) {
    const ssCount = db.getFirstSync<{ count: number }>(
      `SELECT COUNT(*) as count FROM template_exercises WHERE program_id = ? AND template_key = 'shoulder_strengthening'`,
      prog.id
    );
    if (!ssCount || ssCount.count === 0) {
      const ss = WORKOUT_TEMPLATES.find(t => t.key === 'shoulder_strengthening');
      if (ss) {
        for (let i = 0; i < ss.exercises.length; i++) {
          const ex = ss.exercises[i];
          const result = db.runSync(
            `INSERT INTO template_exercises
             (program_id, template_key, exercise_id, exercise_name, muscle_group, exercise_notes, sort_order)
             VALUES (?, ?, ?, ?, ?, ?, ?)`,
            prog.id, 'shoulder_strengthening', ex.exerciseId, ex.name,
            ex.muscleGroup, ex.exerciseNotes ?? '', i
          );
          for (const s of ex.sets) {
            db.runSync(
              `INSERT INTO template_sets (template_exercise_id, set_number, target_reps, prev_weight, notes)
               VALUES (?, ?, ?, ?, ?)`,
              result.lastInsertRowId, s.setNumber, s.targetReps, s.prevWeight, s.notes ?? ''
            );
          }
        }
      }
    }
  }

  // Seed template exercises for active program if not yet done
  const activeId = getActiveProgramId();
  if (activeId !== null) {
    const exCount = db.getFirstSync<{ count: number }>(
      'SELECT COUNT(*) as count FROM template_exercises WHERE program_id = ?',
      activeId
    );
    if (!exCount || exCount.count === 0) {
      seedTemplatesForProgram(activeId);
    }
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
    1: 'pull',
    2: 'push_a',
    3: 'legs_a',
    4: 'push_b',
    5: 'pull',
    6: 'legs_b',
  };
  for (const [day, key] of Object.entries(defaultSchedule)) {
    db.runSync(
      'INSERT INTO schedules (program_id, day_of_week, template_key) VALUES (?, ?, ?)',
      id, parseInt(day), key
    );
  }
  seedTemplatesForProgram(id);
}

export function seedTemplatesForProgram(programId: number) {
  for (const template of WORKOUT_TEMPLATES) {
    for (let i = 0; i < template.exercises.length; i++) {
      const ex = template.exercises[i];
      const result = db.runSync(
        `INSERT INTO template_exercises
         (program_id, template_key, exercise_id, exercise_name, muscle_group, exercise_notes, sort_order)
         VALUES (?, ?, ?, ?, ?, ?, ?)`,
        programId, template.key, ex.exerciseId, ex.name,
        ex.muscleGroup, ex.exerciseNotes ?? '', i
      );
      const exId = result.lastInsertRowId;
      for (const s of ex.sets) {
        db.runSync(
          `INSERT INTO template_sets (template_exercise_id, set_number, target_reps, prev_weight, notes)
           VALUES (?, ?, ?, ?, ?)`,
          exId, s.setNumber, s.targetReps, s.prevWeight, s.notes ?? ''
        );
      }
    }
  }
}

// ─── Program management ──────────────────────────────────────────────────────

export function getActiveProgramId(): number | null {
  return db.getFirstSync<{ id: number }>(
    'SELECT id FROM programs WHERE is_active = 1'
  )?.id ?? null;
}

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
  seedTemplatesForProgram(programId);
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
  db.runSync('DELETE FROM template_sets WHERE template_exercise_id IN (SELECT id FROM template_exercises WHERE program_id = ?)', id);
  db.runSync('DELETE FROM template_exercises WHERE program_id = ?', id);
  db.runSync('DELETE FROM schedules WHERE program_id = ?', id);
  db.runSync('DELETE FROM programs WHERE id = ?', id);
}

// ─── Template exercises (editable per program) ───────────────────────────────

export function getDBTemplate(programId: number, templateKey: string): DBTemplateExercise[] {
  const rows = db.getAllSync<{
    id: number; exercise_id: number; exercise_name: string;
    muscle_group: string; exercise_notes: string; sort_order: number;
  }>(
    `SELECT id, exercise_id, exercise_name, muscle_group, exercise_notes, sort_order
     FROM template_exercises
     WHERE program_id = ? AND template_key = ?
     ORDER BY sort_order ASC, id ASC`,
    programId, templateKey
  );
  return rows.map(ex => {
    const sets = db.getAllSync<{
      id: number; set_number: number; target_reps: string;
      prev_weight: string; notes: string;
    }>(
      `SELECT id, set_number, target_reps, prev_weight, notes
       FROM template_sets WHERE template_exercise_id = ?
       ORDER BY set_number ASC`,
      ex.id
    );
    return {
      id: ex.id,
      exerciseId: ex.exercise_id,
      name: ex.exercise_name,
      muscleGroup: ex.muscle_group,
      notes: ex.exercise_notes,
      sortOrder: ex.sort_order,
      sets: sets.map(s => ({
        id: s.id,
        setNumber: s.set_number,
        targetReps: s.target_reps,
        prevWeight: s.prev_weight,
        notes: s.notes,
      })),
    };
  });
}

// Returns a WorkoutTemplate loaded from DB (exercises from DB, metadata from program.ts)
export function getWorkoutFromDB(programId: number, templateKey: string): WorkoutTemplate {
  const base = getTemplateByKey(templateKey);
  const dbExercises = getDBTemplate(programId, templateKey);
  const exercises: TemplateExercise[] = dbExercises.map(ex => ({
    exerciseId: ex.exerciseId,
    name: ex.name,
    muscleGroup: ex.muscleGroup,
    exerciseNotes: ex.notes || undefined,
    sets: ex.sets.map(s => ({
      setNumber: s.setNumber,
      targetReps: s.targetReps,
      prevWeight: s.prevWeight,
      notes: s.notes || undefined,
    })),
  }));
  return { ...base, exercises };
}

export function addTemplateExercise(
  programId: number, templateKey: string,
  name: string, muscleGroup: string, notes: string
): number {
  const maxOrder = db.getFirstSync<{ m: number | null }>(
    'SELECT MAX(sort_order) as m FROM template_exercises WHERE program_id = ? AND template_key = ?',
    programId, templateKey
  )?.m ?? -1;
  const result = db.runSync(
    `INSERT INTO template_exercises
     (program_id, template_key, exercise_id, exercise_name, muscle_group, exercise_notes, sort_order)
     VALUES (?, ?, ?, ?, ?, ?, ?)`,
    programId, templateKey, Date.now(), name, muscleGroup, notes, (maxOrder ?? -1) + 1
  );
  return result.lastInsertRowId;
}

export function updateTemplateExercise(
  id: number, name: string, muscleGroup: string, notes: string
): void {
  db.runSync(
    'UPDATE template_exercises SET exercise_name = ?, muscle_group = ?, exercise_notes = ? WHERE id = ?',
    name, muscleGroup, notes, id
  );
}

export function deleteTemplateExercise(id: number): void {
  db.runSync('DELETE FROM template_sets WHERE template_exercise_id = ?', id);
  db.runSync('DELETE FROM template_exercises WHERE id = ?', id);
}

export function addTemplateSet(
  exerciseDbId: number, targetReps: string, prevWeight: string
): number {
  const maxSetNum = db.getFirstSync<{ m: number | null }>(
    'SELECT MAX(set_number) as m FROM template_sets WHERE template_exercise_id = ?',
    exerciseDbId
  )?.m ?? 0;
  const result = db.runSync(
    `INSERT INTO template_sets (template_exercise_id, set_number, target_reps, prev_weight, notes)
     VALUES (?, ?, ?, ?, '')`,
    exerciseDbId, (maxSetNum ?? 0) + 1, targetReps, prevWeight
  );
  return result.lastInsertRowId;
}

export function updateTemplateSet(
  id: number, targetReps: string, prevWeight: string, notes: string
): void {
  db.runSync(
    'UPDATE template_sets SET target_reps = ?, prev_weight = ?, notes = ? WHERE id = ?',
    targetReps, prevWeight, notes, id
  );
}

export function deleteTemplateSet(id: number): void {
  db.runSync('DELETE FROM template_sets WHERE id = ?', id);
}

// ─── Program import / export ─────────────────────────────────────────────────

interface ExportedSet      { setNumber: number; targetReps: string; prevWeight: string; notes: string; }
interface ExportedExercise { exerciseId: number; name: string; muscleGroup: string; notes: string; sortOrder: number; sets: ExportedSet[]; }
interface ExportedTemplate { key: string; name: string; cardio: string; exercises: ExportedExercise[]; }
interface ExportedProgram  { version: number; name: string; schedule: Record<string, string>; templates: ExportedTemplate[]; }

function b64Encode(str: string): string {
  return btoa(
    encodeURIComponent(str).replace(/%([0-9A-F]{2})/g, (_, p1) =>
      String.fromCharCode(parseInt(p1, 16))
    )
  );
}

function b64Decode(str: string): string {
  return decodeURIComponent(
    atob(str).split('').map(c => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2)).join('')
  );
}

export function exportProgram(programId: number): string {
  const prog = db.getFirstSync<{ name: string }>('SELECT name FROM programs WHERE id = ?', programId);
  if (!prog) throw new Error('Program not found');

  const scheduleRows = db.getAllSync<{ day_of_week: number; template_key: string }>(
    'SELECT day_of_week, template_key FROM schedules WHERE program_id = ?', programId
  );
  const schedule: Record<string, string> = {};
  scheduleRows.forEach(r => { schedule[String(r.day_of_week)] = r.template_key; });

  const exRows = db.getAllSync<{
    id: number; template_key: string; exercise_id: number; exercise_name: string;
    muscle_group: string; exercise_notes: string; sort_order: number;
  }>(
    `SELECT id, template_key, exercise_id, exercise_name, muscle_group, exercise_notes, sort_order
     FROM template_exercises WHERE program_id = ? ORDER BY template_key, sort_order`,
    programId
  );

  const templateMap: Record<string, typeof exRows> = {};
  for (const ex of exRows) {
    if (!templateMap[ex.template_key]) templateMap[ex.template_key] = [];
    templateMap[ex.template_key].push(ex);
  }

  const templates: ExportedTemplate[] = Object.entries(templateMap).map(([key, exercises]) => {
    const meta = WORKOUT_TEMPLATES.find(t => t.key === key);
    return {
      key,
      name: meta?.name ?? key,
      cardio: meta?.cardio ?? '',
      exercises: exercises.map(ex => {
        const sets = db.getAllSync<{ set_number: number; target_reps: string; prev_weight: string; notes: string }>(
          'SELECT set_number, target_reps, prev_weight, notes FROM template_sets WHERE template_exercise_id = ? ORDER BY set_number',
          ex.id
        );
        return {
          exerciseId: ex.exercise_id,
          name: ex.exercise_name,
          muscleGroup: ex.muscle_group,
          notes: ex.exercise_notes,
          sortOrder: ex.sort_order,
          sets: sets.map(s => ({ setNumber: s.set_number, targetReps: s.target_reps, prevWeight: s.prev_weight, notes: s.notes })),
        };
      }),
    };
  });

  const data: ExportedProgram = { version: 1, name: prog.name, schedule, templates };
  return 'FT:' + b64Encode(JSON.stringify(data));
}

export function importProgram(code: string): { success: boolean; name?: string; programId?: number; error?: string } {
  try {
    if (!code.startsWith('FT:')) return { success: false, error: 'Not a valid FitTrackr code. It should start with "FT:".' };
    const data: ExportedProgram = JSON.parse(b64Decode(code.slice(3)));
    if (!data.version || !data.name || !data.schedule || !data.templates) {
      return { success: false, error: 'Invalid program code structure.' };
    }

    const result = db.runSync('INSERT INTO programs (name, is_active) VALUES (?, 0)', data.name);
    const programId = result.lastInsertRowId;

    for (const [day, key] of Object.entries(data.schedule)) {
      db.runSync(
        'INSERT INTO schedules (program_id, day_of_week, template_key) VALUES (?, ?, ?)',
        programId, parseInt(day), key
      );
    }

    for (const template of data.templates) {
      for (const ex of template.exercises) {
        const exResult = db.runSync(
          `INSERT INTO template_exercises (program_id, template_key, exercise_id, exercise_name, muscle_group, exercise_notes, sort_order)
           VALUES (?, ?, ?, ?, ?, ?, ?)`,
          programId, template.key, ex.exerciseId, ex.name, ex.muscleGroup, ex.notes, ex.sortOrder
        );
        for (const s of ex.sets) {
          db.runSync(
            `INSERT INTO template_sets (template_exercise_id, set_number, target_reps, prev_weight, notes) VALUES (?, ?, ?, ?, ?)`,
            exResult.lastInsertRowId, s.setNumber, s.targetReps, s.prevWeight, s.notes
          );
        }
      }
    }

    return { success: true, name: data.name, programId };
  } catch {
    return { success: false, error: 'Failed to decode the code. Make sure you copied the full thing.' };
  }
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

export function deleteWorkout(id: number): void {
  db.runSync('DELETE FROM workout_sets WHERE workout_id = ?', id);
  db.runSync('DELETE FROM workouts WHERE id = ?', id);
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
