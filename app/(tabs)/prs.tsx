import { useCallback, useState } from 'react';
import { View, Text, FlatList, StyleSheet } from 'react-native';
import { useFocusEffect } from 'expo-router';
import { getPersonalRecords } from '../../src/db/database';
import { PersonalRecord } from '../../src/types';

export default function PRs() {
  const [records, setRecords] = useState<PersonalRecord[]>([]);

  useFocusEffect(
    useCallback(() => {
      setRecords(getPersonalRecords());
    }, [])
  );

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Personal Records</Text>
      {records.length === 0 && (
        <Text style={styles.empty}>No PRs yet. Start logging to set some!</Text>
      )}
      <FlatList
        data={records}
        keyExtractor={r => String(r.exerciseId)}
        renderItem={({ item }) => (
          <View style={styles.card}>
            <View style={styles.badge}>
              <Text style={styles.badgeText}>PR</Text>
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.exerciseName}>{item.exerciseName}</Text>
              <Text style={styles.weight}>{item.weightLbs} lbs × {item.reps} reps</Text>
              <Text style={styles.date}>{item.date}</Text>
            </View>
          </View>
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
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff8f8',
    borderRadius: 10,
    padding: 14,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: '#fdd',
  },
  badge: {
    backgroundColor: '#e63946',
    borderRadius: 6,
    paddingHorizontal: 8,
    paddingVertical: 4,
    marginRight: 14,
  },
  badgeText: { color: '#fff', fontWeight: '800', fontSize: 12 },
  exerciseName: { fontWeight: '700', fontSize: 15 },
  weight: { color: '#333', marginTop: 2, fontSize: 14 },
  date: { color: '#aaa', marginTop: 2, fontSize: 12 },
});
