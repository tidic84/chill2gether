import { useState, useEffect, useCallback, useRef } from 'react';
import { Plate, usePlateEditor } from 'platejs/react';
import { BasicNodesKit } from '@/components/basic-nodes-kit';
import { FixedToolbar } from '@/components/ui/fixed-toolbar';
import { MarkToolbarButton } from '@/components/ui/mark-toolbar-button';
import { Editor, EditorContainer } from '@/components/ui/editor';
import { BoldPlugin, ItalicPlugin, UnderlinePlugin, StrikethroughPlugin } from '@platejs/basic-nodes/react';
import { Bold, Italic, Underline, Strikethrough, Save, Check, BookOpen } from 'lucide-react';
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

function extractFirstHashtag(text) {
    const match = text.match(/#\w+/);
    return match ? match[0].toLowerCase() : null;
}

function flatSerialize(nodes) {
    if (!nodes || !Array.isArray(nodes)) return '';
    let text = '';
    for (const node of nodes) {
        if (node.text !== undefined) {
            text += node.text;
        } else if (node.children) {
            text += flatSerialize(node.children);
            text += '\n';
        }
    }
    return text;
}

export default function Notes({ roomId }) {
    const { user, isAuthenticated } = useAuth();
    const [saveStatus, setSaveStatus] = useState('idle');
    const [loaded, setLoaded] = useState(false);
    const [currentHashtag, setCurrentHashtag] = useState('#untitled');
    const [showIndexModal, setShowIndexModal] = useState(false);
    const [hashtags, setHashtags] = useState([]);
    const saveTimerRef = useRef(null);
    const lastSavedRef = useRef(null);

    const userId = getUserId(isAuthenticated, user);
    const username = getUsername(isAuthenticated, user);

    const editor = usePlateEditor({
        plugins: BasicNodesKit,
        value: defaultValue,
    });

    // Charger les hashtags au montage
    useEffect(() => {
        const loadHashtags = async () => {
            try {
                const res = await noteApi.getAllHashtags(userId);
                if (res.success && res.hashtags) {
                    setHashtags(res.hashtags);
                    if (res.hashtags.length > 0) {
                        setCurrentHashtag(res.hashtags[0].hashtag);
                    }
                }
            } catch (err) {
                console.error('Erreur chargement hashtags:', err);
            }
        };
        loadHashtags();
    }, [userId]);

    // Charger la note au montage et lors du changement de hashtag
    useEffect(() => {
        const loadNote = async () => {
            try {
                const res = await noteApi.getNote(currentHashtag, userId);
                if (res.success && res.note && res.note.content) {
                    const content = typeof res.note.content === 'string'
                        ? JSON.parse(res.note.content)
                        : res.note.content;
                    if (Array.isArray(content) && content.length > 0) {
                        editor.tf.setValue(content);
                        lastSavedRef.current = JSON.stringify(content);
                    }
                } else {
                    editor.tf.setValue(defaultValue);
                    lastSavedRef.current = JSON.stringify(defaultValue);
                }
            } catch (err) {
                console.error('Erreur chargement note:', err);
            } finally {
                setLoaded(true);
            }
        };
        loadNote();
    }, [currentHashtag, userId]);

    // Sauvegarder
    const saveNote = useCallback(async (content) => {
        const serialized = JSON.stringify(content);
        if (serialized === lastSavedRef.current) return;

        const extractedHashtag = extractFirstHashtag(flatSerialize(content));
        const noteHashtag = extractedHashtag || currentHashtag;

        setSaveStatus('saving');
        try {
            await noteApi.saveNote(userId, username, noteHashtag, content);
            lastSavedRef.current = serialized;
            setSaveStatus('saved');
            setTimeout(() => setSaveStatus('idle'), 1500);

            if (noteHashtag !== currentHashtag) {
                setCurrentHashtag(noteHashtag);
            }

            // Mettre à jour la liste des hashtags si c'est une nouvelle note
            const exists = hashtags.some(h => h.hashtag === noteHashtag);
            if (!exists) {
                setHashtags([{ hashtag: noteHashtag, updated_at: new Date().toISOString() }, ...hashtags]);
            }
        } catch (err) {
            console.error('Erreur sauvegarde note:', err);
            setSaveStatus('idle');
        }
    }, [currentHashtag, userId, username, hashtags]);

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

    // Charger une note depuis l'index
    const handleLoadNote = (hashtag) => {
        setCurrentHashtag(hashtag);
        setShowIndexModal(false);
    };

    // Créer une nouvelle note
    const handleNewNote = () => {
        const plainText = flatSerialize(editor.children);
        const newHashtag = extractFirstHashtag(plainText) || '#untitled';
        setCurrentHashtag(newHashtag);
        editor.tf.setValue(defaultValue);
        lastSavedRef.current = JSON.stringify(defaultValue);
        setShowIndexModal(false);
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
                    {/* Index Button */}
                    <button
                        onClick={() => setShowIndexModal(!showIndexModal)}
                        className="p-1 rounded hover:bg-zen-border dark:hover:bg-zen-dark-border transition text-zen-stone dark:text-zen-dark-stone"
                        title="Index des notes"
                    >
                        <BookOpen className="size-3.5" />
                    </button>

                    <div className="w-px bg-zen-border dark:bg-zen-dark-border"></div>

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
                        <span className="text-[10px] text-zen-muted dark:text-zen-dark-muted truncate max-w-xs">
                            {currentHashtag}
                        </span>
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
                            title="Sauvegarder"
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

            {/* Index Modal */}
            {showIndexModal && (
                <div className="absolute bottom-0 left-0 right-0 max-h-64 bg-zen-bg dark:bg-zen-dark-bg border-t border-zen-border dark:border-zen-dark-border overflow-y-auto z-50">
                    <div className="p-2">
                        <div className="flex items-center justify-between mb-2">
                            <h3 className="text-xs font-semibold text-zen-text dark:text-zen-dark-text">Index des notes</h3>
                            <button
                                onClick={() => setShowIndexModal(false)}
                                className="text-xs text-zen-muted dark:text-zen-dark-muted hover:text-zen-text dark:hover:text-zen-dark-text"
                            >
                                ✕
                            </button>
                        </div>

                        {hashtags.length > 0 ? (
                            <div className="space-y-1">
                                {hashtags.map((item) => (
                                    <button
                                        key={item.hashtag}
                                        onClick={() => handleLoadNote(item.hashtag)}
                                        className={`w-full text-left p-1.5 rounded text-xs transition ${
                                            currentHashtag === item.hashtag
                                                ? 'bg-zen-border dark:bg-zen-dark-border text-zen-text dark:text-zen-dark-text'
                                                : 'hover:bg-zen-border dark:hover:bg-zen-dark-border text-zen-muted dark:text-zen-dark-muted'
                                        }`}
                                    >
                                        <div className="font-medium">{item.hashtag}</div>
                                        <div className="text-[9px] opacity-70">
                                            {new Date(item.updated_at).toLocaleDateString('fr-FR', {
                                                month: 'short',
                                                day: 'numeric',
                                                hour: '2-digit',
                                                minute: '2-digit'
                                            })}
                                        </div>
                                    </button>
                                ))}
                            </div>
                        ) : (
                            <p className="text-xs text-zen-muted dark:text-zen-dark-muted">Aucune note sauvegardée</p>
                        )}

                        <button
                            onClick={handleNewNote}
                            className="w-full mt-2 p-1.5 rounded text-xs bg-zen-sage dark:bg-zen-dark-sage text-white hover:opacity-90 transition font-medium"
                        >
                            + Nouvelle note
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
}
