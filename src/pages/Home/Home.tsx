import React, { useState, useMemo } from 'react';
import {
    View,
    Text,
    StyleSheet,
    FlatList,
    TouchableOpacity,
    Alert,
    TextInput,
    Modal,
    Image,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useTasks } from '../../hooks/useTasks';
import { Task } from '../../store/taskSlice';
import TaskCard from '../../components/TaskCard/TaskCard';
import { COLORS, SPACING, TYPOGRAPHY } from '../../constants/theme';
import { globalStyles } from '../../styles/globalStyles';
import type { RootStackParamList } from '../../navigation/types';
import { Ionicons, Octicons } from '@expo/vector-icons';
import CustomDatePicker from '../../components/CustomDatePicker/CustomDatePicker';
import { Shadow } from 'react-native-shadow-2';

type HomeScreenNavigationProp = NativeStackNavigationProp<
    RootStackParamList,
    'Home'
>;

const Home: React.FC = () => {
    const navigation = useNavigation<HomeScreenNavigationProp>();
    const { tasks, isLoading, deleteTask, toggleComplete } = useTasks();
    const [isCalendarVisible, setCalendarVisible] = useState(false);
    const [menuVisible, setMenuVisible] = useState(false);
    const [selectionMode, setSelectionMode] = useState(false);
    const [selectedTasks, setSelectedTasks] = useState<string[]>([]);
    const [searchQuery, setSearchQuery] = useState('');

    const sortedTasks = useMemo(() => {
        const now = new Date();

        const filteredTasks = tasks.filter(task =>
            task.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
            task.notes.toLowerCase().includes(searchQuery.toLowerCase())
        );

        const upcoming = filteredTasks.filter(task =>
            !task.completed && task.remindAt && new Date(task.remindAt) > now
        );

        const others = filteredTasks.filter(task =>
            task.completed || !task.remindAt || new Date(task.remindAt) <= now
        );

        upcoming.sort((a, b) => {
            const dateA = new Date(a.remindAt!).getTime();
            const dateB = new Date(b.remindAt!).getTime();
            return dateA - dateB;
        });

        others.sort((a, b) => {
            const dateA = new Date(a.createdAt).getTime();
            const dateB = new Date(b.createdAt).getTime();
            return dateB - dateA;
        });

        return [...upcoming, ...others];
    }, [tasks, searchQuery]);

    const handleAddTask = () => {
        navigation.navigate('TaskDetails', { mode: 'create' });
    };

    const handleViewTask = (task: Task) => {
        const serializedTask = {
            ...task,
            remindAt: task.remindAt?.toISOString() || null,
            createdAt: task.createdAt.toISOString(),
            updatedAt: task.updatedAt.toISOString(),
        };
        navigation.navigate('TaskDetails', { mode: 'view', task: serializedTask });
    };

    const handleEditTask = (task: Task) => {
        const serializedTask = {
            ...task,
            remindAt: task.remindAt?.toISOString() || null,
            createdAt: task.createdAt.toISOString(),
            updatedAt: task.updatedAt.toISOString(),
        };
        navigation.navigate('TaskDetails', { mode: 'edit', task: serializedTask });
    };

    const handleDeleteTask = (taskId: string, taskTitle: string) => {
        console.log('Home: handleDeleteTask called for', taskId);
        Alert.alert('Delete Task', `Are you sure you want to delete "${taskTitle}"?`, [
            { text: 'Cancel', style: 'cancel', onPress: () => console.log('Home: Delete cancelled') },
            {
                text: 'Delete',
                style: 'destructive',
                onPress: () => {
                    console.log('Home: Delete confirmed for', taskId);
                    deleteTask(taskId);
                },
            },
        ]);
    };

    const handleCalendarPress = () => {
        setCalendarVisible(true);
    };

    const handleDateSelect = (date: Date) => {
        setCalendarVisible(false);
        navigation.navigate('TaskDetails', { mode: 'create', date: date.toISOString() });
    };

    const handleMenuPress = () => {
        setMenuVisible(true);
    };

    const handleSelectAll = () => {
        setMenuVisible(false);
        setSelectionMode(true);
        setSelectedTasks(tasks.map(task => task.id));
    };

    const handleEnterSelectionMode = () => {
        setMenuVisible(false);
        setSelectionMode(true);
        setSelectedTasks([]);
    };

    const handleToggleTaskSelection = (taskId: string) => {
        if (selectedTasks.includes(taskId)) {
            setSelectedTasks(selectedTasks.filter(id => id !== taskId));
        } else {
            setSelectedTasks([...selectedTasks, taskId]);
        }
    };

    const handleCancelSelection = () => {
        setSelectionMode(false);
        setSelectedTasks([]);
    };

    const handleDeleteSelected = () => {
        if (selectedTasks.length === 0) {
            Alert.alert('No Tasks Selected', 'Please select at least one task to delete.');
            return;
        }

        Alert.alert(
            'Delete Tasks',
            `Are you sure you want to delete ${selectedTasks.length} task(s)?`,
            [
                { text: 'Cancel', style: 'cancel' },
                {
                    text: 'Delete',
                    style: 'destructive',
                    onPress: () => {
                        selectedTasks.forEach(taskId => deleteTask(taskId));
                        setSelectionMode(false);
                        setSelectedTasks([]);
                    },
                },
            ]
        );
    };

    const renderEmptyState = () => (
        <View style={styles.emptyState}>
            <View style={styles.illustration}>
                <Image
                    source={require('../../assets/empty_state.png')}
                    style={styles.emptyStateImage}
                    resizeMode="contain"
                />
            </View>
            <Text style={styles.emptyStateTitle}>No Task</Text>
            <Text style={styles.emptyStateSubtitle}>
                Looks like you don't have a task,{'\n'}please add task
            </Text>
        </View>
    );

    return (
        <SafeAreaView style={globalStyles.container}>
            <View style={styles.header}>
                {selectionMode ? (
                    <TouchableOpacity onPress={handleCancelSelection}>
                        <Text style={styles.cancelText}>Cancel</Text>
                    </TouchableOpacity>
                ) : (
                    <TouchableOpacity onPress={() => navigation.navigate('Settings')}>
                        <Ionicons name="menu-outline" size={28} color={COLORS.light.textLime} />
                    </TouchableOpacity>
                )}

                <View style={styles.logoContainer}>
                    {selectionMode ? (
                        <Text style={styles.selectionTitle}>{selectedTasks.length} Selected</Text>
                    ) : (
                        <Image
                            source={require('../../assets/taski_logo.png')}
                            style={styles.logoImage}
                            resizeMode="contain"
                        />
                    )}
                </View>

                {selectionMode ? (
                    <TouchableOpacity onPress={handleDeleteSelected}>
                        <Ionicons name="trash-outline" size={18} color={COLORS.light.error} />
                    </TouchableOpacity>
                ) : (
                    <TouchableOpacity onPress={handleMenuPress}>
                        <Ionicons name="ellipsis-vertical" size={18} color={COLORS.light.textLime} />
                    </TouchableOpacity>
                )}
            </View>

            <View style={[styles.searchContainer, { borderWidth: tasks.length === 0 ? 0 : 1 }]}>
                <TextInput
                    style={styles.searchInput}
                    placeholder="Search task here..."
                    placeholderTextColor={COLORS.light.textSecondary}
                    value={searchQuery}
                    onChangeText={setSearchQuery}
                />
                <Ionicons name="search-outline" size={24} color={'#B7B7B7'} style={styles.searchIcon} />
            </View>

            <FlatList
                data={sortedTasks}
                keyExtractor={item => item.id}
                renderItem={({ item }) => (
                    <View style={styles.taskCardWrapper}>
                        {selectionMode && (
                            <TouchableOpacity
                                style={styles.checkbox}
                                onPress={() => handleToggleTaskSelection(item.id)}
                            >
                                <Ionicons
                                    name={selectedTasks.includes(item.id) ? "checkbox" : "square-outline"}
                                    size={24}
                                    color={selectedTasks.includes(item.id) ? COLORS.light.primary : COLORS.light.textSecondary}
                                />
                            </TouchableOpacity>
                        )}
                        <View style={{ flex: 1 }}>
                            <TaskCard
                                task={item}
                                onPress={() => selectionMode ? handleToggleTaskSelection(item.id) : handleViewTask(item)}
                                onEdit={() => handleEditTask(item)}
                                onToggleComplete={() => toggleComplete(item.id)}
                                onDelete={() => handleDeleteTask(item.id, item.title)}
                            />
                        </View>
                    </View>
                )}
                extraData={tasks}
                contentContainerStyle={styles.listContent}
                ListEmptyComponent={!isLoading ? renderEmptyState : null}
                refreshing={isLoading}
            />

            <View style={styles.bottomNav}>
                <TouchableOpacity style={styles.navItem}>
                    <Octicons name="home" size={24} color={COLORS.light.primary} />
                    <Text style={[styles.navLabel, { color: '#000' }]}>List View</Text>
                </TouchableOpacity>

                <TouchableOpacity style={styles.addButtonContainer} onPress={handleAddTask}>
                    <Shadow
                        distance={3}
                        startColor={'rgba(0,0,0,0.03)'}
                        offset={[0, -3]}
                    >
                        <View style={styles.addButton}>
                            <Octicons name="home" size={24} color="#fff" />
                        </View>
                    </Shadow>
                    <Text style={styles.navLabel}>Add Task</Text>
                </TouchableOpacity>

                <TouchableOpacity style={styles.navItem} onPress={handleCalendarPress}>
                    <Octicons name="calendar" size={24} color={COLORS.light.textLime} />
                    <Text style={styles.navLabel}>Calendar View</Text>
                </TouchableOpacity>
            </View>

            <Modal
                visible={menuVisible}
                transparent
                animationType="fade"
                onRequestClose={() => setMenuVisible(false)}
            >
                <TouchableOpacity
                    style={styles.modalOverlay}
                    activeOpacity={1}
                    onPress={() => setMenuVisible(false)}
                >
                    <View style={styles.menuContainer}>
                        <TouchableOpacity style={styles.menuItem} onPress={handleEnterSelectionMode}>
                            <Text style={styles.menuText}>Select</Text>
                        </TouchableOpacity>
                        <View style={styles.menuDivider} />
                        <TouchableOpacity style={styles.menuItem} onPress={handleSelectAll}>
                            <Text style={styles.menuText}>Select All</Text>
                        </TouchableOpacity>
                    </View>
                </TouchableOpacity>
            </Modal>

            <CustomDatePicker
                visible={isCalendarVisible}
                onClose={() => setCalendarVisible(false)}
                onSelectDate={handleDateSelect}
                initialDate={new Date()}
            />
        </SafeAreaView>
    );
};

const styles = StyleSheet.create({
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingHorizontal: SPACING.lg,
        paddingVertical: SPACING.md,
        backgroundColor: COLORS.light.background,
    },
    logoContainer: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    logoImage: {
        width: 66,
        height: 17,
    },
    searchContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        marginHorizontal: SPACING.lg,
        marginBottom: SPACING.xs,
        borderWidth: 1,
        borderColor: '#D2D2D2',
        borderRadius: 4,
        paddingHorizontal: SPACING.md,
        paddingVertical: SPACING.xs,
        marginTop: SPACING.md,
    },
    searchInput: {
        flex: 1,
        fontSize: TYPOGRAPHY.fontSize.md,
        color: COLORS.light.text,
        paddingVertical: SPACING.sm,
    },
    searchIcon: {
        marginLeft: SPACING.sm,
    },
    listContent: {
        padding: SPACING.md,
        flexGrow: 1,
    },
    emptyState: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        paddingVertical: SPACING.xxl * 2,
    },
    illustration: {
        width: 120,
        height: 80,
        marginBottom: SPACING.lg,
        justifyContent: 'center',
        alignItems: 'center',
    },
    emptyStateImage: {
        width: 202,
        height: 100,
    },
    emptyStateTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        color: COLORS.light.text,
        marginBottom: SPACING.sm,
    },
    emptyStateSubtitle: {
        fontSize: TYPOGRAPHY.fontSize.sm,
        color: COLORS.light.textSecondary,
        textAlign: 'center',
        lineHeight: 18,
    },
    bottomNav: {
        flexDirection: 'row',
        justifyContent: 'space-around',
        alignItems: 'flex-end',
        paddingVertical: SPACING.sm,
        backgroundColor: COLORS.light.background,
    },
    navItem: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
    },
    navLabel: {
        fontSize: 12,
        color: COLORS.light.textLime,
        marginTop: 4,
    },
    addButtonContainer: {
        flex: 1,
        alignItems: 'center',
    },
    addButton: {
        width: 50,
        height: 50,
        borderRadius: 28,
        backgroundColor: COLORS.light.primary,
        justifyContent: 'center',
        alignItems: 'center',
        borderWidth: 4,
        borderColor: '#ffffff',
        marginBottom: 1,
    },
    cancelText: {
        fontSize: 16,
        color: COLORS.light.primary,
        fontWeight: '600',
    },
    selectionTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        color: COLORS.light.text,
    },
    taskCardWrapper: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    checkbox: {
        paddingHorizontal: SPACING.md,
        paddingVertical: SPACING.sm,
    },
    modalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0, 0, 0, 0.3)',
        justifyContent: 'flex-start',
        alignItems: 'flex-end',
        paddingTop: 60,
        paddingRight: SPACING.lg,
    },
    menuContainer: {
        backgroundColor: '#fff',
        borderRadius: 8,
        paddingVertical: 4,
        width: 150,
        shadowColor: "#000",
        shadowOffset: {
            width: 0,
            height: 2,
        },
        shadowOpacity: 0.15,
        shadowRadius: 8,
        elevation: 5,
    },
    menuItem: {
        paddingVertical: 12,
        paddingHorizontal: 16,
    },
    menuText: {
        fontSize: 14,
        color: COLORS.light.text,
    },
    menuDivider: {
        height: 1,
        backgroundColor: '#F0F0F0',
        marginHorizontal: 16,
    },
});

export default Home;
