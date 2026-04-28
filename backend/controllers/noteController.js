const noteModel = require('../model/noteModel');

function extractFirstHashtag(text) {
    const match = text.match(/#\w+/);
    return match ? match[0].toLowerCase() : '#untitled';
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
        const { hashtag } = req.params;
        const { userId } = req.query;

        if (!userId || !hashtag) {
            return res.status(400).json({ success: false, error: 'userId et hashtag sont requis' });
        }

        const note = await noteModel.getNoteByHashtag(userId, hashtag);

        res.status(200).json({
            success: true,
            note: note ? { content: note.content, hashtag: note.hashtag, updated_at: note.updated_at } : null
        });
    } catch (error) {
        console.error('Erreur lors de la récupération de la note:', error);
        res.status(500).json({ success: false, error: 'Erreur lors de la récupération de la note' });
    }
};

const saveNote = async (req, res) => {
    try {
        const { userId, username, hashtag, content } = req.body;

        if (!userId || !content || !hashtag) {
            return res.status(400).json({ success: false, error: 'userId, hashtag et content sont requis' });
        }

        const note = await noteModel.saveNote(userId, username, hashtag, content);

        res.status(200).json({
            success: true,
            note: { content: note.content, hashtag: note.hashtag, updated_at: note.updated_at }
        });
    } catch (error) {
        console.error('Erreur lors de la sauvegarde de la note:', error);
        res.status(500).json({ success: false, error: 'Erreur lors de la sauvegarde de la note' });
    }
};

const getAllHashtags = async (req, res) => {
    try {
        const { userId } = req.query;

        if (!userId) {
            return res.status(400).json({ success: false, error: 'userId est requis' });
        }

        const hashtags = await noteModel.getAllHashtags(userId);

        res.status(200).json({
            success: true,
            hashtags: hashtags
        });
    } catch (error) {
        console.error('Erreur lors de la récupération des hashtags:', error);
        res.status(500).json({ success: false, error: 'Erreur lors de la récupération des hashtags' });
    }
};

module.exports = {
    getNote,
    saveNote,
    getAllHashtags
};
