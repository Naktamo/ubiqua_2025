const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const bcrypt = require('bcrypt');

// Caminho para o arquivo do banco de dados
const dbPath = path.resolve(__dirname, '../../mybestangel.db');

// Criação da conexão com o banco de dados
const db = new sqlite3.Database(dbPath, (err) => {
  if (err) {
    console.error('Erro ao conectar ao banco de dados:', err.message);
  } else {
    console.log('Conectado ao banco de dados SQLite.');
  }
});

// Função para inicializar o banco de dados
function initDatabase() {
  console.log('Inicializando banco de dados...');
  
  // Tabela de Angels (guias turísticos)
  db.run(`CREATE TABLE IF NOT EXISTS angels (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    email TEXT UNIQUE NOT NULL,
    password TEXT NOT NULL,
    phone TEXT,
    bio TEXT,
    languages TEXT,
    profile_image TEXT,
    specialty TEXT,
    rating REAL DEFAULT 5.0,
    reviews_count INTEGER DEFAULT 0,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
  )`, (err) => {
    if (err) {
      console.error('Erro ao criar tabela angels:', err.message);
    } else {
      console.log('Tabela angels criada ou já existente.');
      
      // Inserir um guia turístico de demonstração se a tabela estiver vazia
      db.get("SELECT COUNT(*) as count FROM angels", (err, row) => {
        if (err) {
          console.error('Erro ao verificar angels:', err.message);
        } else if (row.count === 0) {
          // Hash da senha
          bcrypt.hash('admin123', 10, (err, hash) => {
            if (err) {
              console.error('Erro ao gerar hash da senha:', err.message);
            } else {
              // Inserir guia demo
              db.run(`INSERT INTO angels (name, email, password, phone, bio, languages, specialty) 
                VALUES (?, ?, ?, ?, ?, ?, ?)`, 
                [
                  'Guia Demo', 
                  'guia@mybestangel.com', 
                  hash, 
                  '(91) 99999-9999',
                  'Guia turístico com mais de 10 anos de experiência em Belém do Pará.',
                  'Português, Inglês, Espanhol',
                  'Gastronomia e Cultura'
                ], (err) => {
                if (err) {
                  console.error('Erro ao inserir guia demo:', err.message);
                } else {
                  console.log('Guia demo inserido com sucesso.');
                }
              });
            }
          });
        }
      });
    }
  });

  // Tabela de Visitors (turistas)
  db.run(`CREATE TABLE IF NOT EXISTS visitors (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    angel_id INTEGER,
    name TEXT NOT NULL,
    email TEXT UNIQUE NOT NULL,
    password TEXT NOT NULL,
    phone TEXT,
    nationality TEXT,
    language_preference TEXT,
    profile_image TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (angel_id) REFERENCES angels (id)
  )`, (err) => {
    if (err) {
      console.error('Erro ao criar tabela visitors:', err.message);
    } else {
      console.log('Tabela visitors criada ou já existente.');
      
      // Inserir um visitante de demonstração se a tabela estiver vazia
      db.get("SELECT COUNT(*) as count FROM visitors", (err, row) => {
        if (err) {
          console.error('Erro ao verificar visitors:', err.message);
        } else if (row.count === 0) {
          // Hash da senha
          bcrypt.hash('visitor123', 10, (err, hash) => {
            if (err) {
              console.error('Erro ao gerar hash da senha:', err.message);
            } else {
              // Inserir visitante demo
              db.run(`INSERT INTO visitors (angel_id, name, email, password, phone, nationality, language_preference) 
                VALUES (?, ?, ?, ?, ?, ?, ?)`, 
                [
                  1, // Associado ao guia demo com ID 1
                  'Visitante Demo', 
                  'visitante@mybestangel.com', 
                  hash, 
                  '(91) 88888-8888',
                  'Brasil',
                  'Português'
                ], (err) => {
                if (err) {
                  console.error('Erro ao inserir visitante demo:', err.message);
                } else {
                  console.log('Visitante demo inserido com sucesso.');
                }
              });
            }
          });
        }
      });
    }
  });

  // Tabela de Tours (passeios turísticos)
  db.run(`CREATE TABLE IF NOT EXISTS tours (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    angel_id INTEGER NOT NULL,
    title TEXT NOT NULL,
    description TEXT,
    location TEXT NOT NULL,
    date DATETIME NOT NULL,
    duration INTEGER, -- duração em minutos
    price REAL,
    max_participants INTEGER DEFAULT 10,
    current_participants INTEGER DEFAULT 0,
    image TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (angel_id) REFERENCES angels (id)
  )`, (err) => {
    if (err) {
      console.error('Erro ao criar tabela tours:', err.message);
    } else {
      console.log('Tabela tours criada ou já existente.');
      
      // Inserir tours de demonstração se a tabela estiver vazia
      db.get("SELECT COUNT(*) as count FROM tours", (err, row) => {
        if (err) {
          console.error('Erro ao verificar tours:', err.message);
        } else if (row.count === 0) {
          // Array de tours demo
          const demoTours = [
            {
              angel_id: 1,
              title: 'Mercado Ver-o-Peso',
              description: 'Visita ao tradicional mercado Ver-o-Peso, um dos mais antigos e maiores mercados a céu aberto da América Latina.',
              location: 'Ver-o-Peso, Belém, PA',
              date: '2025-06-01 09:00:00',
              duration: 180,
              price: 50.00,
              max_participants: 8
            },
            {
              angel_id: 1,
              title: 'Tour Gastronômico em Belém',
              description: 'Conheça o melhor da culinária paraense com visitas a restaurantes tradicionais e degustação de pratos típicos.',
              location: 'Centro Histórico, Belém, PA',
              date: '2025-06-02 18:00:00',
              duration: 240,
              price: 120.00,
              max_participants: 6
            },
            {
              angel_id: 1,
              title: 'Museu Emílio Goeldi',
              description: 'Visita ao Museu Paraense Emílio Goeldi, um dos mais importantes centros de pesquisa sobre a biodiversidade amazônica.',
              location: 'Av. Magalhães Barata, Belém, PA',
              date: '2025-06-03 14:00:00',
              duration: 150,
              price: 40.00,
              max_participants: 10
            }
          ];
          
          // Inserir cada tour demo
          const stmt = db.prepare(`INSERT INTO tours 
            (angel_id, title, description, location, date, duration, price, max_participants) 
            VALUES (?, ?, ?, ?, ?, ?, ?, ?)`);
            
          demoTours.forEach(tour => {
            stmt.run(
              tour.angel_id, 
              tour.title,
              tour.description,
              tour.location,
              tour.date,
              tour.duration,
              tour.price,
              tour.max_participants,
              (err) => {
                if (err) {
                  console.error('Erro ao inserir tour demo:', err.message);
                }
              }
            );
          });
          
          stmt.finalize();
          console.log('Tours demo inseridos com sucesso.');
        }
      });
    }
  });

  // Tabela de Reservas
  db.run(`CREATE TABLE IF NOT EXISTS bookings (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    tour_id INTEGER NOT NULL,
    visitor_id INTEGER NOT NULL,
    status TEXT DEFAULT 'confirmado', -- confirmado, cancelado, realizado
    notes TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (tour_id) REFERENCES tours (id),
    FOREIGN KEY (visitor_id) REFERENCES visitors (id)
  )`, (err) => {
    if (err) {
      console.error('Erro ao criar tabela bookings:', err.message);
    } else {
      console.log('Tabela bookings criada ou já existente.');
    }
  });

  // Tabela de Mensagens
  db.run(`CREATE TABLE IF NOT EXISTS messages (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    sender_type TEXT NOT NULL, -- angel ou visitor
    sender_id INTEGER NOT NULL,
    receiver_type TEXT NOT NULL, -- angel ou visitor
    receiver_id INTEGER NOT NULL,
    content TEXT NOT NULL,
    read INTEGER DEFAULT 0, -- 0: não lido, 1: lido
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  )`, (err) => {
    if (err) {
      console.error('Erro ao criar tabela messages:', err.message);
    } else {
      console.log('Tabela messages criada ou já existente.');
    }
  });

  // Tabela de Avaliações
  db.run(`CREATE TABLE IF NOT EXISTS reviews (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    tour_id INTEGER NOT NULL,
    visitor_id INTEGER NOT NULL,
    angel_id INTEGER NOT NULL,
    rating INTEGER NOT NULL, -- 1 a 5
    comment TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (tour_id) REFERENCES tours (id),
    FOREIGN KEY (visitor_id) REFERENCES visitors (id),
    FOREIGN KEY (angel_id) REFERENCES angels (id)
  )`, (err) => {
    if (err) {
      console.error('Erro ao criar tabela reviews:', err.message);
    } else {
      console.log('Tabela reviews criada ou já existente.');
    }
  });

  console.log('Inicialização do banco de dados concluída.');
}

// Exportar a conexão e a função de inicialização
module.exports = initDatabase;
module.exports.db = db;