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
    <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <Stack.Screen options={{ title: `Edit: ${workoutName}`, headerBackTitle: 'Back' }} />
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
  container:     { flex: 1, backgroundColor: '#fff', padding: 16 },
  empty:         { color: '#aaa', textAlign: 'center', marginTop: 40, fontSize: 15 },

  // Exercise card
  exCard:        { backgroundColor: '#fafafa', borderRadius: 12, padding: 14, marginBottom: 12, borderWidth: 1, borderColor: '#eee' },
  exHeader:      { flexDirection: 'row', alignItems: 'flex-start', marginBottom: 8 },
  exName:        { fontSize: 15, fontWeight: '700', color: '#111' },
  exMuscle:      { fontSize: 12, color: '#aaa', marginTop: 2 },
  exNote:        { fontSize: 12, color: '#e67e22', fontStyle: 'italic', marginTop: 2 },
  iconBtn:       { padding: 6, marginLeft: 6, borderRadius: 8, backgroundColor: '#f0f0f0' },
  deleteIconBtn: { backgroundColor: '#fff0f0' },
  iconBtnText:   { fontSize: 16 },

  // Edit form (exercise)
  editForm:      { backgroundColor: '#fff8f8', borderRadius: 10, padding: 12, marginBottom: 10, borderWidth: 1, borderColor: '#fdd' },
  editFormTitle: { fontSize: 13, fontWeight: '700', color: RED, marginBottom: 8 },
  input:         { borderWidth: 1, borderColor: '#ddd', borderRadius: 8, padding: 10, fontSize: 14, backgroundColor: '#fff', marginBottom: 8 },
  formBtns:      { flexDirection: 'row', gap: 8 },
  cancelBtn:     { flex: 1, backgroundColor: '#eee', borderRadius: 8, padding: 10, alignItems: 'center' },
  cancelBtnText: { fontWeight: '700', color: '#666', fontSize: 14 },
  saveBtn:       { flex: 1, backgroundColor: RED, borderRadius: 8, padding: 10, alignItems: 'center' },
  saveBtnText:   { fontWeight: '700', color: '#fff', fontSize: 14 },

  // Sets
  setsContainer: { marginTop: 4 },
  setHeaderRow:  { flexDirection: 'row', marginBottom: 4 },
  colHeader:     { fontSize: 10, color: '#bbb', fontWeight: '700', textTransform: 'uppercase' },
  setRow:        { flexDirection: 'row', alignItems: 'center', paddingVertical: 6, borderTopWidth: 1, borderTopColor: '#f0f0f0' },
  setCol1:       { width: 30, fontSize: 12, color: '#999' },
  setCol2:       { width: 70, fontSize: 13, fontWeight: '700', color: '#222' },
  setCol3:       { flex: 1, fontSize: 12, color: '#888' },
  setCol4Btns:   { flexDirection: 'row', gap: 8 },
  setRowAction:  { fontSize: 14 },
  setEditRow:    { flexDirection: 'row', gap: 6, paddingVertical: 6, alignItems: 'center', borderTopWidth: 1, borderTopColor: '#f0f0f0' },
  addSetRow:     { flexDirection: 'row', gap: 6, paddingVertical: 6, alignItems: 'center' },
  setEditInput:  { borderWidth: 1, borderColor: '#ddd', borderRadius: 6, padding: 7, fontSize: 13, backgroundColor: '#fff' },
  setActionBtn:  { backgroundColor: RED, borderRadius: 6, paddingHorizontal: 10, paddingVertical: 7 },
  setActionBtnText: { color: '#fff', fontWeight: '800', fontSize: 13 },
  addSetBtn:     { paddingVertical: 8, alignItems: 'center', borderTopWidth: 1, borderTopColor: '#f0f0f0', marginTop: 4 },
  addSetBtnText: { color: RED, fontWeight: '700', fontSize: 13 },

  // Add exercise
  addExBtn:      { borderWidth: 1.5, borderColor: RED, borderRadius: 10, padding: 14, alignItems: 'center', marginBottom: 12 },
  addExBtnText:  { color: RED, fontWeight: '700', fontSize: 15 },
  addExForm:     { backgroundColor: '#fff8f8', borderRadius: 12, padding: 14, marginBottom: 12, borderWidth: 1, borderColor: '#fdd' },
});
