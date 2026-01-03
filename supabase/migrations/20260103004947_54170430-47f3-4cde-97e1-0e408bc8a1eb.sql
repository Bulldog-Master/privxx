-- Create a function to get top referrers for the leaderboard
-- Uses SECURITY DEFINER to bypass RLS and return aggregated public stats
CREATE OR REPLACE FUNCTION public.get_referral_leaderboard(limit_count INT DEFAULT 10)
RETURNS TABLE (
  rank BIGINT,
  display_name TEXT,
  referral_count BIGINT,
  total_coins_earned BIGINT,
  tier_name TEXT
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN QUERY
  WITH referral_stats AS (
    SELECT 
      r.referrer_id,
      COUNT(*)::BIGINT AS ref_count,
      COALESCE(SUM(r.coins_earned), 0)::BIGINT AS coins_earned
    FROM public.referrals r
    WHERE r.status IN ('completed', 'rewarded')
    GROUP BY r.referrer_id
    HAVING COUNT(*) > 0
  ),
  ranked_referrers AS (
    SELECT 
      ROW_NUMBER() OVER (ORDER BY rs.ref_count DESC, rs.coins_earned DESC) AS rank,
      p.display_name,
      rs.ref_count,
      rs.coins_earned,
      CASE 
        WHEN rs.ref_count >= 100 THEN 'Diamond'
        WHEN rs.ref_count >= 50 THEN 'Platinum'
        WHEN rs.ref_count >= 25 THEN 'Gold'
        WHEN rs.ref_count >= 10 THEN 'Silver'
        WHEN rs.ref_count >= 5 THEN 'Bronze'
        ELSE 'Starter'
      END AS tier
    FROM referral_stats rs
    JOIN public.profiles p ON p.user_id = rs.referrer_id
  )
  SELECT 
    rr.rank,
    COALESCE(rr.display_name, 'Anonymous') AS display_name,
    rr.ref_count AS referral_count,
    rr.coins_earned AS total_coins_earned,
    rr.tier AS tier_name
  FROM ranked_referrers rr
  ORDER BY rr.rank
  LIMIT limit_count;
END;
$$;

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION public.get_referral_leaderboard(INT) TO authenticated;

-- Create a function to get the current user's rank
CREATE OR REPLACE FUNCTION public.get_my_referral_rank()
RETURNS TABLE (
  rank BIGINT,
  referral_count BIGINT,
  total_coins_earned BIGINT,
  tier_name TEXT
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  current_user_id UUID;
BEGIN
  current_user_id := auth.uid();
  
  IF current_user_id IS NULL THEN
    RETURN;
  END IF;
  
  RETURN QUERY
  WITH referral_stats AS (
    SELECT 
      r.referrer_id,
      COUNT(*)::BIGINT AS ref_count,
      COALESCE(SUM(r.coins_earned), 0)::BIGINT AS coins_earned
    FROM public.referrals r
    WHERE r.status IN ('completed', 'rewarded')
    GROUP BY r.referrer_id
  ),
  ranked_referrers AS (
    SELECT 
      rs.referrer_id,
      ROW_NUMBER() OVER (ORDER BY rs.ref_count DESC, rs.coins_earned DESC) AS user_rank,
      rs.ref_count,
      rs.coins_earned,
      CASE 
        WHEN rs.ref_count >= 100 THEN 'Diamond'
        WHEN rs.ref_count >= 50 THEN 'Platinum'
        WHEN rs.ref_count >= 25 THEN 'Gold'
        WHEN rs.ref_count >= 10 THEN 'Silver'
        WHEN rs.ref_count >= 5 THEN 'Bronze'
        ELSE 'Starter'
      END AS tier
    FROM referral_stats rs
  )
  SELECT 
    rr.user_rank AS rank,
    rr.ref_count AS referral_count,
    rr.coins_earned AS total_coins_earned,
    rr.tier AS tier_name
  FROM ranked_referrers rr
  WHERE rr.referrer_id = current_user_id;
END;
$$;

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION public.get_my_referral_rank() TO authenticated;