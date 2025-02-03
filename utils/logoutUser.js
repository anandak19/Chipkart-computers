const logoutUser = (req, res) => {
    return new Promise((resolve, reject) => {
        try {
            // for google users 
            if (req.isAuthenticated && req.isAuthenticated()) {
                req.logout((err) => {
                    if(err){
                        return reject({message: 'Error loging out google user', error:err})
                    }
                })
            }

            // for google users and regular users 
            req.session.destroy((err) => {
                if (err) {
                    return reject({ message: "Error while destorying the session", error: err })
                }
            })

            // clear the session cookie 
            res.clearCookie("connect.sid")
            resolve({ message: "Session destroyed" });

        } catch (error) {
            reject({ message: "An unexpected error occurred", error })
        }
    })
}

module.exports = logoutUser