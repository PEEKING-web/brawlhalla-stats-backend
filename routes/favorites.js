const express = require('express');
const router = express.Router();
const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

// Get all favorites for user
router.get('/', async (req, res) => {
  if (!req.isAuthenticated()) {
    return res.status(401).json({ error: 'Not authenticated' });
  }

  try {
    const user = await prisma.user.findUnique({
      where: { steamId: req.user.steamId },
      include: {
        favorites: {
          orderBy: { addedAt: 'desc' },
        },
      },
    });

    res.json(user?.favorites || []);
  } catch (error) {
    console.error('Error fetching favorites:', error);
    res.status(500).json({ error: 'Failed to fetch favorites' });
  }
});

// Add favorite
router.post('/', async (req, res) => {
  if (!req.isAuthenticated()) {
    return res.status(401).json({ error: 'Not authenticated' });
  }

  const { brawlhallaId, playerName } = req.body;

  if (!brawlhallaId || !playerName) {
    return res.status(400).json({ error: 'Missing required fields' });
  }

  try {
    const user = await prisma.user.findUnique({
      where: { steamId: req.user.steamId },
    });

    const favorite = await prisma.favorite.create({
      data: {
        userId: user.id,
        brawlhallaId,
        playerName,
      },
    });

    res.json({ success: true, favorite });
  } catch (error) {
    if (error.code === 'P2002') {
      return res.status(400).json({ error: 'Player already in favorites' });
    }
    console.error('Error adding favorite:', error);
    res.status(500).json({ error: 'Failed to add favorite' });
  }
});

// Remove favorite
router.delete('/:brawlhallaId', async (req, res) => {
  if (!req.isAuthenticated()) {
    return res.status(401).json({ error: 'Not authenticated' });
  }

  try {
    const user = await prisma.user.findUnique({
      where: { steamId: req.user.steamId },
    });

    await prisma.favorite.delete({
      where: {
        userId_brawlhallaId: {
          userId: user.id,
          brawlhallaId: req.params.brawlhallaId,
        },
      },
    });

    res.json({ success: true, message: 'Favorite removed' });
  } catch (error) {
    console.error('Error removing favorite:', error);
    res.status(500).json({ error: 'Failed to remove favorite' });
  }
});

// Check if player is favorited
router.get('/check/:brawlhallaId', async (req, res) => {
  if (!req.isAuthenticated()) {
    return res.json({ isFavorite: false });
  }

  try {
    const user = await prisma.user.findUnique({
      where: { steamId: req.user.steamId },
    });

    const favorite = await prisma.favorite.findUnique({
      where: {
        userId_brawlhallaId: {
          userId: user.id,
          brawlhallaId: req.params.brawlhallaId,
        },
      },
    });

    res.json({ isFavorite: !!favorite });
  } catch (error) {
    console.error('Error checking favorite:', error);
    res.json({ isFavorite: false });
  }
});

module.exports = router;