const { db } = require('../utils/database');
const moment = require('moment');

// Mostrar detalhe público de um tour
exports.showPublicTour = (req, res) => {
  const tourId = req.params.id;
  
  // Buscar detalhes do tour
  db.get(`SELECT t.*, a.name as angel_name, a.rating as angel_rating 
          FROM tours t 
          JOIN angels a ON t.angel_id = a.id 
          WHERE t.id = ?`, 
          [tourId], (err, tour) => {
    if (err || !tour) {
      req.flash('error', 'Tour não encontrado');
      return res.redirect('/');
    }
    
    // Buscar reviews do Angel
    db.all(`SELECT r.*, v.name as visitor_name 
            FROM reviews r 
            JOIN visitors v ON r.visitor_id = v.id 
            WHERE r.angel_id = ? 
            ORDER BY r.created_at DESC LIMIT 5`, 
            [tour.angel_id], (err, reviews) => {
      if (err) {
        console.error('Erro ao buscar avaliações:', err.message);
        reviews = [];
      }
      
      // Formatar data do tour
      tour.formattedDate = moment(tour.date).format('DD/MM/YYYY HH:mm');
      tour.isPast = moment(tour.date).isBefore(moment());
      tour.isFullyBooked = tour.current_participants >= tour.max_participants;
      
      res.render('pages/public-tour-details', {
        title: `Tour: ${tour.title} - MyBestAngel`,
        description: `Detalhes do tour ${tour.title} com o guia ${tour.angel_name}`,
        tour: tour,
        reviews: reviews,
        isAuthenticated: req.session.user ? true : false,
        userType: req.session.userType,
        errors: req.flash('error'),
        success: req.flash('success')
      });
    });
  });
};

// Buscar tours com base em critérios
exports.searchTours = (req, res) => {
  const { search, date, location } = req.query;
  
  // Construir consulta base
  let query = `SELECT t.*, a.name as angel_name, a.rating as angel_rating 
              FROM tours t 
              JOIN angels a ON t.angel_id = a.id 
              WHERE t.date > datetime('now')`;
  
  const params = [];
  
  // Adicionar critérios de busca
  if (search) {
    query += ` AND (t.title LIKE ? OR t.description LIKE ? OR t.location LIKE ?)`;
    params.push(`%${search}%`, `%${search}%`, `%${search}%`);
  }
  
  if (date) {
    query += ` AND date(t.date) = ?`;
    params.push(date);
  }
  
  if (location) {
    query += ` AND t.location LIKE ?`;
    params.push(`%${location}%`);
  }
  
  // Ordenar por data
  query += ` ORDER BY t.date ASC`;
  
  // Executar a consulta
  db.all(query, params, (err, tours) => {
    if (err) {
      console.error('Erro ao buscar tours:', err.message);
      req.flash('error', 'Erro ao buscar tours');
      return res.redirect('/');
    }
    
    // Formatar datas dos tours
    tours.forEach(tour => {
      tour.formattedDate = moment(tour.date).format('DD/MM/YYYY HH:mm');
      tour.relativeDate = moment(tour.date).fromNow();
      tour.isFullyBooked = tour.current_participants >= tour.max_participants;
    });
    
    // Buscar localizações disponíveis para filtros
    db.all(`SELECT DISTINCT location FROM tours 
            WHERE date > datetime('now') 
            ORDER BY location ASC`, [], (err, locations) => {
      if (err) {
        console.error('Erro ao buscar localizações:', err.message);
        locations = [];
      }
      
      res.render('pages/search-tours', {
        title: 'Buscar Tours - MyBestAngel',
        description: 'Encontre tours em Belém do Pará durante a COP30',
        tours: tours,
        locations: locations,
        searchParams: {
          search: search || '',
          date: date || '',
          location: location || ''
        },
        errors: req.flash('error'),
        success: req.flash('success')
      });
    });
  });
};

// Listar tours em destaque na homepage
exports.getFeaturedTours = (callback) => {
  // Buscar os próximos 6 tours mais próximos
  db.all(`SELECT t.*, a.name as angel_name, a.rating as angel_rating 
          FROM tours t 
          JOIN angels a ON t.angel_id = a.id 
          WHERE t.date > datetime('now') 
          ORDER BY t.date ASC 
          LIMIT 6`, [], (err, tours) => {
    if (err) {
      console.error('Erro ao buscar tours em destaque:', err.message);
      return callback([]);
    }
    
    // Formatar datas dos tours
    tours.forEach(tour => {
      tour.formattedDate = moment(tour.date).format('DD/MM/YYYY HH:mm');
      tour.relativeDate = moment(tour.date).fromNow();
      tour.isFullyBooked = tour.current_participants >= tour.max_participants;
    });
    
    return callback(tours);
  });
};

// Listar guias em destaque na homepage
exports.getFeaturedAngels = (callback) => {
  // Buscar os 4 Angels com melhores avaliações
  db.all(`SELECT a.*, 
          (SELECT COUNT(*) FROM visitors v WHERE v.angel_id = a.id) as visitors_count,
          (SELECT COUNT(*) FROM tours t WHERE t.angel_id = a.id AND t.date > datetime('now')) as upcoming_tours_count
          FROM angels a 
          ORDER BY a.rating DESC, a.reviews_count DESC 
          LIMIT 4`, [], (err, angels) => {
    if (err) {
      console.error('Erro ao buscar guias em destaque:', err.message);
      return callback([]);
    }
    
    return callback(angels);
  });
};