// passport.js
const passport = require('passport');
const GoogleStrategy = require('passport-google-oauth20').Strategy;
const User = require('./models/User');
const { sendWelcomeEmail } = require('./utils/mailjet');

function upsertFromProfile({ provider, providerId, email, name, emailVerified, avatar }) {
  return async () => {
    // Try to find user by provider ID first
    let user = await User.findOne({ [`${provider}Id`]: providerId });

    // If not found and email exists, link to existing by email
    if (!user && email) {
      user = await User.findOne({ email });
      if (user) {
        user.provider = provider;
        user[`${provider}Id`] = providerId;
        if (name && !user.name) user.name = name;
        if (emailVerified) user.emailVerified = true;
        await user.save();
        return user;
      }
    }

    // Create if still not found
    const isNewUser = !user;
    if (isNewUser) {
      user = await User.create({
        email: email || `${provider}-${providerId}@noemail.local`,
        name: name || provider,
        provider,
        [`${provider}Id`]: providerId,
        emailVerified: !!emailVerified,
        // no passwordHash for social
      });

      // Send welcome email for new users (don't await to avoid blocking)
      if (email) {
        sendWelcomeEmail({
          toEmail: email,
          userName: name || 'there',
        }).catch(error => {
          console.error('Failed to send welcome email:', error);
          // Don't fail the auth flow if email sending fails
        });
      }
    }
    return user;
  };
}

if (process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET) {
  const google = new GoogleStrategy({
    clientID: process.env.GOOGLE_CLIENT_ID,
    clientSecret: process.env.GOOGLE_CLIENT_SECRET,
    callbackURL: process.env.GOOGLE_CALLBACK_URL || '/api/auth/google/callback',
  }, async (accessToken, refreshToken, profile, done) => {
    try {
      const email = profile.emails?.[0]?.value?.toLowerCase();
      const name = profile.displayName || `${profile.name?.givenName || ''} ${profile.name?.familyName || ''}`.trim();
      const providerId = profile.id;
      const getUser = upsertFromProfile({
        provider: 'google',
        providerId,
        email,
        name,
        emailVerified: !!profile.emails?.[0]?.verified,
        avatar: profile.photos?.[0]?.value,
      });
      const user = await getUser();
      return done(null, user);
    } catch (err) {
      return done(err);
    }
  });

  passport.use(google);
} else {
  console.warn('Google OAuth keys not found. Google login will be disabled.');
}


module.exports = passport;
