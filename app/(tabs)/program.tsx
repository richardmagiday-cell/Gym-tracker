import { useState, useCallback } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity, TextInput,
  StyleSheet, Alert,
} from 'react-native';
import { useFocusEffect } from 'expo-router';
import { WORKOUT_TEMPLATES, REST_DAY, getTemplateByKey } from '../../src/data/program';
import {
  Program, getPrograms, getActiveSchedule, getScheduleForProgram,
  setActiveProgram, createProgram, updateSchedule, deleteProgram, renameProgram,
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

  const editingProgram = programs.find(p => p.id === editingId);

  return (
    <ScrollView style={s.container} keyboardShouldPersistTaps="handled">
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

      <View style={{ height: 40 }} />
    </ScrollView>
  );
}

const s = StyleSheet.create({
  container:    { flex: 1, backgroundColor: '#fff', padding: 16 },
  pageTitle:    { fontSize: 26, fontWeight: '800', color: '#111', marginBottom: 16 },

  // Program list
  programRow:       { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', backgroundColor: '#f8f8f8', borderRadius: 10, padding: 12, marginBottom: 8, borderWidth: 1, borderColor: '#eee' },
  programRowActive: { borderColor: RED, backgroundColor: '#fff8f8' },
  programInfo:      { flex: 1 },
  programName:      { fontSize: 15, fontWeight: '700', color: '#333' },
  programNameActive:{ color: RED },
  activeTag:        { fontSize: 11, color: RED, fontWeight: '600', marginTop: 2 },
  programActions:   { flexDirection: 'row', gap: 6, alignItems: 'center' },
  actionBtn:        { backgroundColor: '#eee', borderRadius: 7, paddingHorizontal: 10, paddingVertical: 5 },
  actionBtnSelected:{ backgroundColor: RED },
  actionBtnText:    { fontSize: 12, fontWeight: '600', color: '#555' },
  actionBtnTextSelected: { color: '#fff' },
  deleteBtn:        { backgroundColor: '#fde', borderRadius: 7, paddingHorizontal: 9, paddingVertical: 5 },
  deleteBtnText:    { fontSize: 12, fontWeight: '700', color: RED },

  // New program form
  newProgramBtn:    { borderWidth: 1.5, borderColor: RED, borderRadius: 10, padding: 13, alignItems: 'center', marginBottom: 20 },
  newProgramBtnText:{ color: RED, fontWeight: '700', fontSize: 15 },
  newForm:          { backgroundColor: '#fafafa', borderRadius: 12, padding: 14, marginBottom: 20, borderWidth: 1, borderColor: '#eee' },
  newFormTitle:     { fontSize: 16, fontWeight: '800', marginBottom: 10, color: '#111' },
  nameInput:        { borderWidth: 1, borderColor: '#ddd', borderRadius: 8, padding: 10, fontSize: 15, backgroundColor: '#fff', marginBottom: 10 },
  copyRow:          { flexDirection: 'row', justifyContent: 'space-between', padding: 10, backgroundColor: '#f0f0f0', borderRadius: 8, marginBottom: 8 },
  copyLabel:        { fontSize: 13, color: '#666' },
  copyValue:        { fontSize: 13, fontWeight: '600', color: '#333' },
  miniPicker:       { backgroundColor: '#fff', borderRadius: 8, borderWidth: 1, borderColor: '#ddd', marginBottom: 8, overflow: 'hidden' },
  miniPickerItem:   { padding: 11, borderBottomWidth: 1, borderBottomColor: '#f0f0f0' },
  miniPickerActive: { backgroundColor: '#fff0f0' },
  miniPickerText:   { fontSize: 14, color: '#333' },
  newFormBtns:      { flexDirection: 'row', gap: 10, marginTop: 4 },
  cancelBtn:        { flex: 1, backgroundColor: '#eee', borderRadius: 9, padding: 12, alignItems: 'center' },
  cancelBtnText:    { fontWeight: '700', color: '#666' },
  createBtn:        { flex: 1, backgroundColor: RED, borderRadius: 9, padding: 12, alignItems: 'center' },
  createBtnText:    { fontWeight: '700', color: '#fff' },

  // Schedule editor
  scheduleSection:  { backgroundColor: '#f8f8f8', borderRadius: 12, padding: 14, borderWidth: 1, borderColor: '#eee' },
  sectionTitle:     { fontSize: 15, fontWeight: '800', color: '#111', marginBottom: 12 },
  dayRow:           { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', backgroundColor: '#fff', borderRadius: 8, paddingHorizontal: 14, paddingVertical: 13, marginBottom: 6, borderWidth: 1, borderColor: '#eee' },
  dayRowOpen:       { borderColor: RED, backgroundColor: '#fff8f8' },
  dayName:          { fontSize: 14, fontWeight: '700', color: '#333', width: 36 },
  dayRight:         { flexDirection: 'row', alignItems: 'center', gap: 8 },
  dayValue:         { fontSize: 14, fontWeight: '600', color: '#222' },
  dayValueRest:     { color: '#aaa' },
  chevron:          { fontSize: 10, color: '#999' },
  dayOptions:       { backgroundColor: '#fff', borderRadius: 8, borderWidth: 1, borderColor: RED, marginBottom: 6, overflow: 'hidden' },
  dayOption:        { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 12, borderBottomWidth: 1, borderBottomColor: '#f0f0f0' },
  dayOptionActive:  { backgroundColor: '#fff0f0' },
  dayOptionText:    { fontSize: 14, color: '#333' },
  dayOptionTextActive: { color: RED, fontWeight: '700' },
  checkmark:        { fontSize: 14, color: RED, fontWeight: '700' },
  saveBtn:          { backgroundColor: RED, borderRadius: 10, padding: 14, alignItems: 'center', marginTop: 12 },
  saveBtnText:      { color: '#fff', fontWeight: '800', fontSize: 15 },
});
