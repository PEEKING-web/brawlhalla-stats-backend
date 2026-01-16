const express = require('express');
const router = express.Router();
const axios = require('axios');

const BRAWLHALLA_API_KEY = process.env.BRAWLHALLA_API_KEY;
const BRAWLHALLA_BASE_URL = 'https://api.brawlhalla.com';

// Cache
const cache = new Map();
const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

const getCacheKey = (url) => url;

const getCachedData = (key) => {
  const cached = cache.get(key);
  if (cached && Date.now() - cached.timestamp < CACHE_DURATION) {
    return cached.data;
  }
  cache.delete(key);
  return null;
};

const setCachedData = (key, data) => {
  cache.set(key, {
    data,
    timestamp: Date.now()
  });
};

// Get player stats
router.get('/player/:playerId/stats', async (req, res) => {
  const { playerId } = req.params;
  const cacheKey = getCacheKey(`player/${playerId}/stats`);
  
  const cached = getCachedData(cacheKey);
  if (cached) {
    return res.json(cached);
  }

  try {
    const response = await axios.get(
      `${BRAWLHALLA_BASE_URL}/player/${playerId}/stats`,
      { 
        params: { api_key: BRAWLHALLA_API_KEY },
        timeout: 10000 
      }
    );
    
    setCachedData(cacheKey, response.data);
    res.json(response.data);
  } catch (error) {
    if (error.response?.status === 404) {
      return res.status(404).json({ error: 'Player not found' });
    }
    res.status(500).json({ error: 'Failed to fetch player stats' });
  }
});

// Get player ranked
router.get('/player/:playerId/ranked', async (req, res) => {
  const { playerId } = req.params;
  const cacheKey = getCacheKey(`player/${playerId}/ranked`);
  
  const cached = getCachedData(cacheKey);
  if (cached) {
    return res.json(cached);
  }

  try {
    const response = await axios.get(
      `${BRAWLHALLA_BASE_URL}/player/${playerId}/ranked`,
      { 
        params: { api_key: BRAWLHALLA_API_KEY },
        timeout: 10000 
      }
    );
    
    setCachedData(cacheKey, response.data);
    res.json(response.data);
  } catch (error) {
    if (error.response?.status === 404) {
      return res.status(404).json({ error: 'Ranked data not found' });
    }
    res.status(500).json({ error: 'Failed to fetch ranked data' });
  }
});

// Get leaderboard
router.get('/rankings/:bracket/:region/:page', async (req, res) => {
  const { bracket, region, page } = req.params;
  const cacheKey = getCacheKey(`rankings/${bracket}/${region}/${page}`);
  
  const cached = getCachedData(cacheKey);
  if (cached) {
    return res.json(cached);
  }

  try {
    const response = await axios.get(
      `${BRAWLHALLA_BASE_URL}/rankings/${bracket}/${region}/${page}`,
      { 
        params: { api_key: BRAWLHALLA_API_KEY },
        timeout: 10000 
      }
    );
    
    setCachedData(cacheKey, response.data);
    res.json(response.data);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch leaderboard data' });
  }
});

module.exports = router;