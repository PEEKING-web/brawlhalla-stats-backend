const express = require('express');
const router = express.Router();
const passport = require('../config/steam');
const axios = require('axios');
const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

// Steam login
router.get('/steam',
  passport.authenticate('steam', { failureRedirect: '/' }),
  (req, res) => {
    res.redirect('/');
  }
);

// Steam return callback - SAVE USER TO DB
router.get('/steam/return',
  passport.authenticate('steam', { failureRedirect: process.env.CLIENT_URL }),
  async (req, res) => {
    try {
      // Save or update user in database
      await prisma.user.upsert({
        where: { steamId: req.user.steamId },
        update: {
          displayName: req.user.displayName,
          avatar: req.user.photos[2]?.value || req.user.photos[0]?.value,
        },
        create: {
          steamId: req.user.steamId,
          displayName: req.user.displayName,
          avatar: req.user.photos[2]?.value || req.user.photos[0]?.value,
        },
      });
    } catch (error) {
      console.error('Error saving user:', error);
    }
    
    res.redirect(`${process.env.CLIENT_URL}/auth/success`);
  }
);

// Get current user
router.get('/user', async (req, res) => {
  if (req.isAuthenticated()) {
    try {
      const user = await prisma.user.findUnique({
        where: { steamId: req.user.steamId },
      });

      res.json({
        authenticated: true,
        steamId: req.user.steamId,
        displayName: req.user.displayName,
        avatar: req.user.photos[2]?.value || req.user.photos[0]?.value,
        brawlhallaId: user?.brawlhallaId || null,
      });
    } catch (error) {
      console.error('Error fetching user:', error);
      res.json({ authenticated: false });
    }
  } else {
    res.json({ authenticated: false });
  }
});

// Link Brawlhalla account
router.post('/link-brawlhalla', async (req, res) => {
  if (!req.isAuthenticated()) {
    return res.status(401).json({ error: 'Not authenticated' });
  }

  const { brawlhallaId } = req.body;
  
  if (!brawlhallaId) {
    return res.status(400).json({ error: 'Brawlhalla ID required' });
  }

  try {
    // Verify the Brawlhalla ID exists
    const response = await axios.get(
      `https://api.brawlhalla.com/player/${brawlhallaId}/stats`,
      { params: { api_key: process.env.BRAWLHALLA_API_KEY } }
    );

    if (response.data) {
      // Update user in database
      await prisma.user.update({
        where: { steamId: req.user.steamId },
        data: { brawlhallaId },
      });
      
      res.json({ 
        success: true, 
        message: 'Brawlhalla account linked successfully',
        brawlhallaId: brawlhallaId
      });
    }
  } catch (error) {
    res.status(404).json({ error: 'Brawlhalla player not found' });
  }
});

// Unlink Brawlhalla account
router.post('/unlink-brawlhalla', async (req, res) => {
  if (!req.isAuthenticated()) {
    return res.status(401).json({ error: 'Not authenticated' });
  }

  try {
    await prisma.user.update({
      where: { steamId: req.user.steamId },
      data: { brawlhallaId: null },
    });
    
    res.json({ success: true, message: 'Brawlhalla account unlinked' });
  } catch (error) {
    res.status(500).json({ error: 'Failed to unlink account' });
  }
});

// Logout
router.get('/logout', (req, res) => {
  req.logout((err) => {
    if (err) {
      return res.status(500).json({ error: 'Logout failed' });
    }
    res.json({ success: true, message: 'Logged out successfully' });
  });
});

module.exports = router;