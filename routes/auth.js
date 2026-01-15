const express = require('express');
const router = express.Router();
const passport = require('../config/steam');
const axios = require('axios');
const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

// Steam login
router.get('/steam',
  passport.authenticate('steam', { failureRedirect: '/' })
);

// Steam return callback - FIXED VERSION
router.get('/steam/return',
  passport.authenticate('steam', { failureRedirect: process.env.CLIENT_URL }),
  async (req, res) => {
    try {
      // Explicitly save session before redirecting
      req.session.save((err) => {
        if (err) {
          console.error('Session save error:', err);
          return res.redirect(process.env.CLIENT_URL);
        }
        
        console.log('✅ Session saved, user:', req.user);
        res.redirect(`${process.env.CLIENT_URL}/auth/success`);
      });
    } catch (error) {
      console.error('Error in steam return:', error);
      res.redirect(process.env.CLIENT_URL);
    }
  }
);

// Get current user
router.get('/user', async (req, res) => {
  console.log('📍 /auth/user called');
  console.log('Session ID:', req.sessionID);
  console.log('Is Authenticated:', req.isAuthenticated());
  console.log('Session:', req.session);
  console.log('User:', req.user);

  if (req.isAuthenticated()) {
    try {
      const user = await prisma.user.findUnique({
        where: { steamId: req.user.steamId },
      });

      res.json({
        authenticated: true,
        steamId: req.user.steamId,
        displayName: req.user.displayName,
        avatar: req.user.avatar,
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
    const response = await axios.get(
      `https://api.brawlhalla.com/player/${brawlhallaId}/stats`,
      { params: { api_key: process.env.BRAWLHALLA_API_KEY } }
    );

    if (response.data) {
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
    req.session.destroy();
    res.json({ success: true, message: 'Logged out successfully' });
  });
});

module.exports = router;