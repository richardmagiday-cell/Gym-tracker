import { useState, useCallback } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity, TextInput,
  StyleSheet, Alert, KeyboardAvoidingView, Platform,
} from 'react-native';
import { useFocusEffect } from 'expo-router';
import {
  WORKOUT_TEMPLATES, REST_DAY, DAILY_SCHEDULE,
  getTodaysTemplate, getTemplateByKey, WorkoutTemplate, TemplateExercise,
} from '../../src/data/program';
import { addSet, createWorkout, getLastSetsForExercise, getWorkoutsOnDates } from '../../src/db/database';

// ─── helpers ────────────────────────────────────────────────────────────────

const DAY_NAMES = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

type LastSet = { setNumber: number; reps: number; weightLbs: number };
// exerciseId → (setNumber → LastSet)
type SessionMap = Record<number, Record<number, LastSet>>;

function getWeekDates(): { date: string; dayIndex: number; label: string }[] {
  const today = new Date();
  const dow = today.getDay(); // 0=Sun
  const monday = new Date(today);
  monday.setDate(today.getDate() - (dow === 0 ? 6 : dow - 1));
  return Array.from({ length: 7 }, (_, i) => {
    const d = new Date(monday);
    d.setDate(monday.getDate() + i);
    return {
      date: d.toISOString().split('T')[0],
      dayIndex: d.getDay(),
      label: DAY_NAMES[d.getDay()],
    };
  });
}

const TODAY_STR = new Date().toISOString().split('T')[0];

// ─── component ───────────────────────────────────────────────────────────────

export default function TodaysWorkout() {
  const [template, setTemplate] = useState<WorkoutTemplate>(getTodaysTemplate());
  const [showDayPicker, setShowDayPicker] = useState(false);
  const [workoutId, setWorkoutId] = useState<number | null>(null);
  const [activeExerciseId, setActiveExerciseId] = useState<number | null>(null);
  const [weight, setWeight] = useState('');
  const [reps, setReps] = useState('');
  const [loggedCounts, setLoggedCounts] = useState<Record<number, number>>({}); // exerciseId → sets done today
  const [todaySets, setTodaySets] = useState<Record<number, Record<number, { w: number; r: number }>>>({}); // exerciseId → setNum → {w,r}
  const [sessionMap, setSessionMap] = useState<SessionMap>({}); // last-session data
  const [completedDates, setCompletedDates] = useState<string[]>([]);
  const weekDays = getWeekDates();

  useFocusEffect(
    useCallback(() => {
      // Load last-session data for every exercise in this template
      const map: SessionMap = {};
      for (const ex of template.exercises) {
        const rows = getLastSetsForExercise(ex.name);
        const bySet: Record<number, LastSet> = {};
        rows.forEach(r => { bySet[r.setNumber] = r; });
        map[ex.exerciseId] = bySet;
      }
      setSessionMap(map);
      // Load which days this week had workouts
      setCompletedDates(getWorkoutsOnDates(weekDays.map(d => d.date)));
    }, [template])
  );

  function switchTemplate(t: WorkoutTemplate) {
    setTemplate(t);
    setShowDayPicker(false);
    setWorkoutId(null);
    setLoggedCounts({});
    setTodaySets({});
    setActiveExerciseId(null);
    setWeight('');
    setReps('');
  }

  function startWorkout() {
    const id = createWorkout(TODAY_STR, template.name);
    setWorkoutId(id);
  }

  function toggleExercise(id: number) {
    setActiveExerciseId(prev => (prev === id ? null : id));
    setWeight('');
    setReps('');
  }

  function logSet(ex: TemplateExercise) {
    if (!workoutId) return;
    const w = parseFloat(weight);
    const r = parseInt(reps, 10);
    if (!r || isNaN(w)) { Alert.alert('Enter valid weight and reps'); return; }
    const setNum = (loggedCounts[ex.exerciseId] ?? 0) + 1;
    addSet(workoutId, ex.exerciseId, ex.name, setNum, r, w);
    setLoggedCounts(prev => ({ ...prev, [ex.exerciseId]: setNum }));
    setTodaySets(prev => ({
      ...prev,
      [ex.exerciseId]: { ...(prev[ex.exerciseId] ?? {}), [setNum]: { w, r } },
    }));
    setWeight('');
    setReps('');
  }

  const totalSets = Object.values(loggedCounts).reduce((a, b) => a + b, 0);

  if (template.key === 'rest') {
    return (
      <View style={s.center}>
        <Text style={s.restIcon}>💤</Text>
        <Text style={s.restTitle}>Rest Day</Text>
        <Text style={s.restSub}>Recovery is part of the program.</Text>
        <TouchableOpacity style={s.changeBtn} onPress={() => setShowDayPicker(p => !p)}>
          <Text style={s.changeBtnText}>Log a different day</Text>
        </TouchableOpacity>
        {showDayPicker && <DayPicker current={template.key} onSelect={switchTemplate} />}
      </View>
    );
  }

  return (
    <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <ScrollView style={s.container} keyboardShouldPersistTaps="handled">

        {/* ── Week strip ── */}
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={s.weekStrip}>
          {weekDays.map(day => {
            const key = DAILY_SCHEDULE[day.dayIndex];
            const wt = WORKOUT_TEMPLATES.find(t => t.key === key);
            const isToday = day.date === TODAY_STR;
            const isDone = completedDates.includes(day.date);
            const isPast = day.date < TODAY_STR;
            const isSelected = key === template.key && isToday;
            return (
              <TouchableOpacity
                key={day.date}
                style={[s.dayCell, isToday && s.dayCellToday, isSelected && s.dayCellSelected]}
                onPress={() => wt ? switchTemplate(wt) : switchTemplate(REST_DAY)}
              >
                <Text style={[s.dayLabel, isToday && s.dayLabelToday]}>{day.label}</Text>
                <Text style={[s.dayWorkout, isToday && s.dayWorkoutToday]} numberOfLines={1}>
                  {wt?.name ?? 'Rest'}
                </Text>
                <Text style={s.dayStatus}>
                  {isDone ? '✓' : isPast ? '–' : isToday ? '●' : '○'}
                </Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>

        {/* ── Header ── */}
        <View style={s.header}>
          <View>
            <Text style={s.workoutName}>{template.name}</Text>
            {template.cardio !== 'No cardio' && template.cardio !== 'REST' && (
              <Text style={s.cardioText}>Cardio: {template.cardio}</Text>
            )}
          </View>
          <TouchableOpacity style={s.changeBtn} onPress={() => setShowDayPicker(p => !p)}>
            <Text style={s.changeBtnText}>Switch</Text>
          </TouchableOpacity>
        </View>

        {showDayPicker && <DayPicker current={template.key} onSelect={switchTemplate} />}

        {!workoutId ? (
          <TouchableOpacity style={s.startBtn} onPress={startWorkout}>
            <Text style={s.startBtnText}>Start Workout</Text>
          </TouchableOpacity>
        ) : (
          <Text style={s.statsText}>{totalSets} sets logged today</Text>
        )}

        {/* ── Exercise list ── */}
        {template.exercises.map(ex => {
          const logged = loggedCounts[ex.exerciseId] ?? 0;
          const isActive = activeExerciseId === ex.exerciseId;
          const nextSetNum = logged + 1;
          const nextPrescribed = ex.sets[logged]; // the prescribed set object for the upcoming set
          const lastSession = sessionMap[ex.exerciseId] ?? {};
          const todayLogged = todaySets[ex.exerciseId] ?? {};

          return (
            <TouchableOpacity
              key={ex.exerciseId}
              style={[s.exCard, logged > 0 && s.exCardStarted]}
              onPress={() => workoutId && toggleExercise(ex.exerciseId)}
              activeOpacity={workoutId ? 0.7 : 1}
            >
              {/* Exercise header */}
              <View style={s.exHeader}>
                <View style={{ flex: 1 }}>
                  <Text style={s.exName}>{ex.name}</Text>
                  <Text style={s.exMuscle}>{ex.muscleGroup}</Text>
                </View>
                {/* Set completion dots */}
                <View style={s.dots}>
                  {ex.sets.map((_, i) => (
                    <View key={i} style={[s.dot, i < logged && s.dotDone]} />
                  ))}
                </View>
              </View>

              {ex.exerciseNotes && <Text style={s.exNote}>{ex.exerciseNotes}</Text>}

              {/* ── Set rows: coach target + last session (actual in parens) ── */}
              <View style={s.setTable}>
                {/* Column headers */}
                <View style={s.setHeaderRow}>
                  <Text style={[s.col1, s.colHeader]}>Set</Text>
                  <Text style={[s.col2, s.colHeader]}>Target</Text>
                  <Text style={[s.col3, s.colHeader]}>Last (actual)</Text>
                  <Text style={[s.col4, s.colHeader]}>Today</Text>
                </View>

                {ex.sets.map((ps, i) => {
                  const setNum = ps.setNumber;
                  const last = lastSession[setNum];
                  const done = todayLogged[setNum];
                  const rowDone = i < logged;
                  return (
                    <View key={setNum} style={[s.setRow, rowDone && s.setRowDone]}>
                      <Text style={[s.col1, s.setText]}>{setNum}</Text>

                      {/* Official coach rep target — never changes */}
                      <Text style={[s.col2, s.setTarget]}>{ps.targetReps}</Text>

                      {/* Last session: weight + actual reps in parens */}
                      <Text style={[s.col3, s.setLast]}>
                        {last
                          ? `${last.weightLbs} lbs (${last.reps})`
                          : ps.prevWeight}
                      </Text>

                      {/* What was logged today for this set */}
                      <Text style={[s.col4, s.setToday]}>
                        {done ? `${done.w} lbs\n(${done.r})` : '—'}
                      </Text>
                    </View>
                  );
                })}
              </View>

              {/* ── Log input ── */}
              {isActive && nextPrescribed && (
                <View style={s.logBox}>
                  <Text style={s.logHint}>
                    Set {nextSetNum} · Coach target: {nextPrescribed.targetReps} reps
                    {lastSession[nextSetNum]
                      ? `  ·  Last: ${lastSession[nextSetNum].weightLbs} lbs (${lastSession[nextSetNum].reps})`
                      : `  ·  Ref: ${nextPrescribed.prevWeight}`}
                  </Text>
                  <View style={s.logRow}>
                    <TextInput
                      style={s.logInput}
                      placeholder="Weight"
                      keyboardType="decimal-pad"
                      value={weight}
                      onChangeText={setWeight}
                    />
                    <TextInput
                      style={s.logInput}
                      placeholder="Reps"
                      keyboardType="number-pad"
                      value={reps}
                      onChangeText={setReps}
                    />
                    <TouchableOpacity style={s.logBtn} onPress={() => logSet(ex)}>
                      <Text style={s.logBtnText}>Log</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              )}

              {isActive && !nextPrescribed && (
                <View style={s.doneBox}>
                  <Text style={s.doneText}>All {ex.sets.length} sets complete</Text>
                </View>
              )}
            </TouchableOpacity>
          );
        })}

        <View style={{ height: 40 }} />
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

// ─── Day picker ──────────────────────────────────────────────────────────────

function DayPicker({ current, onSelect }: { current: string; onSelect: (t: WorkoutTemplate) => void }) {
  return (
    <View style={s.picker}>
      {WORKOUT_TEMPLATES.map(t => (
        <TouchableOpacity
          key={t.key}
          style={[s.pickerItem, t.key === current && s.pickerItemActive]}
          onPress={() => onSelect(t)}
        >
          <Text style={[s.pickerText, t.key === current && s.pickerTextActive]}>{t.name}</Text>
          <Text style={s.pickerSub}>{t.exercises.length} exercises</Text>
        </TouchableOpacity>
      ))}
    </View>
  );
}

// ─── styles ──────────────────────────────────────────────────────────────────

const RED = '#e63946';

const s = StyleSheet.create({
  container:   { flex: 1, backgroundColor: '#fff', padding: 16 },
  center:      { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#fff', padding: 24 },
  restIcon:    { fontSize: 48, marginBottom: 12 },
  restTitle:   { fontSize: 26, fontWeight: '800', marginBottom: 6 },
  restSub:     { color: '#888', fontSize: 15, marginBottom: 20 },

  // Week strip
  weekStrip:   { marginBottom: 16 },
  dayCell:     { alignItems: 'center', paddingHorizontal: 10, paddingVertical: 8, marginRight: 6, borderRadius: 10, backgroundColor: '#f5f5f5', minWidth: 58 },
  dayCellToday:    { backgroundColor: '#fff0f0', borderWidth: 1.5, borderColor: RED },
  dayCellSelected: { backgroundColor: RED },
  dayLabel:        { fontSize: 11, fontWeight: '700', color: '#888' },
  dayLabelToday:   { color: RED },
  dayWorkout:      { fontSize: 10, color: '#555', fontWeight: '600', marginTop: 2 },
  dayWorkoutToday: { color: RED },
  dayStatus:       { fontSize: 11, color: '#aaa', marginTop: 3 },

  // Header
  header:       { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 10 },
  workoutName:  { fontSize: 24, fontWeight: '800', color: '#111' },
  cardioText:   { fontSize: 12, color: '#c0392b', marginTop: 2 },
  changeBtn:    { backgroundColor: '#f0f0f0', borderRadius: 8, paddingHorizontal: 12, paddingVertical: 6 },
  changeBtnText:{ fontSize: 13, fontWeight: '600', color: '#444' },

  startBtn:     { backgroundColor: RED, borderRadius: 12, padding: 16, alignItems: 'center', marginBottom: 14 },
  startBtnText: { color: '#fff', fontWeight: '800', fontSize: 17 },
  statsText:    { color: '#999', fontSize: 13, marginBottom: 10 },

  // Day picker
  picker:         { backgroundColor: '#f9f9f9', borderRadius: 10, marginBottom: 12, borderWidth: 1, borderColor: '#eee', overflow: 'hidden' },
  pickerItem:     { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 14, borderBottomWidth: 1, borderBottomColor: '#eee' },
  pickerItemActive:{ backgroundColor: '#fff0f0' },
  pickerText:     { fontSize: 15, fontWeight: '700', color: '#333' },
  pickerTextActive:{ color: RED },
  pickerSub:      { fontSize: 12, color: '#aaa' },

  // Exercise card
  exCard:        { backgroundColor: '#fafafa', borderRadius: 12, padding: 14, marginBottom: 12, borderWidth: 1, borderColor: '#ececec' },
  exCardStarted: { borderColor: RED, borderWidth: 1.5 },
  exHeader:      { flexDirection: 'row', alignItems: 'flex-start', marginBottom: 4 },
  exName:        { fontSize: 15, fontWeight: '700', color: '#111' },
  exMuscle:      { fontSize: 11, color: '#aaa', marginTop: 2 },
  exNote:        { fontSize: 12, color: '#e67e22', fontStyle: 'italic', marginBottom: 6 },
  dots:          { flexDirection: 'row', gap: 4, paddingTop: 4 },
  dot:           { width: 8, height: 8, borderRadius: 4, backgroundColor: '#ddd' },
  dotDone:       { backgroundColor: RED },

  // Set table
  setTable:      { marginTop: 6 },
  setHeaderRow:  { flexDirection: 'row', marginBottom: 4 },
  colHeader:     { fontSize: 10, color: '#bbb', fontWeight: '700', textTransform: 'uppercase' },
  setRow:        { flexDirection: 'row', paddingVertical: 5, borderTopWidth: 1, borderTopColor: '#f0f0f0' },
  setRowDone:    { opacity: 0.4 },
  col1:          { width: 30 },
  col2:          { width: 60 },
  col3:          { flex: 1 },
  col4:          { width: 72, textAlign: 'right' },
  setText:       { fontSize: 12, color: '#999' },
  setTarget:     { fontSize: 13, fontWeight: '700', color: '#222' },  // official target — bold
  setLast:       { fontSize: 12, color: '#888' },                      // prev weight + actual in parens
  setToday:      { fontSize: 12, color: RED, fontWeight: '700', textAlign: 'right' }, // what you did today

  // Log input
  logBox:       { backgroundColor: '#fff8f8', borderRadius: 10, padding: 12, marginTop: 10, borderWidth: 1, borderColor: '#fdd' },
  logHint:      { fontSize: 11, color: '#888', marginBottom: 8 },
  logRow:       { flexDirection: 'row', gap: 8 },
  logInput:     { flex: 1, borderWidth: 1, borderColor: '#ddd', borderRadius: 8, padding: 10, fontSize: 15, backgroundColor: '#fff', textAlign: 'center' },
  logBtn:       { backgroundColor: RED, borderRadius: 8, paddingHorizontal: 18, paddingVertical: 10 },
  logBtnText:   { color: '#fff', fontWeight: '800', fontSize: 14 },

  doneBox:      { backgroundColor: '#f0fff4', borderRadius: 8, padding: 10, marginTop: 10, alignItems: 'center' },
  doneText:     { color: '#27ae60', fontWeight: '700' },
});
