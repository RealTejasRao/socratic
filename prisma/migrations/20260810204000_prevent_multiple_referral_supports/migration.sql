CREATE OR REPLACE FUNCTION prevent_multiple_referral_supports()
RETURNS trigger AS $$
BEGIN
  IF EXISTS (
    SELECT 1
    FROM "ReferralCodeSubmission"
    WHERE "userId" = NEW."userId"
  ) THEN
    RAISE EXCEPTION 'User has already supported an ambassador';
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS "ReferralCodeSubmission_prevent_multiple_supports" ON "ReferralCodeSubmission";

CREATE TRIGGER "ReferralCodeSubmission_prevent_multiple_supports"
BEFORE INSERT ON "ReferralCodeSubmission"
FOR EACH ROW
EXECUTE FUNCTION prevent_multiple_referral_supports();
