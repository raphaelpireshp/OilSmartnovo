function apiNotFound(req, res, next) {
    if (req.path.startsWith('/api')) {
        return res.status(404).json({
            success: false,
            message: 'Rota não encontrada'
        });
    }

    next();
}

module.exports = apiNotFound;
