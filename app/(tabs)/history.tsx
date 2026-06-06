import { useCallback, useState } from 'react';
import { View, Text, FlatList, StyleSheet, TouchableOpacity } from 'react-native';
import { useFocusEffect } from 'expo-router';
import { getWorkouts, getSetsForWorkout } from '../../src/db/database';
import { Workout, WorkoutSet } from '../../src/types';

export default function History() {
  const [workouts, setWorkouts] = useState<Workout[]>([]);
  const [expanded, setExpanded] = useState<number | null>(null);
  const [sets, setSets] = useState<WorkoutSet[]>([]);

  useFocusEffect(
    useCallback(() => {
      setWorkouts(getWorkouts());
    }, [])
  );

  function toggle(id: number) {
    if (expanded === id) {
      setExpanded(null);
    } else {
      setExpanded(id);
      setSets(getSetsForWorkout(id));
    }
  }

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Workout History</Text>
      {workouts.length === 0 && (
        <Text style={styles.empty}>No workouts yet. Log your first session!</Text>
      )}
      <FlatList
        data={workouts}
        keyExtractor={w => String(w.id)}
        renderItem={({ item }) => (
          <TouchableOpacity style={styles.card} onPress={() => toggle(item.id)}>
            <Text style={styles.date}>{item.date}</Text>
            {item.notes ? <Text style={styles.notes}>{item.notes}</Text> : null}
            {expanded === item.id && sets.map(s => (
              <Text key={s.id} style={styles.setLine}>
                {s.exerciseName} — Set {s.setNumber}: {s.reps} reps @ {s.weightLbs} lbs
              </Text>
            ))}
          </TouchableOpacity>
        )}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 16, backgroundColor: '#fff' },
  title: { fontSize: 22, fontWeight: '700', marginBottom: 16 },
  empty: { color: '#999', textAlign: 'center', marginTop: 40 },
  card: {
    backgroundColor: '#f9f9f9',
    borderRadius: 10,
    padding: 14,
    marginBottom: 10,
    borderLeftWidth: 3,
    borderLeftColor: '#e63946',
  },
  date: { fontWeight: '700', fontSize: 16 },
  notes: { color: '#777', marginTop: 4 },
  setLine: { color: '#444', marginTop: 6, fontSize: 13 },
});
