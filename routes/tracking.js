const express = require('express');
const router = express.Router();
const { PrismaClient } = require('@prisma/client');
const axios = require('axios');

const prisma = new PrismaClient();

// Get all tracked players for user
router.get('/', async (req, res) => {
  if (!req.isAuthenticated()) {
    return res.status(401).json({ error: 'Not authenticated' });
  }

  try {
    const user = await prisma.user.findUnique({
      where: { steamId: req.user.steamId },
      include: {
        trackedPlayers: {
          include: {
            rankHistory: {
              orderBy: { recordedAt: 'desc' },
              take: 10,
            },
          },
          orderBy: { createdAt: 'desc' },
        },
      },
    });

    res.json(user?.trackedPlayers || []);
  } catch (error) {
    console.error('Error fetching tracked players:', error);
    res.status(500).json({ error: 'Failed to fetch tracked players' });
  }
});

// Helper function to extract rank data
function extractRankData(data) {
  if (!data) {
    console.log('❌ No data received');
    return { rank: null, rating: null };
  }

  // Use region_rank
  const rank = data.region_rank || data.global_rank || null;
  const rating = data.rating || null;

  if (rating) {
    console.log(`Found rank: #${rank || 'Unranked'}, rating: ${rating}`);
    return { rank, rating };
  }

  console.log('No ranked data found');
  return { rank: null, rating: null };
}

// Track a player
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

    let currentRank = null;
    let currentRating = null;

    try {
      console.log(`\n Fetching rank for player ${brawlhallaId}...`);
      
      const rankedData = await axios.get(
        `https://api.brawlhalla.com/player/${brawlhallaId}/ranked`,
        { 
          params: { api_key: process.env.BRAWLHALLA_API_KEY },
          timeout: 10000
        }
      );

      const extracted = extractRankData(rankedData.data);
      currentRank = extracted.rank;
      currentRating = extracted.rating;

    } catch (err) {
      console.error('API Error:', err.message);
    }

    const tracked = await prisma.trackedPlayer.create({
      data: {
        userId: user.id,
        brawlhallaId,
        playerName,
        currentRank,
        currentRating,
      },
    });

    if (currentRating) {
      await prisma.rankHistory.create({
        data: {
          trackedPlayerId: tracked.id,
          rank: currentRank || 0,
          rating: currentRating,
        },
      });
      console.log('Created rank history');
    }

    res.json({ 
      success: true, 
      tracked,
      message: currentRating 
        ? 'Player tracked with rank data' 
        : 'Player tracked - click refresh to load rank'
    });
  } catch (error) {
    if (error.code === 'P2002') {
      return res.status(400).json({ error: 'Player already tracked' });
    }
    console.error('Error tracking player:', error);
    res.status(500).json({ error: 'Failed to track player' });
  }
});

// Untrack a player
router.delete('/:brawlhallaId', async (req, res) => {
  if (!req.isAuthenticated()) {
    return res.status(401).json({ error: 'Not authenticated' });
  }

  try {
    const user = await prisma.user.findUnique({
      where: { steamId: req.user.steamId },
    });

    await prisma.trackedPlayer.delete({
      where: {
        userId_brawlhallaId: {
          userId: user.id,
          brawlhallaId: req.params.brawlhallaId,
        },
      },
    });

    res.json({ success: true, message: 'Player untracked' });
  } catch (error) {
    console.error('Error untracking player:', error);
    res.status(500).json({ error: 'Failed to untrack player' });
  }
});

// Update rank for tracked player (manual refresh)
router.post('/:brawlhallaId/update', async (req, res) => {
  if (!req.isAuthenticated()) {
    return res.status(401).json({ error: 'Not authenticated' });
  }

  try {
    const user = await prisma.user.findUnique({
      where: { steamId: req.user.steamId },
    });

    const tracked = await prisma.trackedPlayer.findUnique({
      where: {
        userId_brawlhallaId: {
          userId: user.id,
          brawlhallaId: req.params.brawlhallaId,
        },
      },
    });

    if (!tracked) {
      return res.status(404).json({ error: 'Player not tracked' });
    }

    console.log(`\n Refreshing rank for ${req.params.brawlhallaId}...`);

    const rankedData = await axios.get(
      `https://api.brawlhalla.com/player/${req.params.brawlhallaId}/ranked`,
      { 
        params: { api_key: process.env.BRAWLHALLA_API_KEY },
        timeout: 10000
      }
    );

    const extracted = extractRankData(rankedData.data);
    const newRank = extracted.rank;
    const newRating = extracted.rating;

    await prisma.trackedPlayer.update({
      where: { id: tracked.id },
      data: {
        currentRank: newRank,
        currentRating: newRating,
        lastChecked: new Date(),
      },
    });

    const hasChanged = newRank !== tracked.currentRank || newRating !== tracked.currentRating;
    const isFirstValidData = (!tracked.currentRating) && (newRating);
    
    if ((hasChanged || isFirstValidData) && newRating) {
      await prisma.rankHistory.create({
        data: {
          trackedPlayerId: tracked.id,
          rank: newRank || 0,
          rating: newRating,
        },
      });
      console.log('Rank history updated');
    }

    res.json({
      success: true,
      rank: newRank,
      rating: newRating,
      changed: hasChanged,
      message: newRating ? 'Rank updated' : 'No ranked data available'
    });
  } catch (error) {
    console.error('Error updating rank:', error);
    res.status(500).json({ error: 'Failed to update rank' });
  }
});

// Check if player is tracked
router.get('/check/:brawlhallaId', async (req, res) => {
  if (!req.isAuthenticated()) {
    return res.json({ isTracked: false });
  }

  try {
    const user = await prisma.user.findUnique({
      where: { steamId: req.user.steamId },
    });

    const tracked = await prisma.trackedPlayer.findUnique({
      where: {
        userId_brawlhallaId: {
          userId: user.id,
          brawlhallaId: req.params.brawlhallaId,
        },
      },
    });

    res.json({ isTracked: !!tracked });
  } catch (error) {
    console.error('Error checking tracked:', error);
    res.json({ isTracked: false });
  }
});

module.exports = router;