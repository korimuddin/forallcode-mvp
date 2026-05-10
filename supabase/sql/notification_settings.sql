CREATE TABLE IF NOT EXISTS notification_settings (
  user_id UUID REFERENCES profiles(id) PRIMARY KEY,
  inapp_stars BOOLEAN DEFAULT true,
  inapp_followers BOOLEAN DEFAULT true,
  inapp_comments BOOLEAN DEFAULT true,
  inapp_learn_reminders BOOLEAN DEFAULT true,
  email_digest BOOLEAN DEFAULT true,
  email_followers BOOLEAN DEFAULT false,
  email_marketing BOOLEAN DEFAULT false
);
