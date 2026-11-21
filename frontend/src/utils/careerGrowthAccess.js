export function canAccessCareerGrowth(user) {
  const allowedEmail = String(import.meta.env.VITE_ARCHANA_CAREER_EMAIL || "").trim().toLowerCase();
  const userEmail = String(user?.email || "").trim().toLowerCase();
  return user?.role === "admin" || Boolean(allowedEmail && userEmail === allowedEmail);
}
