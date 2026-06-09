import { useState, useCallback } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity, TextInput,
  StyleSheet, Alert, KeyboardAvoidingView, Platform,
} from 'react-native';
import { Stack, useLocalSearchParams, router } from 'expo-router';
import { useFocusEffect } from 'expo-router';
import { getTemplateByKey } from '../src/data/program';
import {
  DBTemplateExercise, getDBTemplate,
  addTemplateExercise, updateTemplateExercise, deleteTemplateExercise,
  addTemplateSet, updateTemplateSet, deleteTemplateSet,
} from '../src/db/database';

const RED = '#e63946';

export default function EditWorkout() {
  const { programId: programIdStr, templateKey } = useLocalSearchParams<{
    programId: string; templateKey: string;
  }>();
  const programId = parseInt(programIdStr ?? '0', 10);
  const workoutName = getTemplateByKey(templateKey ?? '').name;

  const [exercises, setExercises] = useState<DBTemplateExercise[]>([]);

  // Exercise editing state
  const [editingExId, setEditingExId] = useState<number | null>(null);
  const [editName, setEditName] = useState('');
  const [editMuscle, setEditMuscle] = useState('');
  const [editNotes, setEditNotes] = useState('');

  // Set editing state
  const [editingSetId, setEditingSetId] = useState<number | null>(null);
  const [editReps, setEditReps] = useState('');
  const [editWeight, setEditWeight] = useState('');
  const [editSetNotes, setEditSetNotes] = useState('');

  // Add set state
  const [addingSetToExId, setAddingSetToExId] = useState<number | null>(null);
  const [newSetReps, setNewSetReps] = useState('');
  const [newSetWeight, setNewSetWeight] = useState('');

  // Add exercise state
  const [showAddEx, setShowAddEx] = useState(false);
  const [newExName, setNewExName] = useState('');
  const [newExMuscle, setNewExMuscle] = useState('');
  const [newExNotes, setNewExNotes] = useState('');

  useFocusEffect(useCallback(() => { reload(); }, []));

  function reload() {
    setExercises(getDBTemplate(programId, templateKey ?? ''));
  }

  // ── Exercise actions ────────────────────────────────────────────────────────

  function startEditEx(ex: DBTemplateExercise) {
    setEditingExId(ex.id);
    setEditName(ex.name);
    setEditMuscle(ex.muscleGroup);
    setEditNotes(ex.notes);
    setEditingSetId(null);
    setAddingSetToExId(null);
  }

  function saveEditEx() {
    if (!editName.trim()) { Alert.alert('Exercise name required'); return; }
    updateTemplateExercise(editingExId!, editName.trim(), editMuscle.trim(), editNotes.trim());
    setEditingExId(null);
    reload();
  }

  function confirmDeleteEx(ex: DBTemplateExercise) {
    Alert.alert(
      'Delete Exercise',
      `Delete "${ex.name}" and all its sets?`,
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Delete', style: 'destructive', onPress: () => { deleteTemplateExercise(ex.id); reload(); } },
      ]
    );
  }

  function handleAddExercise() {
    if (!newExName.trim()) { Alert.alert('Exercise name required'); return; }
    addTemplateExercise(programId, templateKey ?? '', newExName.trim(), newExMuscle.trim(), newExNotes.trim());
    setNewExName('');
    setNewExMuscle('');
    setNewExNotes('');
    setShowAddEx(false);
    reload();
  }

  // ── Set actions ─────────────────────────────────────────────────────────────

  function startEditSet(set: DBTemplateExercise['sets'][number]) {
    setEditingSetId(set.id);
    setEditReps(set.targetReps);
    setEditWeight(set.prevWeight);
    setEditSetNotes(set.notes);
    setEditingExId(null);
    setAddingSetToExId(null);
  }

  function saveEditSet() {
    if (!editReps.trim()) { Alert.alert('Rep target required'); return; }
    updateTemplateSet(editingSetId!, editReps.trim(), editWeight.trim(), editSetNotes.trim());
    setEditingSetId(null);
    reload();
  }

  function confirmDeleteSet(setId: number) {
    Alert.alert(
      'Delete Set',
      'Remove this set?',
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Delete', style: 'destructive', onPress: () => { deleteTemplateSet(setId); reload(); } },
      ]
    );
  }

  function handleAddSet(exId: number) {
    if (!newSetReps.trim()) { Alert.alert('Rep target required'); return; }
    addTemplateSet(exId, newSetReps.trim(), newSetWeight.trim());
    setAddingSetToExId(null);
    setNewSetReps('');
    setNewSetWeight('');
    reload();
  }

  return (
    <KeyboardAvoidingView style={{ flex: 1, backgroundColor: '#F3F4F6' }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <Stack.Screen options={{ title: `Edit: ${workoutName}`, headerBackTitle: 'Back', headerStyle: { backgroundColor: '#111827' }, headerTintColor: '#fff', headerTitleStyle: { fontWeight: '800' } }} />
      <ScrollView style={s.container} keyboardShouldPersistTaps="handled">

        {exercises.length === 0 && (
          <Text style={s.empty}>No exercises yet. Add one below.</Text>
        )}

        {exercises.map(ex => (
          <View key={ex.id} style={s.exCard}>

            {/* ── Exercise header ── */}
            {editingExId === ex.id ? (
              <View style={s.editForm}>
                <Text style={s.editFormTitle}>Edit Exercise</Text>
                <TextInput style={s.input} placeholder="Exercise name *" value={editName} onChangeText={setEditName} />
                <TextInput style={s.input} placeholder="Muscle group" value={editMuscle} onChangeText={setEditMuscle} />
                <TextInput style={s.input} placeholder="Notes (optional)" value={editNotes} onChangeText={setEditNotes} />
                <View style={s.formBtns}>
                  <TouchableOpacity style={s.cancelBtn} onPress={() => setEditingExId(null)}>
                    <Text style={s.cancelBtnText}>Cancel</Text>
                  </TouchableOpacity>
                  <TouchableOpacity style={s.saveBtn} onPress={saveEditEx}>
                    <Text style={s.saveBtnText}>Save</Text>
                  </TouchableOpacity>
                </View>
              </View>
            ) : (
              <View style={s.exHeader}>
                <View style={{ flex: 1 }}>
                  <Text style={s.exName}>{ex.name}</Text>
                  <Text style={s.exMuscle}>{ex.muscleGroup}</Text>
                  {!!ex.notes && <Text style={s.exNote}>{ex.notes}</Text>}
                </View>
                <TouchableOpacity style={s.iconBtn} onPress={() => startEditEx(ex)}>
                  <Text style={s.iconBtnText}>✏️</Text>
                </TouchableOpacity>
                <TouchableOpacity style={[s.iconBtn, s.deleteIconBtn]} onPress={() => confirmDeleteEx(ex)}>
                  <Text style={s.iconBtnText}>🗑️</Text>
                </TouchableOpacity>
              </View>
            )}

            {/* ── Sets ── */}
            <View style={s.setsContainer}>
              <View style={s.setHeaderRow}>
                <Text style={[s.setCol1, s.colHeader]}>Set</Text>
                <Text style={[s.setCol2, s.colHeader]}>Target</Text>
                <Text style={[s.setCol3, s.colHeader]}>Prev</Text>
                <Text style={[s.setCol4, s.colHeader]}></Text>
              </View>

              {ex.sets.map(set => (
                <View key={set.id}>
                  {editingSetId === set.id ? (
                    <View style={s.setEditRow}>
                      <TextInput
                        style={[s.setEditInput, { flex: 1 }]}
                        placeholder="Reps *"
                        value={editReps}
                        onChangeText={setEditReps}
                      />
                      <TextInput
                        style={[s.setEditInput, { flex: 1 }]}
                        placeholder="Prev weight"
                        value={editWeight}
                        onChangeText={setEditWeight}
                      />
                      <TextInput
                        style={[s.setEditInput, { flex: 1 }]}
                        placeholder="Notes"
                        value={editSetNotes}
                        onChangeText={setEditSetNotes}
                      />
                      <TouchableOpacity style={s.setActionBtn} onPress={saveEditSet}>
                        <Text style={s.setActionBtnText}>✓</Text>
                      </TouchableOpacity>
                      <TouchableOpacity style={s.setActionBtn} onPress={() => setEditingSetId(null)}>
                        <Text style={s.setActionBtnText}>✕</Text>
                      </TouchableOpacity>
                    </View>
                  ) : (
                    <View style={s.setRow}>
                      <Text style={s.setCol1}>{set.setNumber}</Text>
                      <Text style={s.setCol2}>{set.targetReps}</Text>
                      <Text style={s.setCol3}>{set.prevWeight || '—'}</Text>
                      <View style={s.setCol4Btns}>
                        <TouchableOpacity onPress={() => startEditSet(set)}>
                          <Text style={s.setRowAction}>✏️</Text>
                        </TouchableOpacity>
                        <TouchableOpacity onPress={() => confirmDeleteSet(set.id)}>
                          <Text style={s.setRowAction}>🗑️</Text>
                        </TouchableOpacity>
                      </View>
                    </View>
                  )}
                </View>
              ))}

              {/* Add Set */}
              {addingSetToExId === ex.id ? (
                <View style={s.addSetRow}>
                  <TextInput
                    style={[s.setEditInput, { flex: 1 }]}
                    placeholder="Reps *"
                    value={newSetReps}
                    onChangeText={setNewSetReps}
                    autoFocus
                  />
                  <TextInput
                    style={[s.setEditInput, { flex: 1 }]}
                    placeholder="Prev weight"
                    value={newSetWeight}
                    onChangeText={setNewSetWeight}
                  />
                  <TouchableOpacity style={s.setActionBtn} onPress={() => handleAddSet(ex.id)}>
                    <Text style={s.setActionBtnText}>+</Text>
                  </TouchableOpacity>
                  <TouchableOpacity style={s.setActionBtn} onPress={() => setAddingSetToExId(null)}>
                    <Text style={s.setActionBtnText}>✕</Text>
                  </TouchableOpacity>
                </View>
              ) : (
                <TouchableOpacity
                  style={s.addSetBtn}
                  onPress={() => { setAddingSetToExId(ex.id); setNewSetReps(''); setNewSetWeight(''); setEditingExId(null); setEditingSetId(null); }}
                >
                  <Text style={s.addSetBtnText}>+ Add Set</Text>
                </TouchableOpacity>
              )}
            </View>
          </View>
        ))}

        {/* ── Add Exercise ── */}
        {showAddEx ? (
          <View style={s.addExForm}>
            <Text style={s.editFormTitle}>New Exercise</Text>
            <TextInput
              style={s.input}
              placeholder="Exercise name *"
              value={newExName}
              onChangeText={setNewExName}
              autoFocus
            />
            <TextInput
              style={s.input}
              placeholder="Muscle group"
              value={newExMuscle}
              onChangeText={setNewExMuscle}
            />
            <TextInput
              style={s.input}
              placeholder="Notes (optional)"
              value={newExNotes}
              onChangeText={setNewExNotes}
            />
            <View style={s.formBtns}>
              <TouchableOpacity style={s.cancelBtn} onPress={() => setShowAddEx(false)}>
                <Text style={s.cancelBtnText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity style={s.saveBtn} onPress={handleAddExercise}>
                <Text style={s.saveBtnText}>Add Exercise</Text>
              </TouchableOpacity>
            </View>
          </View>
        ) : (
          <TouchableOpacity
            style={s.addExBtn}
            onPress={() => { setShowAddEx(true); setEditingExId(null); setEditingSetId(null); }}
          >
            <Text style={s.addExBtnText}>+ Add Exercise</Text>
          </TouchableOpacity>
        )}

        <View style={{ height: 60 }} />
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const s = StyleSheet.create({
  container:     { flex: 1, backgroundColor: '#F3F4F6', padding: 16 },
  empty:         { color: '#9CA3AF', textAlign: 'center', marginTop: 40, fontSize: 15 },

  // Exercise card
  exCard:        { backgroundColor: '#fff', borderRadius: 14, padding: 16, marginBottom: 12, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.06, shadowRadius: 8, elevation: 3 },
  exHeader:      { flexDirection: 'row', alignItems: 'flex-start', marginBottom: 8 },
  exName:        { fontSize: 15, fontWeight: '800', color: '#111827' },
  exMuscle:      { fontSize: 11, color: '#9CA3AF', marginTop: 2 },
  exNote:        { fontSize: 12, color: '#D97706', fontStyle: 'italic', marginTop: 2 },
  iconBtn:       { padding: 7, marginLeft: 6, borderRadius: 8, backgroundColor: '#F3F4F6' },
  deleteIconBtn: { backgroundColor: '#FEF2F2' },
  iconBtnText:   { fontSize: 16 },

  // Edit form (exercise)
  editForm:      { backgroundColor: '#FFF5F5', borderRadius: 12, padding: 14, marginBottom: 10, borderWidth: 1, borderColor: '#FECACA' },
  editFormTitle: { fontSize: 13, fontWeight: '800', color: RED, marginBottom: 10 },
  input:         { borderWidth: 1.5, borderColor: '#E5E7EB', borderRadius: 10, padding: 11, fontSize: 14, backgroundColor: '#fff', marginBottom: 8, color: '#111827' },
  formBtns:      { flexDirection: 'row', gap: 8 },
  cancelBtn:     { flex: 1, backgroundColor: '#F3F4F6', borderRadius: 9, padding: 12, alignItems: 'center' },
  cancelBtnText: { fontWeight: '700', color: '#6B7280', fontSize: 14 },
  saveBtn:       { flex: 1, backgroundColor: RED, borderRadius: 9, padding: 12, alignItems: 'center' },
  saveBtnText:   { fontWeight: '800', color: '#fff', fontSize: 14 },

  // Sets
  setsContainer: { marginTop: 4 },
  setHeaderRow:  { flexDirection: 'row', marginBottom: 4 },
  colHeader:     { fontSize: 10, color: '#9CA3AF', fontWeight: '800', textTransform: 'uppercase', letterSpacing: 0.5 },
  setRow:        { flexDirection: 'row', alignItems: 'center', paddingVertical: 8, borderTopWidth: 1, borderTopColor: '#F3F4F6' },
  setCol1:       { width: 30, fontSize: 12, color: '#9CA3AF', fontWeight: '700' },
  setCol2:       { width: 70, fontSize: 13, fontWeight: '800', color: '#111827' },
  setCol3:       { flex: 1, fontSize: 12, color: '#6B7280' },
  setCol4Btns:   { flexDirection: 'row', gap: 8 },
  setRowAction:  { fontSize: 15 },
  setEditRow:    { flexDirection: 'row', gap: 6, paddingVertical: 8, alignItems: 'center', borderTopWidth: 1, borderTopColor: '#F3F4F6' },
  addSetRow:     { flexDirection: 'row', gap: 6, paddingVertical: 8, alignItems: 'center' },
  setEditInput:  { borderWidth: 1.5, borderColor: '#E5E7EB', borderRadius: 8, padding: 8, fontSize: 13, backgroundColor: '#fff', color: '#111827' },
  setActionBtn:  { backgroundColor: RED, borderRadius: 8, paddingHorizontal: 12, paddingVertical: 8 },
  setActionBtnText: { color: '#fff', fontWeight: '900', fontSize: 13 },
  addSetBtn:     { paddingVertical: 10, alignItems: 'center', borderTopWidth: 1, borderTopColor: '#F3F4F6', marginTop: 4 },
  addSetBtnText: { color: RED, fontWeight: '800', fontSize: 13 },

  // Add exercise
  addExBtn:      { borderWidth: 2, borderColor: RED, borderRadius: 14, padding: 15, alignItems: 'center', marginBottom: 12, borderStyle: 'dashed' },
  addExBtnText:  { color: RED, fontWeight: '800', fontSize: 15 },
  addExForm:     { backgroundColor: '#FFF5F5', borderRadius: 14, padding: 16, marginBottom: 12, borderWidth: 1, borderColor: '#FECACA' },
});
