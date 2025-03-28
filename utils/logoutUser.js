const logoutUser = (req, res) => {
  return new Promise((resolve, reject) => {
    try {
        console.log(req.cookies)
      // Handle logout for Google-authenticated users
      if (req.isAuthenticated && req.isAuthenticated()) {
        req.logout((err) => {
          if (err) {
            return reject({
              message: "Error logging out Google user",
              error: err,
            });
          }

          req.session.destroy((err) => {
            if (err) {
              return reject({
                message: "Error destroying the session",
                error: err,
              });
            }

            if (req.cookies[req.sessionID]) {
              res.clearCookie(req.sessionID);
            }

            resolve({ message: "Session destroyed successfully." });
          });
        });
      } else {
        // Regular user logout (without Google)
        req.session.destroy((err) => {
          if (err) {
            return reject({
              message: "Error destroying the session",
              error: err,
            });
          }

          if (req.cookies[req.sessionID]) {
            res.clearCookie(req.sessionID);
          }

          resolve({ message: "Session destroyed successfully." });
        });
      }
    } catch (error) {
      reject({ message: "An unexpected error occurred", error });
    }
  });
};

module.exports = logoutUser;
