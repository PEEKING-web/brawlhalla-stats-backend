const passport = require('passport');
const SteamStrategy = require('passport-steam').Strategy;
const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

// Serialize ONLY DB user ID
passport.serializeUser((user, done) => {
  done(null, user.id);
});

// Rehydrate user from DB on every request
passport.deserializeUser(async (id, done) => {
  try {
    const user = await prisma.user.findUnique({
      where: { id }
    });
    done(null, user);
  } catch (err) {
    done(err, null);
  }
});

passport.use(
  new SteamStrategy(
    {
      returnURL: `${process.env.CLIENT_URL}/auth/steam/return`,
      realm: process.env.CLIENT_URL,
      apiKey: process.env.STEAM_API_KEY
    },
    async (identifier, profile, done) => {
      try {
        const steamId = identifier.split('/').pop();

        // UPSERT user in DB
        const user = await prisma.user.upsert({
          where: { steamId },
          update: {
            displayName: profile.displayName,
            avatar: profile.photos?.[0]?.value || null
          },
          create: {
            steamId,
            displayName: profile.displayName,
            avatar: profile.photos?.[0]?.value || null
          }
        });

        // pass DB user, NOT Steam profile
        return done(null, user);
      } catch (err) {
        return done(err, null);
      }
    }
  )
);

module.exports = passport;
