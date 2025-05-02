// Importação de módulos necessários
require('dotenv').config();
const express = require('express');
const path = require('path');
const bodyParser = require('body-parser');
const session = require('express-session');
const methodOverride = require('method-override');

// Inicialização do Express
const app = express();
const PORT = process.env.PORT || 3000;

// Configuração do EJS como template engine
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

// Middlewares
app.use(express.static(path.join(__dirname, 'public')));
app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());
app.use(methodOverride('_method'));
app.use(session({
  secret: process.env.SESSION_SECRET || 'mybestangel_secret',
  resave: false,
  saveUninitialized: true,
  cookie: { 
    secure: process.env.NODE_ENV === 'production',
    maxAge: 24 * 60 * 60 * 1000 // 1 dia
  }
}));

// Inicialização do banco de dados
const initDb = require('./src/utils/database');
initDb();

// Rotas
const authRoutes = require('./src/routes/auth');
const angelRoutes = require('./src/routes/angel');
const visitorRoutes = require('./src/routes/visitor');
const tourRoutes = require('./src/routes/tour');

// Middleware para disponibilizar variáveis globais para as views
app.use((req, res, next) => {
  res.locals.user = req.session.user || null;
  res.locals.userType = req.session.userType || null;
  res.locals.errors = [];
  res.locals.success = [];
  next();
});

// Configuração das rotas
app.use('/auth', authRoutes);
app.use('/angel', angelRoutes);
app.use('/visitor', visitorRoutes);
app.use('/tour', tourRoutes);

// Rota para a página inicial
app.get('/', (req, res) => {
  res.render('pages/home', { 
    title: 'MyBestAngel - Seu guia turístico em Belém durante a COP30',
    description: 'Descubra Belém do Pará durante a COP30 com os melhores guias turísticos locais.'
  });
});

// Rota para a página de contatos de emergência
app.get('/emergency', (req, res) => {
  res.render('pages/emergency', { 
    title: 'Contatos de Emergência - MyBestAngel',
    description: 'Contatos de emergência em Belém do Pará'
  });
});

// Rota para a página de SAC
app.get('/sac', (req, res) => {
  res.render('pages/sac', { 
    title: 'SAC - MyBestAngel',
    description: 'Serviço de Atendimento ao Cliente'
  });
});

// Rota para a página de mapa
app.get('/map', (req, res) => {
  res.render('pages/map', { 
    title: 'Mapa de Belém - MyBestAngel',
    description: 'Mapa de Belém do Pará com pontos turísticos'
  });
});

// Middleware para tratar 404
app.use((req, res) => {
  res.status(404).render('pages/404', { 
    title: 'Página não encontrada - MyBestAngel',
    description: 'A página que você está procurando não existe.'
  });
});

// Middleware para tratar erros
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).render('pages/error', { 
    title: 'Erro - MyBestAngel',
    description: 'Ocorreu um erro no servidor.',
    error: process.env.NODE_ENV === 'development' ? err : {}
  });
});

// Inicialização do servidor
app.listen(PORT, () => {
  console.log(`Servidor rodando na porta ${PORT}`);
  console.log(`Acesse: http://localhost:${PORT}`);
});