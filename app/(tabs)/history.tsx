import { useCallback, useState } from 'react';
import { View, Text, FlatList, StyleSheet, TouchableOpacity, Alert } from 'react-native';
import { useFocusEffect } from 'expo-router';
import { getWorkouts, getSetsForWorkout, deleteWorkout } from '../../src/db/database';
import { Workout, WorkoutSet } from '../../src/types';

const RED = '#e63946';

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

  function confirmDelete(workout: Workout) {
    Alert.alert(
      'Delete Workout',
      `Delete the workout logged on ${workout.date}? This cannot be undone.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete', style: 'destructive',
          onPress: () => {
            deleteWorkout(workout.id);
            if (expanded === workout.id) setExpanded(null);
            setWorkouts(getWorkouts());
          },
        },
      ]
    );
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
          <View style={styles.card}>
            <TouchableOpacity onPress={() => toggle(item.id)} style={styles.cardHeader}>
              <View style={{ flex: 1 }}>
                <Text style={styles.date}>{item.date}</Text>
                {item.notes ? <Text style={styles.notes}>{item.notes}</Text> : null}
              </View>
              <TouchableOpacity style={styles.deleteBtn} onPress={() => confirmDelete(item)}>
                <Text style={styles.deleteBtnText}>Delete</Text>
              </TouchableOpacity>
            </TouchableOpacity>
            {expanded === item.id && sets.map(s => (
              <Text key={s.id} style={styles.setLine}>
                {s.exerciseName} — Set {s.setNumber}: {s.reps} reps @ {s.weightLbs} lbs
              </Text>
            ))}
          </View>
        )}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container:   { flex: 1, padding: 16, backgroundColor: '#fff' },
  title:       { fontSize: 22, fontWeight: '700', marginBottom: 16 },
  empty:       { color: '#999', textAlign: 'center', marginTop: 40 },
  card:        { backgroundColor: '#f9f9f9', borderRadius: 10, padding: 14, marginBottom: 10, borderLeftWidth: 3, borderLeftColor: RED },
  cardHeader:  { flexDirection: 'row', alignItems: 'center' },
  date:        { fontWeight: '700', fontSize: 16 },
  notes:       { color: '#777', marginTop: 4 },
  setLine:     { color: '#444', marginTop: 6, fontSize: 13 },
  deleteBtn:   { backgroundColor: '#fff0f0', borderRadius: 7, paddingHorizontal: 10, paddingVertical: 5 },
  deleteBtnText: { color: RED, fontWeight: '700', fontSize: 12 },
});
