const { db } = require('../utils/database');
const moment = require('moment');

// Exibir dashboard do Angel
exports.dashboard = (req, res) => {
  const angelId = req.session.user.id;
  
  // Buscar informações do Angel
  db.get('SELECT * FROM angels WHERE id = ?', [angelId], (err, angel) => {
    if (err || !angel) {
      req.flash('error', 'Erro ao carregar informações do guia');
      return res.redirect('/');
    }
    
    // Buscar próximos tours
    db.all(`SELECT * FROM tours 
            WHERE angel_id = ? AND date > datetime('now') 
            ORDER BY date ASC LIMIT 5`, 
            [angelId], (err, upcomingTours) => {
      if (err) {
        console.error('Erro ao buscar próximos tours:', err.message);
        req.flash('error', 'Erro ao carregar próximos tours');
        return res.redirect('/');
      }
      
      // Buscar visitors afiliados
      db.all('SELECT * FROM visitors WHERE angel_id = ?', [angelId], (err, visitors) => {
        if (err) {
          console.error('Erro ao buscar visitors:', err.message);
          req.flash('error', 'Erro ao carregar visitantes afiliados');
          return res.redirect('/');
        }
        
        // Buscar mensagens não lidas
        db.get(`SELECT COUNT(*) as count FROM messages 
                WHERE receiver_id = ? AND receiver_type = 'angel' AND read = 0`, 
                [angelId], (err, unreadMessages) => {
          if (err) {
            console.error('Erro ao buscar mensagens não lidas:', err.message);
            unreadMessages = { count: 0 };
          }
          
          // Buscar avaliações recentes
          db.all(`SELECT r.*, v.name as visitor_name 
                  FROM reviews r 
                  JOIN visitors v ON r.visitor_id = v.id 
                  WHERE r.angel_id = ? 
                  ORDER BY r.created_at DESC LIMIT 5`, 
                  [angelId], (err, reviews) => {
            if (err) {
              console.error('Erro ao buscar avaliações:', err.message);
              reviews = [];
            }
            
            // Formatar datas dos tours
            upcomingTours.forEach(tour => {
              tour.formattedDate = moment(tour.date).format('DD/MM/YYYY HH:mm');
              tour.relativeDate = moment(tour.date).fromNow();
            });
            
            res.render('pages/angel-dashboard', {
              title: 'Dashboard do Guia - MyBestAngel',
              description: 'Gerencie seus tours e visitantes',
              angel: angel,
              upcomingTours: upcomingTours,
              visitors: visitors,
              unreadMessages: unreadMessages ? unreadMessages.count : 0,
              reviews: reviews,
              errors: req.flash('error'),
              success: req.flash('success')
            });
          });
        });
      });
    });
  });
};

// Mostrar perfil do Angel
exports.showProfile = (req, res) => {
  const angelId = req.params.id || req.session.user.id;
  
  db.get('SELECT * FROM angels WHERE id = ?', [angelId], (err, angel) => {
    if (err || !angel) {
      req.flash('error', 'Guia não encontrado');
      return res.redirect('/');
    }
    
    // Buscar tours disponíveis
    db.all(`SELECT * FROM tours 
            WHERE angel_id = ? AND date > datetime('now') 
            ORDER BY date ASC`, 
            [angelId], (err, tours) => {
      if (err) {
        console.error('Erro ao buscar tours:', err.message);
        tours = [];
      }
      
      // Buscar avaliações
      db.all(`SELECT r.*, v.name as visitor_name 
              FROM reviews r 
              JOIN visitors v ON r.visitor_id = v.id 
              WHERE r.angel_id = ? 
              ORDER BY r.created_at DESC`, 
              [angelId], (err, reviews) => {
        if (err) {
          console.error('Erro ao buscar avaliações:', err.message);
          reviews = [];
        }
        
        // Formatar datas dos tours
        tours.forEach(tour => {
          tour.formattedDate = moment(tour.date).format('DD/MM/YYYY HH:mm');
          tour.relativeDate = moment(tour.date).fromNow();
        });
        
        res.render('pages/angel-profile', {
          title: `Guia ${angel.name} - MyBestAngel`,
          description: `Perfil do guia turístico ${angel.name}`,
          angel: angel,
          tours: tours,
          reviews: reviews,
          isOwnProfile: req.session.user && req.session.user.id === angel.id,
          errors: req.flash('error'),
          success: req.flash('success')
        });
      });
    });
  });
};

// Mostrar formulário para editar perfil
exports.showEditProfileForm = (req, res) => {
  const angelId = req.session.user.id;
  
  db.get('SELECT * FROM angels WHERE id = ?', [angelId], (err, angel) => {
    if (err || !angel) {
      req.flash('error', 'Erro ao carregar informações do guia');
      return res.redirect('/angel/dashboard');
    }
    
    res.render('pages/angel-edit-profile', {
      title: 'Editar Perfil - MyBestAngel',
      description: 'Atualize suas informações de perfil',
      angel: angel,
      errors: req.flash('error'),
      success: req.flash('success')
    });
  });
};

// Processar atualização de perfil
exports.updateProfile = (req, res) => {
  const angelId = req.session.user.id;
  const { name, phone, bio, languages, specialty } = req.body;
  
  // Validar campos obrigatórios
  if (!name) {
    req.flash('error', 'O nome é obrigatório');
    return res.redirect('/angel/edit-profile');
  }
  
  // Atualizar perfil no banco de dados
  db.run(`UPDATE angels 
          SET name = ?, phone = ?, bio = ?, languages = ?, specialty = ?, updated_at = datetime('now') 
          WHERE id = ?`, 
          [name, phone || '', bio || '', languages || '', specialty || '', angelId], 
          function(err) {
    if (err) {
      console.error('Erro ao atualizar perfil:', err.message);
      req.flash('error', 'Erro ao atualizar perfil');
      return res.redirect('/angel/edit-profile');
    }
    
    // Atualizar nome na sessão
    req.session.user.name = name;
    
    req.flash('success', 'Perfil atualizado com sucesso!');
    return res.redirect('/angel/dashboard');
  });
};

// Mostrar formulário para criar novo tour
exports.showCreateTourForm = (req, res) => {
  res.render('pages/angel-create-tour', {
    title: 'Criar Tour - MyBestAngel',
    description: 'Crie um novo tour turístico',
    errors: req.flash('error'),
    success: req.flash('success')
  });
};

// Processar criação de tour
exports.createTour = (req, res) => {
  const angelId = req.session.user.id;
  const { title, description, location, date, time, duration, price, maxParticipants } = req.body;
  
  // Validar campos obrigatórios
  if (!title || !location || !date || !time) {
    req.flash('error', 'Título, local, data e hora são obrigatórios');
    return res.redirect('/angel/create-tour');
  }
  
  // Combinar data e hora
  const dateTime = `${date} ${time}:00`;
  
  // Inserir tour no banco de dados
  db.run(`INSERT INTO tours 
          (angel_id, title, description, location, date, duration, price, max_participants) 
          VALUES (?, ?, ?, ?, ?, ?, ?, ?)`, 
          [
            angelId, 
            title, 
            description || '', 
            location, 
            dateTime, 
            duration || 60, 
            price || 0, 
            maxParticipants || 10
          ], 
          function(err) {
    if (err) {
      console.error('Erro ao criar tour:', err.message);
      req.flash('error', 'Erro ao criar tour');
      return res.redirect('/angel/create-tour');
    }
    
    req.flash('success', 'Tour criado com sucesso!');
    return res.redirect('/angel/dashboard');
  });
};

// Mostrar todos os tours do Angel
exports.showTours = (req, res) => {
  const angelId = req.session.user.id;
  
  // Buscar todos os tours do Angel
  db.all(`SELECT * FROM tours 
          WHERE angel_id = ? 
          ORDER BY date DESC`, 
          [angelId], (err, tours) => {
    if (err) {
      console.error('Erro ao buscar tours:', err.message);
      req.flash('error', 'Erro ao carregar tours');
      return res.redirect('/angel/dashboard');
    }
    
    // Formatar datas dos tours
    tours.forEach(tour => {
      tour.formattedDate = moment(tour.date).format('DD/MM/YYYY HH:mm');
      tour.isPast = moment(tour.date).isBefore(moment());
    });
    
    // Separar tours futuros e passados
    const upcomingTours = tours.filter(tour => !tour.isPast);
    const pastTours = tours.filter(tour => tour.isPast);
    
    res.render('pages/angel-tours', {
      title: 'Meus Tours - MyBestAngel',
      description: 'Gerencie seus tours turísticos',
      upcomingTours: upcomingTours,
      pastTours: pastTours,
      errors: req.flash('error'),
      success: req.flash('success')
    });
  });
};

// Mostrar detalhes de um tour específico
exports.showTour = (req, res) => {
  const tourId = req.params.id;
  const angelId = req.session.user.id;
  
  // Buscar detalhes do tour
  db.get(`SELECT * FROM tours WHERE id = ? AND angel_id = ?`, 
          [tourId, angelId], (err, tour) => {
    if (err || !tour) {
      req.flash('error', 'Tour não encontrado');
      return res.redirect('/angel/tours');
    }
    
    // Buscar reservas para este tour
    db.all(`SELECT b.*, v.name as visitor_name, v.email as visitor_email 
            FROM bookings b 
            JOIN visitors v ON b.visitor_id = v.id 
            WHERE b.tour_id = ?`, 
            [tourId], (err, bookings) => {
      if (err) {
        console.error('Erro ao buscar reservas:', err.message);
        bookings = [];
      }
      
      // Formatar data do tour
      tour.formattedDate = moment(tour.date).format('DD/MM/YYYY HH:mm');
      tour.isPast = moment(tour.date).isBefore(moment());
      
      res.render('pages/angel-tour-details', {
        title: `Tour: ${tour.title} - MyBestAngel`,
        description: `Detalhes do tour ${tour.title}`,
        tour: tour,
        bookings: bookings,
        errors: req.flash('error'),
        success: req.flash('success')
      });
    });
  });
};

// Mostrar formulário para editar tour
exports.showEditTourForm = (req, res) => {
  const tourId = req.params.id;
  const angelId = req.session.user.id;
  
  // Buscar detalhes do tour
  db.get(`SELECT * FROM tours WHERE id = ? AND angel_id = ?`, 
          [tourId, angelId], (err, tour) => {
    if (err || !tour) {
      req.flash('error', 'Tour não encontrado');
      return res.redirect('/angel/tours');
    }
    
    // Formatar data e hora para o formulário
    const tourDate = moment(tour.date).format('YYYY-MM-DD');
    const tourTime = moment(tour.date).format('HH:mm');
    
    res.render('pages/angel-edit-tour', {
      title: `Editar Tour: ${tour.title} - MyBestAngel`,
      description: `Editar detalhes do tour ${tour.title}`,
      tour: tour,
      tourDate: tourDate,
      tourTime: tourTime,
      errors: req.flash('error'),
      success: req.flash('success')
    });
  });
};

// Processar atualização de tour
exports.updateTour = (req, res) => {
  const tourId = req.params.id;
  const angelId = req.session.user.id;
  const { title, description, location, date, time, duration, price, maxParticipants } = req.body;
  
  // Validar campos obrigatórios
  if (!title || !location || !date || !time) {
    req.flash('error', 'Título, local, data e hora são obrigatórios');
    return res.redirect(`/angel/edit-tour/${tourId}`);
  }
  
  // Combinar data e hora
  const dateTime = `${date} ${time}:00`;
  
  // Atualizar tour no banco de dados
  db.run(`UPDATE tours 
          SET title = ?, description = ?, location = ?, date = ?, 
              duration = ?, price = ?, max_participants = ?, updated_at = datetime('now') 
          WHERE id = ? AND angel_id = ?`, 
          [
            title, 
            description || '', 
            location, 
            dateTime, 
            duration || 60, 
            price || 0, 
            maxParticipants || 10,
            tourId,
            angelId
          ], 
          function(err) {
    if (err) {
      console.error('Erro ao atualizar tour:', err.message);
      req.flash('error', 'Erro ao atualizar tour');
      return res.redirect(`/angel/edit-tour/${tourId}`);
    }
    
    req.flash('success', 'Tour atualizado com sucesso!');
    return res.redirect(`/angel/tour/${tourId}`);
  });
};

// Cancelar tour
exports.cancelTour = (req, res) => {
  const tourId = req.params.id;
  const angelId = req.session.user.id;
  
  // Verificar se o tour pertence ao Angel
  db.get('SELECT id FROM tours WHERE id = ? AND angel_id = ?', 
          [tourId, angelId], (err, tour) => {
    if (err || !tour) {
      req.flash('error', 'Tour não encontrado');
      return res.redirect('/angel/tours');
    }
    
    // Remover tour do banco de dados
    db.run('DELETE FROM tours WHERE id = ?', [tourId], function(err) {
      if (err) {
        console.error('Erro ao cancelar tour:', err.message);
        req.flash('error', 'Erro ao cancelar tour');
        return res.redirect(`/angel/tour/${tourId}`);
      }
      
      // Atualizar status das reservas para 'cancelado'
      db.run(`UPDATE bookings SET status = 'cancelado' WHERE tour_id = ?`, 
              [tourId], function(err) {
        if (err) {
          console.error('Erro ao atualizar reservas:', err.message);
        }
        
        req.flash('success', 'Tour cancelado com sucesso!');
        return res.redirect('/angel/tours');
      });
    });
  });
};

// Mostrar todos os visitantes afiliados
exports.showVisitors = (req, res) => {
  const angelId = req.session.user.id;
  
  // Buscar todos os visitantes afiliados
  db.all('SELECT * FROM visitors WHERE angel_id = ?', [angelId], (err, visitors) => {
    if (err) {
      console.error('Erro ao buscar visitantes:', err.message);
      req.flash('error', 'Erro ao carregar visitantes');
      return res.redirect('/angel/dashboard');
    }
    
    res.render('pages/angel-visitors', {
      title: 'Meus Visitantes - MyBestAngel',
      description: 'Gerencie seus visitantes afiliados',
      visitors: visitors,
      errors: req.flash('error'),
      success: req.flash('success')
    });
  });
};

// Mostrar todas as mensagens
exports.showMessages = (req, res) => {
  const angelId = req.session.user.id;
  
  // Buscar todas as mensagens
  db.all(`SELECT m.*, 
          CASE WHEN m.sender_type = 'visitor' THEN v.name ELSE a.name END as sender_name,
          CASE WHEN m.receiver_type = 'visitor' THEN v.name ELSE a.name END as receiver_name
          FROM messages m
          LEFT JOIN visitors v ON (m.sender_type = 'visitor' AND m.sender_id = v.id) OR (m.receiver_type = 'visitor' AND m.receiver_id = v.id)
          LEFT JOIN angels a ON (m.sender_type = 'angel' AND m.sender_id = a.id) OR (m.receiver_type = 'angel' AND m.receiver_id = a.id)
          WHERE (m.sender_id = ? AND m.sender_type = 'angel') OR (m.receiver_id = ? AND m.receiver_type = 'angel')
          ORDER BY m.created_at DESC`, 
          [angelId, angelId], (err, messages) => {
    if (err) {
      console.error('Erro ao buscar mensagens:', err.message);
      req.flash('error', 'Erro ao carregar mensagens');
      return res.redirect('/angel/dashboard');
    }
    
    // Marcar todas as mensagens como lidas
    db.run(`UPDATE messages SET read = 1 
            WHERE receiver_id = ? AND receiver_type = 'angel' AND read = 0`, 
            [angelId], (err) => {
      if (err) {
        console.error('Erro ao marcar mensagens como lidas:', err.message);
      }
      
      // Agrupar mensagens por conversas (contato)
      const conversations = {};
      
      messages.forEach(message => {
        let contactId, contactType, contactName;
        
        if (message.sender_id === angelId && message.sender_type === 'angel') {
          contactId = message.receiver_id;
          contactType = message.receiver_type;
          contactName = message.receiver_name;
        } else {
          contactId = message.sender_id;
          contactType = message.sender_type;
          contactName = message.sender_name;
        }
        
        const conversationKey = `${contactType}-${contactId}`;
        
        if (!conversations[conversationKey]) {
          conversations[conversationKey] = {
            id: contactId,
            type: contactType,
            name: contactName,
            messages: []
          };
        }
        
        // Adicionar formatação da data
        message.formattedDate = moment(message.created_at).format('DD/MM/YYYY HH:mm');
        message.isFromAngel = message.sender_type === 'angel' && message.sender_id === angelId;
        
        conversations[conversationKey].messages.push(message);
      });
      
      // Converter objeto de conversas para array
      const conversationsArray = Object.values(conversations);
      
      // Buscar visitantes afiliados que ainda não têm conversa
      db.all(`SELECT id, name FROM visitors 
              WHERE angel_id = ? AND id NOT IN (
                SELECT CASE WHEN sender_type = 'visitor' THEN sender_id ELSE receiver_id END
                FROM messages
                WHERE (sender_type = 'visitor' AND receiver_id = ? AND receiver_type = 'angel')
                OR (receiver_type = 'visitor' AND sender_id = ? AND sender_type = 'angel')
              )`, 
              [angelId, angelId, angelId], (err, availableVisitors) => {
        if (err) {
          console.error('Erro ao buscar visitantes disponíveis:', err.message);
          availableVisitors = [];
        }
        
        res.render('pages/angel-messages', {
          title: 'Minhas Mensagens - MyBestAngel',
          description: 'Gerencie suas conversas com visitantes',
          conversations: conversationsArray,
          availableVisitors: availableVisitors,
          errors: req.flash('error'),
          success: req.flash('success')
        });
      });
    });
  });
};

// Enviar mensagem para visitante
exports.sendMessage = (req, res) => {
  const angelId = req.session.user.id;
  const { visitorId, content } = req.body;
  
  // Validar campos obrigatórios
  if (!visitorId || !content) {
    req.flash('error', 'Destinatário e mensagem são obrigatórios');
    return res.redirect('/angel/messages');
  }
  
  // Verificar se o visitante está afiliado ao Angel
  db.get('SELECT id FROM visitors WHERE id = ? AND angel_id = ?', 
          [visitorId, angelId], (err, visitor) => {
    if (err || !visitor) {
      req.flash('error', 'Visitante não encontrado ou não afiliado a você');
      return res.redirect('/angel/messages');
    }
    
    // Inserir mensagem no banco de dados
    db.run(`INSERT INTO messages 
            (sender_type, sender_id, receiver_type, receiver_id, content) 
            VALUES (?, ?, ?, ?, ?)`, 
            ['angel', angelId, 'visitor', visitorId, content], 
            function(err) {
      if (err) {
        console.error('Erro ao enviar mensagem:', err.message);
        req.flash('error', 'Erro ao enviar mensagem');
        return res.redirect('/angel/messages');
      }
      
      req.flash('success', 'Mensagem enviada com sucesso!');
      return res.redirect('/angel/messages');
    });
  });
};

// Mostrar dashboard com insights
exports.showInsights = (req, res) => {
  const angelId = req.session.user.id;
  
  // Buscar estatísticas de tours
  db.get(`SELECT COUNT(*) as totalTours, 
          SUM(CASE WHEN date > datetime('now') THEN 1 ELSE 0 END) as upcomingTours,
          SUM(CASE WHEN date < datetime('now') THEN 1 ELSE 0 END) as pastTours,
          COUNT(DISTINCT location) as uniqueLocations
          FROM tours WHERE angel_id = ?`, 
          [angelId], (err, tourStats) => {
    if (err) {
      console.error('Erro ao buscar estatísticas de tours:', err.message);
      tourStats = { totalTours: 0, upcomingTours: 0, pastTours: 0, uniqueLocations: 0 };
    }
    
    // Buscar estatísticas de reservas
    db.get(`SELECT COUNT(*) as totalBookings, 
            SUM(CASE WHEN b.status = 'confirmado' THEN 1 ELSE 0 END) as confirmedBookings,
            SUM(CASE WHEN b.status = 'cancelado' THEN 1 ELSE 0 END) as canceledBookings,
            SUM(CASE WHEN b.status = 'realizado' THEN 1 ELSE 0 END) as completedBookings
            FROM bookings b
            JOIN tours t ON b.tour_id = t.id
            WHERE t.angel_id = ?`, 
            [angelId], (err, bookingStats) => {
      if (err) {
        console.error('Erro ao buscar estatísticas de reservas:', err.message);
        bookingStats = { totalBookings: 0, confirmedBookings: 0, canceledBookings: 0, completedBookings: 0 };
      }
      
      // Buscar top locais mais populares
      db.all(`SELECT location, COUNT(*) as count
              FROM tours
              WHERE angel_id = ?
              GROUP BY location
              ORDER BY count DESC
              LIMIT 5`, 
              [angelId], (err, popularLocations) => {
        if (err) {
          console.error('Erro ao buscar locais populares:', err.message);
          popularLocations = [];
        }
        
        // Buscar avaliação média
        db.get(`SELECT AVG(rating) as averageRating, COUNT(*) as totalReviews
                FROM reviews
                WHERE angel_id = ?`, 
                [angelId], (err, reviewStats) => {
          if (err) {
            console.error('Erro ao buscar estatísticas de avaliações:', err.message);
            reviewStats = { averageRating: 0, totalReviews: 0 };
          }
          
          // Formatar avaliação média
          const averageRating = reviewStats.averageRating ? parseFloat(reviewStats.averageRating).toFixed(1) : '0.0';
          
          // Buscar sugestões de passeios populares em Belém
          const popularTours = [
            {
              title: 'Mercado Ver-o-Peso',
              description: 'O famoso mercado Ver-o-Peso é o maior mercado a céu aberto da América Latina e um símbolo de Belém.',
              image: '/images/ver-o-peso.jpg'
            },
            {
              title: 'Estação das Docas',
              description: 'Um complexo turístico à beira do rio com restaurantes, bares e lojas em antigos galpões portuários.',
              image: '/images/estacao-docas.jpg'
            },
            {
              title: 'Museu Emílio Goeldi',
              description: 'Um dos mais importantes museus de história natural e etnografia da Amazônia.',
              image: '/images/museu-goeldi.jpg'
            },
            {
              title: 'Basílica de Nazaré',
              description: 'Santuário que abriga a imagem de Nossa Senhora de Nazaré, padroeira dos paraenses.',
              image: '/images/basilica-nazare.jpg'
            },
            {
              title: 'Mangal das Garças',
              description: 'Parque naturalístico com fauna e flora amazônicas, incluindo um borboletário e um mirante.',
              image: '/images/mangal-garcas.jpg'
            }
          ];
          
          // Sugestões de pratos típicos paraenses
          const typicalDishes = [
            {
              name: 'Pato no Tucupi',
              description: 'Pato assado servido com molho de tucupi (líquido extraído da mandioca) e jambu (erva típica).',
              image: '/images/pato-tucupi.jpg'
            },
            {
              name: 'Tacacá',
              description: 'Caldo quente feito com tucupi, jambu, camarão seco e goma de tapioca.',
              image: '/images/tacaca.jpg'
            },
            {
              name: 'Maniçoba',
              description: 'Prato feito com folhas de mandioca moídas e cozidas por dias, servido com carnes variadas.',
              image: '/images/manicoba.jpg'
            },
            {
              name: 'Açaí',
              description: 'Servido como uma pasta espessa, geralmente acompanhado de farinha de tapioca e peixe frito.',
              image: '/images/acai.jpg'
            },
            {
              name: 'Vatapá',
              description: 'Creme à base de pão, camarão seco, amendoim, castanha de caju, leite de coco e dendê.',
              image: '/images/vatapa.jpg'
            }
          ];
          
          res.render('pages/angel-insights', {
            title: 'Insights e Sugestões - MyBestAngel',
            description: 'Insights e sugestões para melhorar seus tours',
            tourStats: tourStats,
            bookingStats: bookingStats,
            popularLocations: popularLocations,
            reviewStats: {
              averageRating: averageRating,
              totalReviews: reviewStats.totalReviews
            },
            popularTours: popularTours,
            typicalDishes: typicalDishes,
            errors: req.flash('error'),
            success: req.flash('success')
          });
        });
      });
    });
  });
};