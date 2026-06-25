-- =============================================
-- BANCO DE DADOS - Sistema de Pedidos
-- =============================================

CREATE DATABASE IF NOT EXISTS doce_hub_db 
CHARACTER SET utf8mb4 
COLLATE utf8mb4_unicode_ci;

USE doce_hub_db;

-- =============================================
-- 1. CATEGORIAS (com hierarquia)
-- =============================================
CREATE TABLE categorias (
    id                  INT AUTO_INCREMENT PRIMARY KEY,
    id_categoria_pai    INT NULL,
    nome                VARCHAR(100) NOT NULL,
    
    FOREIGN KEY (id_categoria_pai) REFERENCES categorias(id)
        ON DELETE SET NULL
        ON UPDATE CASCADE
) ENGINE=InnoDB;

-- =============================================
-- 2. PRODUTOS
-- =============================================
CREATE TABLE produtos (
    id              INT AUTO_INCREMENT PRIMARY KEY,
    id_categoria    INT NOT NULL,
    nome            VARCHAR(150) NOT NULL,
    descricao       TEXT,
    preco           DECIMAL(10,2) NOT NULL,
    imagem_url      VARCHAR(500),
    criado_em       DATETIME DEFAULT CURRENT_TIMESTAMP,
    excluido_em     DATETIME NULL,
    desabilitado    TINYINT(1) DEFAULT 0,
    
    FOREIGN KEY (id_categoria) REFERENCES categorias(id)
        ON DELETE RESTRICT
        ON UPDATE CASCADE
) ENGINE=InnoDB;

-- =============================================
-- 3. USUARIOS
-- =============================================
CREATE TABLE usuarios (
    id                  INT AUTO_INCREMENT PRIMARY KEY,
    nome                VARCHAR(150) NOT NULL,
    endereco            TEXT,
    email               VARCHAR(150) UNIQUE NOT NULL,
    telefone_whatsapp   VARCHAR(30),
    senha_hash          VARCHAR(255) NOT NULL,
    criado_em           DATETIME DEFAULT CURRENT_TIMESTAMP,
    excluido_em         DATETIME NULL,
    desabilitado        TINYINT(1) DEFAULT 0
) ENGINE=InnoDB;

-- =============================================
-- 4. PEDIDOS
-- =============================================
CREATE TABLE pedidos (
    id                  INT AUTO_INCREMENT PRIMARY KEY,
    id_usuario          INT NOT NULL,
    numero_pedido       VARCHAR(20) UNIQUE NOT NULL,
    entregar_em         DATETIME NULL,
    retirada_local      TINYINT(1) DEFAULT 0,
    status              VARCHAR(30) NOT NULL DEFAULT 'pendente',
    valor_total         DECIMAL(10,2) NOT NULL DEFAULT 0.00,
    nome_cliente        VARCHAR(150),
    endereco            TEXT,
    email               VARCHAR(150),
    telefone_whatsapp   VARCHAR(30),
    criado_em           DATETIME DEFAULT CURRENT_TIMESTAMP,
    excluido_em         DATETIME NULL,
    
    FOREIGN KEY (id_usuario) REFERENCES usuarios(id)
        ON DELETE RESTRICT
        ON UPDATE CASCADE
) ENGINE=InnoDB;

-- =============================================
-- 5. PEDIDOS_PRODUTOS (Itens do Pedido)
-- =============================================
CREATE TABLE pedidos_produtos (
    id              INT AUTO_INCREMENT PRIMARY KEY,
    id_pedido       INT NOT NULL,
    id_produto      INT NOT NULL,
    quantidade      INT NOT NULL,
    observacao      VARCHAR(255),
    preco_unitario  DECIMAL(10,2) NOT NULL,
    subtotal_item   DECIMAL(10,2) NOT NULL,
    
    FOREIGN KEY (id_pedido)  REFERENCES pedidos(id)   ON DELETE CASCADE,
    FOREIGN KEY (id_produto) REFERENCES produtos(id) ON DELETE RESTRICT
) ENGINE=InnoDB;

-- =============================================
-- 6. PAGAMENTOS
-- =============================================
CREATE TABLE pagamentos (
    id                  INT AUTO_INCREMENT PRIMARY KEY,
    id_pedido           INT NOT NULL,
    id_pagamento_mp     VARCHAR(100) NULL,
    status              VARCHAR(50) NOT NULL,
    detalhe_status      VARCHAR(255),
    valor               DECIMAL(10,2) NOT NULL,
    metodo_pagamento    VARCHAR(50),
    tipo_pagamento      VARCHAR(50),
    aprovado_em         DATETIME NULL,
    criado_em           DATETIME DEFAULT CURRENT_TIMESTAMP,
    
    FOREIGN KEY (id_pedido) REFERENCES pedidos(id)
        ON DELETE CASCADE
        ON UPDATE CASCADE
) ENGINE=InnoDB;

-- =============================================
-- ÍNDICES ADICIONAIS para melhor performance
-- =============================================
CREATE INDEX idx_produtos_categoria ON produtos(id_categoria);
CREATE INDEX idx_pedidos_usuario ON pedidos(id_usuario);
CREATE INDEX idx_pedidos_status ON pedidos(status);
CREATE INDEX idx_pedidos_numero ON pedidos(numero_pedido);
CREATE INDEX idx_pedidos_produtos_pedido ON pedidos_produtos(id_pedido);
CREATE INDEX idx_pedidos_produtos_produto ON pedidos_produtos(id_produto);
CREATE INDEX idx_pagamentos_pedido ON pagamentos(id_pedido);
CREATE INDEX idx_categorias_pai ON categorias(id_categoria_pai);