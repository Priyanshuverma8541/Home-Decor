export function canAccessCareerGrowth(user) {
  const name = String(user?.fullName || "").trim().replace(/\s+/g, " ").toLowerCase();
  return user?.role === "admin" || name === "archana singh";
}
