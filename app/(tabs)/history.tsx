import { useCallback, useState } from 'react';
import { View, Text, FlatList, StyleSheet, TouchableOpacity, Alert } from 'react-native';
import { useFocusEffect } from 'expo-router';
import { getWorkouts, getSetsForWorkout, deleteWorkout } from '../../src/db/database';
import { Workout, WorkoutSet } from '../../src/types';

const RED   = '#e63946';
const DARK  = '#111827';
const MID   = '#4B5563';
const MUTED = '#9CA3AF';
const BG    = '#F3F4F6';
const CARD  = '#FFFFFF';
const BORDER= '#E5E7EB';

export default function History() {
  const [workouts, setWorkouts] = useState<Workout[]>([]);
  const [expanded, setExpanded] = useState<number | null>(null);
  const [sets, setSets]         = useState<WorkoutSet[]>([]);

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

  // Group sets by exercise name for the expanded view
  function groupSetsByExercise(setList: WorkoutSet[]) {
    const groups: Record<string, WorkoutSet[]> = {};
    for (const s of setList) {
      if (!groups[s.exerciseName]) groups[s.exerciseName] = [];
      groups[s.exerciseName].push(s);
    }
    return Object.entries(groups);
  }

  return (
    <View style={s.container}>
      {workouts.length === 0 && (
        <View style={s.emptyState}>
          <Text style={s.emptyIcon}>📋</Text>
          <Text style={s.emptyTitle}>No Workouts Yet</Text>
          <Text style={s.emptyText}>Log your first session to see history here.</Text>
        </View>
      )}
      <FlatList
        data={workouts}
        keyExtractor={w => String(w.id)}
        contentContainerStyle={{ padding: 16, paddingBottom: 40 }}
        showsVerticalScrollIndicator={false}
        renderItem={({ item }) => {
          const isExpanded = expanded === item.id;
          const exerciseGroups = isExpanded ? groupSetsByExercise(sets) : [];
          return (
            <View style={s.card}>
              <TouchableOpacity onPress={() => toggle(item.id)} activeOpacity={0.75}>
                <View style={s.cardHeader}>
                  <View style={s.cardLeft}>
                    <View style={s.dateBadge}>
                      <Text style={s.dateMonth}>{item.date.slice(5, 7)}/{item.date.slice(8, 10)}</Text>
                      <Text style={s.dateYear}>{item.date.slice(0, 4)}</Text>
                    </View>
                    <View style={s.cardInfo}>
                      <Text style={s.cardTitle}>{item.notes || 'Workout'}</Text>
                      <Text style={s.cardSub}>{item.date}</Text>
                    </View>
                  </View>
                  <View style={s.cardActions}>
                    <Text style={s.chevron}>{isExpanded ? '▲' : '▼'}</Text>
                    <TouchableOpacity style={s.deleteBtn} onPress={() => confirmDelete(item)}>
                      <Text style={s.deleteBtnText}>Delete</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              </TouchableOpacity>

              {isExpanded && (
                <View style={s.setsSection}>
                  <View style={s.setsDivider} />
                  {exerciseGroups.map(([exName, exSets]) => (
                    <View key={exName} style={s.exGroup}>
                      <Text style={s.exGroupName}>{exName}</Text>
                      {exSets.map(set => (
                        <View key={set.id} style={s.setLine}>
                          <Text style={s.setLineNum}>Set {set.setNumber}</Text>
                          <Text style={s.setLineData}>{set.weightLbs} lbs × {set.reps} reps</Text>
                        </View>
                      ))}
                    </View>
                  ))}
                </View>
              )}
            </View>
          );
        }}
      />
    </View>
  );
}

const s = StyleSheet.create({
  container:    { flex: 1, backgroundColor: BG },

  emptyState:   { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 40 },
  emptyIcon:    { fontSize: 48, marginBottom: 12 },
  emptyTitle:   { fontSize: 20, fontWeight: '800', color: DARK, marginBottom: 8 },
  emptyText:    { color: MID, fontSize: 14, textAlign: 'center' },

  card: {
    backgroundColor: CARD, borderRadius: 16, marginBottom: 12,
    shadowColor: '#000', shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.07, shadowRadius: 8, elevation: 3,
    overflow: 'hidden', borderLeftWidth: 4, borderLeftColor: RED,
  },
  cardHeader:   { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 16 },
  cardLeft:     { flexDirection: 'row', alignItems: 'center', flex: 1 },
  dateBadge:    {
    backgroundColor: RED, borderRadius: 10, paddingHorizontal: 10,
    paddingVertical: 8, alignItems: 'center', marginRight: 14, minWidth: 44,
  },
  dateMonth:    { color: '#fff', fontWeight: '900', fontSize: 14 },
  dateYear:     { color: 'rgba(255,255,255,0.7)', fontSize: 10, marginTop: 1 },
  cardInfo:     { flex: 1 },
  cardTitle:    { fontSize: 15, fontWeight: '800', color: DARK },
  cardSub:      { fontSize: 12, color: MUTED, marginTop: 2 },
  cardActions:  { flexDirection: 'row', alignItems: 'center', gap: 10 },
  chevron:      { fontSize: 11, color: MUTED },

  deleteBtn:    { backgroundColor: '#FEF2F2', borderRadius: 8, paddingHorizontal: 10, paddingVertical: 6 },
  deleteBtnText:{ color: RED, fontWeight: '700', fontSize: 12 },

  setsSection:  { paddingHorizontal: 16, paddingBottom: 16 },
  setsDivider:  { height: 1, backgroundColor: BORDER, marginBottom: 12 },
  exGroup:      { marginBottom: 12 },
  exGroupName:  { fontSize: 13, fontWeight: '800', color: DARK, marginBottom: 6 },
  setLine:      { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 4 },
  setLineNum:   { fontSize: 12, color: MUTED, fontWeight: '600', width: 50 },
  setLineData:  { fontSize: 13, color: MID, fontWeight: '600' },
});
