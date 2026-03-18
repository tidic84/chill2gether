const noteModel = require('../model/noteModel');

function extractHashtags(text) {
    return [...new Set((text.match(/#\w+/g) || []).map(h => h.toLowerCase()))];
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

const getNote = async (req, res) => {
    try {
        const { roomId } = req.params;
        const { userId } = req.query;

        if (!userId) {
            return res.status(400).json({ success: false, error: 'userId est requis' });
        }

        const note = await noteModel.getNote(roomId, userId);

        res.status(200).json({
            success: true,
            note: note ? { content: note.content, hashtags: note.hashtags, updated_at: note.updated_at } : null
        });
    } catch (error) {
        console.error('Erreur lors de la récupération de la note:', error);
        res.status(500).json({ success: false, error: 'Erreur lors de la récupération de la note' });
    }
};

const saveNote = async (req, res) => {
    try {
        const { roomId } = req.params;
        const { userId, username, content } = req.body;

        if (!userId || !content) {
            return res.status(400).json({ success: false, error: 'userId et content sont requis' });
        }

        const plainText = flatSerialize(content);
        const hashtags = extractHashtags(plainText);

        const note = await noteModel.saveNote(roomId, userId, username, content, hashtags);

        res.status(200).json({
            success: true,
            note: { content: note.content, hashtags: note.hashtags, updated_at: note.updated_at }
        });
    } catch (error) {
        console.error('Erreur lors de la sauvegarde de la note:', error);
        res.status(500).json({ success: false, error: 'Erreur lors de la sauvegarde de la note' });
    }
};

module.exports = {
    getNote,
    saveNote
};
