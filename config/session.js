module.exports = {
    secret: process.env.SESSION_SECRET || 'oilsmart_secret_key_2024',
    resave: false,
    saveUninitialized: false,
    cookie: {
        secure: false,
        maxAge: 24 * 60 * 60 * 1000
    }
};
