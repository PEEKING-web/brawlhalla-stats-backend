const passport = require('passport');
const SteamStrategy = require('passport-steam').Strategy;

passport.serializeUser((user, done) => {
  done(null, user);
});

passport.deserializeUser((obj, done) => {
  done(null, obj);
});

passport.use(new SteamStrategy({
    returnURL: `${process.env.BACKEND_URL}/auth/steam/return`,
    realm: process.env.BACKEND_URL,
    apiKey: process.env.STEAM_API_KEY
  },
  function(identifier, profile, done) {
    // Extract Steam ID from identifier
    const steamId = identifier.split('/').pop();
    
    profile.steamId = steamId;
    return done(null, profile);
  }
));

module.exports = passport;