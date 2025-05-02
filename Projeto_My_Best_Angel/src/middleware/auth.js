const jwt = require('jsonwebtoken');

// Middleware para verificar se o usuário está autenticado
exports.isAuthenticated = (req, res, next) => {
  // Verificar se o usuário está na sessão
  if (req.session.user && req.session.userType) {
    return next();
  }
  
  // Verificar token JWT nos cookies ou no cabeçalho
  const token = req.cookies?.token || req.headers.authorization?.split(' ')[1];
  
  if (!token) {
    req.flash('error', 'Você precisa estar logado para acessar esta página');
    return res.redirect('/auth/login');
  }
  
  try {
    // Verificar token
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'mybestangel_secret');
    
    // Armazenar informações do usuário na sessão
    req.session.user = {
      id: decoded.id,
      name: decoded.name,
      email: decoded.email
    };
    req.session.userType = decoded.userType;
    
    next();
  } catch (error) {
    res.clearCookie('token');
    req.flash('error', 'Sessão expirada. Por favor, faça login novamente.');
    return res.redirect('/auth/login');
  }
};

// Middleware para verificar se o usuário é um Angel
exports.isAngel = (req, res, next) => {
  if (req.session.userType !== 'angel') {
    req.flash('error', 'Acesso restrito a guias turísticos');
    return res.redirect('/');
  }
  next();
};

// Middleware para verificar se o usuário é um Visitor
exports.isVisitor = (req, res, next) => {
  if (req.session.userType !== 'visitor') {
    req.flash('error', 'Acesso restrito a visitantes');
    return res.redirect('/');
  }
  next();
};

// Middleware para verificar se o usuário NÃO está autenticado (para rotas de login/registro)
exports.isNotAuthenticated = (req, res, next) => {
  if (req.session.user) {
    return res.redirect('/');
  }
  next();
};

// Middleware para verificar se um Angel tem permissão para uma operação específica
exports.checkAngelPermission = (req, res, next) => {
  // Verifica se o usuário é um Angel e se o ID do recurso corresponde ao seu ID
  if (req.session.userType === 'angel' && 
      req.session.user.id === parseInt(req.params.angelId || req.body.angelId)) {
    return next();
  }
  
  req.flash('error', 'Você não tem permissão para esta operação');
  return res.redirect('/');
};

// Middleware para verificar se um Visitor tem permissão para uma operação específica
exports.checkVisitorPermission = (req, res, next) => {
  // Verifica se o usuário é um Visitor e se o ID do recurso corresponde ao seu ID
  if (req.session.userType === 'visitor' && 
      req.session.user.id === parseInt(req.params.visitorId || req.body.visitorId)) {
    return next();
  }
  
  req.flash('error', 'Você não tem permissão para esta operação');
  return res.redirect('/');
};