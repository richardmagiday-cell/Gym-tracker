import { useState, useCallback } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity, TextInput,
  StyleSheet, Alert, KeyboardAvoidingView, Platform,
} from 'react-native';
import { useFocusEffect } from 'expo-router';
import {
  WORKOUT_TEMPLATES, REST_DAY,
  getTemplateByKey, WorkoutTemplate, TemplateExercise,
} from '../../src/data/program';
import {
  addSet, createWorkout, getLastSetsForExercise, getWorkoutsOnDates,
  getActiveSchedule, getActiveProgramId, getWorkoutFromDB,
} from '../../src/db/database';

// ─── constants ───────────────────────────────────────────────────────────────

const RED    = '#e63946';
const DARK   = '#111827';
const MID    = '#4B5563';
const MUTED  = '#9CA3AF';
const BG     = '#F3F4F6';
const CARD   = '#FFFFFF';
const BORDER = '#E5E7EB';
const GREEN  = '#10B981';

const DAY_NAMES = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

type LastSet  = { setNumber: number; reps: number; weightLbs: number };
type SessionMap = Record<number, Record<number, LastSet>>;

// ─── helpers ────────────────────────────────────────────────────────────────

function getWeekDates(): { date: string; dayIndex: number; label: string }[] {
  const today = new Date();
  const dow   = today.getDay();
  const monday = new Date(today);
  monday.setDate(today.getDate() - (dow === 0 ? 6 : dow - 1));
  return Array.from({ length: 7 }, (_, i) => {
    const d = new Date(monday);
    d.setDate(monday.getDate() + i);
    return {
      date:     d.toISOString().split('T')[0],
      dayIndex: d.getDay(),
      label:    DAY_NAMES[d.getDay()],
    };
  });
}

const TODAY_STR = new Date().toISOString().split('T')[0];

// ─── component ───────────────────────────────────────────────────────────────

export default function TodaysWorkout() {
  const [schedule, setSchedule]               = useState<Record<number, string>>({});
  const [template, setTemplate]               = useState<WorkoutTemplate>(REST_DAY);
  const [showDayPicker, setShowDayPicker]     = useState(false);
  const [workoutId, setWorkoutId]             = useState<number | null>(null);
  const [activeExerciseId, setActiveExerciseId] = useState<number | null>(null);
  const [weight, setWeight]                   = useState('');
  const [reps, setReps]                       = useState('');
  const [loggedCounts, setLoggedCounts]       = useState<Record<number, number>>({});
  const [todaySets, setTodaySets]             = useState<Record<number, Record<number, { w: number; r: number }>>>({});
  const [sessionMap, setSessionMap]           = useState<SessionMap>({});
  const [completedDates, setCompletedDates]   = useState<string[]>([]);
  const weekDays = getWeekDates();

  useFocusEffect(
    useCallback(() => {
      const activeSchedule = getActiveSchedule();
      setSchedule(activeSchedule);
      const todayKey   = activeSchedule[new Date().getDay()] ?? 'rest';
      const programId  = getActiveProgramId();
      const todayTemplate = programId
        ? getWorkoutFromDB(programId, todayKey)
        : getTemplateByKey(todayKey);
      setTemplate(todayTemplate);
      loadSessionMap(todayTemplate);
      setCompletedDates(getWorkoutsOnDates(weekDays.map(d => d.date)));
    }, [])
  );

  function loadSessionMap(t: WorkoutTemplate) {
    const map: SessionMap = {};
    for (const ex of t.exercises) {
      const rows = getLastSetsForExercise(ex.name);
      const bySet: Record<number, LastSet> = {};
      rows.forEach(r => { bySet[r.setNumber] = r; });
      map[ex.exerciseId] = bySet;
    }
    setSessionMap(map);
  }

  function switchTemplate(key: string) {
    const programId = getActiveProgramId();
    const t = programId ? getWorkoutFromDB(programId, key) : getTemplateByKey(key);
    setTemplate(t);
    setShowDayPicker(false);
    setWorkoutId(null);
    setLoggedCounts({});
    setTodaySets({});
    setActiveExerciseId(null);
    setWeight('');
    setReps('');
    loadSessionMap(t);
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
  const totalExercises = template.exercises.length;
  const doneExercises  = Object.keys(loggedCounts).filter(
    id => loggedCounts[parseInt(id)] >= (template.exercises.find(e => e.exerciseId === parseInt(id))?.sets.length ?? 0)
  ).length;

  if (template.key === 'rest') {
    return (
      <View style={s.restScreen}>
        <Text style={s.restEmoji}>😴</Text>
        <Text style={s.restTitle}>Rest Day</Text>
        <Text style={s.restSub}>Recovery is part of the program.</Text>
        <TouchableOpacity style={s.altBtn} onPress={() => setShowDayPicker(p => !p)}>
          <Text style={s.altBtnText}>Log a Different Day</Text>
        </TouchableOpacity>
        {showDayPicker && <DayPicker current={template.key} onSelect={key => switchTemplate(key)} />}
      </View>
    );
  }

  return (
    <KeyboardAvoidingView style={{ flex: 1, backgroundColor: BG }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <ScrollView style={s.container} keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>

        {/* ── Week strip ── */}
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={s.weekStrip} contentContainerStyle={{ paddingHorizontal: 16, paddingVertical: 8 }}>
          {weekDays.map(day => {
            const key      = schedule[day.dayIndex] ?? 'rest';
            const wt       = WORKOUT_TEMPLATES.find(t => t.key === key);
            const isToday  = day.date === TODAY_STR;
            const isDone   = completedDates.includes(day.date);
            const isPast   = day.date < TODAY_STR;
            const isSelected = key === template.key && isToday;
            return (
              <TouchableOpacity
                key={day.date}
                style={[s.dayCell, isToday && s.dayCellToday, isSelected && s.dayCellSelected]}
                onPress={() => switchTemplate(key)}
              >
                <Text style={[s.dayLabel, isToday && s.dayLabelToday, isSelected && s.dayLabelSel]}>
                  {day.label}
                </Text>
                <Text style={[s.dayWorkout, isToday && s.dayWorkoutToday, isSelected && s.dayWorkoutSel]} numberOfLines={1}>
                  {wt?.name ?? 'Rest'}
                </Text>
                <Text style={[s.dayDot, isSelected && { color: '#fff' }]}>
                  {isDone ? '✓' : isPast ? '·' : isToday ? '●' : '○'}
                </Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>

        {/* ── Workout banner ── */}
        <View style={s.banner}>
          <View style={{ flex: 1 }}>
            <Text style={s.bannerName}>{template.name}</Text>
            {template.cardio && template.cardio !== 'No cardio' && template.cardio !== 'REST' && (
              <Text style={s.bannerCardio}>🏃 {template.cardio}</Text>
            )}
            {workoutId !== null && (
              <Text style={s.bannerStats}>{doneExercises}/{totalExercises} exercises · {totalSets} sets logged</Text>
            )}
          </View>
          <TouchableOpacity style={s.switchBtn} onPress={() => setShowDayPicker(p => !p)}>
            <Text style={s.switchBtnText}>Switch</Text>
          </TouchableOpacity>
        </View>

        {showDayPicker && (
          <View style={s.pickerWrapper}>
            <DayPicker current={template.key} onSelect={key => switchTemplate(key)} />
          </View>
        )}

        {!workoutId ? (
          <TouchableOpacity style={s.startBtn} onPress={startWorkout}>
            <Text style={s.startBtnText}>Start Workout</Text>
          </TouchableOpacity>
        ) : null}

        {/* ── Exercise list ── */}
        <View style={{ paddingHorizontal: 16, paddingBottom: 40 }}>
          {template.exercises.map(ex => {
            const logged          = loggedCounts[ex.exerciseId] ?? 0;
            const isActive        = activeExerciseId === ex.exerciseId;
            const nextSetNum      = logged + 1;
            const nextPrescribed  = ex.sets[logged];
            const lastSession     = sessionMap[ex.exerciseId] ?? {};
            const todayLogged     = todaySets[ex.exerciseId] ?? {};
            const allDone         = logged >= ex.sets.length;

            return (
              <TouchableOpacity
                key={ex.exerciseId}
                style={[s.exCard, logged > 0 && s.exCardProgress, allDone && s.exCardDone]}
                onPress={() => workoutId && toggleExercise(ex.exerciseId)}
                activeOpacity={workoutId ? 0.75 : 1}
              >
                {/* Exercise header */}
                <View style={s.exHeader}>
                  <View style={{ flex: 1 }}>
                    <Text style={s.exName}>{ex.name}</Text>
                    <View style={s.musclePill}>
                      <Text style={s.musclePillText}>{ex.muscleGroup}</Text>
                    </View>
                  </View>
                  <View style={s.dotsRow}>
                    {ex.sets.map((_, i) => (
                      <View
                        key={i}
                        style={[
                          s.dot,
                          i < logged && s.dotDone,
                          i < logged && allDone && s.dotComplete,
                        ]}
                      />
                    ))}
                  </View>
                </View>

                {ex.exerciseNotes ? (
                  <Text style={s.exNote}>{ex.exerciseNotes}</Text>
                ) : null}

                {/* Set table */}
                <View style={s.setTable}>
                  <View style={s.setHeaderRow}>
                    <Text style={[s.col1, s.colHdr]}>Set</Text>
                    <Text style={[s.col2, s.colHdr]}>Target</Text>
                    <Text style={[s.col3, s.colHdr]}>Last</Text>
                    <Text style={[s.col4, s.colHdr]}>Today</Text>
                  </View>
                  {ex.sets.map((ps, i) => {
                    const setNum = ps.setNumber;
                    const last   = lastSession[setNum];
                    const done   = todayLogged[setNum];
                    const rowDone = i < logged;
                    return (
                      <View key={setNum} style={[s.setRow, i % 2 === 1 && s.setRowAlt, rowDone && s.setRowDone]}>
                        <Text style={[s.col1, s.setNum]}>{setNum}</Text>
                        <Text style={[s.col2, s.setTarget]}>{ps.targetReps}</Text>
                        <Text style={[s.col3, s.setLast]}>
                          {last ? `${last.weightLbs} lbs (${last.reps})` : ps.prevWeight || '—'}
                        </Text>
                        <Text style={[s.col4, done ? s.setTodayDone : s.setToday]}>
                          {done ? `${done.w}\n(${done.r})` : '—'}
                        </Text>
                      </View>
                    );
                  })}
                </View>

                {/* Log input */}
                {isActive && nextPrescribed && (
                  <View style={s.logBox}>
                    <Text style={s.logHint}>
                      Set {nextSetNum} · Target: {nextPrescribed.targetReps} reps
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
                        placeholderTextColor={MUTED}
                      />
                      <TextInput
                        style={s.logInput}
                        placeholder="Reps"
                        keyboardType="number-pad"
                        value={reps}
                        onChangeText={setReps}
                        placeholderTextColor={MUTED}
                      />
                      <TouchableOpacity style={s.logBtn} onPress={() => logSet(ex)}>
                        <Text style={s.logBtnText}>Log</Text>
                      </TouchableOpacity>
                    </View>
                  </View>
                )}

                {isActive && !nextPrescribed && (
                  <View style={s.allDoneBox}>
                    <Text style={s.allDoneText}>✓  All {ex.sets.length} sets complete</Text>
                  </View>
                )}
              </TouchableOpacity>
            );
          })}
        </View>

      </ScrollView>
    </KeyboardAvoidingView>
  );
}

// ─── Day picker ──────────────────────────────────────────────────────────────

function DayPicker({ current, onSelect }: { current: string; onSelect: (key: string) => void }) {
  return (
    <View style={s.picker}>
      {[{ key: 'rest', name: 'Rest' }, ...WORKOUT_TEMPLATES].map(t => (
        <TouchableOpacity
          key={t.key}
          style={[s.pickerItem, t.key === current && s.pickerItemActive]}
          onPress={() => onSelect(t.key)}
        >
          <Text style={[s.pickerText, t.key === current && s.pickerTextActive]}>{t.name}</Text>
          {t.key === current && <Text style={s.pickerCheck}>✓</Text>}
        </TouchableOpacity>
      ))}
    </View>
  );
}

// ─── styles ──────────────────────────────────────────────────────────────────

const s = StyleSheet.create({
  container:   { flex: 1, backgroundColor: BG },

  // Rest screen
  restScreen:  { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: BG, padding: 32 },
  restEmoji:   { fontSize: 56, marginBottom: 16 },
  restTitle:   { fontSize: 28, fontWeight: '900', color: DARK, marginBottom: 8 },
  restSub:     { color: MID, fontSize: 15, marginBottom: 32, textAlign: 'center' },
  altBtn:      { backgroundColor: RED, borderRadius: 14, paddingHorizontal: 28, paddingVertical: 14 },
  altBtnText:  { color: '#fff', fontWeight: '800', fontSize: 16 },

  // Week strip
  weekStrip:       { backgroundColor: BG },
  dayCell:         {
    alignItems: 'center', paddingHorizontal: 10, paddingVertical: 10,
    marginRight: 8, borderRadius: 14, backgroundColor: CARD, minWidth: 62,
    shadowColor: '#000', shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06, shadowRadius: 4, elevation: 2,
  },
  dayCellToday:    { borderWidth: 2, borderColor: RED },
  dayCellSelected: { backgroundColor: RED },
  dayLabel:        { fontSize: 10, fontWeight: '800', color: MUTED, textTransform: 'uppercase', letterSpacing: 0.5 },
  dayLabelToday:   { color: RED },
  dayLabelSel:     { color: '#fff' },
  dayWorkout:      { fontSize: 9, color: MID, fontWeight: '600', marginTop: 3, textAlign: 'center' },
  dayWorkoutToday: { color: RED },
  dayWorkoutSel:   { color: '#fff' },
  dayDot:          { fontSize: 11, color: MUTED, marginTop: 4 },

  // Workout banner
  banner:      {
    backgroundColor: DARK, borderRadius: 16, marginHorizontal: 16, marginBottom: 14,
    padding: 18, flexDirection: 'row', alignItems: 'flex-start',
  },
  bannerName:  { fontSize: 26, fontWeight: '900', color: '#fff', letterSpacing: 0.3 },
  bannerCardio:{ fontSize: 12, color: '#9CA3AF', marginTop: 5 },
  bannerStats: { fontSize: 12, color: '#6EE7B7', marginTop: 5, fontWeight: '600' },
  switchBtn:   { backgroundColor: 'rgba(255,255,255,0.15)', borderRadius: 10, paddingHorizontal: 14, paddingVertical: 8 },
  switchBtnText: { color: '#fff', fontWeight: '700', fontSize: 13 },

  pickerWrapper: { marginHorizontal: 16, marginBottom: 12 },

  // Start button
  startBtn:     {
    backgroundColor: RED, borderRadius: 14, padding: 18, alignItems: 'center',
    marginHorizontal: 16, marginBottom: 16,
    shadowColor: RED, shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.35, shadowRadius: 10, elevation: 6,
  },
  startBtnText: { color: '#fff', fontWeight: '900', fontSize: 18, letterSpacing: 0.5 },

  // Day picker
  picker:          {
    backgroundColor: CARD, borderRadius: 14, overflow: 'hidden',
    borderWidth: 1, borderColor: BORDER,
    shadowColor: '#000', shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.07, shadowRadius: 8, elevation: 3,
  },
  pickerItem:      { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 15, borderBottomWidth: 1, borderBottomColor: BORDER },
  pickerItemActive:{ backgroundColor: '#FFF5F5' },
  pickerText:      { fontSize: 15, fontWeight: '600', color: DARK },
  pickerTextActive:{ color: RED, fontWeight: '800' },
  pickerCheck:     { color: RED, fontWeight: '800', fontSize: 16 },

  // Exercise card
  exCard:        {
    backgroundColor: CARD, borderRadius: 16, padding: 16, marginBottom: 12,
    shadowColor: '#000', shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.07, shadowRadius: 8, elevation: 3,
    borderLeftWidth: 4, borderLeftColor: 'transparent',
  },
  exCardProgress:{ borderLeftColor: RED },
  exCardDone:    { borderLeftColor: GREEN, opacity: 0.85 },
  exHeader:      { flexDirection: 'row', alignItems: 'flex-start', marginBottom: 8 },
  exName:        { fontSize: 16, fontWeight: '800', color: DARK },
  musclePill:    {
    backgroundColor: '#F3F4F6', borderRadius: 6,
    paddingHorizontal: 8, paddingVertical: 3,
    alignSelf: 'flex-start', marginTop: 5,
  },
  musclePillText:{ fontSize: 11, fontWeight: '700', color: MID },
  dotsRow:       { flexDirection: 'row', gap: 5, paddingTop: 4 },
  dot:           { width: 9, height: 9, borderRadius: 5, backgroundColor: BORDER },
  dotDone:       { backgroundColor: RED },
  dotComplete:   { backgroundColor: GREEN },
  exNote:        { fontSize: 12, color: '#D97706', fontStyle: 'italic', marginBottom: 8, fontWeight: '500' },

  // Set table
  setTable:      { marginTop: 4, borderRadius: 10, overflow: 'hidden', borderWidth: 1, borderColor: BORDER },
  setHeaderRow:  { flexDirection: 'row', backgroundColor: '#F9FAFB', paddingVertical: 7, paddingHorizontal: 10 },
  colHdr:        { fontSize: 10, color: MUTED, fontWeight: '800', textTransform: 'uppercase', letterSpacing: 0.5 },
  setRow:        { flexDirection: 'row', paddingVertical: 8, paddingHorizontal: 10, backgroundColor: CARD },
  setRowAlt:     { backgroundColor: '#FAFAFA' },
  setRowDone:    { opacity: 0.45 },
  col1:          { width: 32 },
  col2:          { width: 64 },
  col3:          { flex: 1 },
  col4:          { width: 72, alignItems: 'flex-end' },
  setNum:        { fontSize: 12, color: MUTED, fontWeight: '700' },
  setTarget:     { fontSize: 13, fontWeight: '800', color: DARK },
  setLast:       { fontSize: 12, color: MID },
  setToday:      { fontSize: 12, color: MUTED, textAlign: 'right' },
  setTodayDone:  { fontSize: 12, color: RED, fontWeight: '800', textAlign: 'right' },

  // Log input
  logBox:      {
    backgroundColor: '#F9FAFB', borderRadius: 12, padding: 14, marginTop: 12,
    borderWidth: 1, borderColor: BORDER,
  },
  logHint:     { fontSize: 12, color: MID, marginBottom: 10, fontWeight: '600' },
  logRow:      { flexDirection: 'row', gap: 8 },
  logInput:    {
    flex: 1, borderWidth: 1.5, borderColor: BORDER, borderRadius: 10,
    padding: 12, fontSize: 16, backgroundColor: CARD, textAlign: 'center',
    fontWeight: '700', color: DARK,
  },
  logBtn:      {
    backgroundColor: RED, borderRadius: 10, paddingHorizontal: 20, paddingVertical: 12,
    justifyContent: 'center',
  },
  logBtnText:  { color: '#fff', fontWeight: '900', fontSize: 15 },

  allDoneBox:  { backgroundColor: '#ECFDF5', borderRadius: 10, padding: 12, marginTop: 12, alignItems: 'center' },
  allDoneText: { color: GREEN, fontWeight: '800', fontSize: 14 },
});
