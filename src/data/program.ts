export interface PrescribedSet {
  setNumber: number;
  targetReps: string;   // official coach target — never changes
  prevWeight: string;   // fallback from PDF if no DB data yet
  notes?: string;
}

export interface TemplateExercise {
  exerciseId: number;
  name: string;
  muscleGroup: string;
  sets: PrescribedSet[];
  exerciseNotes?: string;
}

export interface WorkoutTemplate {
  key: string;
  name: string;
  cardio: string;
  exercises: TemplateExercise[];
}

// Fallback static schedule — replaced at runtime by DB active schedule
export const DAILY_SCHEDULE: Record<number, string> = {
  1: 'pull_a',
  2: 'push_a',
  3: 'legs_a',
  4: 'push_b',
  5: 'pull_b',
  6: 'legs_b',
  0: 'rest',
};

export const WORKOUT_TEMPLATES: WorkoutTemplate[] = [
  // ─── PULL A (page 6) ───────────────────────────────────────────────────────
  {
    key: 'pull_a',
    name: 'Pull A',
    cardio: 'Incline walk 5 pace 2 – 20 min',
    exercises: [
      {
        exerciseId: 19,
        name: 'Pull Ups',
        muscleGroup: 'Back',
        exerciseNotes: 'Heavy',
        sets: [
          { setNumber: 1, targetReps: '12', prevWeight: 'BW' },
          { setNumber: 2, targetReps: '12', prevWeight: 'BW' },
        ],
      },
      {
        exerciseId: 23,
        name: 'Close Grip Pull Down',
        muscleGroup: 'Back',
        exerciseNotes: 'Heavy',
        sets: [
          { setNumber: 1, targetReps: '10',    prevWeight: '209' },
          { setNumber: 2, targetReps: '12-15', prevWeight: '187' },
        ],
      },
      {
        exerciseId: 24,
        name: 'Single Hand / High Pull Down',
        muscleGroup: 'Back',
        sets: [
          { setNumber: 1, targetReps: '8', prevWeight: '77' },
          { setNumber: 2, targetReps: '8', prevWeight: '77' },
          { setNumber: 3, targetReps: '8', prevWeight: '77' },
        ],
      },
      {
        exerciseId: 25,
        name: 'Bent Over Rows',
        muscleGroup: 'Back',
        sets: [
          { setNumber: 1, targetReps: '6',   prevWeight: '185 / iso 3 plates' },
          { setNumber: 2, targetReps: '6',   prevWeight: '185 / iso 3 plates' },
          { setNumber: 3, targetReps: '12+', prevWeight: '135 / iso 2p+25' },
        ],
      },
      {
        exerciseId: 26,
        name: 'Close Grip Rows',
        muscleGroup: 'Back',
        sets: [
          { setNumber: 1, targetReps: '6',   prevWeight: '209' },
          { setNumber: 2, targetReps: '6',   prevWeight: '214' },
          { setNumber: 3, targetReps: '12+', prevWeight: '187' },
        ],
      },
      {
        exerciseId: 27,
        name: 'Pullovers',
        muscleGroup: 'Back',
        sets: [
          { setNumber: 1, targetReps: '8',  prevWeight: '82.5' },
          { setNumber: 2, targetReps: '10', prevWeight: '82.5' },
          { setNumber: 3, targetReps: '12', prevWeight: '82.5' },
        ],
      },
      {
        exerciseId: 1,
        name: 'Hammer Curls',
        muscleGroup: 'Biceps',
        exerciseNotes: 'One arm at a time – rep count is per arm',
        sets: [
          { setNumber: 1, targetReps: '6',  prevWeight: '55' },
          { setNumber: 2, targetReps: '6',  prevWeight: '55' },
          { setNumber: 3, targetReps: '10', prevWeight: '55' },
          { setNumber: 4, targetReps: '15', prevWeight: '45' },
        ],
      },
      {
        exerciseId: 2,
        name: 'Preacher Cable Curls',
        muscleGroup: 'Biceps',
        exerciseNotes: 'Go up in weight if you hit 12',
        sets: [
          { setNumber: 1, targetReps: '12+', prevWeight: '70' },
          { setNumber: 2, targetReps: '12+', prevWeight: '70' },
        ],
      },
      {
        exerciseId: 3,
        name: 'Flat Bar Curls',
        muscleGroup: 'Biceps',
        sets: [
          { setNumber: 1, targetReps: '6-8', prevWeight: '50' },
          { setNumber: 2, targetReps: '15',  prevWeight: '50' },
        ],
      },
    ],
  },

  // ─── PUSH A (page 3) ───────────────────────────────────────────────────────
  {
    key: 'push_a',
    name: 'Push A',
    cardio: 'Walk backwards on treadmill incline 5 for 10 min',
    exercises: [
      {
        exerciseId: 10,
        name: 'Bench Press',
        muscleGroup: 'Chest',
        sets: [
          { setNumber: 1, targetReps: '4', prevWeight: '275' },
          { setNumber: 2, targetReps: '4', prevWeight: '295' },
          { setNumber: 3, targetReps: '8', prevWeight: '245', notes: '2-sec pause at bottom' },
        ],
      },
      {
        exerciseId: 11,
        name: 'Lateral Raises / Delt Machine',
        muscleGroup: 'Shoulders',
        sets: [
          { setNumber: 1, targetReps: '10+', prevWeight: '50 LR / 90 machine' },
          { setNumber: 2, targetReps: '10+', prevWeight: '50 LR / 90 machine' },
          { setNumber: 3, targetReps: '10+', prevWeight: '50 LR / 90 machine' },
        ],
      },
      {
        exerciseId: 12,
        name: 'Chest Flys',
        muscleGroup: 'Chest',
        sets: [
          { setNumber: 1, targetReps: '8',   prevWeight: '160 / 85' },
          { setNumber: 2, targetReps: '10',  prevWeight: '160 / 85' },
          { setNumber: 3, targetReps: '15+', prevWeight: '160 / 75' },
          { setNumber: 4, targetReps: '15+', prevWeight: '160 / 75' },
        ],
      },
      {
        exerciseId: 5,
        name: 'EZ Bar Cable Push Downs',
        muscleGroup: 'Triceps',
        sets: [
          { setNumber: 1, targetReps: '8',   prevWeight: '93.5' },
          { setNumber: 2, targetReps: '8',   prevWeight: '93.5' },
          { setNumber: 3, targetReps: '8',   prevWeight: '93.5' },
          { setNumber: 4, targetReps: '12+', prevWeight: '88' },
        ],
      },
      {
        exerciseId: 6,
        name: 'Rope Tricep Extension',
        muscleGroup: 'Triceps',
        sets: [
          { setNumber: 1, targetReps: '8',   prevWeight: '71.5 / 22 single' },
          { setNumber: 2, targetReps: '8',   prevWeight: '71.5 / 22 single' },
          { setNumber: 3, targetReps: '12+', prevWeight: '71.5 / 22 single' },
        ],
      },
      {
        exerciseId: 13,
        name: 'Dips',
        muscleGroup: 'Triceps',
        sets: [
          { setNumber: 1, targetReps: 'F', prevWeight: 'BW' },
          { setNumber: 2, targetReps: 'F', prevWeight: 'BW' },
          { setNumber: 3, targetReps: 'F', prevWeight: 'BW' },
        ],
      },
    ],
  },

  // ─── LEGS A (page 4) ───────────────────────────────────────────────────────
  {
    key: 'legs_a',
    name: 'Legs A',
    cardio: 'Incline walk 5 pace 2 – 20 min',
    exercises: [
      {
        exerciseId: 14,
        name: 'Deadlifts',
        muscleGroup: 'Back / Legs',
        exerciseNotes: 'Your core is your limitation',
        sets: [
          { setNumber: 1, targetReps: '4', prevWeight: '315', notes: 'Feeder set' },
          { setNumber: 2, targetReps: '4', prevWeight: '315' },
          { setNumber: 3, targetReps: '8', prevWeight: '275' },
        ],
      },
      {
        exerciseId: 15,
        name: 'RDLs',
        muscleGroup: 'Hamstrings',
        sets: [
          { setNumber: 1, targetReps: '10+', prevWeight: '225' },
          { setNumber: 2, targetReps: '10+', prevWeight: '225' },
          { setNumber: 3, targetReps: '10+', prevWeight: '225' },
          { setNumber: 4, targetReps: '10+', prevWeight: '225' },
        ],
      },
      {
        exerciseId: 16,
        name: 'Reverse Lunges – Smith Machine',
        muscleGroup: 'Quads',
        exerciseNotes: '4 inch elevation, each side',
        sets: [
          { setNumber: 1, targetReps: '8', prevWeight: '225' },
          { setNumber: 2, targetReps: '8', prevWeight: '225', notes: 'Pushing failure' },
          { setNumber: 3, targetReps: '8', prevWeight: '225' },
        ],
      },
      {
        exerciseId: 17,
        name: 'Leg Curls',
        muscleGroup: 'Hamstrings',
        sets: [
          { setNumber: 1, targetReps: '8',   prevWeight: '140 / 70' },
          { setNumber: 2, targetReps: '8',   prevWeight: '140 / 70' },
          { setNumber: 3, targetReps: '10+', prevWeight: '140 / 70' },
          { setNumber: 4, targetReps: '15+', prevWeight: '3-pt drop set' },
          { setNumber: 5, targetReps: '15+', prevWeight: '3-pt drop set' },
        ],
      },
      {
        exerciseId: 18,
        name: 'Calf Raises',
        muscleGroup: 'Calves',
        sets: [
          { setNumber: 1, targetReps: '12', prevWeight: '115' },
          { setNumber: 2, targetReps: '12', prevWeight: '115' },
          { setNumber: 3, targetReps: '12', prevWeight: '115' },
        ],
      },
    ],
  },

  // ─── PUSH B (page 9) ───────────────────────────────────────────────────────
  {
    key: 'push_b',
    name: 'Push B',
    cardio: 'Walk backwards on treadmill incline 5 for 10 min',
    exercises: [
      {
        exerciseId: 33,
        name: 'Neutral Grip Pull Down',
        muscleGroup: 'Back',
        sets: [
          { setNumber: 1, targetReps: '6',  prevWeight: '165' },
          { setNumber: 2, targetReps: '6+', prevWeight: '165' },
          { setNumber: 3, targetReps: '8+', prevWeight: '165', notes: 'Preferably smith' },
        ],
      },
      {
        exerciseId: 10,
        name: 'Bench Press / Flat DBs',
        muscleGroup: 'Chest',
        sets: [
          { setNumber: 1, targetReps: '6',  prevWeight: '225 / 80s', notes: 'Heavy' },
          { setNumber: 2, targetReps: '15', prevWeight: '185 / 70s' },
        ],
      },
      {
        exerciseId: 34,
        name: 'Pullups × Pullover Superset',
        muscleGroup: 'Back',
        exerciseNotes: 'Pullups to failure → immediately 10+ reps of pullovers (66 lbs)',
        sets: [
          { setNumber: 1, targetReps: 'F + 10', prevWeight: 'BW / 66' },
          { setNumber: 2, targetReps: 'F + 11', prevWeight: 'BW / 66' },
          { setNumber: 3, targetReps: 'F + 12', prevWeight: 'BW / 66' },
        ],
      },
      {
        exerciseId: 13,
        name: 'Dips',
        muscleGroup: 'Chest / Triceps',
        sets: [
          { setNumber: 1, targetReps: 'F', prevWeight: 'BW (22 reps)' },
          { setNumber: 2, targetReps: 'F', prevWeight: 'BW (14 reps)' },
        ],
      },
      {
        exerciseId: 35,
        name: 'Single Hand DB Rows',
        muscleGroup: 'Back',
        exerciseNotes: 'Focus on deep stretch, go heavy',
        sets: [
          { setNumber: 1, targetReps: '8+', prevWeight: '80', notes: 'Each side' },
          { setNumber: 2, targetReps: '8+', prevWeight: '80' },
        ],
      },
      {
        exerciseId: 36,
        name: 'Wide Grip Rows',
        muscleGroup: 'Back',
        sets: [
          { setNumber: 1, targetReps: '12+', prevWeight: '145' },
          { setNumber: 2, targetReps: '12+', prevWeight: '145' },
        ],
      },
      {
        exerciseId: 12,
        name: 'Chest Flys',
        muscleGroup: 'Chest',
        sets: [
          { setNumber: 1, targetReps: '10+', prevWeight: '30.8 / 160' },
          { setNumber: 2, targetReps: '10+', prevWeight: '30.8 / 160' },
          { setNumber: 3, targetReps: '10+', prevWeight: '30.8 / 160' },
        ],
      },
      {
        exerciseId: 37,
        name: 'Tricep Flat Bar Pushdown',
        muscleGroup: 'Triceps',
        exerciseNotes: 'Heavy as possible',
        sets: [
          { setNumber: 1, targetReps: '8',   prevWeight: '77' },
          { setNumber: 2, targetReps: '8',   prevWeight: '77' },
          { setNumber: 3, targetReps: '10+', prevWeight: '77' },
        ],
      },
      {
        exerciseId: 38,
        name: 'Lateral Raises (5/10 lb DBs)',
        muscleGroup: 'Shoulders',
        exerciseNotes: 'Light weight, pause at top',
        sets: [
          { setNumber: 1, targetReps: '15+', prevWeight: '10 / 50', notes: '2-sec pause at top' },
          { setNumber: 2, targetReps: '15+', prevWeight: '10 / 50', notes: '3-sec pause at top' },
          { setNumber: 3, targetReps: '15+', prevWeight: '10 / 50', notes: 'No pause' },
        ],
      },
      {
        exerciseId: 39,
        name: 'Tricep Overhead Extensions',
        muscleGroup: 'Triceps',
        sets: [
          { setNumber: 1, targetReps: '8+', prevWeight: '60.5 / 22 single' },
          { setNumber: 2, targetReps: '8+', prevWeight: '71 / 22 single' },
        ],
      },
      {
        exerciseId: 1,
        name: 'Hammer Curls',
        muscleGroup: 'Biceps',
        exerciseNotes: 'One arm at a time',
        sets: [
          { setNumber: 1, targetReps: '8-10', prevWeight: '45' },
          { setNumber: 2, targetReps: '12+',  prevWeight: '45' },
          { setNumber: 3, targetReps: '12+',  prevWeight: '45' },
        ],
      },
    ],
  },

  // ─── PULL B (page 5) ───────────────────────────────────────────────────────
  {
    key: 'pull_b',
    name: 'Pull B',
    cardio: 'No cardio',
    exercises: [
      {
        exerciseId: 19,
        name: 'Pull Ups',
        muscleGroup: 'Back',
        sets: [
          { setNumber: 1, targetReps: '8',  prevWeight: 'BW' },
          { setNumber: 2, targetReps: '12', prevWeight: 'BW' },
        ],
      },
      {
        exerciseId: 20,
        name: 'Flat Dumbbell Press / Bench',
        muscleGroup: 'Chest',
        sets: [
          { setNumber: 1, targetReps: '8', prevWeight: '225 / 90 DBs' },
          { setNumber: 2, targetReps: '8', prevWeight: '245 / 90 DBs' },
        ],
      },
      {
        exerciseId: 21,
        name: 'High Incline Smith Press',
        muscleGroup: 'Chest / Shoulders',
        sets: [
          { setNumber: 1, targetReps: '6',   prevWeight: '225' },
          { setNumber: 2, targetReps: '8',   prevWeight: '225' },
          { setNumber: 3, targetReps: '12+', prevWeight: '185' },
        ],
      },
      {
        exerciseId: 22,
        name: 'Lateral Raises',
        muscleGroup: 'Shoulders',
        exerciseNotes: 'HEAVY',
        sets: [
          { setNumber: 1, targetReps: '8',   prevWeight: '90' },
          { setNumber: 2, targetReps: '8',   prevWeight: '90' },
          { setNumber: 3, targetReps: '8',   prevWeight: '90' },
          { setNumber: 4, targetReps: '15+', prevWeight: '90' },
          { setNumber: 5, targetReps: '15+', prevWeight: '90' },
        ],
      },
      {
        exerciseId: 12,
        name: 'Chest Flys',
        muscleGroup: 'Chest',
        sets: [
          { setNumber: 1, targetReps: '8',   prevWeight: '160 / 85' },
          { setNumber: 2, targetReps: '8',   prevWeight: '160 / 85' },
          { setNumber: 3, targetReps: '15+', prevWeight: '160 / 85' },
          { setNumber: 4, targetReps: '15+', prevWeight: '160 / 85' },
        ],
      },
      {
        exerciseId: 4,
        name: 'Skull Crushers',
        muscleGroup: 'Triceps',
        exerciseNotes: 'If you do 12 go up in weight',
        sets: [
          { setNumber: 1, targetReps: '12+', prevWeight: '100' },
          { setNumber: 2, targetReps: '12+', prevWeight: '100' },
          { setNumber: 3, targetReps: '12+', prevWeight: '100' },
        ],
      },
      {
        exerciseId: 6,
        name: 'Rope Tricep Extension',
        muscleGroup: 'Triceps',
        exerciseNotes: 'If you do 12 go up in weight',
        sets: [
          { setNumber: 1, targetReps: '12+', prevWeight: '71.5 / 25 single' },
          { setNumber: 2, targetReps: '12+', prevWeight: '71.5 / 25 single' },
          { setNumber: 3, targetReps: '12+', prevWeight: '71.5 / 25 single' },
        ],
      },
      {
        exerciseId: 13,
        name: 'Dips',
        muscleGroup: 'Triceps',
        sets: [
          { setNumber: 1, targetReps: 'F', prevWeight: 'BW' },
          { setNumber: 2, targetReps: 'F', prevWeight: 'BW' },
        ],
      },
    ],
  },

  // ─── LEGS B (page 8) ───────────────────────────────────────────────────────
  {
    key: 'legs_b',
    name: 'Legs B',
    cardio: 'REST',
    exercises: [
      {
        exerciseId: 28,
        name: 'Lying Hamstring Curls',
        muscleGroup: 'Hamstrings',
        sets: [
          { setNumber: 1, targetReps: '12', prevWeight: '130 / 60',  notes: '60% effort' },
          { setNumber: 2, targetReps: '12', prevWeight: '140 / 70',  notes: '70% effort' },
          { setNumber: 3, targetReps: '12', prevWeight: '150 / 80',  notes: '80% effort' },
        ],
      },
      {
        exerciseId: 29,
        name: 'Smith Squats / Hack Squats',
        muscleGroup: 'Quads',
        sets: [
          { setNumber: 1, targetReps: '4',     prevWeight: '2/1 plates',   notes: 'Warm up' },
          { setNumber: 2, targetReps: '4',     prevWeight: '5/3 plates',   notes: 'HEAVY' },
          { setNumber: 3, targetReps: '6-8',   prevWeight: '4p / 2p+25' },
          { setNumber: 4, targetReps: '15-20', prevWeight: '3p / 2 plates' },
        ],
      },
      {
        exerciseId: 30,
        name: 'Lunges',
        muscleGroup: 'Quads',
        sets: [
          { setNumber: 1, targetReps: '4 lengths (25 yds)', prevWeight: 'BW' },
        ],
      },
      {
        exerciseId: 31,
        name: 'Leg Press',
        muscleGroup: 'Quads',
        exerciseNotes: 'Heavy',
        sets: [
          { setNumber: 1, targetReps: '8',  prevWeight: '6 plates' },
          { setNumber: 2, targetReps: '8',  prevWeight: '7 plates' },
          { setNumber: 3, targetReps: '20', prevWeight: '7 plates' },
        ],
      },
      {
        exerciseId: 32,
        name: 'Leg Extension',
        muscleGroup: 'Quads',
        exerciseNotes: 'Heavy first 2, volume after',
        sets: [
          { setNumber: 1, targetReps: '8',   prevWeight: '220 / 90', notes: 'HEAVY' },
          { setNumber: 2, targetReps: '8',   prevWeight: '220 / 90', notes: 'HEAVY' },
          { setNumber: 3, targetReps: '12+', prevWeight: '220 / 90' },
          { setNumber: 4, targetReps: '12+', prevWeight: '220 / 90' },
          { setNumber: 5, targetReps: 'D3F', prevWeight: '220/200/180 + 80/60/40' },
        ],
      },
      {
        exerciseId: 18,
        name: 'Calf Raises',
        muscleGroup: 'Calves',
        sets: [
          { setNumber: 1, targetReps: '12+', prevWeight: '135' },
          { setNumber: 2, targetReps: '8+',  prevWeight: '135' },
          { setNumber: 3, targetReps: '8+',  prevWeight: '135' },
          { setNumber: 4, targetReps: '8+',  prevWeight: '115' },
        ],
      },
    ],
  },

  // ─── ARMS (page 2) ─────────────────────────────────────────────────────────
  {
    key: 'arms',
    name: 'Arms',
    cardio: 'Walk backwards on treadmill incline 5 for 10 min',
    exercises: [
      {
        exerciseId: 1,
        name: 'Hammer Curls',
        muscleGroup: 'Biceps',
        exerciseNotes: 'One arm at a time',
        sets: [
          { setNumber: 1, targetReps: '8-12', prevWeight: '45' },
          { setNumber: 2, targetReps: '8-12', prevWeight: '45' },
          { setNumber: 3, targetReps: '12+',  prevWeight: '45' },
          { setNumber: 4, targetReps: '12+',  prevWeight: '45' },
        ],
      },
      {
        exerciseId: 2,
        name: 'Preacher Cable Curls',
        muscleGroup: 'Biceps',
        exerciseNotes: 'Go up in weight if you hit 12',
        sets: [
          { setNumber: 1, targetReps: '12+', prevWeight: '70' },
          { setNumber: 2, targetReps: '12+', prevWeight: '70' },
        ],
      },
      {
        exerciseId: 3,
        name: 'Flat Bar Curls',
        muscleGroup: 'Biceps',
        sets: [
          { setNumber: 1, targetReps: '6-8', prevWeight: '50' },
          { setNumber: 2, targetReps: '15',  prevWeight: '50' },
        ],
      },
      {
        exerciseId: 4,
        name: 'Skull Crushers',
        muscleGroup: 'Triceps',
        exerciseNotes: 'If you do 12 go up in weight',
        sets: [
          { setNumber: 1, targetReps: '12+', prevWeight: '100' },
          { setNumber: 2, targetReps: '12+', prevWeight: '100' },
          { setNumber: 3, targetReps: '12+', prevWeight: '100' },
        ],
      },
      {
        exerciseId: 5,
        name: 'EZ Bar Cable Push Downs',
        muscleGroup: 'Triceps',
        sets: [
          { setNumber: 1, targetReps: '8',   prevWeight: '93.5' },
          { setNumber: 2, targetReps: '8',   prevWeight: '93.5' },
          { setNumber: 3, targetReps: '8',   prevWeight: '93.5' },
          { setNumber: 4, targetReps: '12+', prevWeight: '88' },
        ],
      },
      {
        exerciseId: 6,
        name: 'Rope Tricep Extension',
        muscleGroup: 'Triceps',
        sets: [
          { setNumber: 1, targetReps: '8',   prevWeight: '71.5 / 22 single' },
          { setNumber: 2, targetReps: '8',   prevWeight: '71.5 / 22 single' },
          { setNumber: 3, targetReps: '12+', prevWeight: '71.5 / 22 single' },
        ],
      },
      {
        exerciseId: 7,
        name: 'Eugene Extension',
        muscleGroup: 'Triceps',
        sets: [
          { setNumber: 1, targetReps: '8+', prevWeight: '—' },
          { setNumber: 2, targetReps: '8+', prevWeight: '—' },
        ],
      },
      {
        exerciseId: 8,
        name: 'Prorated Curl',
        muscleGroup: 'Biceps',
        sets: [
          { setNumber: 1, targetReps: 'F', prevWeight: '—' },
          { setNumber: 2, targetReps: 'F', prevWeight: '—' },
        ],
      },
      {
        exerciseId: 9,
        name: 'First Knuckle Push-ups',
        muscleGroup: 'Chest / Triceps',
        sets: [
          { setNumber: 1, targetReps: 'F', prevWeight: 'BW' },
          { setNumber: 2, targetReps: 'F', prevWeight: 'BW' },
        ],
      },
    ],
  },
];

export const REST_DAY: WorkoutTemplate = {
  key: 'rest',
  name: 'Rest Day',
  cardio: '',
  exercises: [],
};

export function getTodaysTemplate(): WorkoutTemplate {
  const key = DAILY_SCHEDULE[new Date().getDay()];
  return WORKOUT_TEMPLATES.find(w => w.key === key) ?? REST_DAY;
}

export function getTemplateByKey(key: string): WorkoutTemplate {
  return WORKOUT_TEMPLATES.find(w => w.key === key) ?? REST_DAY;
}
