import { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  FlatList,
  StyleSheet,
  Alert,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { addSet, createWorkout } from '../../src/db/database';

const EXERCISES = [
  { id: 1, name: 'Bench Press', muscleGroup: 'Chest' },
  { id: 2, name: 'Squat', muscleGroup: 'Legs' },
  { id: 3, name: 'Deadlift', muscleGroup: 'Back' },
  { id: 4, name: 'Overhead Press', muscleGroup: 'Shoulders' },
  { id: 5, name: 'Barbell Row', muscleGroup: 'Back' },
  { id: 6, name: 'Pull-up', muscleGroup: 'Back' },
  { id: 7, name: 'Dumbbell Curl', muscleGroup: 'Arms' },
  { id: 8, name: 'Tricep Pushdown', muscleGroup: 'Arms' },
  { id: 9, name: 'Leg Press', muscleGroup: 'Legs' },
  { id: 10, name: 'Lat Pulldown', muscleGroup: 'Back' },
];

interface LoggedSet {
  exerciseName: string;
  setNumber: number;
  reps: number;
  weightLbs: number;
}

export default function LogWorkout() {
  const [workoutId, setWorkoutId] = useState<number | null>(null);
  const [selectedExercise, setSelectedExercise] = useState(EXERCISES[0]);
  const [reps, setReps] = useState('');
  const [weight, setWeight] = useState('');
  const [loggedSets, setLoggedSets] = useState<LoggedSet[]>([]);
  const [setCounters, setSetCounters] = useState<Record<string, number>>({});

  function startWorkout() {
    const today = new Date().toISOString().split('T')[0];
    const id = createWorkout(today);
    setWorkoutId(id);
  }

  function logSet() {
    if (!workoutId) return;
    const r = parseInt(reps, 10);
    const w = parseFloat(weight);
    if (!r || !w) {
      Alert.alert('Enter valid reps and weight');
      return;
    }
    const setNum = (setCounters[selectedExercise.name] ?? 0) + 1;
    addSet(workoutId, selectedExercise.id, selectedExercise.name, setNum, r, w);
    setLoggedSets(prev => [
      ...prev,
      { exerciseName: selectedExercise.name, setNumber: setNum, reps: r, weightLbs: w },
    ]);
    setSetCounters(prev => ({ ...prev, [selectedExercise.name]: setNum }));
    setReps('');
    setWeight('');
  }

  if (!workoutId) {
    return (
      <View style={styles.center}>
        <Text style={styles.title}>Ready to train?</Text>
        <TouchableOpacity style={styles.startBtn} onPress={startWorkout}>
          <Text style={styles.startBtnText}>Start Workout</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <KeyboardAvoidingView
      style={{ flex: 1 }}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <ScrollView style={styles.container} keyboardShouldPersistTaps="handled">
        <Text style={styles.title}>Log Sets</Text>

        <Text style={styles.label}>Exercise</Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.chipRow}>
          {EXERCISES.map(ex => (
            <TouchableOpacity
              key={ex.id}
              style={[styles.chip, selectedExercise.id === ex.id && styles.chipActive]}
              onPress={() => setSelectedExercise(ex)}
            >
              <Text style={[styles.chipText, selectedExercise.id === ex.id && styles.chipTextActive]}>
                {ex.name}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>

        <View style={styles.row}>
          <View style={{ flex: 1, marginRight: 8 }}>
            <Text style={styles.label}>Reps</Text>
            <TextInput
              style={styles.input}
              keyboardType="number-pad"
              value={reps}
              onChangeText={setReps}
              placeholder="e.g. 8"
            />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={styles.label}>Weight (lbs)</Text>
            <TextInput
              style={styles.input}
              keyboardType="decimal-pad"
              value={weight}
              onChangeText={setWeight}
              placeholder="e.g. 135"
            />
          </View>
        </View>

        <TouchableOpacity style={styles.logBtn} onPress={logSet}>
          <Text style={styles.logBtnText}>+ Log Set</Text>
        </TouchableOpacity>

        {loggedSets.length > 0 && (
          <>
            <Text style={[styles.label, { marginTop: 24 }]}>Today's Sets</Text>
            {loggedSets.map((s, i) => (
              <View key={i} style={styles.setRow}>
                <Text style={styles.setExercise}>{s.exerciseName}</Text>
                <Text style={styles.setDetail}>
                  Set {s.setNumber} — {s.reps} reps @ {s.weightLbs} lbs
                </Text>
              </View>
            ))}
          </>
        )}
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 16, backgroundColor: '#fff' },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#fff' },
  title: { fontSize: 22, fontWeight: '700', marginBottom: 16 },
  label: { fontSize: 14, fontWeight: '600', color: '#555', marginBottom: 6 },
  chipRow: { marginBottom: 16 },
  chip: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: '#f0f0f0',
    marginRight: 8,
  },
  chipActive: { backgroundColor: '#e63946' },
  chipText: { color: '#333', fontWeight: '500' },
  chipTextActive: { color: '#fff' },
  row: { flexDirection: 'row', marginBottom: 12 },
  input: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    padding: 10,
    fontSize: 16,
    backgroundColor: '#fafafa',
  },
  logBtn: {
    backgroundColor: '#e63946',
    borderRadius: 10,
    padding: 14,
    alignItems: 'center',
    marginTop: 4,
  },
  logBtnText: { color: '#fff', fontWeight: '700', fontSize: 16 },
  startBtn: {
    backgroundColor: '#e63946',
    borderRadius: 12,
    paddingVertical: 16,
    paddingHorizontal: 40,
    marginTop: 20,
  },
  startBtnText: { color: '#fff', fontWeight: '700', fontSize: 18 },
  setRow: {
    backgroundColor: '#f9f9f9',
    borderRadius: 8,
    padding: 12,
    marginBottom: 8,
    borderLeftWidth: 3,
    borderLeftColor: '#e63946',
  },
  setExercise: { fontWeight: '700', fontSize: 14 },
  setDetail: { color: '#555', marginTop: 2 },
});
