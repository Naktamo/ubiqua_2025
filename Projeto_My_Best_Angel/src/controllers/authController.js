const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const { db } = require('../utils/database');

// Função para gerar token JWT
const generateToken = (user, userType) => {
  return jwt.sign(
    { id: user.id, email: user.email, name: user.name, userType },
    process.env.JWT_SECRET || 'mybestangel_secret',
    { expiresIn: '24h' }
  );
};

// Mostrar página de login
exports.showLoginPage = (req, res) => {
  res.render('pages/login', { 
    title: 'Login - MyBestAngel',
    description: 'Faça login na sua conta MyBestAngel',
    errors: req.flash('error'),
    success: req.flash('success')
  });
};

// Mostrar página de cadastro
exports.showRegisterPage = (req, res) => {
  // Buscar todos os Angels disponíveis para afiliação
  db.all(`SELECT id, name, specialty, languages, bio FROM angels 
          WHERE (SELECT COUNT(*) FROM visitors WHERE angel_id = angels.id) < 3`, 
          [], (err, angels) => {
    if (err) {
      req.flash('error', 'Erro ao carregar guias disponíveis');
      return res.redirect('/auth/login');
    }
    
    res.render('pages/register', { 
      title: 'Cadastro - MyBestAngel',
      description: 'Crie sua conta no MyBestAngel',
      angels: angels,
      userType: req.query.type || 'visitor', // Tipo padrão é visitor
      errors: req.flash('error'),
      success: req.flash('success')
    });
  });
};

// Processar login
exports.login = (req, res) => {
  const { email, password, userType } = req.body;
  
  if (!email || !password || !userType) {
    req.flash('error', 'Todos os campos são obrigatórios');
    return res.redirect('/auth/login');
  }
  
  // Validar tipo de usuário
  if (userType !== 'angel' && userType !== 'visitor') {
    req.flash('error', 'Tipo de usuário inválido');
    return res.redirect('/auth/login');
  }
  
  // Definir a tabela baseada no tipo de usuário
  const table = userType === 'angel' ? 'angels' : 'visitors';
  
  // Buscar usuário no banco de dados
  db.get(`SELECT * FROM ${table} WHERE email = ?`, [email], (err, user) => {
    if (err) {
      console.error('Erro ao buscar usuário:', err.message);
      req.flash('error', 'Erro ao realizar login');
      return res.redirect('/auth/login');
    }
    
    if (!user) {
      req.flash('error', 'Email ou senha incorretos');
      return res.redirect('/auth/login');
    }
    
    // Comparar senha
    bcrypt.compare(password, user.password, (err, isMatch) => {
      if (err) {
        console.error('Erro ao comparar senha:', err.message);
        req.flash('error', 'Erro ao realizar login');
        return res.redirect('/auth/login');
      }
      
      if (!isMatch) {
        req.flash('error', 'Email ou senha incorretos');
        return res.redirect('/auth/login');
      }
      
      // Senha correta, criar sessão
      req.session.user = {
        id: user.id,
        name: user.name,
        email: user.email
      };
      req.session.userType = userType;
      
      // Gerar token JWT
      const token = generateToken(user, userType);
      
      // Definir cookie com o token
      res.cookie('token', token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        maxAge: 24 * 60 * 60 * 1000 // 1 dia
      });
      
      // Redirecionar para o dashboard apropriado
      req.flash('success', 'Login realizado com sucesso!');
      if (userType === 'angel') {
        return res.redirect('/angel/dashboard');
      } else {
        return res.redirect('/visitor/dashboard');
      }
    });
  });
};

// Processar registro de Angel
exports.registerAngel = (req, res) => {
  const { name, email, password, confirmPassword, phone, bio, languages, specialty } = req.body;
  
  // Validar campos obrigatórios
  if (!name || !email || !password || !confirmPassword || !phone) {
    req.flash('error', 'Todos os campos marcados são obrigatórios');
    return res.redirect('/auth/register?type=angel');
  }
  
  // Validar se as senhas coincidem
  if (password !== confirmPassword) {
    req.flash('error', 'As senhas não coincidem');
    return res.redirect('/auth/register?type=angel');
  }
  
  // Verificar se o email já está em uso
  db.get('SELECT id FROM angels WHERE email = ?', [email], (err, angel) => {
    if (err) {
      console.error('Erro ao verificar email:', err.message);
      req.flash('error', 'Erro ao realizar cadastro');
      return res.redirect('/auth/register?type=angel');
    }
    
    if (angel) {
      req.flash('error', 'Este email já está em uso');
      return res.redirect('/auth/register?type=angel');
    }
    
    // Hash da senha
    bcrypt.hash(password, 10, (err, hash) => {
      if (err) {
        console.error('Erro ao gerar hash da senha:', err.message);
        req.flash('error', 'Erro ao realizar cadastro');
        return res.redirect('/auth/register?type=angel');
      }
      
      // Inserir novo Angel no banco de dados
      db.run(`INSERT INTO angels (name, email, password, phone, bio, languages, specialty) 
              VALUES (?, ?, ?, ?, ?, ?, ?)`, 
              [name, email, hash, phone, bio || '', languages || '', specialty || ''], 
              function(err) {
        if (err) {
          console.error('Erro ao inserir Angel:', err.message);
          req.flash('error', 'Erro ao realizar cadastro');
          return res.redirect('/auth/register?type=angel');
        }
        
        const angelId = this.lastID;
        
        // Login automático após cadastro
        req.session.user = {
          id: angelId,
          name: name,
          email: email
        };
        req.session.userType = 'angel';
        
        // Gerar token JWT
        const token = generateToken({ id: angelId, name, email }, 'angel');
        
        // Definir cookie com o token
        res.cookie('token', token, {
          httpOnly: true,
          secure: process.env.NODE_ENV === 'production',
          maxAge: 24 * 60 * 60 * 1000 // 1 dia
        });
        
        req.flash('success', 'Cadastro realizado com sucesso!');
        return res.redirect('/angel/dashboard');
      });
    });
  });
};

// Processar registro de Visitor
exports.registerVisitor = (req, res) => {
  const { name, email, password, confirmPassword, phone, nationality, languagePreference, angelId } = req.body;
  
  // Validar campos obrigatórios
  if (!name || !email || !password || !confirmPassword || !angelId) {
    req.flash('error', 'Todos os campos marcados são obrigatórios');
    return res.redirect('/auth/register?type=visitor');
  }
  
  // Validar se as senhas coincidem
  if (password !== confirmPassword) {
    req.flash('error', 'As senhas não coincidem');
    return res.redirect('/auth/register?type=visitor');
  }
  
  // Verificar se o email já está em uso
  db.get('SELECT id FROM visitors WHERE email = ?', [email], (err, visitor) => {
    if (err) {
      console.error('Erro ao verificar email:', err.message);
      req.flash('error', 'Erro ao realizar cadastro');
      return res.redirect('/auth/register?type=visitor');
    }
    
    if (visitor) {
      req.flash('error', 'Este email já está em uso');
      return res.redirect('/auth/register?type=visitor');
    }
    
    // Verificar se o Angel existe e tem vagas disponíveis
    db.get(`SELECT id FROM angels WHERE id = ? AND 
            (SELECT COUNT(*) FROM visitors WHERE angel_id = ?) < 3`, 
            [angelId, angelId], (err, angel) => {
      if (err) {
        console.error('Erro ao verificar Angel:', err.message);
        req.flash('error', 'Erro ao realizar cadastro');
        return res.redirect('/auth/register?type=visitor');
      }
      
      if (!angel) {
        req.flash('error', 'O guia selecionado não existe ou não tem vagas disponíveis');
        return res.redirect('/auth/register?type=visitor');
      }
      
      // Hash da senha
      bcrypt.hash(password, 10, (err, hash) => {
        if (err) {
          console.error('Erro ao gerar hash da senha:', err.message);
          req.flash('error', 'Erro ao realizar cadastro');
          return res.redirect('/auth/register?type=visitor');
        }
        
        // Inserir novo Visitor no banco de dados
        db.run(`INSERT INTO visitors (angel_id, name, email, password, phone, nationality, language_preference) 
                VALUES (?, ?, ?, ?, ?, ?, ?)`, 
                [angelId, name, email, hash, phone || '', nationality || '', languagePreference || ''], 
                function(err) {
          if (err) {
            console.error('Erro ao inserir Visitor:', err.message);
            req.flash('error', 'Erro ao realizar cadastro');
            return res.redirect('/auth/register?type=visitor');
          }
          
          const visitorId = this.lastID;
          
          // Login automático após cadastro
          req.session.user = {
            id: visitorId,
            name: name,
            email: email
          };
          req.session.userType = 'visitor';
          
          // Gerar token JWT
          const token = generateToken({ id: visitorId, name, email }, 'visitor');
          
          // Definir cookie com o token
          res.cookie('token', token, {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            maxAge: 24 * 60 * 60 * 1000 // 1 dia
          });
          
          req.flash('success', 'Cadastro realizado com sucesso!');
          return res.redirect('/visitor/dashboard');
        });
      });
    });
  });
};

// Processar logout
exports.logout = (req, res) => {
  // Limpar sessão
  req.session.destroy();
  
  // Limpar cookie do token
  res.clearCookie('token');
  
  return res.redirect('/');
};