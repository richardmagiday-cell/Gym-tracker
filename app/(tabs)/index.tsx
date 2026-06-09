import { useState } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity, TextInput,
  StyleSheet, Alert, KeyboardAvoidingView, Platform,
} from 'react-native';
import { WORKOUT_TEMPLATES, REST_DAY, getTodaysTemplate, WorkoutTemplate, TemplateExercise } from '../../src/data/program';
import { addSet, createWorkout } from '../../src/db/database';

const DAY_NAMES = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

export default function TodaysWorkout() {
  const [template, setTemplate] = useState<WorkoutTemplate>(getTodaysTemplate());
  const [showDayPicker, setShowDayPicker] = useState(false);
  const [workoutId, setWorkoutId] = useState<number | null>(null);
  const [activeExercise, setActiveExercise] = useState<number | null>(null);
  const [weight, setWeight] = useState('');
  const [reps, setReps] = useState('');
  // loggedSets[exerciseId] = number of sets logged
  const [loggedSets, setLoggedSets] = useState<Record<number, number>>({});

  function startWorkout() {
    const today = new Date().toISOString().split('T')[0];
    const id = createWorkout(today, template.name);
    setWorkoutId(id);
  }

  function toggleExercise(id: number) {
    setActiveExercise(prev => (prev === id ? null : id));
    setWeight('');
    setReps('');
  }

  function logSet(exercise: TemplateExercise) {
    if (!workoutId) return;
    const w = parseFloat(weight);
    const r = parseInt(reps, 10);
    if (!r || isNaN(w)) {
      Alert.alert('Enter valid weight and reps');
      return;
    }
    const setNum = (loggedSets[exercise.exerciseId] ?? 0) + 1;
    addSet(workoutId, exercise.exerciseId, exercise.name, setNum, r, w);
    setLoggedSets(prev => ({ ...prev, [exercise.exerciseId]: setNum }));
    setWeight('');
    setReps('');
  }

  const totalSets = Object.values(loggedSets).reduce((a, b) => a + b, 0);
  const today = DAY_NAMES[new Date().getDay()];

  if (template.key === 'rest') {
    return (
      <View style={styles.center}>
        <Text style={styles.restIcon}>💤</Text>
        <Text style={styles.restTitle}>Rest Day</Text>
        <Text style={styles.restSub}>Recovery is part of the program.</Text>
        <TouchableOpacity style={styles.changeBtn} onPress={() => setShowDayPicker(true)}>
          <Text style={styles.changeBtnText}>Log a different day</Text>
        </TouchableOpacity>
        {showDayPicker && <DayPicker onSelect={t => { setTemplate(t); setShowDayPicker(false); }} />}
      </View>
    );
  }

  return (
    <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <ScrollView style={styles.container} keyboardShouldPersistTaps="handled">

        {/* Header */}
        <View style={styles.header}>
          <View>
            <Text style={styles.dayLabel}>{today}</Text>
            <Text style={styles.workoutName}>{template.name}</Text>
          </View>
          <TouchableOpacity style={styles.changeBtn} onPress={() => setShowDayPicker(p => !p)}>
            <Text style={styles.changeBtnText}>Change</Text>
          </TouchableOpacity>
        </View>

        {showDayPicker && (
          <DayPicker onSelect={t => {
            setTemplate(t);
            setShowDayPicker(false);
            setWorkoutId(null);
            setLoggedSets({});
            setActiveExercise(null);
          }} />
        )}

        {template.cardio !== 'No cardio' && template.cardio !== 'REST' && (
          <View style={styles.cardioBar}>
            <Text style={styles.cardioText}>Cardio: {template.cardio}</Text>
          </View>
        )}

        {/* Start button */}
        {!workoutId ? (
          <TouchableOpacity style={styles.startBtn} onPress={startWorkout}>
            <Text style={styles.startBtnText}>Start Workout</Text>
          </TouchableOpacity>
        ) : (
          <View style={styles.statsRow}>
            <Text style={styles.statsText}>Sets logged: {totalSets}</Text>
          </View>
        )}

        {/* Exercise list */}
        {template.exercises.map(ex => {
          const logged = loggedSets[ex.exerciseId] ?? 0;
          const isActive = activeExercise === ex.exerciseId;
          const nextSet = ex.sets[logged];

          return (
            <TouchableOpacity
              key={ex.exerciseId}
              style={[styles.exCard, logged > 0 && styles.exCardStarted]}
              onPress={() => workoutId && toggleExercise(ex.exerciseId)}
              activeOpacity={workoutId ? 0.7 : 1}
            >
              {/* Exercise header row */}
              <View style={styles.exHeader}>
                <View style={{ flex: 1 }}>
                  <Text style={styles.exName}>{ex.name}</Text>
                  <Text style={styles.exMuscle}>{ex.muscleGroup}</Text>
                </View>
                <View style={styles.setDots}>
                  {ex.sets.map((_, i) => (
                    <View key={i} style={[styles.dot, i < logged && styles.dotFilled]} />
                  ))}
                </View>
              </View>

              {ex.exerciseNotes && (
                <Text style={styles.exNote}>{ex.exerciseNotes}</Text>
              )}

              {/* Prescribed sets table */}
              <View style={styles.setsTable}>
                {ex.sets.map((s, i) => (
                  <View key={i} style={[styles.setRow, i < logged && styles.setRowDone]}>
                    <Text style={styles.setNum}>Set {s.setNumber}</Text>
                    <Text style={styles.setTarget}>{s.targetReps} reps</Text>
                    <Text style={styles.setPrev}>prev: {s.prevWeight}</Text>
                    {s.notes && <Text style={styles.setNote}>{s.notes}</Text>}
                  </View>
                ))}
              </View>

              {/* Log input — shown when active and sets remain */}
              {isActive && nextSet && (
                <View style={styles.logBox}>
                  <Text style={styles.logLabel}>
                    Set {nextSet.setNumber} — target: {nextSet.targetReps} reps · prev: {nextSet.prevWeight}
                  </Text>
                  <View style={styles.logRow}>
                    <TextInput
                      style={styles.logInput}
                      placeholder="Weight"
                      keyboardType="decimal-pad"
                      value={weight}
                      onChangeText={setWeight}
                    />
                    <TextInput
                      style={styles.logInput}
                      placeholder="Reps"
                      keyboardType="number-pad"
                      value={reps}
                      onChangeText={setReps}
                    />
                    <TouchableOpacity style={styles.logBtn} onPress={() => logSet(ex)}>
                      <Text style={styles.logBtnText}>Log</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              )}

              {isActive && !nextSet && (
                <View style={styles.doneBox}>
                  <Text style={styles.doneText}>All sets complete</Text>
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

function DayPicker({ onSelect }: { onSelect: (t: WorkoutTemplate) => void }) {
  return (
    <View style={styles.picker}>
      {WORKOUT_TEMPLATES.map(t => (
        <TouchableOpacity key={t.key} style={styles.pickerItem} onPress={() => onSelect(t)}>
          <Text style={styles.pickerText}>{t.name}</Text>
        </TouchableOpacity>
      ))}
    </View>
  );
}

const RED = '#e63946';

const styles = StyleSheet.create({
  container:   { flex: 1, backgroundColor: '#fff', padding: 16 },
  center:      { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#fff', padding: 24 },
  restIcon:    { fontSize: 48, marginBottom: 12 },
  restTitle:   { fontSize: 26, fontWeight: '800', marginBottom: 6 },
  restSub:     { color: '#888', fontSize: 15, marginBottom: 20 },

  header:      { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 12 },
  dayLabel:    { fontSize: 13, color: '#999', fontWeight: '600' },
  workoutName: { fontSize: 26, fontWeight: '800', color: '#111' },

  changeBtn:   { backgroundColor: '#f0f0f0', borderRadius: 8, paddingHorizontal: 12, paddingVertical: 6 },
  changeBtnText: { fontSize: 13, fontWeight: '600', color: '#444' },

  cardioBar:   { backgroundColor: '#fff3f3', borderRadius: 8, padding: 10, marginBottom: 12, borderLeftWidth: 3, borderLeftColor: RED },
  cardioText:  { color: '#c0392b', fontSize: 13, fontWeight: '500' },

  startBtn:    { backgroundColor: RED, borderRadius: 12, padding: 16, alignItems: 'center', marginBottom: 16 },
  startBtnText: { color: '#fff', fontWeight: '800', fontSize: 17 },

  statsRow:    { flexDirection: 'row', marginBottom: 12 },
  statsText:   { color: '#888', fontSize: 13, fontWeight: '600' },

  picker:      { backgroundColor: '#f9f9f9', borderRadius: 10, marginBottom: 12, overflow: 'hidden', borderWidth: 1, borderColor: '#eee' },
  pickerItem:  { padding: 14, borderBottomWidth: 1, borderBottomColor: '#eee' },
  pickerText:  { fontSize: 16, fontWeight: '600', color: '#333' },

  exCard:         { backgroundColor: '#fafafa', borderRadius: 12, padding: 14, marginBottom: 12, borderWidth: 1, borderColor: '#ececec' },
  exCardStarted:  { borderColor: RED, borderWidth: 1.5 },
  exHeader:       { flexDirection: 'row', alignItems: 'flex-start', marginBottom: 6 },
  exName:         { fontSize: 16, fontWeight: '700', color: '#111' },
  exMuscle:       { fontSize: 12, color: '#999', marginTop: 2 },
  exNote:         { fontSize: 12, color: '#e67e22', marginBottom: 6, fontStyle: 'italic' },

  setDots:     { flexDirection: 'row', gap: 4, marginTop: 4 },
  dot:         { width: 8, height: 8, borderRadius: 4, backgroundColor: '#ddd' },
  dotFilled:   { backgroundColor: RED },

  setsTable:   { marginTop: 4, marginBottom: 4 },
  setRow:      { flexDirection: 'row', alignItems: 'center', paddingVertical: 4, gap: 8 },
  setRowDone:  { opacity: 0.4 },
  setNum:      { width: 44, fontSize: 12, color: '#888', fontWeight: '600' },
  setTarget:   { width: 70, fontSize: 12, fontWeight: '700', color: '#333' },
  setPrev:     { flex: 1, fontSize: 11, color: '#aaa' },
  setNote:     { fontSize: 11, color: '#e67e22', fontStyle: 'italic' },

  logBox:      { backgroundColor: '#fff8f8', borderRadius: 10, padding: 12, marginTop: 10, borderWidth: 1, borderColor: '#fdd' },
  logLabel:    { fontSize: 12, color: '#666', marginBottom: 8 },
  logRow:      { flexDirection: 'row', gap: 8, alignItems: 'center' },
  logInput:    { flex: 1, borderWidth: 1, borderColor: '#ddd', borderRadius: 8, padding: 10, fontSize: 15, backgroundColor: '#fff', textAlign: 'center' },
  logBtn:      { backgroundColor: RED, borderRadius: 8, paddingHorizontal: 18, paddingVertical: 10 },
  logBtnText:  { color: '#fff', fontWeight: '800', fontSize: 14 },

  doneBox:     { backgroundColor: '#f0fff4', borderRadius: 8, padding: 10, marginTop: 10, alignItems: 'center' },
  doneText:    { color: '#27ae60', fontWeight: '700' },
});
