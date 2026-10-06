const buckets = new Map();

function publicRateLimit({ windowMs = 15 * 60 * 1000, max = 12, message = "Too many requests. Please wait a little and try again." } = {}) {
  return (req, res, next) => {
    const now = Date.now();
    const key = String(req.ip || req.socket?.remoteAddress || "unknown").slice(0, 100);
    let bucket = buckets.get(key);
    if (!bucket || bucket.resetAt <= now) bucket = { count: 0, resetAt: now + windowMs };
    bucket.count += 1;
    buckets.set(key, bucket);
    if (buckets.size > 10000) for (const [ip, entry] of buckets) if (entry.resetAt <= now) buckets.delete(ip);
    res.set("RateLimit-Limit", String(max));
    res.set("RateLimit-Remaining", String(Math.max(0, max - bucket.count)));
    res.set("RateLimit-Reset", String(Math.ceil(bucket.resetAt / 1000)));
    if (bucket.count > max) return res.status(429).json({ success: false, message });
    next();
  };
}

module.exports = publicRateLimit;
