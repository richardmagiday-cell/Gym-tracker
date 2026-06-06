import { useCallback, useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  Dimensions,
} from 'react-native';
import Svg, { Polyline, Line, Circle, Text as SvgText } from 'react-native-svg';
import { useFocusEffect } from 'expo-router';
import { getProgressForExercise } from '../../src/db/database';

const EXERCISES = [
  'Bench Press', 'Squat', 'Deadlift', 'Overhead Press',
  'Barbell Row', 'Pull-up', 'Dumbbell Curl', 'Tricep Pushdown',
  'Leg Press', 'Lat Pulldown',
];

const W = Dimensions.get('window').width - 32;
const H = 180;
const PAD = { top: 10, right: 10, bottom: 30, left: 40 };

export default function Progress() {
  const [selected, setSelected] = useState(EXERCISES[0]);
  const [data, setData] = useState<{ date: string; maxWeight: number }[]>([]);

  useFocusEffect(
    useCallback(() => {
      setData(getProgressForExercise(selected));
    }, [selected])
  );

  const chartW = W - PAD.left - PAD.right;
  const chartH = H - PAD.top - PAD.bottom;

  const maxVal = data.length ? Math.max(...data.map(d => d.maxWeight)) : 1;
  const minVal = data.length ? Math.min(...data.map(d => d.maxWeight)) : 0;
  const range = maxVal - minVal || 1;

  function toX(i: number) {
    return PAD.left + (i / Math.max(data.length - 1, 1)) * chartW;
  }
  function toY(v: number) {
    return PAD.top + chartH - ((v - minVal) / range) * chartH;
  }

  const points = data.map((d, i) => `${toX(i)},${toY(d.maxWeight)}`).join(' ');

  return (
    <ScrollView style={styles.container}>
      <Text style={styles.title}>Progress</Text>

      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.chipRow}>
        {EXERCISES.map(ex => (
          <TouchableOpacity
            key={ex}
            style={[styles.chip, selected === ex && styles.chipActive]}
            onPress={() => setSelected(ex)}
          >
            <Text style={[styles.chipText, selected === ex && styles.chipTextActive]}>{ex}</Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      <Text style={styles.exerciseTitle}>{selected}</Text>

      {data.length < 2 ? (
        <Text style={styles.empty}>Log at least 2 sessions to see a chart.</Text>
      ) : (
        <Svg width={W} height={H}>
          <Line x1={PAD.left} y1={PAD.top} x2={PAD.left} y2={PAD.top + chartH} stroke="#ddd" strokeWidth={1} />
          <Line x1={PAD.left} y1={PAD.top + chartH} x2={PAD.left + chartW} y2={PAD.top + chartH} stroke="#ddd" strokeWidth={1} />
          <SvgText x={PAD.left - 4} y={PAD.top + 4} fontSize={10} fill="#999" textAnchor="end">{maxVal}</SvgText>
          <SvgText x={PAD.left - 4} y={PAD.top + chartH} fontSize={10} fill="#999" textAnchor="end">{minVal}</SvgText>
          <Polyline points={points} fill="none" stroke="#e63946" strokeWidth={2} />
          {data.map((d, i) => (
            <Circle key={i} cx={toX(i)} cy={toY(d.maxWeight)} r={4} fill="#e63946" />
          ))}
          {data.map((d, i) => (
            <SvgText key={i} x={toX(i)} y={H - 4} fontSize={9} fill="#999" textAnchor="middle">
              {d.date.slice(5)}
            </SvgText>
          ))}
        </Svg>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 16, backgroundColor: '#fff' },
  title: { fontSize: 22, fontWeight: '700', marginBottom: 16 },
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
  exerciseTitle: { fontSize: 16, fontWeight: '600', marginBottom: 12 },
  empty: { color: '#999', textAlign: 'center', marginTop: 20 },
});
