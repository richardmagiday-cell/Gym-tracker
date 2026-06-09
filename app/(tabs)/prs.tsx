import { useCallback, useState } from 'react';
import { View, Text, FlatList, StyleSheet } from 'react-native';
import { useFocusEffect } from 'expo-router';
import { getPersonalRecords } from '../../src/db/database';
import { PersonalRecord } from '../../src/types';

const RED   = '#e63946';
const DARK  = '#111827';
const MID   = '#4B5563';
const MUTED = '#9CA3AF';
const BG    = '#F3F4F6';
const CARD  = '#FFFFFF';
const BORDER= '#E5E7EB';

export default function PRs() {
  const [records, setRecords] = useState<PersonalRecord[]>([]);

  useFocusEffect(
    useCallback(() => {
      setRecords(getPersonalRecords());
    }, [])
  );

  return (
    <View style={s.container}>
      {records.length === 0 && (
        <View style={s.emptyState}>
          <Text style={s.emptyIcon}>🏆</Text>
          <Text style={s.emptyTitle}>No PRs Yet</Text>
          <Text style={s.emptyText}>Start logging sets to track your personal records.</Text>
        </View>
      )}
      <FlatList
        data={records}
        keyExtractor={r => String(r.exerciseId)}
        contentContainerStyle={{ padding: 16, paddingBottom: 40 }}
        showsVerticalScrollIndicator={false}
        renderItem={({ item, index }) => (
          <View style={s.card}>
            <View style={s.rankBadge}>
              <Text style={s.rankText}>#{index + 1}</Text>
            </View>
            <View style={s.cardBody}>
              <Text style={s.exerciseName}>{item.exerciseName}</Text>
              <View style={s.prRow}>
                <View style={s.prChip}>
                  <Text style={s.prChipLabel}>Weight</Text>
                  <Text style={s.prChipValue}>{item.weightLbs} lbs</Text>
                </View>
                <View style={s.prChip}>
                  <Text style={s.prChipLabel}>Reps</Text>
                  <Text style={s.prChipValue}>{item.reps}</Text>
                </View>
                <View style={[s.prChip, s.prChipDate]}>
                  <Text style={s.prChipLabel}>Date</Text>
                  <Text style={s.prDateText}>{item.date}</Text>
                </View>
              </View>
            </View>
            <Text style={s.trophyIcon}>🏆</Text>
          </View>
        )}
      />
    </View>
  );
}

const s = StyleSheet.create({
  container:    { flex: 1, backgroundColor: BG },

  emptyState:   { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 40 },
  emptyIcon:    { fontSize: 56, marginBottom: 14 },
  emptyTitle:   { fontSize: 22, fontWeight: '800', color: DARK, marginBottom: 8 },
  emptyText:    { color: MID, fontSize: 14, textAlign: 'center' },

  card: {
    backgroundColor: CARD, borderRadius: 16, marginBottom: 12, padding: 16,
    flexDirection: 'row', alignItems: 'center',
    shadowColor: '#000', shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.07, shadowRadius: 8, elevation: 3,
    borderLeftWidth: 4, borderLeftColor: RED,
  },
  rankBadge:    {
    backgroundColor: RED, borderRadius: 10, width: 36, height: 36,
    alignItems: 'center', justifyContent: 'center', marginRight: 14,
  },
  rankText:     { color: '#fff', fontWeight: '900', fontSize: 13 },
  cardBody:     { flex: 1 },
  exerciseName: { fontSize: 15, fontWeight: '800', color: DARK, marginBottom: 10 },
  prRow:        { flexDirection: 'row', gap: 8 },
  prChip:       {
    backgroundColor: BG, borderRadius: 8, paddingHorizontal: 10,
    paddingVertical: 6, alignItems: 'center', flex: 1,
  },
  prChipDate:   { flex: 1.5 },
  prChipLabel:  { fontSize: 9, fontWeight: '700', color: MUTED, textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 2 },
  prChipValue:  { fontSize: 14, fontWeight: '900', color: RED },
  prDateText:   { fontSize: 11, fontWeight: '700', color: MID },
  trophyIcon:   { fontSize: 24, marginLeft: 10 },
});
