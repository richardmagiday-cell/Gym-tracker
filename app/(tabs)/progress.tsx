import { useCallback, useState } from 'react';
import {
  View, Text, ScrollView, StyleSheet, TouchableOpacity, Dimensions,
} from 'react-native';
import Svg, { Polyline, Line, Circle, Text as SvgText } from 'react-native-svg';
import { useFocusEffect } from 'expo-router';
import { getProgressForExercise } from '../../src/db/database';

const RED   = '#e63946';
const DARK  = '#111827';
const MID   = '#4B5563';
const MUTED = '#9CA3AF';
const BG    = '#F3F4F6';
const CARD  = '#FFFFFF';
const BORDER= '#E5E7EB';

const EXERCISES = [
  'Bench Press', 'Deadlifts', 'RDLs', 'Leg Press',
  'Pull Ups', 'Bent Over Rows', 'Leg Extension',
  'Hammer Curls', 'Skull Crushers', 'Chest Flys',
];

const W   = Dimensions.get('window').width - 32;
const H   = 200;
const PAD = { top: 16, right: 16, bottom: 32, left: 46 };

export default function Progress() {
  const [selected, setSelected] = useState(EXERCISES[0]);
  const [data, setData]         = useState<{ date: string; maxWeight: number }[]>([]);

  useFocusEffect(
    useCallback(() => {
      setData(getProgressForExercise(selected));
    }, [selected])
  );

  const chartW = W - PAD.left - PAD.right;
  const chartH = H - PAD.top - PAD.bottom;
  const maxVal = data.length ? Math.max(...data.map(d => d.maxWeight)) : 100;
  const minVal = data.length ? Math.min(...data.map(d => d.maxWeight)) : 0;
  const range  = maxVal - minVal || 1;

  function toX(i: number) { return PAD.left + (i / Math.max(data.length - 1, 1)) * chartW; }
  function toY(v: number) { return PAD.top + chartH - ((v - minVal) / range) * chartH; }

  const points = data.map((d, i) => `${toX(i)},${toY(d.maxWeight)}`).join(' ');

  return (
    <ScrollView style={s.container} showsVerticalScrollIndicator={false}>

      {/* Exercise chips */}
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={s.chipRow}>
        {EXERCISES.map(ex => (
          <TouchableOpacity
            key={ex}
            style={[s.chip, selected === ex && s.chipActive]}
            onPress={() => setSelected(ex)}
          >
            <Text style={[s.chipText, selected === ex && s.chipTextActive]}>{ex}</Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      {/* Chart card */}
      <View style={s.chartCard}>
        <Text style={s.chartTitle}>{selected}</Text>
        <Text style={s.chartSub}>Max weight per session (lbs)</Text>

        {data.length < 2 ? (
          <View style={s.emptyChart}>
            <Text style={s.emptyIcon}>📈</Text>
            <Text style={s.emptyText}>Log at least 2 sessions to see a progress chart.</Text>
          </View>
        ) : (
          <View style={s.svgWrapper}>
            <Svg width={W} height={H}>
              {/* Grid lines */}
              <Line x1={PAD.left} y1={PAD.top} x2={PAD.left} y2={PAD.top + chartH} stroke={BORDER} strokeWidth={1} />
              <Line x1={PAD.left} y1={PAD.top + chartH} x2={PAD.left + chartW} y2={PAD.top + chartH} stroke={BORDER} strokeWidth={1} />
              <Line x1={PAD.left} y1={PAD.top + chartH / 2} x2={PAD.left + chartW} y2={PAD.top + chartH / 2} stroke={BORDER} strokeWidth={1} strokeDasharray="4,4" />
              {/* Labels */}
              <SvgText x={PAD.left - 6} y={PAD.top + 5} fontSize={10} fill={MUTED} textAnchor="end">{maxVal}</SvgText>
              <SvgText x={PAD.left - 6} y={PAD.top + chartH / 2 + 4} fontSize={10} fill={MUTED} textAnchor="end">{Math.round((maxVal + minVal) / 2)}</SvgText>
              <SvgText x={PAD.left - 6} y={PAD.top + chartH} fontSize={10} fill={MUTED} textAnchor="end">{minVal}</SvgText>
              {/* Line */}
              <Polyline points={points} fill="none" stroke={RED} strokeWidth={2.5} strokeLinejoin="round" strokeLinecap="round" />
              {/* Dots */}
              {data.map((d, i) => (
                <Circle key={i} cx={toX(i)} cy={toY(d.maxWeight)} r={5} fill={RED} stroke="#fff" strokeWidth={2} />
              ))}
              {/* Date labels */}
              {data.map((d, i) => (
                <SvgText key={i} x={toX(i)} y={H - 4} fontSize={9} fill={MUTED} textAnchor="middle">
                  {d.date.slice(5)}
                </SvgText>
              ))}
            </Svg>
          </View>
        )}

        {data.length >= 2 && (
          <View style={s.statsRow}>
            <View style={s.statBox}>
              <Text style={s.statLabel}>Max</Text>
              <Text style={s.statValue}>{maxVal} lbs</Text>
            </View>
            <View style={s.statBox}>
              <Text style={s.statLabel}>Sessions</Text>
              <Text style={s.statValue}>{data.length}</Text>
            </View>
            <View style={s.statBox}>
              <Text style={s.statLabel}>Change</Text>
              <Text style={[s.statValue, { color: data[data.length-1].maxWeight >= data[0].maxWeight ? '#10B981' : RED }]}>
                {data[data.length-1].maxWeight >= data[0].maxWeight ? '+' : ''}
                {(data[data.length-1].maxWeight - data[0].maxWeight).toFixed(1)} lbs
              </Text>
            </View>
          </View>
        )}
      </View>

    </ScrollView>
  );
}

const s = StyleSheet.create({
  container:    { flex: 1, backgroundColor: BG },

  chipRow:      { paddingHorizontal: 16, paddingVertical: 14, gap: 8 },
  chip:         {
    paddingHorizontal: 16, paddingVertical: 9, borderRadius: 20,
    backgroundColor: CARD, borderWidth: 1, borderColor: BORDER,
  },
  chipActive:   { backgroundColor: RED, borderColor: RED },
  chipText:     { color: MID, fontWeight: '700', fontSize: 13 },
  chipTextActive:{ color: '#fff', fontWeight: '800' },

  chartCard:    {
    backgroundColor: CARD, borderRadius: 16, margin: 16, marginTop: 0, padding: 20,
    shadowColor: '#000', shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.07, shadowRadius: 8, elevation: 3,
  },
  chartTitle:   { fontSize: 18, fontWeight: '900', color: DARK },
  chartSub:     { fontSize: 12, color: MUTED, marginTop: 3, marginBottom: 16 },

  svgWrapper:   { borderRadius: 12, overflow: 'hidden', backgroundColor: '#FAFAFA' },

  emptyChart:   { alignItems: 'center', paddingVertical: 40 },
  emptyIcon:    { fontSize: 40, marginBottom: 12 },
  emptyText:    { color: MID, fontSize: 14, textAlign: 'center' },

  statsRow:     { flexDirection: 'row', gap: 10, marginTop: 16 },
  statBox:      { flex: 1, backgroundColor: BG, borderRadius: 10, padding: 12, alignItems: 'center' },
  statLabel:    { fontSize: 10, color: MUTED, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 4 },
  statValue:    { fontSize: 16, fontWeight: '900', color: DARK },
});
