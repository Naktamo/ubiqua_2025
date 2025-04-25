-- Criação do banco de dados
CREATE DATABASE ser_recicla;

-- Usar o banco de dados
USE ser_recicla;

-- Tabela de Unidades da UNAMA
CREATE TABLE unidades (
    id SERIAL PRIMARY KEY,
    nome VARCHAR(100) NOT NULL,
    endereco VARCHAR(255),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- Tabela de Cursos
CREATE TABLE cursos (
    id SERIAL PRIMARY KEY,
    nome VARCHAR(100) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- Tabela de Turnos
CREATE TABLE turnos (
    id SERIAL PRIMARY KEY,
    nome VARCHAR(50) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- Tabela de Tipos de Resíduos
CREATE TABLE tipos_residuos (
    id SERIAL PRIMARY KEY,
    nome VARCHAR(50) NOT NULL,
    descricao TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- Tabela de Turmas
CREATE TABLE turmas (
    id SERIAL PRIMARY KEY,
    codigo VARCHAR(50) NOT NULL,
    curso_id BIGINT UNSIGNED NOT NULL,
    semestre INT NOT NULL,
    turno_id BIGINT UNSIGNED NOT NULL,
    unidade_id BIGINT UNSIGNED NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (curso_id) REFERENCES cursos(id),
    FOREIGN KEY (turno_id) REFERENCES turnos(id),
    FOREIGN KEY (unidade_id) REFERENCES unidades(id)
);

-- Tabela de Usuários (para administradores e operadores do sistema)
CREATE TABLE usuarios (
    id SERIAL PRIMARY KEY,
    nome VARCHAR(100) NOT NULL,
    email VARCHAR(100) NOT NULL UNIQUE,
    senha VARCHAR(255) NOT NULL,
    perfil ENUM('admin', 'gestor', 'operador') NOT NULL,
    unidade_id BIGINT UNSIGNED,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (unidade_id) REFERENCES unidades(id)
);

-- Tabela de Entregas de Resíduos
CREATE TABLE entregas (
    id SERIAL PRIMARY KEY,
    turma_id BIGINT UNSIGNED NOT NULL,
    tipo_residuo_id BIGINT UNSIGNED NOT NULL,
    quantidade DECIMAL(10,2) NOT NULL, -- Em Kg
    data_entrega DATE NOT NULL,
    registrado_por BIGINT UNSIGNED NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (turma_id) REFERENCES turmas(id),
    FOREIGN KEY (tipo_residuo_id) REFERENCES tipos_residuos(id),
    FOREIGN KEY (registrado_por) REFERENCES usuarios(id)
);

-- Tabela de Metas de Reciclagem
CREATE TABLE metas (
    id SERIAL PRIMARY KEY,
    tipo_residuo_id BIGINT UNSIGNED NOT NULL,
    quantidade_meta DECIMAL(10,2) NOT NULL, -- Em Kg
    data_inicio DATE NOT NULL,
    data_fim DATE NOT NULL,
    unidade_id BIGINT UNSIGNED,  -- NULL para meta global
    turma_id BIGINT UNSIGNED,    -- NULL para meta não específica de turma
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (tipo_residuo_id) REFERENCES tipos_residuos(id),
    FOREIGN KEY (unidade_id) REFERENCES unidades(id),
    FOREIGN KEY (turma_id) REFERENCES turmas(id)
);

-- Inserção de dados iniciais para os tipos de resíduos
INSERT INTO tipos_residuos (nome, descricao) VALUES 
('Alumínio', 'Latas, papel alumínio e outros itens de alumínio'),
('Vidro', 'Garrafas, potes e outros itens de vidro'),
('Pano', 'Tecidos, roupas e outros materiais têxteis'),
('PET', 'Garrafas plásticas e outros items feitos de PET');

-- Inserção de dados iniciais para os turnos
INSERT INTO turnos (nome) VALUES 
('Matutino'),
('Vespertino'),
('Noturno'),
('Integral');

-- Inserção de dados iniciais para as unidades
INSERT INTO unidades (nome, endereco) VALUES 
('Unama Alcindo Cacela', 'Av. Alcindo Cacela, Belém - PA'),
('Unama Ananindeua', 'Rod. BR-316 - Ananindeua - PA');

-- Criação de índices para melhorar a performance das consultas
CREATE INDEX idx_turma_curso ON turmas(curso_id);
CREATE INDEX idx_turma_unidade ON turmas(unidade_id);
CREATE INDEX idx_entregas_turma ON entregas(turma_id);
CREATE INDEX idx_entregas_tipo ON entregas(tipo_residuo_id);
CREATE INDEX idx_entregas_data ON entregas(data_entrega);