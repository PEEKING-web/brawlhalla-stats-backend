const express = require('express');
const router = express.Router();
const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

// Get all notes for a player
router.get('/player/:brawlhallaId', async (req, res) => {
  if (!req.isAuthenticated()) {
    return res.status(401).json({ error: 'Not authenticated' });
  }

  try {
    const user = await prisma.user.findUnique({
      where: { steamId: req.user.steamId },
    });

    const notes = await prisma.playerNote.findMany({
      where: {
        userId: user.id,
        brawlhallaId: req.params.brawlhallaId,
      },
      orderBy: { updatedAt: 'desc' },
    });

    res.json(notes);
  } catch (error) {
    console.error('Error fetching notes:', error);
    res.status(500).json({ error: 'Failed to fetch notes' });
  }
});

// Get all notes (all players)
router.get('/', async (req, res) => {
  if (!req.isAuthenticated()) {
    return res.status(401).json({ error: 'Not authenticated' });
  }

  try {
    const user = await prisma.user.findUnique({
      where: { steamId: req.user.steamId },
    });

    const notes = await prisma.playerNote.findMany({
      where: { userId: user.id },
      orderBy: { updatedAt: 'desc' },
    });

    res.json(notes);
  } catch (error) {
    console.error('Error fetching notes:', error);
    res.status(500).json({ error: 'Failed to fetch notes' });
  }
});

// Create note
router.post('/', async (req, res) => {
  if (!req.isAuthenticated()) {
    return res.status(401).json({ error: 'Not authenticated' });
  }

  const { brawlhallaId, playerName, note, category } = req.body;

  if (!brawlhallaId || !playerName || !note) {
    return res.status(400).json({ error: 'Missing required fields' });
  }

  try {
    const user = await prisma.user.findUnique({
      where: { steamId: req.user.steamId },
    });

    const newNote = await prisma.playerNote.create({
      data: {
        userId: user.id,
        brawlhallaId,
        playerName,
        note,
        category: category || null,
      },
    });

    res.json({ success: true, note: newNote });
  } catch (error) {
    console.error('Error creating note:', error);
    res.status(500).json({ error: 'Failed to create note' });
  }
});

// Update note
router.put('/:noteId', async (req, res) => {
  if (!req.isAuthenticated()) {
    return res.status(401).json({ error: 'Not authenticated' });
  }

  const { note, category } = req.body;

  try {
    const user = await prisma.user.findUnique({
      where: { steamId: req.user.steamId },
    });

    const updatedNote = await prisma.playerNote.updateMany({
      where: {
        id: req.params.noteId,
        userId: user.id,
      },
      data: {
        note: note || undefined,
        category: category !== undefined ? category : undefined,
      },
    });

    if (updatedNote.count === 0) {
      return res.status(404).json({ error: 'Note not found' });
    }

    res.json({ success: true, message: 'Note updated' });
  } catch (error) {
    console.error('Error updating note:', error);
    res.status(500).json({ error: 'Failed to update note' });
  }
});

// Delete note
router.delete('/:noteId', async (req, res) => {
  if (!req.isAuthenticated()) {
    return res.status(401).json({ error: 'Not authenticated' });
  }

  try {
    const user = await prisma.user.findUnique({
      where: { steamId: req.user.steamId },
    });

    await prisma.playerNote.deleteMany({
      where: {
        id: req.params.noteId,
        userId: user.id,
      },
    });

    res.json({ success: true, message: 'Note deleted' });
  } catch (error) {
    console.error('Error deleting note:', error);
    res.status(500).json({ error: 'Failed to delete note' });
  }
});

module.exports = router;