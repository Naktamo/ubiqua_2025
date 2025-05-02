const { db } = require('../utils/database');
const moment = require('moment');

// Exibir dashboard do Visitor
exports.dashboard = (req, res) => {
  const visitorId = req.session.user.id;
  
  // Buscar informações do Visitor
  db.get(`SELECT v.*, a.name as angel_name, a.email as angel_email, a.phone as angel_phone 
          FROM visitors v 
          JOIN angels a ON v.angel_id = a.id 
          WHERE v.id = ?`, 
          [visitorId], (err, visitor) => {
    if (err || !visitor) {
      req.flash('error', 'Erro ao carregar informações do visitante');
      return res.redirect('/');
    }
    
    // Buscar próximos tours agendados
    db.all(`SELECT b.*, t.title, t.location, t.date, t.description, t.price, a.name as angel_name  
            FROM bookings b 
            JOIN tours t ON b.tour_id = t.id 
            JOIN angels a ON t.angel_id = a.id 
            WHERE b.visitor_id = ? AND t.date > datetime('now') AND b.status = 'confirmado' 
            ORDER BY t.date ASC`, 
            [visitorId], (err, upcomingTours) => {
      if (err) {
        console.error('Erro ao buscar próximos tours:', err.message);
        upcomingTours = [];
      }
      
      // Buscar histórico de agendamentos
      db.all(`SELECT b.*, t.title, t.location, t.date, t.price, a.name as angel_name, b.status  
              FROM bookings b 
              JOIN tours t ON b.tour_id = t.id 
              JOIN angels a ON t.angel_id = a.id 
              WHERE b.visitor_id = ? 
              ORDER BY t.date DESC`, 
              [visitorId], (err, bookingHistory) => {
        if (err) {
          console.error('Erro ao buscar histórico de agendamentos:', err.message);
          bookingHistory = [];
        }
        
        // Buscar mensagens não lidas
        db.get(`SELECT COUNT(*) as count FROM messages 
                WHERE receiver_id = ? AND receiver_type = 'visitor' AND read = 0`, 
                [visitorId], (err, unreadMessages) => {
          if (err) {
            console.error('Erro ao buscar mensagens não lidas:', err.message);
            unreadMessages = { count: 0 };
          }
          
          // Buscar atualizações recentes do Angel
          db.all(`SELECT t.id, t.title, t.location, t.date, t.updated_at, 'tour_created' as type  
                  FROM tours t 
                  WHERE t.angel_id = ? AND t.date > datetime('now') AND t.created_at > datetime('now', '-7 days') 
                  UNION 
                  SELECT t.id, t.title, t.location, t.date, t.updated_at, 'tour_updated' as type  
                  FROM tours t 
                  WHERE t.angel_id = ? AND t.updated_at > t.created_at AND t.updated_at > datetime('now', '-7 days') 
                  ORDER BY updated_at DESC LIMIT 10`, 
                  [visitor.angel_id, visitor.angel_id], (err, recentUpdates) => {
            if (err) {
              console.error('Erro ao buscar atualizações recentes:', err.message);
              recentUpdates = [];
            }
            
            // Formatar datas dos tours e atualizações
            upcomingTours.forEach(tour => {
              tour.formattedDate = moment(tour.date).format('DD/MM/YYYY HH:mm');
              tour.relativeDate = moment(tour.date).fromNow();
            });
            
            bookingHistory.forEach(booking => {
              booking.formattedDate = moment(booking.date).format('DD/MM/YYYY HH:mm');
              booking.isPast = moment(booking.date).isBefore(moment());
            });
            
            recentUpdates.forEach(update => {
              update.formattedDate = moment(update.date).format('DD/MM/YYYY HH:mm');
              update.formattedUpdateDate = moment(update.updated_at).format('DD/MM/YYYY HH:mm');
              update.relativeUpdateDate = moment(update.updated_at).fromNow();
            });
            
            res.render('pages/visitor-dashboard', {
              title: 'Dashboard do Visitante - MyBestAngel',
              description: 'Gerencie seus passeios turísticos e veja atualizações do seu guia',
              visitor: visitor,
              upcomingTours: upcomingTours,
              bookingHistory: bookingHistory,
              unreadMessages: unreadMessages ? unreadMessages.count : 0,
              recentUpdates: recentUpdates,
              errors: req.flash('error'),
              success: req.flash('success')
            });
          });
        });
      });
    });
  });
};

// Mostrar perfil do Visitor
exports.showProfile = (req, res) => {
  const visitorId = req.session.user.id;
  
  db.get(`SELECT v.*, a.name as angel_name, a.id as angel_id 
          FROM visitors v 
          JOIN angels a ON v.angel_id = a.id 
          WHERE v.id = ?`, 
          [visitorId], (err, visitor) => {
    if (err || !visitor) {
      req.flash('error', 'Erro ao carregar informações do visitante');
      return res.redirect('/');
    }
    
    res.render('pages/visitor-profile', {
      title: 'Meu Perfil - MyBestAngel',
      description: 'Visualize e edite seu perfil',
      visitor: visitor,
      errors: req.flash('error'),
      success: req.flash('success')
    });
  });
};

// Mostrar formulário para editar perfil
exports.showEditProfileForm = (req, res) => {
  const visitorId = req.session.user.id;
  
  db.get('SELECT * FROM visitors WHERE id = ?', [visitorId], (err, visitor) => {
    if (err || !visitor) {
      req.flash('error', 'Erro ao carregar informações do visitante');
      return res.redirect('/visitor/dashboard');
    }
    
    res.render('pages/visitor-edit-profile', {
      title: 'Editar Perfil - MyBestAngel',
      description: 'Atualize suas informações de perfil',
      visitor: visitor,
      errors: req.flash('error'),
      success: req.flash('success')
    });
  });
};

// Processar atualização de perfil
exports.updateProfile = (req, res) => {
  const visitorId = req.session.user.id;
  const { name, phone, nationality, languagePreference } = req.body;
  
  // Validar campos obrigatórios
  if (!name) {
    req.flash('error', 'O nome é obrigatório');
    return res.redirect('/visitor/edit-profile');
  }
  
  // Atualizar perfil no banco de dados
  db.run(`UPDATE visitors 
          SET name = ?, phone = ?, nationality = ?, language_preference = ?, updated_at = datetime('now') 
          WHERE id = ?`, 
          [name, phone || '', nationality || '', languagePreference || '', visitorId], 
          function(err) {
    if (err) {
      console.error('Erro ao atualizar perfil:', err.message);
      req.flash('error', 'Erro ao atualizar perfil');
      return res.redirect('/visitor/edit-profile');
    }
    
    // Atualizar nome na sessão
    req.session.user.name = name;
    
    req.flash('success', 'Perfil atualizado com sucesso!');
    return res.redirect('/visitor/profile');
  });
};

// Mostrar tours disponíveis
exports.showAvailableTours = (req, res) => {
  const visitorId = req.session.user.id;
  
  // Buscar o Angel associado ao visitante
  db.get('SELECT angel_id FROM visitors WHERE id = ?', [visitorId], (err, visitor) => {
    if (err || !visitor) {
      req.flash('error', 'Erro ao carregar informações do visitante');
      return res.redirect('/visitor/dashboard');
    }
    
    // Buscar tours disponíveis do Angel associado
    db.all(`SELECT t.*, a.name as angel_name, 
            (SELECT COUNT(*) FROM bookings b WHERE b.tour_id = t.id AND b.visitor_id = ? AND b.status = 'confirmado') as already_booked 
            FROM tours t 
            JOIN angels a ON t.angel_id = a.id 
            WHERE t.angel_id = ? AND t.date > datetime('now') AND t.current_participants < t.max_participants 
            ORDER BY t.date ASC`, 
            [visitorId, visitor.angel_id], (err, tours) => {
      if (err) {
        console.error('Erro ao buscar tours disponíveis:', err.message);
        req.flash('error', 'Erro ao carregar tours disponíveis');
        return res.redirect('/visitor/dashboard');
      }
      
      // Formatar datas dos tours
      tours.forEach(tour => {
        tour.formattedDate = moment(tour.date).format('DD/MM/YYYY HH:mm');
        tour.relativeDate = moment(tour.date).fromNow();
        tour.isFullyBooked = tour.current_participants >= tour.max_participants;
      });
      
      res.render('pages/visitor-available-tours', {
        title: 'Tours Disponíveis - MyBestAngel',
        description: 'Veja os tours disponíveis do seu guia',
        tours: tours,
        errors: req.flash('error'),
        success: req.flash('success')
      });
    });
  });
};

// Mostrar detalhes de um tour específico
exports.showTour = (req, res) => {
  const tourId = req.params.id;
  const visitorId = req.session.user.id;
  
  // Buscar detalhes do tour
  db.get(`SELECT t.*, a.name as angel_name, a.email as angel_email, a.phone as angel_phone, 
          (SELECT COUNT(*) FROM bookings b WHERE b.tour_id = t.id AND b.visitor_id = ? AND b.status = 'confirmado') as already_booked 
          FROM tours t 
          JOIN angels a ON t.angel_id = a.id 
          WHERE t.id = ?`, 
          [visitorId, tourId], (err, tour) => {
    if (err || !tour) {
      req.flash('error', 'Tour não encontrado');
      return res.redirect('/visitor/available-tours');
    }
    
    // Formatar data do tour
    tour.formattedDate = moment(tour.date).format('DD/MM/YYYY HH:mm');
    tour.isPast = moment(tour.date).isBefore(moment());
    tour.isFullyBooked = tour.current_participants >= tour.max_participants;
    
    res.render('pages/visitor-tour-details', {
      title: `Tour: ${tour.title} - MyBestAngel`,
      description: `Detalhes do tour ${tour.title}`,
      tour: tour,
      errors: req.flash('error'),
      success: req.flash('success')
    });
  });
};

// Reservar um tour
exports.bookTour = (req, res) => {
  const tourId = req.params.id;
  const visitorId = req.session.user.id;
  const { notes } = req.body;
  
  // Verificar se o tour existe e está disponível
  db.get(`SELECT t.*, 
          (SELECT COUNT(*) FROM bookings b WHERE b.tour_id = t.id AND b.visitor_id = ? AND b.status = 'confirmado') as already_booked 
          FROM tours t 
          WHERE t.id = ? AND t.date > datetime('now') AND t.current_participants < t.max_participants`, 
          [visitorId, tourId], (err, tour) => {
    if (err || !tour) {
      req.flash('error', 'Tour não encontrado ou não disponível');
      return res.redirect('/visitor/available-tours');
    }
    
    if (tour.already_booked > 0) {
      req.flash('error', 'Você já reservou este tour');
      return res.redirect(`/visitor/tour/${tourId}`);
    }
    
    // Iniciar transação
    db.serialize(() => {
      db.run('BEGIN TRANSACTION');
      
      // Inserir reserva
      db.run(`INSERT INTO bookings (tour_id, visitor_id, notes) 
              VALUES (?, ?, ?)`, 
              [tourId, visitorId, notes || ''], function(err) {
        if (err) {
          console.error('Erro ao criar reserva:', err.message);
          db.run('ROLLBACK');
          req.flash('error', 'Erro ao reservar tour');
          return res.redirect(`/visitor/tour/${tourId}`);
        }
        
        // Incrementar número de participantes
        db.run(`UPDATE tours SET current_participants = current_participants + 1 
                WHERE id = ?`, [tourId], function(err) {
          if (err) {
            console.error('Erro ao atualizar número de participantes:', err.message);
            db.run('ROLLBACK');
            req.flash('error', 'Erro ao reservar tour');
            return res.redirect(`/visitor/tour/${tourId}`);
          }
          
          db.run('COMMIT');
          req.flash('success', 'Tour reservado com sucesso!');
          return res.redirect('/visitor/dashboard');
        });
      });
    });
  });
};

// Cancelar reserva de um tour
exports.cancelBooking = (req, res) => {
  const bookingId = req.params.id;
  const visitorId = req.session.user.id;
  
  // Verificar se a reserva pertence ao visitante
  db.get(`SELECT b.*, t.id as tour_id 
          FROM bookings b 
          JOIN tours t ON b.tour_id = t.id 
          WHERE b.id = ? AND b.visitor_id = ? AND b.status = 'confirmado'`, 
          [bookingId, visitorId], (err, booking) => {
    if (err || !booking) {
      req.flash('error', 'Reserva não encontrada ou já cancelada');
      return res.redirect('/visitor/dashboard');
    }
    
    // Iniciar transação
    db.serialize(() => {
      db.run('BEGIN TRANSACTION');
      
      // Atualizar status da reserva
      db.run(`UPDATE bookings SET status = 'cancelado' 
              WHERE id = ?`, [bookingId], function(err) {
        if (err) {
          console.error('Erro ao cancelar reserva:', err.message);
          db.run('ROLLBACK');
          req.flash('error', 'Erro ao cancelar reserva');
          return res.redirect('/visitor/dashboard');
        }
        
        // Decrementar número de participantes
        db.run(`UPDATE tours SET current_participants = current_participants - 1 
                WHERE id = ?`, [booking.tour_id], function(err) {
          if (err) {
            console.error('Erro ao atualizar número de participantes:', err.message);
            db.run('ROLLBACK');
            req.flash('error', 'Erro ao cancelar reserva');
            return res.redirect('/visitor/dashboard');
          }
          
          db.run('COMMIT');
          req.flash('success', 'Reserva cancelada com sucesso!');
          return res.redirect('/visitor/dashboard');
        });
      });
    });
  });
};

// Mostrar todas as mensagens
exports.showMessages = (req, res) => {
  const visitorId = req.session.user.id;
  
  // Buscar o Angel associado ao visitante
  db.get(`SELECT v.angel_id, a.name as angel_name 
          FROM visitors v 
          JOIN angels a ON v.angel_id = a.id 
          WHERE v.id = ?`, 
          [visitorId], (err, visitor) => {
    if (err || !visitor) {
      req.flash('error', 'Erro ao carregar informações do visitante');
      return res.redirect('/visitor/dashboard');
    }
    
    // Buscar todas as mensagens
    db.all(`SELECT m.*, 
            CASE WHEN m.sender_type = 'visitor' THEN v.name ELSE a.name END as sender_name,
            CASE WHEN m.receiver_type = 'visitor' THEN v.name ELSE a.name END as receiver_name
            FROM messages m
            LEFT JOIN visitors v ON (m.sender_type = 'visitor' AND m.sender_id = v.id) OR (m.receiver_type = 'visitor' AND m.receiver_id = v.id)
            LEFT JOIN angels a ON (m.sender_type = 'angel' AND m.sender_id = a.id) OR (m.receiver_type = 'angel' AND m.receiver_id = a.id)
            WHERE (m.sender_id = ? AND m.sender_type = 'visitor') OR (m.receiver_id = ? AND m.receiver_type = 'visitor')
            ORDER BY m.created_at ASC`, 
            [visitorId, visitorId], (err, messages) => {
      if (err) {
        console.error('Erro ao buscar mensagens:', err.message);
        req.flash('error', 'Erro ao carregar mensagens');
        return res.redirect('/visitor/dashboard');
      }
      
      // Marcar todas as mensagens como lidas
  db.run(`UPDATE messages SET read = 1 
          WHERE receiver_id = ? AND receiver_type = 'visitor' AND read = 0`, 
          [visitorId], (err) => {
    if (err) {
      console.error('Erro ao marcar mensagens como lidas:', err.message);
    }
    
    // Formatar datas das mensagens
    messages.forEach(message => {
      message.formattedDate = moment(message.created_at).format('DD/MM/YYYY HH:mm');
      message.isFromVisitor = message.sender_type === 'visitor' && message.sender_id === visitorId;
    });
    
    res.render('pages/visitor-messages', {
      title: 'Mensagens - MyBestAngel',
      description: 'Mensagens com seu guia turístico',
      messages: messages,
      angelId: visitor.angel_id,
      angelName: visitor.angel_name,
      errors: req.flash('error'),
      success: req.flash('success')
    });
  });
    });
  });
};

// Enviar mensagem para Angel
exports.sendMessage = (req, res) => {
  const visitorId = req.session.user.id;
  const { content } = req.body;
  
  // Validar campo obrigatório
  if (!content) {
    req.flash('error', 'Mensagem não pode estar vazia');
    return res.redirect('/visitor/messages');
  }
  
  // Buscar o Angel associado ao visitante
  db.get('SELECT angel_id FROM visitors WHERE id = ?', [visitorId], (err, visitor) => {
    if (err || !visitor) {
      req.flash('error', 'Erro ao buscar informações do visitante');
      return res.redirect('/visitor/dashboard');
    }
    
    // Inserir mensagem no banco de dados
    db.run(`INSERT INTO messages 
            (sender_type, sender_id, receiver_type, receiver_id, content) 
            VALUES (?, ?, ?, ?, ?)`, 
            ['visitor', visitorId, 'angel', visitor.angel_id, content], 
            function(err) {
      if (err) {
        console.error('Erro ao enviar mensagem:', err.message);
        req.flash('error', 'Erro ao enviar mensagem');
        return res.redirect('/visitor/messages');
      }
      
      req.flash('success', 'Mensagem enviada com sucesso!');
      return res.redirect('/visitor/messages');
    });
  });
};

// Avaliar um tour após a realização
exports.rateTour = (req, res) => {
  const tourId = req.params.id;
  const visitorId = req.session.user.id;
  const { rating, comment } = req.body;
  
  // Validar campos obrigatórios
  if (!rating || rating < 1 || rating > 5) {
    req.flash('error', 'Avaliação deve ser entre 1 e 5 estrelas');
    return res.redirect('/visitor/dashboard');
  }
  
  // Verificar se o tour existe e se o visitante participou
  db.get(`SELECT t.*, t.angel_id, b.id as booking_id 
          FROM tours t 
          JOIN bookings b ON t.id = b.tour_id 
          WHERE t.id = ? AND b.visitor_id = ? AND t.date < datetime('now')`, 
          [tourId, visitorId], (err, tour) => {
    if (err || !tour) {
      req.flash('error', 'Tour não encontrado ou não realizado');
      return res.redirect('/visitor/dashboard');
    }
    
    // Verificar se já avaliou este tour
    db.get('SELECT id FROM reviews WHERE tour_id = ? AND visitor_id = ?', 
            [tourId, visitorId], (err, existingReview) => {
      if (err) {
        console.error('Erro ao verificar avaliação existente:', err.message);
        req.flash('error', 'Erro ao processar avaliação');
        return res.redirect('/visitor/dashboard');
      }
      
      if (existingReview) {
        req.flash('error', 'Você já avaliou este tour');
        return res.redirect('/visitor/dashboard');
      }
      
      // Inserir avaliação
      db.run(`INSERT INTO reviews (tour_id, visitor_id, angel_id, rating, comment) 
              VALUES (?, ?, ?, ?, ?)`, 
              [tourId, visitorId, tour.angel_id, rating, comment || ''], 
              function(err) {
        if (err) {
          console.error('Erro ao inserir avaliação:', err.message);
          req.flash('error', 'Erro ao enviar avaliação');
          return res.redirect('/visitor/dashboard');
        }
        
        // Atualizar status da reserva para 'realizado'
        db.run(`UPDATE bookings SET status = 'realizado' 
                WHERE id = ?`, [tour.booking_id], function(err) {
          if (err) {
            console.error('Erro ao atualizar status da reserva:', err.message);
          }
          
          // Atualizar avaliação média do Angel
          db.get('SELECT AVG(rating) as avg_rating, COUNT(*) as count FROM reviews WHERE angel_id = ?', 
                  [tour.angel_id], (err, result) => {
            if (err) {
              console.error('Erro ao calcular avaliação média:', err.message);
            } else {
              // Atualizar rating do Angel
              db.run(`UPDATE angels SET rating = ?, reviews_count = ? WHERE id = ?`, 
                      [result.avg_rating, result.count, tour.angel_id], (err) => {
                if (err) {
                  console.error('Erro ao atualizar rating do Angel:', err.message);
                }
              });
            }
            
            req.flash('success', 'Avaliação enviada com sucesso!');
            return res.redirect('/visitor/dashboard');
          });
        });
      });
    });
  });
};