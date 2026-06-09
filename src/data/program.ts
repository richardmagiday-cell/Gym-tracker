export interface PrescribedSet {
  setNumber: number;
  targetReps: string;  // "6", "12+", "F", "8-12", "15-20"
  prevWeight: string;  // e.g. "55", "BW", "71.5 / 22 single"
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

// Day-of-week → workout key (0=Sun, 1=Mon, …)
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
  {
    key: 'pull_a',
    name: 'Pull A',
    cardio: 'Walk backwards on treadmill incline 5 for 10 min',
    exercises: [
      {
        exerciseId: 1,
        name: 'Hammer Curls',
        muscleGroup: 'Biceps',
        exerciseNotes: 'One arm at a time – rep count is per arm',
        sets: [
          { setNumber: 1, targetReps: '6',   prevWeight: '55' },
          { setNumber: 2, targetReps: '6',   prevWeight: '55' },
          { setNumber: 3, targetReps: '10',  prevWeight: '55' },
          { setNumber: 4, targetReps: '15',  prevWeight: '45' },
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
          { setNumber: 1, targetReps: '8',   prevWeight: '88' },
          { setNumber: 2, targetReps: '8',   prevWeight: '88' },
          { setNumber: 3, targetReps: '8',   prevWeight: '88' },
          { setNumber: 4, targetReps: '12+', prevWeight: '88' },
        ],
      },
      {
        exerciseId: 6,
        name: 'Rope Tricep Extension',
        muscleGroup: 'Triceps',
        sets: [
          { setNumber: 1, targetReps: '8',   prevWeight: '71.5 / 27.5 single' },
          { setNumber: 2, targetReps: '8',   prevWeight: '71.5 / 27.5 single' },
          { setNumber: 3, targetReps: '12+', prevWeight: '71.5 / 27.5 single' },
        ],
      },
      {
        exerciseId: 7,
        name: 'Eugene Extension',
        muscleGroup: 'Triceps',
        sets: [
          { setNumber: 1, targetReps: '15+', prevWeight: '30' },
          { setNumber: 2, targetReps: '15+', prevWeight: '30' },
        ],
      },
      {
        exerciseId: 8,
        name: 'Prorated Curl',
        muscleGroup: 'Biceps',
        sets: [
          { setNumber: 1, targetReps: '10+', prevWeight: '30' },
          { setNumber: 2, targetReps: '10+', prevWeight: '30' },
        ],
      },
      {
        exerciseId: 9,
        name: 'First Knuckle Push-ups',
        muscleGroup: 'Triceps',
        sets: [
          { setNumber: 1, targetReps: '15+', prevWeight: 'BW' },
          { setNumber: 2, targetReps: '15+', prevWeight: 'BW' },
        ],
      },
    ],
  },

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
          { setNumber: 1, targetReps: '4',  prevWeight: '275' },
          { setNumber: 2, targetReps: '4',  prevWeight: '295' },
          { setNumber: 3, targetReps: '8',  prevWeight: '245', notes: '2-sec pause at bottom' },
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
        exerciseNotes: '4 inch elevation – each side',
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
          { setNumber: 4, targetReps: '15+', prevWeight: '3-point drop set' },
          { setNumber: 5, targetReps: '15+', prevWeight: '3-point drop set' },
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

  {
    key: 'push_b',
    name: 'Push B',
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

  {
    key: 'pull_b',
    name: 'Pull B',
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
          { setNumber: 3, targetReps: '12+', prevWeight: '135 / iso 2 plates+25' },
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
          { setNumber: 1, targetReps: '4',     prevWeight: '2/1 plates',         notes: 'Warm up' },
          { setNumber: 2, targetReps: '4',     prevWeight: '5/3 plates',         notes: 'HEAVY' },
          { setNumber: 3, targetReps: '6-8',   prevWeight: '4 plates / 2p+25' },
          { setNumber: 4, targetReps: '15-20', prevWeight: '3 plates / 2 plates' },
        ],
      },
      {
        exerciseId: 30,
        name: 'Lunges',
        muscleGroup: 'Quads',
        sets: [
          { setNumber: 1, targetReps: '4 lengths – 25 yds', prevWeight: 'BW' },
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
        exerciseNotes: 'HEAVY first 2 sets, volume after',
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
];

export const REST_DAY: WorkoutTemplate = {
  key: 'rest',
  name: 'Rest Day',
  cardio: '',
  exercises: [],
};

export function getTodaysTemplate(): WorkoutTemplate {
  const day = new Date().getDay();
  const key = DAILY_SCHEDULE[day];
  return WORKOUT_TEMPLATES.find(w => w.key === key) ?? REST_DAY;
}
