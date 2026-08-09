-- Account consent tracking: which policy version a user agreed to on signup.
ALTER TABLE "Profile" ADD COLUMN "consentAccepted" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "Profile" ADD COLUMN "consentVersion" TEXT NOT NULL DEFAULT 'v1';
