import { useState, useEffect, useCallback, useRef } from 'react';
import { Plate, usePlateEditor } from 'platejs/react';
import { BasicNodesKit } from '@/components/basic-nodes-kit';
import { FixedToolbar } from '@/components/ui/fixed-toolbar';
import { MarkToolbarButton } from '@/components/ui/mark-toolbar-button';
import { Editor, EditorContainer } from '@/components/ui/editor';
import { BoldPlugin, ItalicPlugin, UnderlinePlugin, StrikethroughPlugin } from '@platejs/basic-nodes/react';
import { Bold, Italic, Underline, Strikethrough, Save, Check } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { noteApi } from '../../services/api';

const AUTOSAVE_DELAY = 2000;

const defaultValue = [{ type: 'p', children: [{ text: '' }] }];

function getUserId(isAuthenticated, user) {
    if (isAuthenticated && user?.id) return String(user.id);
    return localStorage.getItem('anonymousUserId') || 'anonymous';
}

function getUsername(isAuthenticated, user) {
    if (isAuthenticated && user?.username) return user.username;
    return localStorage.getItem('anonymousUsername') || 'Anonyme';
}

export default function Notes({ roomId }) {
    const { user, isAuthenticated } = useAuth();
    const [saveStatus, setSaveStatus] = useState('idle'); // 'idle' | 'saving' | 'saved'
    const [loaded, setLoaded] = useState(false);
    const saveTimerRef = useRef(null);
    const lastSavedRef = useRef(null);

    const userId = getUserId(isAuthenticated, user);
    const username = getUsername(isAuthenticated, user);

    const editor = usePlateEditor({
        plugins: BasicNodesKit,
        value: defaultValue,
    });

    // Charger la note au montage
    useEffect(() => {
        const loadNote = async () => {
            try {
                const res = await noteApi.getNote(roomId, userId);
                if (res.success && res.note && res.note.content) {
                    const content = typeof res.note.content === 'string'
                        ? JSON.parse(res.note.content)
                        : res.note.content;
                    if (Array.isArray(content) && content.length > 0) {
                        editor.tf.setValue(content);
                        lastSavedRef.current = JSON.stringify(content);
                    }
                }
            } catch (err) {
                console.error('Erreur chargement note:', err);
            } finally {
                setLoaded(true);
            }
        };
        loadNote();
    }, [roomId, userId]);

    // Sauvegarder
    const saveNote = useCallback(async (content) => {
        const serialized = JSON.stringify(content);
        if (serialized === lastSavedRef.current) return;

        setSaveStatus('saving');
        try {
            await noteApi.saveNote(roomId, userId, username, content);
            lastSavedRef.current = serialized;
            setSaveStatus('saved');
            setTimeout(() => setSaveStatus('idle'), 1500);
        } catch (err) {
            console.error('Erreur sauvegarde note:', err);
            setSaveStatus('idle');
        }
    }, [roomId, userId, username]);

    // Auto-save debounced
    const handleChange = useCallback(({ value }) => {
        if (!loaded) return;
        if (saveTimerRef.current) clearTimeout(saveTimerRef.current);
        saveTimerRef.current = setTimeout(() => {
            saveNote(value);
        }, AUTOSAVE_DELAY);
    }, [loaded, saveNote]);

    // Sauvegarde manuelle
    const handleManualSave = () => {
        if (saveTimerRef.current) clearTimeout(saveTimerRef.current);
        saveNote(editor.children);
    };

    // Cleanup timer
    useEffect(() => {
        return () => {
            if (saveTimerRef.current) clearTimeout(saveTimerRef.current);
        };
    }, []);

    if (!loaded) {
        return (
            <div className="flex items-center justify-center h-full text-zen-muted dark:text-zen-dark-muted text-xs p-4">
                Chargement...
            </div>
        );
    }

    return (
        <div className="flex flex-col h-full">
            <Plate editor={editor} onChange={handleChange}>
                {/* Toolbar */}
                <FixedToolbar className="border-b border-zen-border dark:border-zen-dark-border bg-zen-bg dark:bg-zen-dark-bg p-0.5 gap-0.5 rounded-none">
                    <MarkToolbarButton nodeType={BoldPlugin.key}>
                        <Bold className="size-3.5" />
                    </MarkToolbarButton>
                    <MarkToolbarButton nodeType={ItalicPlugin.key}>
                        <Italic className="size-3.5" />
                    </MarkToolbarButton>
                    <MarkToolbarButton nodeType={UnderlinePlugin.key}>
                        <Underline className="size-3.5" />
                    </MarkToolbarButton>
                    <MarkToolbarButton nodeType={StrikethroughPlugin.key}>
                        <Strikethrough className="size-3.5" />
                    </MarkToolbarButton>

                    {/* Save status */}
                    <div className="ml-auto flex items-center gap-1.5 pr-1">
                        {saveStatus === 'saving' && (
                            <span className="text-[10px] text-zen-muted dark:text-zen-dark-muted animate-pulse">
                                Sauvegarde...
                            </span>
                        )}
                        {saveStatus === 'saved' && (
                            <span className="text-[10px] text-zen-sage dark:text-zen-dark-sage flex items-center gap-0.5">
                                <Check className="size-3" />
                                Sauvegardé
                            </span>
                        )}
                        <button
                            onClick={handleManualSave}
                            className="p-1 rounded hover:bg-zen-border dark:hover:bg-zen-dark-border transition text-zen-stone dark:text-zen-dark-stone"
                            title="Sauvegarder (Ctrl+S)"
                        >
                            <Save className="size-3.5" />
                        </button>
                    </div>
                </FixedToolbar>

                {/* Editor */}
                <EditorContainer className="flex-1 overflow-y-auto">
                    <Editor
                        variant="none"
                        className="px-3 py-2 text-sm text-zen-text dark:text-zen-dark-text min-h-full"
                        placeholder="Prendre des notes... (auto-save activé)"
                    />
                </EditorContainer>
            </Plate>
        </div>
    );
}
