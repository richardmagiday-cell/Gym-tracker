import { useState, useCallback } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity, TextInput,
  StyleSheet, Alert, Share,
} from 'react-native';
import { useFocusEffect, router } from 'expo-router';
import { WORKOUT_TEMPLATES, REST_DAY, getTemplateByKey } from '../../src/data/program';
import {
  Program, getPrograms, getActiveSchedule, getScheduleForProgram,
  setActiveProgram, createProgram, updateSchedule, deleteProgram, renameProgram,
  exportProgram, importProgram,
} from '../../src/db/database';

const DAY_NAMES = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
const DAYS_ORDER = [1, 2, 3, 4, 5, 6, 0]; // Mon first
const RED = '#e63946';

const TEMPLATE_OPTIONS = [
  { key: 'rest', label: 'Rest' },
  ...WORKOUT_TEMPLATES.map(t => ({ key: t.key, label: t.name })),
];

// Keys that are flex/optional — shown separately in the schedule picker
const OPTIONAL_KEYS = new Set(['arms', 'push_b', 'shoulder_recovery']);

function templateLabel(key: string) {
  return TEMPLATE_OPTIONS.find(o => o.key === key)?.label ?? key;
}

export default function ProgramScreen() {
  const [programs, setPrograms] = useState<Program[]>([]);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [editSchedule, setEditSchedule] = useState<Record<number, string>>({});
  const [openDay, setOpenDay] = useState<number | null>(null);
  const [showNewForm, setShowNewForm] = useState(false);
  const [newName, setNewName] = useState('');
  const [copyFromId, setCopyFromId] = useState<number | null>(null);
  const [showCopyPicker, setShowCopyPicker] = useState(false);
  const [showImportForm, setShowImportForm] = useState(false);
  const [importCode, setImportCode] = useState('');
  const [importing, setImporting] = useState(false);

  useFocusEffect(
    useCallback(() => {
      reload();
    }, [])
  );

  function reload() {
    const progs = getPrograms();
    setPrograms(progs);
    const active = progs.find(p => p.isActive);
    if (active && editingId === null) {
      setEditingId(active.id);
      setEditSchedule(getScheduleForProgram(active.id));
    }
    setOpenDay(null);
  }

  function handleActivate(id: number) {
    setActiveProgram(id);
    const progs = getPrograms();
    setPrograms(progs);
    setEditingId(id);
    setEditSchedule(getScheduleForProgram(id));
    setOpenDay(null);
  }

  function handleEditSelect(id: number) {
    setEditingId(id);
    setEditSchedule(getScheduleForProgram(id));
    setOpenDay(null);
  }

  function handleDelete(prog: Program) {
    if (prog.isActive) {
      Alert.alert('Cannot Delete', 'Deactivate this program first by activating another one.');
      return;
    }
    Alert.alert(
      'Delete Program',
      `Delete "${prog.name}"? This cannot be undone.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete', style: 'destructive',
          onPress: () => {
            deleteProgram(prog.id);
            if (editingId === prog.id) setEditingId(null);
            reload();
          },
        },
      ]
    );
  }

  function handleDaySelect(day: number, key: string) {
    setEditSchedule(prev => ({ ...prev, [day]: key }));
    setOpenDay(null);
  }

  function handleSaveSchedule() {
    if (editingId === null) return;
    updateSchedule(editingId, editSchedule);
    Alert.alert('Saved', 'Schedule updated.');
  }

  function handleCreate() {
    const trimmed = newName.trim();
    if (!trimmed) { Alert.alert('Enter a program name'); return; }
    const baseSchedule: Record<number, string> = copyFromId
      ? getScheduleForProgram(copyFromId)
      : { 0: 'rest', 1: 'rest', 2: 'rest', 3: 'rest', 4: 'rest', 5: 'rest', 6: 'rest' };
    const newId = createProgram(trimmed, baseSchedule);
    setNewName('');
    setCopyFromId(null);
    setShowNewForm(false);
    setShowCopyPicker(false);
    setPrograms(getPrograms());
    setEditingId(newId);
    setEditSchedule(getScheduleForProgram(newId));
  }

  async function handleExport(programId: number) {
    try {
      const code = exportProgram(programId);
      await Share.share({ message: code, title: 'FitTrackr Program Code' });
    } catch {
      Alert.alert('Export Failed', 'Could not generate the program code. Try again.');
    }
  }

  function handleImport() {
    const trimmed = importCode.trim();
    if (!trimmed) { Alert.alert('Paste a program code first'); return; }
    setImporting(true);
    const result = importProgram(trimmed);
    setImporting(false);
    if (!result.success) {
      Alert.alert('Import Failed', result.error ?? 'Unknown error');
      return;
    }
    setImportCode('');
    setShowImportForm(false);
    reload();
    Alert.alert('Imported!', `"${result.name}" added to your programs.`);
  }

  const editingProgram = programs.find(p => p.id === editingId);

  return (
    <ScrollView style={s.container} keyboardShouldPersistTaps="handled" contentContainerStyle={{ padding: 16, paddingBottom: 48 }}>
      <Text style={s.pageTitle}>Programs</Text>

      {/* ── Programs list ── */}
      {programs.map(prog => (
        <View key={prog.id} style={[s.programRow, prog.isActive && s.programRowActive]}>
          <View style={s.programInfo}>
            <Text style={[s.programName, prog.isActive && s.programNameActive]}>
              {prog.isActive ? '● ' : '○ '}{prog.name}
            </Text>
            {prog.isActive && <Text style={s.activeTag}>Active</Text>}
          </View>
          <View style={s.programActions}>
            {!prog.isActive && (
              <TouchableOpacity style={s.actionBtn} onPress={() => handleActivate(prog.id)}>
                <Text style={s.actionBtnText}>Activate</Text>
              </TouchableOpacity>
            )}
            <TouchableOpacity
              style={[s.actionBtn, editingId === prog.id && s.actionBtnSelected]}
              onPress={() => handleEditSelect(prog.id)}
            >
              <Text style={[s.actionBtnText, editingId === prog.id && s.actionBtnTextSelected]}>
                Edit
              </Text>
            </TouchableOpacity>
            <TouchableOpacity style={s.shareBtn} onPress={() => handleExport(prog.id)}>
              <Text style={s.shareBtnText}>Share</Text>
            </TouchableOpacity>
            {!prog.isActive && (
              <TouchableOpacity style={s.deleteBtn} onPress={() => handleDelete(prog)}>
                <Text style={s.deleteBtnText}>✕</Text>
              </TouchableOpacity>
            )}
          </View>
        </View>
      ))}

      {/* ── New program form ── */}
      {showNewForm ? (
        <View style={s.newForm}>
          <Text style={s.newFormTitle}>New Program</Text>
          <TextInput
            style={s.nameInput}
            placeholder="Program name"
            value={newName}
            onChangeText={setNewName}
            autoFocus
          />
          <TouchableOpacity
            style={s.copyRow}
            onPress={() => setShowCopyPicker(p => !p)}
          >
            <Text style={s.copyLabel}>Copy schedule from:</Text>
            <Text style={s.copyValue}>
              {copyFromId ? programs.find(p => p.id === copyFromId)?.name ?? 'None' : 'None (blank)'}
            </Text>
          </TouchableOpacity>
          {showCopyPicker && (
            <View style={s.miniPicker}>
              <TouchableOpacity
                style={[s.miniPickerItem, copyFromId === null && s.miniPickerActive]}
                onPress={() => { setCopyFromId(null); setShowCopyPicker(false); }}
              >
                <Text style={s.miniPickerText}>None (blank schedule)</Text>
              </TouchableOpacity>
              {programs.map(p => (
                <TouchableOpacity
                  key={p.id}
                  style={[s.miniPickerItem, copyFromId === p.id && s.miniPickerActive]}
                  onPress={() => { setCopyFromId(p.id); setShowCopyPicker(false); }}
                >
                  <Text style={s.miniPickerText}>{p.name}</Text>
                </TouchableOpacity>
              ))}
            </View>
          )}
          <View style={s.newFormBtns}>
            <TouchableOpacity style={s.cancelBtn} onPress={() => { setShowNewForm(false); setNewName(''); setCopyFromId(null); }}>
              <Text style={s.cancelBtnText}>Cancel</Text>
            </TouchableOpacity>
            <TouchableOpacity style={s.createBtn} onPress={handleCreate}>
              <Text style={s.createBtnText}>Create</Text>
            </TouchableOpacity>
          </View>
        </View>
      ) : (
        <TouchableOpacity style={s.newProgramBtn} onPress={() => setShowNewForm(true)}>
          <Text style={s.newProgramBtnText}>+ New Program</Text>
        </TouchableOpacity>
      )}

      {/* ── Import program ── */}
      {showImportForm ? (
        <View style={s.importForm}>
          <Text style={s.importFormTitle}>Import Program</Text>
          <Text style={s.importFormSub}>Paste a FitTrackr share code (starts with "FT:")</Text>
          <TextInput
            style={s.importInput}
            placeholder="FT:eyJ..."
            placeholderTextColor="#9CA3AF"
            value={importCode}
            onChangeText={setImportCode}
            multiline
            numberOfLines={3}
            autoCapitalize="none"
            autoCorrect={false}
          />
          <View style={s.importBtns}>
            <TouchableOpacity style={s.cancelBtn} onPress={() => { setShowImportForm(false); setImportCode(''); }}>
              <Text style={s.cancelBtnText}>Cancel</Text>
            </TouchableOpacity>
            <TouchableOpacity style={s.importConfirmBtn} onPress={handleImport} disabled={importing}>
              <Text style={s.importConfirmBtnText}>{importing ? 'Importing…' : 'Import'}</Text>
            </TouchableOpacity>
          </View>
        </View>
      ) : (
        <TouchableOpacity style={s.importBtn} onPress={() => setShowImportForm(true)}>
          <Text style={s.importBtnText}>↓ Import Program Code</Text>
        </TouchableOpacity>
      )}

      {/* ── Schedule editor ── */}
      {editingProgram && (
        <View style={s.scheduleSection}>
          <Text style={s.sectionTitle}>
            Edit Schedule{editingProgram.isActive ? ' (Active)' : ''}: {editingProgram.name}
          </Text>

          {DAYS_ORDER.map(day => {
            const currentKey = editSchedule[day] ?? 'rest';
            const isOpen = openDay === day;
            return (
              <View key={day}>
                <TouchableOpacity
                  style={[s.dayRow, isOpen && s.dayRowOpen]}
                  onPress={() => setOpenDay(isOpen ? null : day)}
                >
                  <Text style={s.dayName}>{DAY_NAMES[day]}</Text>
                  <View style={s.dayRight}>
                    <Text style={[s.dayValue, currentKey === 'rest' && s.dayValueRest]}>
                      {templateLabel(currentKey)}
                    </Text>
                    <Text style={s.chevron}>{isOpen ? '▲' : '▼'}</Text>
                  </View>
                </TouchableOpacity>
                {isOpen && (
                  <View style={s.dayOptions}>
                    {TEMPLATE_OPTIONS.map(opt => (
                      <TouchableOpacity
                        key={opt.key}
                        style={[s.dayOption, currentKey === opt.key && s.dayOptionActive]}
                        onPress={() => handleDaySelect(day, opt.key)}
                      >
                        <Text style={[s.dayOptionText, currentKey === opt.key && s.dayOptionTextActive]}>
                          {opt.label}
                        </Text>
                        {currentKey === opt.key && <Text style={s.checkmark}>✓</Text>}
                      </TouchableOpacity>
                    ))}
                  </View>
                )}
              </View>
            );
          })}

          <TouchableOpacity style={s.saveBtn} onPress={handleSaveSchedule}>
            <Text style={s.saveBtnText}>Save Schedule</Text>
          </TouchableOpacity>
        </View>
      )}

      {/* ── Workouts editor ── */}
      {editingProgram && (
        <View style={s.workoutsSection}>
          <Text style={s.sectionTitle}>Edit Workouts: {editingProgram.name}</Text>
          <Text style={s.workoutsSub}>Tap a workout to add, edit, or delete exercises and sets.</Text>
          {WORKOUT_TEMPLATES.map(t => (
            <TouchableOpacity
              key={t.key}
              style={s.workoutRow}
              onPress={() => router.push({
                pathname: '/edit-workout',
                params: { programId: String(editingProgram.id), templateKey: t.key },
              })}
            >
              <View style={{ flex: 1 }}>
                <Text style={s.workoutRowName}>{t.name}</Text>
                <Text style={s.workoutRowMeta}>{t.exercises.length} default exercises</Text>
              </View>
              <Text style={s.workoutRowArrow}>›</Text>
            </TouchableOpacity>
          ))}
        </View>
      )}

      <View style={{ height: 40 }} />
    </ScrollView>
  );
}

const s = StyleSheet.create({
  container:    { flex: 1, backgroundColor: '#F3F4F6' },
  pageTitle:    { fontSize: 26, fontWeight: '900', color: '#111827', marginBottom: 16 },

  // Program list
  programRow:       { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', backgroundColor: '#fff', borderRadius: 14, padding: 14, marginBottom: 10, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.06, shadowRadius: 6, elevation: 2 },
  programRowActive: { borderLeftWidth: 4, borderLeftColor: RED },
  programInfo:      { flex: 1 },
  programName:      { fontSize: 15, fontWeight: '700', color: '#111827' },
  programNameActive:{ color: RED },
  activeTag:        { fontSize: 11, color: RED, fontWeight: '700', marginTop: 3 },
  programActions:   { flexDirection: 'row', gap: 6, alignItems: 'center' },
  actionBtn:        { backgroundColor: '#F3F4F6', borderRadius: 8, paddingHorizontal: 12, paddingVertical: 6 },
  actionBtnSelected:{ backgroundColor: RED },
  actionBtnText:    { fontSize: 12, fontWeight: '700', color: '#4B5563' },
  actionBtnTextSelected: { color: '#fff' },
  shareBtn:         { backgroundColor: '#EFF6FF', borderRadius: 8, paddingHorizontal: 12, paddingVertical: 6 },
  shareBtnText:     { fontSize: 12, fontWeight: '700', color: '#2563EB' },
  deleteBtn:        { backgroundColor: '#FEF2F2', borderRadius: 8, paddingHorizontal: 10, paddingVertical: 6 },
  deleteBtnText:    { fontSize: 12, fontWeight: '700', color: RED },

  // New program form
  newProgramBtn:    { borderWidth: 2, borderColor: RED, borderRadius: 14, padding: 15, alignItems: 'center', marginBottom: 20, borderStyle: 'dashed' },
  newProgramBtnText:{ color: RED, fontWeight: '800', fontSize: 15 },
  newForm:          { backgroundColor: '#fff', borderRadius: 14, padding: 16, marginBottom: 20, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.06, shadowRadius: 8, elevation: 3 },
  newFormTitle:     { fontSize: 16, fontWeight: '900', marginBottom: 12, color: '#111827' },
  nameInput:        { borderWidth: 1.5, borderColor: '#E5E7EB', borderRadius: 10, padding: 12, fontSize: 15, backgroundColor: '#F9FAFB', marginBottom: 10, color: '#111827' },
  copyRow:          { flexDirection: 'row', justifyContent: 'space-between', padding: 12, backgroundColor: '#F3F4F6', borderRadius: 10, marginBottom: 10 },
  copyLabel:        { fontSize: 13, color: '#6B7280' },
  copyValue:        { fontSize: 13, fontWeight: '700', color: '#111827' },
  miniPicker:       { backgroundColor: '#fff', borderRadius: 10, borderWidth: 1, borderColor: '#E5E7EB', marginBottom: 10, overflow: 'hidden' },
  miniPickerItem:   { padding: 12, borderBottomWidth: 1, borderBottomColor: '#F3F4F6' },
  miniPickerActive: { backgroundColor: '#FFF5F5' },
  miniPickerText:   { fontSize: 14, color: '#111827', fontWeight: '600' },
  newFormBtns:      { flexDirection: 'row', gap: 10, marginTop: 4 },
  cancelBtn:        { flex: 1, backgroundColor: '#F3F4F6', borderRadius: 10, padding: 13, alignItems: 'center' },
  cancelBtnText:    { fontWeight: '700', color: '#6B7280' },
  createBtn:        { flex: 1, backgroundColor: RED, borderRadius: 10, padding: 13, alignItems: 'center' },
  createBtnText:    { fontWeight: '800', color: '#fff' },

  // Import form
  importBtn:          { borderWidth: 2, borderColor: '#2563EB', borderRadius: 14, padding: 15, alignItems: 'center', marginBottom: 20, borderStyle: 'dashed' },
  importBtnText:      { color: '#2563EB', fontWeight: '800', fontSize: 15 },
  importForm:         { backgroundColor: '#fff', borderRadius: 14, padding: 16, marginBottom: 20, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.06, shadowRadius: 8, elevation: 3, borderLeftWidth: 4, borderLeftColor: '#2563EB' },
  importFormTitle:    { fontSize: 16, fontWeight: '900', color: '#111827', marginBottom: 4 },
  importFormSub:      { fontSize: 12, color: '#9CA3AF', marginBottom: 12 },
  importInput:        { borderWidth: 1.5, borderColor: '#E5E7EB', borderRadius: 10, padding: 12, fontSize: 13, backgroundColor: '#F9FAFB', color: '#111827', fontFamily: 'monospace', minHeight: 80, textAlignVertical: 'top', marginBottom: 12 },
  importBtns:         { flexDirection: 'row', gap: 10 },
  importConfirmBtn:   { flex: 1, backgroundColor: '#2563EB', borderRadius: 10, padding: 13, alignItems: 'center' },
  importConfirmBtnText: { fontWeight: '800', color: '#fff' },

  // Schedule editor
  scheduleSection:  { backgroundColor: '#fff', borderRadius: 14, padding: 16, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.06, shadowRadius: 8, elevation: 3 },
  sectionTitle:     { fontSize: 15, fontWeight: '900', color: '#111827', marginBottom: 14 },
  dayRow:           { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', backgroundColor: '#F9FAFB', borderRadius: 10, paddingHorizontal: 14, paddingVertical: 14, marginBottom: 6, borderWidth: 1, borderColor: '#E5E7EB' },
  dayRowOpen:       { borderColor: RED, backgroundColor: '#FFF5F5' },
  dayName:          { fontSize: 14, fontWeight: '800', color: '#111827', width: 40 },
  dayRight:         { flexDirection: 'row', alignItems: 'center', gap: 8 },
  dayValue:         { fontSize: 14, fontWeight: '700', color: '#111827' },
  dayValueRest:     { color: '#9CA3AF' },
  chevron:          { fontSize: 10, color: '#9CA3AF' },
  dayOptions:       { backgroundColor: '#fff', borderRadius: 10, borderWidth: 1, borderColor: RED, marginBottom: 6, overflow: 'hidden' },
  dayOption:        { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 13, borderBottomWidth: 1, borderBottomColor: '#F3F4F6' },
  dayOptionActive:  { backgroundColor: '#FFF5F5' },
  dayOptionText:    { fontSize: 14, color: '#111827', fontWeight: '600' },
  dayOptionTextActive: { color: RED, fontWeight: '800' },
  checkmark:        { fontSize: 15, color: RED, fontWeight: '900' },
  saveBtn:          { backgroundColor: RED, borderRadius: 12, padding: 15, alignItems: 'center', marginTop: 14, shadowColor: RED, shadowOffset: { width: 0, height: 3 }, shadowOpacity: 0.3, shadowRadius: 6, elevation: 5 },
  saveBtnText:      { color: '#fff', fontWeight: '900', fontSize: 15 },

  // Workouts editor
  workoutsSection:  { backgroundColor: '#fff', borderRadius: 14, padding: 16, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.06, shadowRadius: 8, elevation: 3, marginTop: 16 },
  workoutsSub:      { fontSize: 12, color: '#9CA3AF', marginBottom: 12 },
  workoutRow:       { flexDirection: 'row', alignItems: 'center', backgroundColor: '#F9FAFB', borderRadius: 10, paddingHorizontal: 14, paddingVertical: 14, marginBottom: 8, borderWidth: 1, borderColor: '#E5E7EB' },
  workoutRowName:   { fontSize: 14, fontWeight: '800', color: '#111827' },
  workoutRowMeta:   { fontSize: 11, color: '#9CA3AF', marginTop: 2 },
  workoutRowArrow:  { fontSize: 22, color: '#D1D5DB' },
});
