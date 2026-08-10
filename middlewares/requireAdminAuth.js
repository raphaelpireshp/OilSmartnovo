function requireAdminAuth(req, res, next) {
    if (!req.session.admin) {
        return res.status(401).json({
            success: false,
            message: 'Acesso não autorizado'
        });
    }

    next();
}

module.exports = requireAdminAuth;
