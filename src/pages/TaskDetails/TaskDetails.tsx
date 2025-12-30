import React, { useState, useEffect } from 'react';
import {
    View,
    Text,
    StyleSheet,
    ScrollView,
    TouchableOpacity,
    Alert,
    TextInput,
    ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, SPACING, TYPOGRAPHY, BORDER_RADIUS } from '../../constants/theme';
import { doc, setDoc, updateDoc, deleteDoc, Timestamp, collection, addDoc } from 'firebase/firestore';
import { firebaseFirestore, firebaseAuth } from '../../config/firebase';
import { FirebaseError } from 'firebase/app';
import CustomDatePicker from '../../components/CustomDatePicker/CustomDatePicker';
import { Dropdown } from 'react-native-element-dropdown';

import { RootStackParamList } from '../../navigation/types';

type TaskDetailsRouteProp = RouteProp<RootStackParamList, 'TaskDetails'>;

const TaskDetails = () => {
    const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
    const route = useRoute<TaskDetailsRouteProp>();
    const { task, date, mode: initialMode } = route.params || {};
    const [mode, setMode] = useState(initialMode || 'create');

    const tagData = [
        { label: 'Normal', value: 'normal' },
        { label: 'Urgent', value: 'urgent' },
    ];

    const [title, setTitle] = useState('');
    const [notes, setNotes] = useState('');
    const [tag, setTag] = useState<'normal' | 'urgent' | null>(null);
    const [remindAt, setRemindAt] = useState<Date | null>(null);
    const [isDatePickerVisible, setDatePickerVisible] = useState(false);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        if (task) {
            setTitle(task.title);
            setNotes(task.notes || '');
            setTag(task.tag || 'normal');
            if (task.remindAt) {
                setRemindAt(new Date(task.remindAt));
            }
        } else if (date) {
            const initialDate = new Date(date);
            initialDate.setHours(9, 0, 0, 0);
            setRemindAt(initialDate);
        }
    }, [task, date]);

    const handleSave = async () => {
        if (!title.trim()) {
            Alert.alert('Error', 'Please enter a task title');
            return;
        }

        setLoading(true);
        try {
            const user = firebaseAuth().currentUser;
            if (!user) {
                Alert.alert('Error', 'You must be logged in to save tasks');
                return;
            }

            const taskData = {
                title,
                notes,
                tag: tag || 'normal',
                remindAt: remindAt ? Timestamp.fromDate(remindAt) : null,
                updatedAt: Timestamp.now(),
                userId: user.uid,
                completed: task ? task.completed : false,
            };

            if (task) {
                await updateDoc(doc(firebaseFirestore(), 'tasks', task.id), taskData);
            } else {
                await addDoc(collection(firebaseFirestore(), 'tasks'), {
                    ...taskData,
                    createdAt: Timestamp.now(),
                });
            }

            navigation.goBack();
        } catch (error: unknown) {
            console.error('Error saving task:', error);
            const message = error instanceof FirebaseError ? error.message : (error as Error).message;
            Alert.alert('Error', 'Failed to save task: ' + message);
        } finally {
            setLoading(false);
        }
    };

    const handleDelete = async () => {
        if (!task) return;

        Alert.alert(
            'Delete Task',
            'Are you sure you want to delete this task?',
            [
                { text: 'Cancel', style: 'cancel' },
                {
                    text: 'Delete',
                    style: 'destructive',
                    onPress: async () => {
                        setLoading(true);
                        try {
                            await deleteDoc(doc(firebaseFirestore(), 'tasks', task.id));
                            navigation.goBack();
                        } catch (error: unknown) {
                            console.error('Error deleting task:', error);
                            Alert.alert('Error', 'Failed to delete task');
                        } finally {
                            setLoading(false);
                        }
                    },
                },
            ]
        );
    };

    const formatReminderDate = (date: Date) => {
        return date.toLocaleDateString('en-GB', {
            day: 'numeric',
            month: 'short',
            year: 'numeric',
        }) + ' at ' + date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    };

    return (
        <SafeAreaView style={styles.container}>
            <View style={styles.header}>
                <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
                    <Ionicons name="arrow-back" size={24} color="#B7B7B7" />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>
                    {mode === 'view' ? 'Task Details' : task ? 'Edit Task' : 'Add New Task'}
                </Text>
                <View style={{ width: 24 }} />
            </View>

            <ScrollView style={styles.content} contentContainerStyle={styles.contentContainer}>

                <View style={styles.inputGroup}>
                    <Text style={styles.label}>Title</Text>
                    <TextInput
                        style={styles.input}
                        value={title}
                        onChangeText={setTitle}
                        placeholder="Input task title..."
                        placeholderTextColor={COLORS.light.textSecondary}
                        editable={mode !== 'view'}
                    />
                </View>

                <View style={styles.inputGroup}>
                    <Text style={styles.label}>Notes</Text>
                    <TextInput
                        style={[styles.input, styles.textArea]}
                        value={notes}
                        onChangeText={setNotes}
                        placeholder="Input task notes..."
                        placeholderTextColor={COLORS.light.textSecondary}
                        multiline
                        textAlignVertical="top"
                        editable={mode !== 'view'}
                    />
                </View>

                <View style={styles.inputGroup}>
                    <Text style={styles.label}>Tags</Text>
                    <Dropdown
                        style={styles.dropdown}
                        placeholderStyle={styles.placeholderStyle}
                        selectedTextStyle={styles.selectedTextStyle}
                        inputSearchStyle={styles.inputSearchStyle}
                        iconStyle={styles.iconStyle}
                        data={tagData}
                        search={false}
                        maxHeight={300}
                        labelField="label"
                        valueField="value"
                        placeholder="-Select tags-"
                        value={tag}
                        onChange={item => {
                            setTag(item.value as 'normal' | 'urgent');
                        }}
                        disable={mode === 'view'}
                    />
                </View>

                <View style={styles.inputGroup}>
                    <Text style={styles.sectionHeader}>Remind Me</Text>
                    <View style={styles.reminderBox}>
                        <View>
                            <Text style={styles.reminderLabel}>Date & Time</Text>
                            <Text style={styles.reminderValue}>
                                {remindAt ? formatReminderDate(remindAt) : 'No reminder set'}
                            </Text>
                        </View>
                        <TouchableOpacity
                            onPress={() => setDatePickerVisible(true)}
                            disabled={mode === 'view'}>
                            <Ionicons name="create-outline" size={24} color={COLORS.light.textSecondary} />
                        </TouchableOpacity>
                    </View>
                </View>
            </ScrollView>

            {mode === 'view' ? (
                !task?.completed && (
                    <View style={styles.footer}>
                        <TouchableOpacity
                            style={styles.saveButton}
                            onPress={() => setMode('edit')}>
                            <Text style={styles.saveButtonText}>Edit Task</Text>
                        </TouchableOpacity>
                    </View>
                )
            ) : (
                <View style={styles.footer}>
                    <TouchableOpacity
                        style={[styles.saveButton, loading && styles.saveButtonDisabled]}
                        onPress={handleSave}
                        disabled={loading}>
                        {loading ? (
                            <ActivityIndicator color="#fff" />
                        ) : (
                            <Text style={styles.saveButtonText}>Save Task</Text>
                        )}
                    </TouchableOpacity>
                </View>
            )}

            <CustomDatePicker
                visible={isDatePickerVisible}
                onClose={() => setDatePickerVisible(false)}
                onSelectDate={(date) => setRemindAt(date)}
                initialDate={remindAt}
            />
        </SafeAreaView>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: COLORS.light.background,
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingHorizontal: SPACING.md,
        paddingVertical: SPACING.md,
        backgroundColor: COLORS.light.background,
    },
    backButton: {
        padding: 4,
    },
    headerTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        color: COLORS.light.text,
    },
    content: {
        flex: 1,
    },
    contentContainer: {
        padding: SPACING.lg,
    },
    inputGroup: {
        marginBottom: SPACING.lg,
    },
    label: {
        fontSize: 12,
        marginBottom: SPACING.xs,
    },
    input: {
        borderWidth: 1,
        borderColor: COLORS.light.border,
        borderRadius: BORDER_RADIUS.sm,
        paddingHorizontal: SPACING.md,
        paddingVertical: SPACING.sm + 4,
        fontSize: 14,
        color: COLORS.light.text,
        backgroundColor: '#fff',
    },
    textArea: {
        minHeight: 100,
    },
    dropdown: {
        height: 50,
        borderColor: COLORS.light.border,
        borderWidth: 1,
        borderRadius: BORDER_RADIUS.sm,
        paddingLeft: 10,
        paddingRight: 8,
        backgroundColor: '#fff',
    },
    icon: {
        marginRight: 5,
    },
    placeholderStyle: {
        fontSize: 14,
        color: COLORS.light.textSecondary,
        marginLeft: 5,
    },
    selectedTextStyle: {
        fontSize: 14,
        color: COLORS.light.text,
        marginLeft: 5,
    },
    iconStyle: {
        width: 20,
        height: 20,
    },
    inputSearchStyle: {
        height: 40,
        fontSize: 16,
    },
    sectionHeader: {
        fontSize: 14,
        fontWeight: 'bold',
        color: COLORS.light.text,
        marginBottom: SPACING.md,
    },
    reminderBox: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        borderWidth: 1,
        borderColor: COLORS.light.border,
        borderRadius: BORDER_RADIUS.sm,
        padding: SPACING.md,
        backgroundColor: '#fff',
    },
    reminderLabel: {
        fontSize: 12,
        color: COLORS.light.textSecondary,
        marginBottom: 4,
    },
    reminderValue: {
        fontSize: 16,
        fontWeight: 'bold',
        color: COLORS.light.text,
    },
    footer: {
        padding: SPACING.lg,
        backgroundColor: COLORS.light.background,
    },
    saveButton: {
        backgroundColor: COLORS.light.primary,
        paddingVertical: 16,
        borderRadius: BORDER_RADIUS.sm,
        alignItems: 'center',
    },
    saveButtonDisabled: {
        opacity: 0.7,
    },
    saveButtonText: {
        color: '#fff',
        fontSize: 16,
        fontWeight: 'bold',
    },
});

export default TaskDetails;
