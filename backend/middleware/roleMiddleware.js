function authorizeRoles(...allowedRoles) {
  return function roleGuard(req, res, next) {
    const userRole = String(req.user?.role || "")
      .trim()
      .toLowerCase();
    const normalizedAllowedRoles = allowedRoles.map((role) =>
      String(role).trim().toLowerCase(),
    );

    if (!req.user || !normalizedAllowedRoles.includes(userRole)) {
      return res
        .status(403)
        .json({ message: "You do not have permission for this action." });
    }

    return next();
  };
}

module.exports = { authorizeRoles };
