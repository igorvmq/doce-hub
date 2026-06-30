-- =============================================
-- POPULAÇÃO DE DADOS - CONFEITARIA (COM LIMPEZA)
-- =============================================



-- =============================================
-- 1. LIMPEZA DO BANCO (Remove todos os dados)
-- =============================================
SET FOREIGN_KEY_CHECKS = 0;  -- Desabilita verificação de chaves estrangeiras temporariamente

TRUNCATE TABLE pagamentos;
TRUNCATE TABLE pedidos_produtos;
TRUNCATE TABLE pedidos;
TRUNCATE TABLE produtos;
TRUNCATE TABLE categorias;
TRUNCATE TABLE usuarios;

SET FOREIGN_KEY_CHECKS = 1;  -- Reabilita verificação de chaves estrangeiras

-- =============================================
-- 2. CATEGORIAS
-- =============================================
INSERT INTO categorias (nome) VALUES
('Bolos'),
('Doces Finos'),
('Salgados'),
('Bebidas'),
('Sobremesas Geladas'),
('Pães e Massas');

INSERT INTO categorias (id_categoria_pai, nome) VALUES
(1, 'Bolos de Aniversário'),
(1, 'Bolos de Fatia'),
(2, 'Brigadeiros Gourmet'),
(2, 'Bem-casados'),
(3, 'Salgados Assados'),
(3, 'Salgados Fritos');

-- =============================================
-- 3. PRODUTOS
-- =============================================
INSERT INTO produtos (id_categoria, nome, descricao, preco, imagem_url) VALUES
(2, 'Bolo de Chocolate com Nutella', 'Bolo de chocolate com recheio de Nutella e ganache', 89.90, 'https://exemplo.com/bolo-chocolate.jpg'),
(2, 'Bolo Red Velvet', 'Bolo red velvet com cream cheese frosting', 95.50, NULL),
(3, 'Bolo de Cenoura com Chocolate', 'Bolo de cenoura tradicional com cobertura de chocolate', 75.00, NULL),
(8, 'Brigadeiro Gourmet Tradicional', 'Caixa com 12 unidades', 28.90, NULL),
(8, 'Brigadeiro de Pistache', 'Caixa com 12 unidades', 35.90, NULL),
(9, 'Bem-casado de Doce de Leite', 'Pacote com 20 unidades', 42.00, NULL),
(11, 'Coxinha de Frango', 'Unidade - massa crocante', 6.50, NULL),
(11, 'Pão de Queijo', 'Pacote com 20 unidades', 22.90, NULL),
(5, 'Torta de Limão', 'Torta gelada de limão com base de biscoito', 68.00, NULL),
(5, 'Pudim de Leite Condensado', 'Pudim tradicional (médio)', 45.00, NULL),
(1, 'Bolo de Noiva 2 andares', 'Bolo elegante para casamento', 450.00, NULL),
(6, 'Água de Coco 500ml', 'Água de coco natural', 8.90, NULL),
(6, 'Suco de Laranja Natural', 'Copo 300ml', 12.50, NULL);

-- =============================================
-- 4. USUÁRIOS (Clientes)
-- =============================================
INSERT INTO usuarios (nome, email, telefone_whatsapp, senha_hash, endereco) VALUES
('Ana Clara Mendes', 'ana.mendes@email.com', '51998765432', '$2y$10$exemploHashAna123', 'Rua das Flores, 123 - Porto Alegre'),
('João Pedro Silva', 'joao.silva@email.com', '51987654321', '$2y$10$exemploHashJoao456', 'Av. Ipiranga, 450 - Porto Alegre'),
('Mariana Costa', 'mariana.costa@email.com', '51999887766', '$2y$10$exemploHashMari789', 'Rua 24 de Outubro, 567 - Canoas'),
('Lucas Ferreira', 'lucas.ferreira@email.com', '51933445566', '$2y$10$exemploHashLucas999', 'Rua Borges de Medeiros, 890 - Gravataí'),
('Camila Rocha', 'camila.rocha@email.com', '51988776655', '$2y$10$exemploHashCamila111', 'Av. Bento Gonçalves, 1234 - Porto Alegre');

-- =============================================
-- 5. PEDIDOS
-- =============================================
INSERT INTO pedidos (id_usuario, numero_pedido, status, valor_total, nome_cliente, endereco, email, telefone_whatsapp, entregar_em, retirada_local) VALUES
(1, 'PED2026001', 'entregue',  168.40, 'Ana Clara Mendes', 'Rua das Flores, 123', 'ana.mendes@email.com', '51998765432', '2026-05-10 14:30:00', 0),
(2, 'PED2026002', 'entregue',   89.90, 'João Pedro Silva', 'Av. Ipiranga, 450', 'joao.silva@email.com', '51987654321', '2026-05-12 11:00:00', 0),
(3, 'PED2026003', 'preparando',  98.40, 'Mariana Costa',   'Rua 24 de Outubro, 567', 'mariana.costa@email.com', '51999887766', NULL, 1),
(4, 'PED2026004', 'pago',       142.30, 'Lucas Ferreira',  'Rua Borges de Medeiros, 890', 'lucas.ferreira@email.com', '51933445566', '2026-05-20 16:00:00', 0),
(1, 'PED2026005', 'pendente',    75.00, 'Ana Clara Mendes', 'Rua das Flores, 123', 'ana.mendes@email.com', '51998765432', NULL, 0),
(5, 'PED2026006', 'entregue',   312.90, 'Camila Rocha',    'Av. Bento Gonçalves, 1234', 'camila.rocha@email.com', '51988776655', '2026-05-15 15:00:00', 0);

-- =============================================
-- 6. ITENS DOS PEDIDOS (pedidos_produtos)
-- =============================================
INSERT INTO pedidos_produtos (id_pedido, id_produto, quantidade, preco_unitario, subtotal_item, observacao) VALUES
(1, 1, 1, 89.90,  89.90,  'Com parabéns escrito'),
(1, 8, 1, 28.90,  28.90,  NULL),
(1,11, 2, 6.50,   13.00,  'Bem quentinhas'),
(1, 9, 1, 68.00,  68.00,  NULL),   -- Torta de Limão

(2, 1, 1, 89.90,  89.90, NULL),

(3, 3, 1, 75.00,  75.00, NULL),
(3, 8, 1, 28.90,  28.90, NULL),

(4, 2, 1, 95.50,  95.50, NULL),
(4,12, 2, 22.90,  45.80, NULL),

(5, 3, 1, 75.00,  75.00, 'Sem cobertura extra'),

(6,11, 1, 450.00,450.00, 'Bolo de noiva'),
(6, 8, 2, 28.90,  57.80, NULL),
(6, 9, 1, 42.00,  42.00, NULL),
(6, 9, 1, 68.00,  68.00, NULL);   -- Torta de Limão (corrigido id)

-- =============================================
-- 7. PAGAMENTOS
-- =============================================
INSERT INTO pagamentos (id_pedido, id_pagamento_mp, status, valor, metodo_pagamento, tipo_pagamento, aprovado_em) VALUES
(1, 'MP-123456789', 'approved', 168.40, 'pix', 'à vista', '2026-05-10 10:15:00'),
(2, 'MP-987654321', 'approved',  89.90, 'credito', 'à vista', '2026-05-12 09:45:00'),
(3, 'MP-555444333', 'approved',  98.40, 'pix', 'à vista', '2026-05-18 08:20:00'),
(4, NULL,           'pending',  142.30, 'credito', 'parcelado_3x', NULL),
(5, NULL,           'pending',   75.00, 'pix', 'à vista', NULL),
(6, 'MP-111222333', 'approved', 312.90, 'pix', 'à vista', '2026-05-14 14:30:00');

-- =============================================
-- Atualiza valor_total dos pedidos (segurança)
-- =============================================
UPDATE pedidos p
JOIN (
    SELECT id_pedido, SUM(subtotal_item) as total
    FROM pedidos_produtos
    GROUP BY id_pedido
) pp ON p.id = pp.id_pedido
SET p.valor_total = pp.total;

SELECT '✅ Banco limpo e populado com sucesso!' AS Mensagem;