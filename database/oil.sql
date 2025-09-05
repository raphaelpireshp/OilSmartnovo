-- Criação do banco de dados OilSmart
CREATE DATABASE IF NOT EXISTS Oil;
USE Oil;

-- Tabela de usuários
CREATE TABLE usuario (
    id INT AUTO_INCREMENT PRIMARY KEY,
    nome VARCHAR(100) NOT NULL,
    email VARCHAR(100) NOT NULL UNIQUE,
    senha VARCHAR(255) NOT NULL,
    tipo ENUM('cliente', 'oficina', 'funcionario') NOT NULL,
    telefone VARCHAR(20),
    cpf VARCHAR(14) UNIQUE NULL,
    cnpj VARCHAR(18) UNIQUE NULL,
    endereco VARCHAR(255),
    cep VARCHAR(9),
    cidade VARCHAR(100),
    estado VARCHAR(2),
    data_cadastro DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Tabela de marcas de veículos
CREATE TABLE marca (
    id INT AUTO_INCREMENT PRIMARY KEY,
    nome VARCHAR(100) NOT NULL UNIQUE
);

-- Tabela de modelos de veículos
CREATE TABLE modelo (
    id INT AUTO_INCREMENT PRIMARY KEY,
    nome VARCHAR(100) NOT NULL,
    marca_id INT NOT NULL,
    tipo ENUM('carro', 'moto') NOT NULL,
    FOREIGN KEY (marca_id) REFERENCES marca(id) ON DELETE CASCADE
);

-- Tabela de anos dos modelos
CREATE TABLE modelo_ano (
    id INT AUTO_INCREMENT PRIMARY KEY,
    modelo_id INT NOT NULL,
    ano INT NOT NULL,
    FOREIGN KEY (modelo_id) REFERENCES modelo(id) ON DELETE CASCADE
);

-- Tabela de veículos dos clientes
CREATE TABLE veiculo (
    id INT AUTO_INCREMENT PRIMARY KEY,
    usuario_id INT NOT NULL,
    modelo_ano_id INT NOT NULL,
    placa VARCHAR(10),
    quilometragem INT,
    data_cadastro DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (usuario_id) REFERENCES usuario(id) ON DELETE CASCADE,
    FOREIGN KEY (modelo_ano_id) REFERENCES modelo_ano(id) ON DELETE CASCADE
);

-- Tabela de oficinas
CREATE TABLE oficina (
    id INT AUTO_INCREMENT PRIMARY KEY,
    usuario_id INT NOT NULL,
    nome VARCHAR(100) NOT NULL,
    cep VARCHAR(9) NOT NULL,
    endereco VARCHAR(255),
    cidade VARCHAR(100),
    estado VARCHAR(2),
    horario_abertura TIME,
    horario_fechamento TIME,
    dias_funcionamento VARCHAR(50),
    lat DECIMAL(10,8),
    lng DECIMAL(11,8),
    FOREIGN KEY (usuario_id) REFERENCES usuario(id) ON DELETE CASCADE
);

-- Tabela de funcionários
CREATE TABLE funcionario (
    id INT AUTO_INCREMENT PRIMARY KEY,
    usuario_id INT NOT NULL,
    oficina_id INT NOT NULL,
    cargo VARCHAR(50),
    FOREIGN KEY (usuario_id) REFERENCES usuario(id) ON DELETE CASCADE,
    FOREIGN KEY (oficina_id) REFERENCES oficina(id) ON DELETE CASCADE
);

-- Tabela de produtos (óleos)
CREATE TABLE produto_oleo (
    id INT AUTO_INCREMENT PRIMARY KEY,
    nome VARCHAR(100) NOT NULL,
    tipo ENUM('carro', 'moto') NOT NULL,
    viscosidade VARCHAR(20),
    especificacao VARCHAR(255),
    marca VARCHAR(100),
    preco DECIMAL(10,2) DEFAULT 0
);

-- Tabela de produtos (filtros)
CREATE TABLE produto_filtro (
    id INT AUTO_INCREMENT PRIMARY KEY,
    nome VARCHAR(100) NOT NULL,
    tipo ENUM('carro', 'moto') NOT NULL,
    compatibilidade_modelo VARCHAR(255),
    preco DECIMAL(10,2) DEFAULT 0
);

-- Tabela de estoque
CREATE TABLE estoque (
    id INT AUTO_INCREMENT PRIMARY KEY,
    oficina_id INT NOT NULL,
    produto_id INT NOT NULL,
    tipo_produto ENUM('oleo', 'filtro') NOT NULL,
    quantidade INT NOT NULL DEFAULT 0,
    FOREIGN KEY (oficina_id) REFERENCES oficina(id) ON DELETE CASCADE
);

-- Tabela de recomendações
CREATE TABLE recomendacao (
    id INT AUTO_INCREMENT PRIMARY KEY,
    modelo_ano_id INT NOT NULL,
    oleo_id INT,
    filtro_id INT,
    FOREIGN KEY (modelo_ano_id) REFERENCES modelo_ano(id) ON DELETE CASCADE,
    FOREIGN KEY (oleo_id) REFERENCES produto_oleo(id) ON DELETE SET NULL,
    FOREIGN KEY (filtro_id) REFERENCES produto_filtro(id) ON DELETE SET NULL
);

-- Tabela de agendamentos
CREATE TABLE agendamento (
    id INT AUTO_INCREMENT PRIMARY KEY,
    cliente_id INT NOT NULL,
    oficina_id INT NOT NULL,
    veiculo_id INT NOT NULL,
    funcionario_id INT,
    data_agendamento DATETIME NOT NULL,
    status ENUM('pendente', 'confirmado', 'cancelado', 'concluido') DEFAULT 'pendente',
    codigo_confirmacao VARCHAR(10) UNIQUE,
    data_criacao DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (cliente_id) REFERENCES usuario(id) ON DELETE CASCADE,
    FOREIGN KEY (oficina_id) REFERENCES oficina(id) ON DELETE CASCADE,
    FOREIGN KEY (veiculo_id) REFERENCES veiculo(id) ON DELETE CASCADE,
    FOREIGN KEY (funcionario_id) REFERENCES funcionario(id) ON DELETE SET NULL
);

-- Tabela de divergências
CREATE TABLE divergencia (
    id INT AUTO_INCREMENT PRIMARY KEY,
    agendamento_id INT NOT NULL,
    descricao TEXT NOT NULL,
    resolvido BOOLEAN DEFAULT FALSE,
    data_criacao DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (agendamento_id) REFERENCES agendamento(id) ON DELETE CASCADE
);

-- ========================================
-- INSERÇÃO DE DADOS INICIAIS
-- ========================================

-- Inserir usuários administradores das oficinas
INSERT INTO usuario (nome, email, senha, tipo, telefone, cnpj) VALUES 
("Oficina Norte", "adm_norte@motul.com", "$2a$10$xJwL5v5z5U6ZU5Z5Z5Z5Zu", "oficina", "(11) 1234-5678", "12.345.678/0001-90"),
("Oficina Sul", "adm_sul@motul.com", "$2a$10$xJwL5v5z5U6ZU5Z5Z5Z5Zu", "oficina", "(11) 2345-6789", "23.456.789/0001-01"),
("Oficina Leste", "adm_leste@motul.com", "$2a$10$xJwL5v5z5U6ZU5Z5Z5Z5Zu", "oficina", "(11) 3456-7890", "34.567.890/0001-12");

-- Inserir oficinas
INSERT INTO oficina (usuario_id, nome, cep, endereco, cidade, estado, horario_abertura, horario_fechamento, dias_funcionamento, lat, lng) VALUES 
(1, "Motul Oficina Norte", "02430-000", "Rua Exemplo Norte, 123", "São Paulo", "SP", "08:00:00", "17:00:00", "Seg-Sex", -23.550520, -46.633308),
(2, "Motul Oficina Sul", "04783-100", "Rua Exemplo Sul, 456", "São Paulo", "SP", "09:00:00", "18:00:00", "Seg-Sab", -23.563099, -46.654279),
(3, "Motul Oficina Leste", "03675-040", "Rua Exemplo Leste, 789", "São Paulo", "SP", "10:00:00", "20:00:00", "Seg-Sex", -23.548943, -46.638818);

-- Inserir marcas de veículos
INSERT INTO marca (nome) VALUES 
("Fiat"), ("Ford"), ("Chevrolet"), ("Volkswagen"), ("Toyota"), 
("Honda"), ("Hyundai"), ("Renault"), ("Peugeot"), ("Nissan"), ("Jeep"),
("Yamaha"), ("Suzuki"), ("Kawasaki"), ("Harley-Davidson"),
("BMW"), ("Mercedes-Benz"), ("Audi"), ("Porsche");

-- Inserir modelos de carros
INSERT INTO modelo (nome, marca_id, tipo) VALUES 
("Palio", 1, "carro"), 
("Uno", 1, "carro"), 
("Strada", 1, "carro"), 
("Toro", 1, "carro"),
("Ka", 2, "carro"), 
("Fiesta", 2, "carro"), 
("EcoSport", 2, "carro"), 
("Focus", 2, "carro"),
("Onix", 3, "carro"), 
("Celta", 3, "carro"), 
("Prisma", 3, "carro"), 
("S10", 3, "carro"),
("Gol", 4, "carro"), 
("Voyage", 4, "carro"), 
("Saveiro", 4, "carro"), 
("Polo", 4, "carro"),
("Corolla", 5, "carro"), 
("Hilux", 5, "carro"), 
("Etios", 5, "carro"), 
("Yaris", 5, "carro"),
("Civic", 6, "carro"), 
("Fit", 6, "carro"), 
("HR-V", 6, "carro"), 
("CR-V", 6, "carro"),
("HB20", 7, "carro"), 
("Creta", 7, "carro"), 
("Tucson", 7, "carro"), 
("Santa Fe", 7, "carro"),
("Kwid", 8, "carro"), 
("Sandero", 8, "carro"), 
("Logan", 8, "carro"), 
("Duster", 8, "carro"),
("208", 9, "carro"), 
("2008", 9, "carro"), 
("3008", 9, "carro"), 
("Partner", 9, "carro"),
("March", 10, "carro"), 
("Versa", 10, "carro"), 
("Kicks", 10, "carro"), 
("Frontier", 10, "carro"),
("Renegade", 11, "carro"), 
("Compass", 11, "carro"), 
("Commander", 11, "carro"), 
("Wrangler", 11, "carro"),
("X5", 16, "carro"), 
("S-Class", 17, "carro"), 
("A4", 18, "carro"), 
("911", 19, "carro");

-- Inserir modelos de motos
INSERT INTO modelo (nome, marca_id, tipo) VALUES 
("CG 160", 12, "moto"), 
("Fazer 250", 12, "moto"), 
("MT-03", 12, "moto"), 
("XTZ 250", 12, "moto"),
("Bandit 125", 13, "moto"), 
("Burgman 125", 13, "moto"), 
("GSX-S750", 13, "moto"), 
("V-Strom 650", 13, "moto"),
("Ninja 300", 14, "moto"), 
("Z400", 14, "moto"), 
("Versys 650", 14, "moto"), 
("Z900", 14, "moto"),
("Iron 883", 15, "moto"), 
("Street 750", 15, "moto"), 
("Fat Boy", 15, "moto"), 
("Road King", 15, "moto"),
("CBR 600RR", 6, "moto"), 
("CB 500F", 6, "moto");

-- Inserir anos dos modelos (simplificado para os principais modelos)
INSERT INTO modelo_ano (modelo_id, ano) VALUES 
-- Fiat
(1, 2020), (1, 2021), (1, 2022), (1, 2023), (1, 2024),
(2, 2020), (2, 2021), (2, 2022), (2, 2023), (2, 2024),
(3, 2021), (3, 2022), (3, 2023), (3, 2024),
(4, 2020), (4, 2021), (4, 2022), (4, 2023), (4, 2024),
-- Ford
(5, 2021), (5, 2022), (5, 2023), (5, 2024),
(6, 2020), (6, 2021), (6, 2022), (6, 2023), (6, 2024),
(7, 2021), (7, 2022), (7, 2023), (7, 2024),
(8, 2020), (8, 2021), (8, 2022), (8, 2023), (8, 2024),
-- Chevrolet
(9, 2021), (9, 2022), (9, 2023), (9, 2024),
(10, 2020), (10, 2021), (10, 2022), (10, 2023), (10, 2024),
(11, 2021), (11, 2022), (11, 2023), (11, 2024),
(12, 2020), (12, 2021), (12, 2022), (12, 2023), (12, 2024),
-- Volkswagen
(13, 2020), (13, 2021), (13, 2022), (13, 2023), (13, 2024),
(14, 2020), (14, 2021), (14, 2022), (14, 2023), (14, 2024),
(15, 2020), (15, 2021), (15, 2022), (15, 2023), (15, 2024),
(16, 2020), (16, 2021), (16, 2022), (16, 2023), (16, 2024),
-- Toyota
(17, 2020), (17, 2021), (17, 2022), (17, 2023), (17, 2024),
(18, 2020), (18, 2021), (18, 2022), (18, 2023), (18, 2024),
(19, 2020), (19, 2021), (19, 2022), (19, 2023), (19, 2024),
(20, 2020), (20, 2021), (20, 2022), (20, 2023), (20, 2024),
-- Honda carros
(21, 2020), (21, 2021), (21, 2022), (21, 2023), (21, 2024),
(22, 2020), (22, 2021), (22, 2022), (22, 2023), (22, 2024),
(23, 2020), (23, 2021), (23, 2022), (23, 2023), (23, 2024),
(24, 2020), (24, 2021), (24, 2022), (24, 2023), (24, 2024),
-- Hyundai
(25, 2020), (25, 2021), (25, 2022), (25, 2023), (25, 2024),
(26, 2020), (26, 2021), (26, 2022), (26, 2023), (26, 2024),
(27, 2020), (27, 2021), (27, 2022), (27, 2023), (27, 2024),
(28, 2020), (28, 2021), (28, 2022), (28, 2023), (28, 2024),
-- Renault
(29, 2020), (29, 2021), (29, 2022), (29, 2023), (29, 2024),
(30, 2020), (30, 2021), (30, 2022), (30, 2023), (30, 2024),
(31, 2020), (31, 2021), (31, 2022), (31, 2023), (31, 2024),
(32, 2020), (32, 2021), (32, 2022), (32, 2023), (32, 2024),
-- Peugeot
(33, 2020), (33, 2021), (33, 2022), (33, 2023), (33, 2024),
(34, 2020), (34, 2021), (34, 2022), (34, 2023), (34, 2024),
(35, 2020), (35, 2021), (35, 2022), (35, 2023), (35, 2024),
(36, 2020), (36, 2021), (36, 2022), (36, 2023), (36, 2024),
-- Nissan
(37, 2020), (37, 2021), (37, 2022), (37, 2023), (37, 2024),
(38, 2020), (38, 2021), (38, 2022), (38, 2023), (38, 2024),
(39, 2020), (39, 2021), (39, 2022), (39, 2023), (39, 2024),
(40, 2020), (40, 2021), (40, 2022), (40, 2023), (40, 2024),
-- Jeep
(41, 2020), (41, 2021), (41, 2022), (41, 2023), (41, 2024),
(42, 2020), (42, 2021), (42, 2022), (42, 2023), (42, 2024),
(43, 2020), (43, 2021), (43, 2022), (43, 2023), (43, 2024),
(44, 2020), (44, 2021), (44, 2022), (44, 2023), (44, 2024),
-- BMW, Mercedes, Audi, Porsche
(45, 2020), (45, 2021), (45, 2022), (45, 2023), (45, 2024),
(46, 2020), (46, 2021), (46, 2022), (46, 2023), (46, 2024),
(47, 2020), (47, 2021), (47, 2022), (47, 2023), (47, 2024),
(48, 2020), (48, 2021), (48, 2022), (48, 2023), (48, 2024),
-- Motos Yamaha
(49, 2020), (49, 2021), (49, 2022), (49, 2023), (49, 2024),
(50, 2020), (50, 2021), (50, 2022), (50, 2023), (50, 2024),
(51, 2020), (51, 2021), (51, 2022), (51, 2023), (51, 2024),
(52, 2020), (52, 2021), (52, 2022), (52, 2023), (52, 2024),
-- Motos Suzuki
(53, 2020), (53, 2021), (53, 2022), (53, 2023), (53, 2024),
(54, 2020), (54, 2021), (54, 2022), (54, 2023), (54, 2024),
(55, 2020), (55, 2021), (55, 2022), (55, 2023), (55, 2024),
(56, 2020), (56, 2021), (56, 2022), (56, 2023), (56, 2024),
-- Motos Kawasaki
(57, 2020), (57, 2021), (57, 2022), (57, 2023), (57, 2024),
(58, 2020), (58, 2021), (58, 2022), (58, 2023), (58, 2024),
(59, 2020), (59, 2021), (59, 2022), (59, 2023), (59, 2024),
(60, 2020), (60, 2021), (60, 2022), (60, 2023), (60, 2024),
-- Motos Harley-Davidson
(61, 2020), (61, 2021), (61, 2022), (61, 2023), (61, 2024),
(62, 2020), (62, 2021), (62, 2022), (62, 2023), (62, 2024),
(63, 2020), (63, 2021), (63, 2022), (63, 2023), (63, 2024),
(64, 2020), (64, 2021), (64, 2022), (64, 2023), (64, 2024),
-- Motos Honda
(65, 2020), (65, 2021), (65, 2022), (65, 2023), (65, 2024),
(66, 2020), (66, 2021), (66, 2022), (66, 2023), (66, 2024);

-- Inserção de óleos (DEVE VIR ANTES DAS RECOMENDAÇÕES)
INSERT INTO produto_oleo (nome, tipo, viscosidade, especificacao, marca, preco) VALUES 
("Óleo Sintético 5W-30", "carro", "5W-30", "API SN/CF", "Motul", 85.00),
("Óleo Semissintético 10W-40", "carro", "10W-40", "API SL/CF", "Castrol", 60.00),
("Óleo Sintético 10W-30 Moto", "moto", "10W-30", "JASO MA2", "Mobil", 75.00),
("Óleo Mineral 20W-50", "carro", "20W-50", "API SJ", "Petronas", 45.00),
("Óleo Sintético 5W-40", "carro", "5W-40", "API SN/CF", "Shell", 90.00),
("Óleo Sintético 15W-50 Moto", "moto", "15W-50", "JASO MA2", "Motul", 80.00),
("Óleo Sintético 0W-20", "carro", "0W-20", "API SP", "Idemitsu", 110.00),
("Óleo Sintético 5W-20", "carro", "5W-20", "API SN", "Valvoline", 80.00),
("Óleo Sintético 5W-30 Diesel", "carro", "5W-30", "ACEA C3", "Total", 95.00),
("Óleo Sintético 10W-50 Moto", "moto", "10W-50", "JASO MA2", "Castrol", 85.00),
("Óleo Sintético 0W-30", "carro", "0W-30", "API SP", "Motul", 120.00),
("Óleo Sintético 5W-50", "carro", "5W-50", "API SN", "Shell", 100.00),
("Óleo Semissintético 15W-40", "carro", "15W-40", "API SL", "Petronas", 55.00),
("Óleo Sintético 10W-40 Moto", "moto", "10W-40", "JASO MA2", "Yamaha", 70.00),
("Óleo Sintético 20W-50 Moto", "moto", "20W-50", "JASO MA2", "Honda", 65.00);

-- Inserção de filtros (DEVE VIR ANTES DAS RECOMENDAÇÕES)
INSERT INTO produto_filtro (nome, tipo, compatibilidade_modelo, preco) VALUES 
("Filtro de Óleo Universal Carro Pequeno", "carro", "Compatível com Fiat Palio, Uno, VW Gol, Chevrolet Onix", 30.00),
("Filtro de Óleo Universal Carro Médio", "carro", "Compatível com Ford Focus, Honda Civic, Toyota Corolla", 35.00),
("Filtro de Óleo Universal Carro Grande/SUV", "carro", "Compatível com Jeep Compass, Toyota Hilux, Chevrolet S10", 40.00),
("Filtro de Óleo Universal Moto Pequena", "moto", "Compatível com Honda CG 160, Yamaha Fazer 250", 25.00),
("Filtro de Ar Universal Carro Pequeno", "carro", "Compatível com Fiat Palio, Uno, VW Gol, Chevrolet Onix", 45.00),
("Filtro de Ar Universal Carro Médio", "carro", "Compatível com Ford Focus, Honda Civic, Toyota Corolla", 50.00),
("Filtro de Ar Universal Carro Grande/SUV", "carro", "Compatível com Jeep Compass, Toyota Hilux, Chevrolet S10", 55.00),
("Filtro de Ar Universal Moto", "moto", "Compatível com Honda CG 160, Yamaha Fazer 250", 30.00),
("Filtro de Combustível Universal Carro", "carro", "Compatível com a maioria dos carros a gasolina/etanol", 20.00),
("Filtro de Combustível Universal Moto", "moto", "Compatível com a maioria das motos", 18.00),
("Filtro de Cabine Universal Carro", "carro", "Compatível com a maioria dos carros", 60.00),
("Filtro de Óleo Esportivo Carro", "carro", "Compatível com carros esportivos", 70.00),
("Filtro de Ar Esportivo Carro", "carro", "Compatível com carros esportivos", 80.00),
("Filtro de Óleo para Diesel", "carro", "Compatível com veículos a diesel", 45.00),
("Filtro de Ar para Diesel", "carro", "Compatível com veículos a diesel", 50.00),
("Filtro de Óleo Premium Carro", "carro", "Compatível com carros premium", 65.00);

-- Inserção de usuários clientes
INSERT INTO usuario (nome, email, senha, tipo, telefone, cpf, endereco, cep, cidade, estado) VALUES 
("João Silva", "joao.silva@email.com", "$2a$10$xJwL5v5z5U6ZU5Z5Z5Z5Zu", "cliente", "(11) 98765-4321", "111.111.111-11", "Rua A, 1", "01000-001", "São Paulo", "SP"),
("Maria Santos", "maria.santos@email.com", "$2a$10$xJwL5v5z5U6ZU5Z5Z5Z5Zu", "cliente", "(21) 98765-6789", "222.222.222-22", "Rua B, 2", "20000-002", "Rio de Janeiro", "RJ"),
("Lucas Santos", "lucas.santos@email.com", "$2a$10$xJwL5v5z5U6ZU5Z5Z5Z5Zu", "cliente", "(31) 98765-9012", "333.333.333-33", "Rua C, 3", "30000-003", "Belo Horizonte", "MG"),
("Julia Costa", "julia.costa@email.com", "$2a$10$xJwL5v5z5U6ZU5Z5Z5Z5Zu", "cliente", "(41) 98765-3456", "444.444.444-44", "Rua D, 4", "80000-004", "Curitiba", "PR"),
("Gabriel Almeida", "gabriel.almeida@email.com", "$2a$10$xJwL5v5z5U6ZU5Z5Z5Z5Zu", "cliente", "(51) 98765-7890", "555.555.555-55", "Rua E, 5", "90000-005", "Porto Alegre", "RS");

-- Mais usuários de exemplo (oficinas)
INSERT INTO usuario (nome, email, senha, tipo, telefone, cnpj) VALUES 
("Oficina Centro", "adm_centro@motul.com", "$2a$10$xJwL5v5z5U6ZU5Z5Z5Z5Zu", "oficina", "(11) 4567-8901", "45.678.901/0001-23"),
("Oficina Oeste", "adm_oeste@motul.com", "$2a$10$xJwL5v5z5U6ZU5Z5Z5Z5Zu", "oficina", "(11) 5678-9012", "56.789.012/0001-34");

-- Mais oficinas (associando aos usuários recém-criados)
INSERT INTO oficina (usuario_id, nome, cep, endereco, cidade, estado, horario_abertura, horario_fechamento, dias_funcionamento, lat, lng) VALUES 
(9, "Motul Oficina Centro", "01000-000", "Rua do Centro, 100", "São Paulo", "SP", "08:30:00", "17:30:00", "Seg-Sex", -23.550520, -46.633308),
(10, "Motul Oficina Oeste", "05000-000", "Av. Oeste, 200", "São Paulo", "SP", "09:00:00", "18:00:00", "Seg-Sab", -23.563099, -46.654279);

-- Mais usuários de exemplo (funcionários)
INSERT INTO usuario (nome, email, senha, tipo, telefone, cpf) VALUES 
("Roberto Carlos", "roberto.carlos@oficinacentro.com", "$2a$10$xJwL5v5z5U6ZU5Z5Z5Z5Zu", "funcionario", "(11) 99887-7766", "666.777.888-99"),
("Patricia Souza", "patricia.souza@oficinaoeste.com", "$2a$10$xJwL5v5z5U6ZU5Z5Z5Z5Zu", "funcionario", "(11) 99776-6655", "777.888.999-00");

-- Mais funcionários (associando aos usuários recém-criados e oficinas)
INSERT INTO funcionario (usuario_id, oficina_id, cargo) VALUES 
(11, 4, "Mecânico"),
(12, 5, "Atendente");

-- RECOMENDAÇÕES (AGORA COM IDs CORRETOS)
-- Fiat (marca_id = 1) - usando óleo 2 e filtro 1
INSERT INTO recomendacao (modelo_ano_id, oleo_id, filtro_id)
SELECT ma.id, 2, 1 FROM modelo_ano ma
JOIN modelo m ON ma.modelo_id = m.id
WHERE m.marca_id = 1 AND m.tipo = "carro";

-- Ford (marca_id = 2) - usando óleo 1 e filtro 2
INSERT INTO recomendacao (modelo_ano_id, oleo_id, filtro_id)
SELECT ma.id, 1, 2 FROM modelo_ano ma
JOIN modelo m ON ma.modelo_id = m.id
WHERE m.marca_id = 2 AND m.tipo = "carro";

-- Chevrolet (marca_id = 3) - usando óleo 2 e filtro 2
INSERT INTO recomendacao (modelo_ano_id, oleo_id, filtro_id)
SELECT ma.id, 2, 2 FROM modelo_ano ma
JOIN modelo m ON ma.modelo_id = m.id
WHERE m.marca_id = 3 AND m.tipo = "carro";

-- Volkswagen (marca_id = 4) - usando óleo 1 e filtro 1
INSERT INTO recomendacao (modelo_ano_id, oleo_id, filtro_id)
SELECT ma.id, 1, 1 FROM modelo_ano ma
JOIN modelo m ON ma.modelo_id = m.id
WHERE m.marca_id = 4 AND m.tipo = "carro";

-- Toyota (marca_id = 5) - usando óleo 5 e filtro 2
INSERT INTO recomendacao (modelo_ano_id, oleo_id, filtro_id)
SELECT ma.id, 5, 2 FROM modelo_ano ma
JOIN modelo m ON ma.modelo_id = m.id
WHERE m.marca_id = 5 AND m.tipo = "carro";

-- Honda carros (marca_id = 6) - usando óleo 5 e filtro 2
INSERT INTO recomendacao (modelo_ano_id, oleo_id, filtro_id)
SELECT ma.id, 5, 2 FROM modelo_ano ma
JOIN modelo m ON ma.modelo_id = m.id
WHERE m.marca_id = 6 AND m.tipo = "carro";

-- Honda motos (marca_id = 6) - usando óleo 3 e filtro 4
INSERT INTO recomendacao (modelo_ano_id, oleo_id, filtro_id)
SELECT ma.id, 3, 4 FROM modelo_ano ma
JOIN modelo m ON ma.modelo_id = m.id
WHERE m.marca_id = 6 AND m.tipo = "moto";

-- Hyundai (marca_id = 7) - usando óleo 1 e filtro 2
INSERT INTO recomendacao (modelo_ano_id, oleo_id, filtro_id)
SELECT ma.id, 1, 2 FROM modelo_ano ma
JOIN modelo m ON ma.modelo_id = m.id
WHERE m.marca_id = 7 AND m.tipo = "carro";

-- Renault (marca_id = 8) - usando óleo 2 e filtro 1
INSERT INTO recomendacao (modelo_ano_id, oleo_id, filtro_id)
SELECT ma.id, 2, 1 FROM modelo_ano ma
JOIN modelo m ON ma.modelo_id = m.id
WHERE m.marca_id = 8 AND m.tipo = "carro";

-- Peugeot (marca_id = 9) - usando óleo 5 e filtro 2
INSERT INTO recomendacao (modelo_ano_id, oleo_id, filtro_id)
SELECT ma.id, 5, 2 FROM modelo_ano ma
JOIN modelo m ON ma.modelo_id = m.id
WHERE m.marca_id = 9 AND m.tipo = "carro";

-- Nissan (marca_id = 10) - usando óleo 5 e filtro 2
INSERT INTO recomendacao (modelo_ano_id, oleo_id, filtro_id)
SELECT ma.id, 5, 2 FROM modelo_ano ma
JOIN modelo m ON ma.modelo_id = m.id
WHERE m.marca_id = 10 AND m.tipo = "carro";

-- Jeep (marca_id = 11) - usando óleo 5 e filtro 3
INSERT INTO recomendacao (modelo_ano_id, oleo_id, filtro_id)
SELECT ma.id, 5, 3 FROM modelo_ano ma
JOIN modelo m ON ma.modelo_id = m.id
WHERE m.marca_id = 11 AND m.tipo = "carro";

-- Yamaha (marca_id = 12) - usando óleo 3 e filtro 4
INSERT INTO recomendacao (modelo_ano_id, oleo_id, filtro_id)
SELECT ma.id, 3, 4 FROM modelo_ano ma
JOIN modelo m ON ma.modelo_id = m.id
WHERE m.marca_id = 12 AND m.tipo = "moto";

-- Suzuki (marca_id = 13) - usando óleo 3 e filtro 4
INSERT INTO recomendacao (modelo_ano_id, oleo_id, filtro_id)
SELECT ma.id, 3, 4 FROM modelo_ano ma
JOIN modelo m ON ma.modelo_id = m.id
WHERE m.marca_id = 13 AND m.tipo = "moto";

-- Kawasaki (marca_id = 14) - usando óleo 3 e filtro 4
INSERT INTO recomendacao (modelo_ano_id, oleo_id, filtro_id)
SELECT ma.id, 3, 4 FROM modelo_ano ma
JOIN modelo m ON ma.modelo_id = m.id
WHERE m.marca_id = 14 AND m.tipo = "moto";

-- Harley-Davidson (marca_id = 15) - usando óleo 6 e filtro 4
INSERT INTO recomendacao (modelo_ano_id, oleo_id, filtro_id)
SELECT ma.id, 6, 4 FROM modelo_ano ma
JOIN modelo m ON ma.modelo_id = m.id
WHERE m.marca_id = 15 AND m.tipo = "moto";

-- BMW (marca_id = 16) - usando óleo 11 e filtro 12
INSERT INTO recomendacao (modelo_ano_id, oleo_id, filtro_id)
SELECT ma.id, 11, 12 FROM modelo_ano ma
JOIN modelo m ON ma.modelo_id = m.id
WHERE m.marca_id = 16 AND m.tipo = "carro";

-- Mercedes-Benz (marca_id = 17) - usando óleo 11 e filtro 12
INSERT INTO recomendacao (modelo_ano_id, oleo_id, filtro_id)
SELECT ma.id, 11, 12 FROM modelo_ano ma
JOIN modelo m ON ma.modelo_id = m.id
WHERE m.marca_id = 17 AND m.tipo = "carro";

-- Audi (marca_id = 18) - usando óleo 11 e filtro 12
INSERT INTO recomendacao (modelo_ano_id, oleo_id, filtro_id)
SELECT ma.id, 11, 12 FROM modelo_ano ma
JOIN modelo m ON ma.modelo_id = m.id
WHERE m.marca_id = 18 AND m.tipo = "carro";

-- Porsche (marca_id = 19) - usando óleo 12 e filtro 12
INSERT INTO recomendacao (modelo_ano_id, oleo_id, filtro_id)
SELECT ma.id, 12, 12 FROM modelo_ano ma
JOIN modelo m ON ma.modelo_id = m.id
WHERE m.marca_id = 19 AND m.tipo = "carro";

-- Estoque para Motul Oficina Norte (id 1)
INSERT INTO estoque (oficina_id, produto_id, tipo_produto, quantidade) VALUES 
(1, 1, 'oleo', 50),
(1, 2, 'oleo', 40),
(1, 1, 'filtro', 60),
(1, 6, 'filtro', 30),
(1, 7, 'oleo', 25),
(1, 9, 'filtro', 45);

-- Estoque para Motul Oficina Sul (id 2)
INSERT INTO estoque (oficina_id, produto_id, tipo_produto, quantidade) VALUES 
(2, 4, 'oleo', 35),
(2, 3, 'oleo', 30),
(2, 2, 'filtro', 50),
(2, 4, 'filtro', 40),
(2, 5, 'oleo', 20),
(2, 11, 'filtro', 35);

-- Estoque para Motul Oficina Leste (id 3)
INSERT INTO estoque (oficina_id, produto_id, tipo_produto, quantidade) VALUES 
(3, 1, 'oleo', 45),
(3, 6, 'oleo', 25),
(3, 3, 'filtro', 55),
(3, 8, 'filtro', 30),
(3, 8, 'oleo', 30),
(3, 12, 'filtro', 20);

-- Estoque para Motul Oficina Centro (id 4)
INSERT INTO estoque (oficina_id, produto_id, tipo_produto, quantidade) VALUES 
(4, 2, 'oleo', 30),
(4, 7, 'oleo', 20),
(4, 1, 'filtro', 40),
(4, 5, 'filtro', 25),
(4, 9, 'oleo', 15),
(4, 10, 'filtro', 30);

-- Estoque para Motul Oficina Oeste (id 5)
INSERT INTO estoque (oficina_id, produto_id, tipo_produto, quantidade) VALUES 
(5, 4, 'oleo', 25),
(5, 10, 'oleo', 15),
(5, 3, 'filtro', 30),
(5, 13, 'filtro', 10),
(5, 5, 'oleo', 20),
(5, 14, 'filtro', 25);

-- Adicione a coluna telefone na tabela oficina
ALTER TABLE oficina ADD COLUMN telefone VARCHAR(20) AFTER estado;

-- Atualize os telefones das oficinas existentes
UPDATE oficina SET telefone = '(11) 3333-0001' WHERE id = 1;
UPDATE oficina SET telefone = '(11) 3333-0002' WHERE id = 2;
UPDATE oficina SET telefone = '(11) 3333-0003' WHERE id = 3;
UPDATE oficina SET telefone = '(11) 3333-0004' WHERE id = 4;
UPDATE oficina SET telefone = '(11) 3333-0005' WHERE id = 5;


-- aaaaaaaaaa
-- Inserir 10 novos usuários para as oficinas
INSERT INTO usuario (nome, email, senha, tipo, telefone, cnpj) VALUES 
("Oficina Paulista", "adm_paulista@motul.com", "$2a$10$xJwL5v5z5U6ZU5Z5Z5Z5Zu", "oficina", "(11) 6789-0123", "67.890.123/0001-45"),
("Oficina Ipiranga", "adm_ipiranga@motul.com", "$2a$10$xJwL5v5z5U6ZU5Z5Z5Z5Zu", "oficina", "(11) 7890-1234", "78.901.234/0001-56"),
("Oficina Tatuapé", "adm_tatuape@motul.com", "$2a$10$xJwL5v5z5U6ZU5Z5Z5Z5Zu", "oficina", "(11) 8901-2345", "89.012.345/0001-67"),
("Oficina Mooca", "adm_mooca@motul.com", "$2a$10$xJwL5v5z5U6ZU5Z5Z5Z5Zu", "oficina", "(11) 9012-3456", "90.123.456/0001-78"),
("Oficina Santana", "adm_santana@motul.com", "$2a$10$xJwL5v5z5U6ZU5Z5Z5Z5Zu", "oficina", "(11) 9123-4567", "91.234.567/0001-89"),
("Oficina Pinheiros", "adm_pinheiros@motul.com", "$2a$10$xJwL5v5z5U6ZU5Z5Z5Z5Zu", "oficina", "(11) 9234-5678", "92.345.678/0001-90"),
("Oficina Vila Madalena", "adm_vilamada@motul.com", "$2a$10$xJwL5v5z5U6ZU5Z5Z5Z5Zu", "oficina", "(11) 9345-6789", "93.456.789/0001-01"),
("Oficina Itaim Bibi", "adm_itaim@motul.com", "$2a$10$xJwL5v5z5U6ZU5Z5Z5Z5Zu", "oficina", "(11) 9456-7890", "94.567.890/0001-12"),
("Oficina Jardins", "adm_jardins@motul.com", "$2a$10$xJwL5v5z5U6ZU5Z5Z5Z5Zu", "oficina", "(11) 9567-8901", "95.678.901/0001-23"),
("Oficina Morumbi", "adm_morumbi@motul.com", "$2a$10$xJwL5v5z5U6ZU5Z5Z5Z5Zu", "oficina", "(11) 9678-9012", "96.789.012/0001-34");

-- Inserir as 10 novas oficinas
INSERT INTO oficina (usuario_id, nome, cep, endereco, cidade, estado, telefone, horario_abertura, horario_fechamento, dias_funcionamento, lat, lng) VALUES 
(13, "Motul Oficina Paulista", "01310-000", "Av. Paulista, 1000", "São Paulo", "SP", "(11) 3333-0006", "08:00:00", "18:00:00", "Seg-Sab", -23.563099, -46.654279),
(14, "Motul Oficina Ipiranga", "04280-000", "Av. Ipiranga, 200", "São Paulo", "SP", "(11) 3333-0007", "08:30:00", "17:30:00", "Seg-Sex", -23.580000, -46.640000),
(15, "Motul Oficina Tatuapé", "03310-000", "Rua Tuiuti, 500", "São Paulo", "SP", "(11) 3333-0008", "09:00:00", "18:00:00", "Seg-Sex", -23.540000, -46.575000),
(16, "Motul Oficina Mooca", "03110-000", "Rua da Mooca, 300", "São Paulo", "SP", "(11) 3333-0009", "08:00:00", "17:00:00", "Seg-Sex", -23.550000, -46.600000),
(17, "Motul Oficina Santana", "02030-000", "Av. Eng. Caetano Álvares, 400", "São Paulo", "SP", "(11) 3333-0010", "08:30:00", "17:30:00", "Seg-Sex", -23.500000, -46.625000),
(18, "Motul Oficina Pinheiros", "05410-000", "Rua dos Pinheiros, 600", "São Paulo", "SP", "(11) 3333-0011", "09:00:00", "19:00:00", "Seg-Sab", -23.565000, -46.690000),
(19, "Motul Oficina Vila Madalena", "05435-000", "Rua Aspicuelta, 700", "São Paulo", "SP", "(11) 3333-0012", "10:00:00", "20:00:00", "Seg-Sab", -23.550000, -46.690000),
(20, "Motul Oficina Itaim Bibi", "04551-000", "Rua João Cachoeira, 800", "São Paulo", "SP", "(11) 3333-0013", "08:00:00", "18:00:00", "Seg-Sex", -23.585000, -46.680000),
(21, "Motul Oficina Jardins", "01410-000", "Alameda Santos, 900", "São Paulo", "SP", "(11) 3333-0014", "08:30:00", "17:30:00", "Seg-Sex", -23.560000, -46.655000),
(22, "Motul Oficina Morumbi", "05710-000", "Av. Morumbi, 1000", "São Paulo", "SP", "(11) 3333-0015", "09:00:00", "18:00:00", "Seg-Sex", -23.600000, -46.700000);

-- Inserir estoque para a Oficina Paulista (id 6)
INSERT INTO estoque (oficina_id, produto_id, tipo_produto, quantidade) VALUES 
(6, 1, 'oleo', 40),
(6, 5, 'oleo', 30),
(6, 2, 'filtro', 50),
(6, 6, 'filtro', 35),
(6, 7, 'oleo', 20),
(6, 9, 'filtro', 40);

-- Inserir estoque para a Oficina Ipiranga (id 7)
INSERT INTO estoque (oficina_id, produto_id, tipo_produto, quantidade) VALUES 
(7, 3, 'oleo', 35),
(7, 8, 'oleo', 25),
(7, 4, 'filtro', 45),
(7, 7, 'filtro', 30),
(7, 10, 'oleo', 15),
(7, 11, 'filtro', 35);

-- Inserir estoque para a Oficina Tatuapé (id 8)
INSERT INTO estoque (oficina_id, produto_id, tipo_produto, quantidade) VALUES 
(8, 2, 'oleo', 45),
(8, 6, 'oleo', 20),
(8, 1, 'filtro', 55),
(8, 5, 'filtro', 25),
(8, 9, 'oleo', 30),
(8, 12, 'filtro', 20);

-- Inserir estoque para a Oficina Mooca (id 9)
INSERT INTO estoque (oficina_id, produto_id, tipo_produto, quantidade) VALUES 
(9, 4, 'oleo', 30),
(9, 7, 'oleo', 25),
(9, 3, 'filtro', 40),
(9, 8, 'filtro', 30),
(9, 11, 'oleo', 20),
(9, 13, 'filtro', 25);

-- Inserir estoque para a Oficina Santana (id 10)
INSERT INTO estoque (oficina_id, produto_id, tipo_produto, quantidade) VALUES 
(10, 1, 'oleo', 50),
(10, 5, 'oleo', 35),
(10, 2, 'filtro', 60),
(10, 6, 'filtro', 40),
(10, 8, 'oleo', 25),
(10, 10, 'filtro', 45);

-- Inserir estoque para a Oficina Pinheiros (id 11)
INSERT INTO estoque (oficina_id, produto_id, tipo_produto, quantidade) VALUES 
(11, 3, 'oleo', 40),
(11, 9, 'oleo', 30),
(11, 4, 'filtro', 50),
(11, 7, 'filtro', 35),
(11, 12, 'oleo', 20),
(11, 14, 'filtro', 30);

-- Inserir estoque para a Oficina Vila Madalena (id 12)
INSERT INTO estoque (oficina_id, produto_id, tipo_produto, quantidade) VALUES 
(12, 2, 'oleo', 35),
(12, 10, 'oleo', 25),
(12, 1, 'filtro', 45),
(12, 5, 'filtro', 30),
(12, 13, 'oleo', 15),
(12, 15, 'filtro', 25);

-- Inserir estoque para a Oficina Itaim Bibi (id 13)
INSERT INTO estoque (oficina_id, produto_id, tipo_produto, quantidade) VALUES 
(13, 5, 'oleo', 45),
(13, 11, 'oleo', 20),
(13, 6, 'filtro', 55),
(13, 12, 'filtro', 25),
(13, 14, 'oleo', 30),
(13, 16, 'filtro', 20);

-- Inserir estoque para a Oficina Jardins (id 14)
INSERT INTO estoque (oficina_id, produto_id, tipo_produto, quantidade) VALUES 
(14, 1, 'oleo', 40),
(14, 7, 'oleo', 30),
(14, 2, 'filtro', 50),
(14, 8, 'filtro', 35),
(14, 15, 'oleo', 20),
(14, 9, 'filtro', 40);

-- Inserir estoque para a Oficina Morumbi (id 15)
INSERT INTO estoque (oficina_id, produto_id, tipo_produto, quantidade) VALUES 
(15, 4, 'oleo', 35),
(15, 8, 'oleo', 25),
(15, 3, 'filtro', 45),
(15, 10, 'filtro', 30),
(15, 16, 'oleo', 15),
(15, 11, 'filtro', 35);



-- segunda leva

-- Inserir 20 novos usuários para as oficinas de regiões periféricas
INSERT INTO usuario (nome, email, senha, tipo, telefone, cnpj) VALUES 
("Oficina Heliópolis", "adm_heliopolis@motul.com", "$2a$10$xJwL5v5z5U6ZU5Z5Z5Z5Zu", "oficina", "(11) 9685-0741", "10.074.100/0001-01"),
("Oficina Paraisópolis", "adm_paraisopolis@motul.com", "$2a$10$xJwL5v5z5U6ZU5Z5Z5Z5Zu", "oficina", "(11) 9685-0742", "10.074.200/0001-02"),
("Oficina Cidade Tiradentes", "adm_tiradentes@motul.com", "$2a$10$xJwL5v5z5U6ZU5Z5Z5Z5Zu", "oficina", "(11) 9685-0743", "10.074.300/0001-03"),
("Oficina Brasilândia", "adm_brasilandia@motul.com", "$2a$10$xJwL5v5z5U6ZU5Z5Z5Z5Zu", "oficina", "(11) 9685-0744", "10.074.400/0001-04"),
("Oficina Capão Redondo", "adm_capao@motul.com", "$2a$10$xJwL5v5z5U6ZU5Z5Z5Z5Zu", "oficina", "(11) 9685-0745", "10.074.500/0001-05"),
("Oficina Grajaú", "adm_grajau@motul.com", "$2a$10$xJwL5v5z5U6ZU5Z5Z5Z5Zu", "oficina", "(11) 9685-0746", "10.074.600/0001-06"),
("Oficina Jardim Angela", "adm_jangela@motul.com", "$2a$10$xJwL5v5z5U6ZU5Z5Z5Z5Zu", "oficina", "(11) 9685-0747", "10.074.700/0001-07"),
("Oficina Cidade Dutra", "adm_dutra@motul.com", "$2a$10$xJwL5v5z5U6ZU5Z5Z5Z5Zu", "oficina", "(11) 9685-0748", "10.074.800/0001-08"),
("Oficina Vila Prudente", "adm_vprudente@motul.com", "$2a$10$xJwL5v5z5U6ZU5Z5Z5Z5Zu", "oficina", "(11) 9685-0749", "10.074.900/0001-09"),
("Oficina Sapopemba", "adm_sapopemba@motul.com", "$2a$10$xJwL5v5z5U6ZU5Z5Z5Z5Zu", "oficina", "(11) 9685-0750", "10.075.000/0001-10"),
("Oficina Itaquera", "adm_itaquera@motul.com", "$2a$10$xJwL5v5z5U6ZU5Z5Z5Z5Zu", "oficina", "(11) 9685-0751", "10.075.100/0001-11"),
("Oficina Cidade Ademar", "adm_ademar@motul.com", "$2a$10$xJwL5v5z5U6ZU5Z5Z5Z5Zu", "oficina", "(11) 9685-0752", "10.075.200/0001-12"),
("Oficina Pedreira", "adm_pedreira@motul.com", "$2a$10$xJwL5v5z5U6ZU5Z5Z5Z5Zu", "oficina", "(11) 9685-0753", "10.075.300/0001-13"),
("Oficina Jardim São Luís", "adm_jsluis@motul.com", "$2a$10$xJwL5v5z5U6ZU5Z5Z5Z5Zu", "oficina", "(11) 9685-0754", "10.075.400/0001-14"),
("Oficina Parelheiros", "adm_parelheiros@motul.com", "$2a$10$xJwL5v5z5U6ZU5Z5Z5Z5Zu", "oficina", "(11) 9685-0755", "10.075.500/0001-15"),
("Oficina Perus", "adm_perus@motul.com", "$2a$10$xJwL5v5z5U6ZU5Z5Z5Z5Zu", "oficina", "(11) 9685-0756", "10.075.600/0001-16"),
("Oficina Jaraguá", "adm_jaragua@motul.com", "$2a$10$xJwL5v5z5U6ZU5Z5Z5Z5Zu", "oficina", "(11) 9685-0757", "10.075.700/0001-17"),
("Oficina São Miguel", "adm_smiguel@motul.com", "$2a$10$xJwL5v5z5U6ZU5Z5Z5Z5Zu", "oficina", "(11) 9685-0758", "10.075.800/0001-18"),
("Oficina Ermelino Matarazzo", "adm_ermelino@motul.com", "$2a$10$xJwL5v5z5U6ZU5Z5Z5Z5Zu", "oficina", "(11) 9685-0759", "10.075.900/0001-19"),
("Oficina Guaianases", "adm_guaianases@motul.com", "$2a$10$xJwL5v5z5U6ZU5Z5Z5Z5Zu", "oficina", "(11) 9685-0760", "10.076.000/0001-20");

-- Inserir as 20 novas oficinas em regiões periféricas
INSERT INTO oficina (usuario_id, nome, cep, endereco, cidade, estado, telefone, horario_abertura, horario_fechamento, dias_funcionamento, lat, lng) VALUES 
(23, "Motul Oficina Heliópolis", "04250-000", "Estrada das Lágrimas, 123", "São Paulo", "SP", "(11) 3333-0016", "08:00:00", "18:00:00", "Seg-Sab", -23.610000, -46.625000),
(24, "Motul Oficina Paraisópolis", "05660-000", "Rua Itamotinga, 456", "São Paulo", "SP", "(11) 3333-0017", "08:30:00", "17:30:00", "Seg-Sex", -23.620000, -46.720000),
(25, "Motul Oficina Cidade Tiradentes", "08450-000", "Av. dos Metalúrgicos, 789", "São Paulo", "SP", "(11) 3333-0018", "09:00:00", "18:00:00", "Seg-Sex", -23.580000, -46.410000),
(26, "Motul Oficina Brasilândia", "02850-000", "Av. Brasilândia, 321", "São Paulo", "SP", "(11) 3333-0019", "08:00:00", "17:00:00", "Seg-Sex", -23.470000, -46.680000),
(27, "Motul Oficina Capão Redondo", "05880-000", "Av. Carlos Caldeira, 654", "São Paulo", "SP", "(11) 3333-0020", "08:30:00", "17:30:00", "Seg-Sex", -23.660000, -46.770000),
(28, "Motul Oficina Grajaú", "04840-000", "Av. Dona Belmira Marin, 987", "São Paulo", "SP", "(11) 3333-0021", "09:00:00", "19:00:00", "Seg-Sab", -23.720000, -46.700000),
(29, "Motul Oficina Jardim Angela", "04950-000", "Av. João Dias, 147", "São Paulo", "SP", "(11) 3333-0022", "10:00:00", "20:00:00", "Seg-Sab", -23.690000, -46.760000),
(30, "Motul Oficina Cidade Dutra", "04810-000", "Av. Senador Teotônio Vilela, 258", "São Paulo", "SP", "(11) 3333-0023", "08:00:00", "18:00:00", "Seg-Sex", -23.700000, -46.680000),
(31, "Motul Oficina Vila Prudente", "03130-000", "Rua Siqueira Bueno, 369", "São Paulo", "SP", "(11) 3333-0024", "08:30:00", "17:30:00", "Seg-Sex", -23.580000, -46.580000),
(32, "Motul Oficina Sapopemba", "03980-000", "Av. Sapopemba, 741", "São Paulo", "SP", "(11) 3333-0025", "09:00:00", "18:00:00", "Seg-Sex", -23.540000, -46.480000),
(33, "Motul Oficina Itaquera", "08250-000", "Av. Itaquera, 852", "São Paulo", "SP", "(11) 3333-0026", "08:00:00", "17:00:00", "Seg-Sex", -23.540000, -46.470000),
(34, "Motul Oficina Cidade Ademar", "04450-000", "Av. Cupecê, 963", "São Paulo", "SP", "(11) 3333-0027", "08:30:00", "17:30:00", "Seg-Sex", -23.690000, -46.700000),
(35, "Motul Oficina Pedreira", "04455-000", "Av. Robert Kennedy, 159", "São Paulo", "SP", "(11) 3333-0028", "09:00:00", "18:00:00", "Seg-Sex", -23.730000, -46.690000),
(36, "Motul Oficina Jardim São Luís", "05840-000", "Av. Washington Luís, 357", "São Paulo", "SP", "(11) 3333-0029", "08:00:00", "18:00:00", "Seg-Sab", -23.650000, -46.750000),
(37, "Motul Oficina Parelheiros", "04890-000", "Estrada de Parelheiros, 486", "São Paulo", "SP", "(11) 3333-0030", "08:30:00", "17:30:00", "Seg-Sex", -23.820000, -46.700000),
(38, "Motul Oficina Perus", "05200-000", "Av. Raimundo Pereira de Magalhães, 753", "São Paulo", "SP", "(11) 3333-0031", "09:00:00", "18:00:00", "Seg-Sex", -23.400000, -46.760000),
(39, "Motul Oficina Jaraguá", "05180-000", "Av. Elísio Teixeira Leite, 264", "São Paulo", "SP", "(11) 3333-0032", "08:00:00", "17:00:00", "Seg-Sex", -23.460000, -46.740000),
(40, "Motul Oficina São Miguel", "08010-000", "Av. Nordestina, 975", "São Paulo", "SP", "(11) 3333-0033", "08:30:00", "17:30:00", "Seg-Sex", -23.500000, -46.440000),
(41, "Motul Oficina Ermelino Matarazzo", "03810-000", "Av. Paranaguá, 681", "São Paulo", "SP", "(11) 3333-0034", "09:00:00", "18:00:00", "Seg-Sex", -23.490000, -46.480000),
(42, "Motul Oficina Guaianases", "08440-000", "Av. Dr. Assis Ribeiro, 294", "São Paulo", "SP", "(11) 3333-0035", "08:00:00", "17:00:00", "Seg-Sex", -23.540000, -46.410000);

-- Inserir estoque para as 20 novas oficinas (cada uma com 6 produtos)
-- Oficina Heliópolis (id 16)
INSERT INTO estoque (oficina_id, produto_id, tipo_produto, quantidade) VALUES 
(16, 2, 'oleo', 35), (16, 4, 'oleo', 40), (16, 1, 'filtro', 50), 
(16, 3, 'filtro', 30), (16, 5, 'oleo', 25), (16, 6, 'filtro', 45);

-- Oficina Paraisópolis (id 17)
INSERT INTO estoque (oficina_id, produto_id, tipo_produto, quantidade) VALUES 
(17, 1, 'oleo', 40), (17, 3, 'oleo', 35), (17, 2, 'filtro', 45), 
(17, 4, 'filtro', 30), (17, 6, 'oleo', 20), (17, 5, 'filtro', 40);

-- Oficina Cidade Tiradentes (id 18)
INSERT INTO estoque (oficina_id, produto_id, tipo_produto, quantidade) VALUES 
(18, 4, 'oleo', 30), (18, 6, 'oleo', 25), (18, 3, 'filtro', 40), 
(18, 5, 'filtro', 35), (18, 7, 'oleo', 20), (18, 8, 'filtro', 30);

-- Oficina Brasilândia (id 19)
INSERT INTO estoque (oficina_id, produto_id, tipo_produto, quantidade) VALUES 
(19, 3, 'oleo', 35), (19, 5, 'oleo', 30), (19, 4, 'filtro', 45), 
(19, 6, 'filtro', 40), (19, 8, 'oleo', 25), (19, 7, 'filtro', 35);

-- Oficina Capão Redondo (id 20)
INSERT INTO estoque (oficina_id, produto_id, tipo_produto, quantidade) VALUES 
(20, 5, 'oleo', 40), (20, 7, 'oleo', 35), (20, 6, 'filtro', 50), 
(20, 8, 'filtro', 30), (20, 9, 'oleo', 20), (20, 10, 'filtro', 40);

-- Oficina Grajaú (id 21)
INSERT INTO estoque (oficina_id, produto_id, tipo_produto, quantidade) VALUES 
(21, 6, 'oleo', 35), (21, 8, 'oleo', 30), (21, 7, 'filtro', 45), 
(21, 9, 'filtro', 40), (21, 10, 'oleo', 25), (21, 11, 'filtro', 35);

-- Oficina Jardim Angela (id 22)
INSERT INTO estoque (oficina_id, produto_id, tipo_produto, quantidade) VALUES 
(22, 7, 'oleo', 40), (22, 9, 'oleo', 35), (22, 8, 'filtro', 50), 
(22, 10, 'filtro', 30), (22, 11, 'oleo', 20), (22, 12, 'filtro', 40);

-- Oficina Cidade Dutra (id 23)
INSERT INTO estoque (oficina_id, produto_id, tipo_produto, quantidade) VALUES 
(23, 8, 'oleo', 35), (23, 10, 'oleo', 30), (23, 9, 'filtro', 45), 
(23, 11, 'filtro', 40), (23, 12, 'oleo', 25), (23, 13, 'filtro', 35);

-- Oficina Vila Prudente (id 24)
INSERT INTO estoque (oficina_id, produto_id, tipo_produto, quantidade) VALUES 
(24, 9, 'oleo', 40), (24, 11, 'oleo', 35), (24, 10, 'filtro', 50), 
(24, 12, 'filtro', 30), (24, 13, 'oleo', 20), (24, 14, 'filtro', 40);

-- Oficina Sapopemba (id 25)
INSERT INTO estoque (oficina_id, produto_id, tipo_produto, quantidade) VALUES 
(25, 10, 'oleo', 35), (25, 12, 'oleo', 30), (25, 11, 'filtro', 45), 
(25, 13, 'filtro', 40), (25, 14, 'oleo', 25), (25, 15, 'filtro', 35);

-- Oficina Itaquera (id 26)
INSERT INTO estoque (oficina_id, produto_id, tipo_produto, quantidade) VALUES 
(26, 11, 'oleo', 40), (26, 13, 'oleo', 35), (26, 12, 'filtro', 50), 
(26, 14, 'filtro', 30), (26, 15, 'oleo', 20), (26, 16, 'filtro', 40);

-- Oficina Cidade Ademar (id 27)
INSERT INTO estoque (oficina_id, produto_id, tipo_produto, quantidade) VALUES 
(27, 12, 'oleo', 35), (27, 14, 'oleo', 30), (27, 13, 'filtro', 45), 
(27, 15, 'filtro', 40), (27, 16, 'oleo', 25), (27, 1, 'filtro', 35);

-- Oficina Pedreira (id 28)
INSERT INTO estoque (oficina_id, produto_id, tipo_produto, quantidade) VALUES 
(28, 13, 'oleo', 40), (28, 15, 'oleo', 35), (28, 14, 'filtro', 50), 
(28, 16, 'filtro', 30), (28, 1, 'oleo', 20), (28, 2, 'filtro', 40);

-- Oficina Jardim São Luís (id 29)
INSERT INTO estoque (oficina_id, produto_id, tipo_produto, quantidade) VALUES 
(29, 14, 'oleo', 35), (29, 16, 'oleo', 30), (29, 15, 'filtro', 45), 
(29, 1, 'filtro', 40), (29, 2, 'oleo', 25), (29, 3, 'filtro', 35);

-- Oficina Parelheiros (id 30)
INSERT INTO estoque (oficina_id, produto_id, tipo_produto, quantidade) VALUES 
(30, 15, 'oleo', 40), (30, 1, 'oleo', 35), (30, 16, 'filtro', 50), 
(30, 2, 'filtro', 30), (30, 3, 'oleo', 20), (30, 4, 'filtro', 40);

-- Oficina Perus (id 31)
INSERT INTO estoque (oficina_id, produto_id, tipo_produto, quantidade) VALUES 
(31, 16, 'oleo', 35), (31, 2, 'oleo', 30), (31, 1, 'filtro', 45), 
(31, 3, 'filtro', 40), (31, 4, 'oleo', 25), (31, 5, 'filtro', 35);

-- Oficina Jaraguá (id 32)
INSERT INTO estoque (oficina_id, produto_id, tipo_produto, quantidade) VALUES 
(32, 1, 'oleo', 40), (32, 3, 'oleo', 35), (32, 2, 'filtro', 50), 
(32, 4, 'filtro', 30), (32, 5, 'oleo', 20), (32, 6, 'filtro', 40);

-- Oficina São Miguel (id 33)
INSERT INTO estoque (oficina_id, produto_id, tipo_produto, quantidade) VALUES 
(33, 2, 'oleo', 35), (33, 4, 'oleo', 30), (33, 3, 'filtro', 45), 
(33, 5, 'filtro', 40), (33, 6, 'oleo', 25), (33, 7, 'filtro', 35);

-- Oficina Ermelino Matarazzo (id 34)
INSERT INTO estoque (oficina_id, produto_id, tipo_produto, quantidade) VALUES 
(34, 3, 'oleo', 40), (34, 5, 'oleo', 35), (34, 4, 'filtro', 50), 
(34, 6, 'filtro', 30), (34, 7, 'oleo', 20), (34, 8, 'filtro', 40);

-- Oficina Guaianases (id 35)
INSERT INTO estoque (oficina_id, produto_id, tipo_produto, quantidade) VALUES 
(35, 4, 'oleo', 35), (35, 6, 'oleo', 30), (35, 5, 'filtro', 45), 
(35, 7, 'filtro', 40), (35, 8, 'oleo', 25), (35, 9, 'filtro', 35);


-- terceiraaaaa

-- Inserir mais óleos
INSERT INTO produto_oleo (nome, tipo, viscosidade, especificacao, marca, preco) VALUES 
("Óleo Sintético 0W-40", "carro", "0W-40", "API SP/ACEA C3", "Motul", 130.00),
("Óleo Semissintético 15W-40", "carro", "15W-40", "API CH-4", "Shell", 70.00),
("Óleo Mineral 10W-30", "carro", "10W-30", "API SL", "Petrobras", 50.00),
("Óleo Sintético 5W-30 Moto", "moto", "5W-30", "JASO MA2", "Mobil", 85.00),
("Óleo Semissintético 20W-50 Moto", "moto", "20W-50", "JASO MA", "Castrol", 65.00),
("Óleo Sintético 5W-40 Diesel", "carro", "5W-40", "API CK-4", "Total", 110.00),
("Óleo Sintético 0W-16", "carro", "0W-16", "API SP", "Idemitsu", 140.00),
("Óleo Semissintético 10W-30 Moto", "moto", "10W-30", "JASO MB", "Yamalube", 75.00),
("Óleo Mineral 15W-40", "carro", "15W-40", "API SJ", "Ipiranga", 55.00),
("Óleo Sintético 5W-50", "carro", "5W-50", "API SN", "Liqui Moly", 120.00);

-- Inserir mais filtros
INSERT INTO produto_filtro (nome, tipo, compatibilidade_modelo, preco) VALUES 
("Filtro de Óleo Específico Fiat", "carro", "Fiat Palio, Uno, Siena, Strada", 32.00),
("Filtro de Óleo Específico Volkswagen", "carro", "VW Gol, Voyage, Saveiro, Polo", 34.00),
("Filtro de Óleo Específico Honda", "carro", "Honda Civic, Fit, City, HR-V", 36.00),
("Filtro de Óleo Específico Toyota", "carro", "Toyota Corolla, Etios, Yaris, Hilux", 38.00),
("Filtro de Ar Específico Fiat", "carro", "Fiat Palio, Uno, Siena, Strada", 48.00),
("Filtro de Ar Específico Volkswagen", "carro", "VW Gol, Voyage, Saveiro, Polo", 52.00),
("Filtro de Ar Específico Honda", "carro", "Honda Civic, Fit, City, HR-V", 56.00),
("Filtro de Ar Específico Toyota", "carro", "Toyota Corolla, Etios, Yaris, Hilux", 58.00),
("Filtro de Combustível Universal Carro", "carro", "Compatível com maioria dos veículos", 22.00),
("Filtro de Cabine com Carvão Ativado", "carro", "Compatível com maioria dos veículos", 65.00),
("Filtro de Óleo Racing", "carro", "Para veículos de alta performance", 85.00),
("Filtro de Ar Esportivo", "carro", "Para veículos esportivos", 90.00),
("Filtro de Óleo para Moto Honda", "moto", "Honda CG, CB, Biz, NXR", 28.00),
("Filtro de Óleo para Moto Yamaha", "moto", "Yamaha Fazer, Factor, Lander", 30.00),
("Filtro de Ar para Moto Universal", "moto", "Compatível com maioria das motos", 35.00);

-- Inserir mais marcas de veículos
INSERT INTO marca (nome) VALUES 
("Kia"), ("Citroën"), ("Mitsubishi"), ("Volvo"), ("Land Rover"),
("JAC"), ("Chery"), ("RAM"), ("Foton"), ("Iveco"), ("Scania");

-- Inserir mais modelos de carros
INSERT INTO modelo (nome, marca_id, tipo) VALUES 
("Sportage", 20, "carro"), ("Sorento", 20, "carro"), ("Cerato", 20, "carro"),
("C4 Cactus", 21, "carro"), ("C4 Lounge", 21, "carro"), ("Aircross", 21, "carro"),
("L200", 22, "carro"), ("Outlander", 22, "carro"), ("Pajero", 22, "carro"),
("XC60", 23, "carro"), ("XC90", 23, "carro"), ("S60", 23, "carro"),
("Discovery", 24, "carro"), ("Range Rover Evoque", 24, "carro"), ("Defender", 24, "carro"),
("J3", 25, "carro"), ("J5", 25, "carro"), ("T40", 25, "carro"),
("Tiggo", 26, "carro"), ("QQ", 26, "carro"), ("Arrizo", 26, "carro"),
("1500", 27, "carro"), ("2500", 27, "carro"), ("3500", 27, "carro"),
("Aumark", 28, "carro"), ("Tunland", 28, "carro"), ("View", 28, "carro"),
("Daily", 29, "carro"), ("Trakker", 29, "carro"), ("Stralis", 29, "carro"),
("P310", 30, "carro"), ("P360", 30, "carro"), ("P410", 30, "carro");

-- Inserir mais modelos de motos
INSERT INTO modelo (nome, marca_id, tipo) VALUES 
("XRE 300", 6, "moto"), ("CB 1000R", 6, "moto"), ("NC 750X", 6, "moto"),
("MT-07", 12, "moto"), ("MT-09", 12, "moto"), ("Ténéré 700", 12, "moto"),
("GSX-R1000", 13, "moto"), ("V-Strom 1000", 13, "moto"), ("Boulevard M109R", 13, "moto"),
("Ninja 650", 14, "moto"), ("Z650", 14, "moto"), ("Vulcan S", 14, "moto"),
("Street Glide", 15, "moto"), ("Road Glide", 15, "moto"), ("Sportster Iron 1200", 15, "moto"),
("S1000RR", 16, "moto"), ("R1250GS", 16, "moto"), ("F850GS", 16, "moto");

-- Inserir anos para os novos modelos
INSERT INTO modelo_ano (modelo_id, ano) VALUES 
-- Kia
(67, 2020), (67, 2021), (67, 2022), (67, 2023), (67, 2024),
(68, 2020), (68, 2021), (68, 2022), (68, 2023), (68, 2024),
(69, 2020), (69, 2021), (69, 2022), (69, 2023), (69, 2024),
-- Citroën
(70, 2020), (70, 2021), (70, 2022), (70, 2023), (70, 2024),
(71, 2020), (71, 2021), (71, 2022), (71, 2023), (71, 2024),
(72, 2020), (72, 2021), (72, 2022), (72, 2023), (72, 2024),
-- Mitsubishi
(73, 2020), (73, 2021), (73, 2022), (73, 2023), (73, 2024),
(74, 2020), (74, 2021), (74, 2022), (74, 2023), (74, 2024),
(75, 2020), (75, 2021), (75, 2022), (75, 2023), (75, 2024),
-- Volvo
(76, 2020), (76, 2021), (76, 2022), (76, 2023), (76, 2024),
(77, 2020), (77, 2021), (77, 2022), (77, 2023), (77, 2024),
(78, 2020), (78, 2021), (78, 2022), (78, 2023), (78, 2024),
-- Land Rover
(79, 2020), (79, 2021), (79, 2022), (79, 2023), (79, 2024),
(80, 2020), (80, 2021), (80, 2022), (80, 2023), (80, 2024),
(81, 2020), (81, 2021), (81, 2022), (81, 2023), (81, 2024),
-- JAC
(82, 2020), (82, 2021), (82, 2022), (82, 2023), (82, 2024),
(83, 2020), (83, 2021), (83, 2022), (83, 2023), (83, 2024),
(84, 2020), (84, 2021), (84, 2022), (84, 2023), (84, 2024),
-- Chery
(85, 2020), (85, 2021), (85, 2022), (85, 2023), (85, 2024),
(86, 2020), (86, 2021), (86, 2022), (86, 2023), (86, 2024),
(87, 2020), (87, 2021), (87, 2022), (87, 2023), (87, 2024),
-- RAM
(88, 2020), (88, 2021), (88, 2022), (88, 2023), (88, 2024),
(89, 2020), (89, 2021), (89, 2022), (89, 2023), (89, 2024),
(90, 2020), (90, 2021), (90, 2022), (90, 2023), (90, 2024),
-- Foton
(91, 2020), (91, 2021), (91, 2022), (91, 2023), (91, 2024),
(92, 2020), (92, 2021), (92, 2022), (92, 2023), (92, 2024),
(93, 2020), (93, 2021), (93, 2022), (93, 2023), (93, 2024),
-- Iveco
(94, 2020), (94, 2021), (94, 2022), (94, 2023), (94, 2024),
(95, 2020), (95, 2021), (95, 2022), (95, 2023), (95, 2024),
(96, 2020), (96, 2021), (96, 2022), (96, 2023), (96, 2024),
-- Scania
(97, 2020), (97, 2021), (97, 2022), (97, 2023), (97, 2024),
(98, 2020), (98, 2021), (98, 2022), (98, 2023), (98, 2024),
(99, 2020), (99, 2021), (99, 2022), (99, 2023), (99, 2024),
-- Novas motos Honda
(100, 2020), (100, 2021), (100, 2022), (100, 2023), (100, 2024),
(101, 2020), (101, 2021), (101, 2022), (101, 2023), (101, 2024),
(102, 2020), (102, 2021), (102, 2022), (102, 2023), (102, 2024),
-- Novas motos Yamaha
(103, 2020), (103, 2021), (103, 2022), (103, 2023), (103, 2024),
(104, 2020), (104, 2021), (104, 2022), (104, 2023), (104, 2024),
(105, 2020), (105, 2021), (105, 2022), (105, 2023), (105, 2024),
-- Novas motos Suzuki
(106, 2020), (106, 2021), (106, 2022), (106, 2023), (106, 2024),
(107, 2020), (107, 2021), (107, 2022), (107, 2023), (107, 2024),
(108, 2020), (108, 2021), (108, 2022), (108, 2023), (108, 2024),
-- Novas motos Kawasaki
(109, 2020), (109, 2021), (109, 2022), (109, 2023), (109, 2024),
(110, 2020), (110, 2021), (110, 2022), (110, 2023), (110, 2024),
(111, 2020), (111, 2021), (111, 2022), (111, 2023), (111, 2024),
-- Novas motos Harley-Davidson
(112, 2020), (112, 2021), (112, 2022), (112, 2023), (112, 2024),
(113, 2020), (113, 2021), (113, 2022), (113, 2023), (113, 2024),
(114, 2020), (114, 2021), (114, 2022), (114, 2023), (114, 2024),
-- Novas motos BMW
(115, 2020), (115, 2021), (115, 2022), (115, 2023), (115, 2024),
(116, 2020), (116, 2021), (116, 2022), (116, 2023), (116, 2024),
(117, 2020), (117, 2021), (117, 2022), (117, 2023), (117, 2024);

-- Adicionar recomendações para os novos modelos
-- Kia (marca_id = 20) - usando óleo 1 e filtro 2
INSERT INTO recomendacao (modelo_ano_id, oleo_id, filtro_id)
SELECT ma.id, 1, 2 FROM modelo_ano ma
JOIN modelo m ON ma.modelo_id = m.id
WHERE m.marca_id = 20 AND m.tipo = "carro";

-- Citroën (marca_id = 21) - usando óleo 5 e filtro 2
INSERT INTO recomendacao (modelo_ano_id, oleo_id, filtro_id)
SELECT ma.id, 5, 2 FROM modelo_ano ma
JOIN modelo m ON ma.modelo_id = m.id
WHERE m.marca_id = 21 AND m.tipo = "carro";

-- Mitsubishi (marca_id = 22) - usando óleo 1 e filtro 2
INSERT INTO recomendacao (modelo_ano_id, oleo_id, filtro_id)
SELECT ma.id, 1, 2 FROM modelo_ano ma
JOIN modelo m ON ma.modelo_id = m.id
WHERE m.marca_id = 22 AND m.tipo = "carro";

-- Volvo (marca_id = 23) - usando óleo 11 e filtro 12
INSERT INTO recomendacao (modelo_ano_id, oleo_id, filtro_id)
SELECT ma.id, 11, 12 FROM modelo_ano ma
JOIN modelo m ON ma.modelo_id = m.id
WHERE m.marca_id = 23 AND m.tipo = "carro";

-- Land Rover (marca_id = 24) - usando óleo 11 e filtro 12
INSERT INTO recomendacao (modelo_ano_id, oleo_id, filtro_id)
SELECT ma.id, 11, 12 FROM modelo_ano ma
JOIN modelo m ON ma.modelo_id = m.id
WHERE m.marca_id = 24 AND m.tipo = "carro";

-- JAC (marca_id = 25) - usando óleo 2 e filtro 1
INSERT INTO recomendacao (modelo_ano_id, oleo_id, filtro_id)
SELECT ma.id, 2, 1 FROM modelo_ano ma
JOIN modelo m ON ma.modelo_id = m.id
WHERE m.marca_id = 25 AND m.tipo = "carro";

-- Chery (marca_id = 26) - usando óleo 2 e filtro 1
INSERT INTO recomendacao (modelo_ano_id, oleo_id, filtro_id)
SELECT ma.id, 2, 1 FROM modelo_ano ma
JOIN modelo m ON ma.modelo_id = m.id
WHERE m.marca_id = 26 AND m.tipo = "carro";

-- RAM (marca_id = 27) - usando óleo 6 e filtro 14
INSERT INTO recomendacao (modelo_ano_id, oleo_id, filtro_id)
SELECT ma.id, 6, 14 FROM modelo_ano ma
JOIN modelo m ON ma.modelo_id = m.id
WHERE m.marca_id = 27 AND m.tipo = "carro";

-- Foton (marca_id = 28) - usando óleo 6 e filtro 14
INSERT INTO recomendacao (modelo_ano_id, oleo_id, filtro_id)
SELECT ma.id, 6, 14 FROM modelo_ano ma
JOIN modelo m ON ma.modelo_id = m.id
WHERE m.marca_id = 28 AND m.tipo = "carro";

-- Iveco (marca_id = 29) - usando óleo 6 e filtro 14
INSERT INTO recomendacao (modelo_ano_id, oleo_id, filtro_id)
SELECT ma.id, 6, 14 FROM modelo_ano ma
JOIN modelo m ON ma.modelo_id = m.id
WHERE m.marca_id = 29 AND m.tipo = "carro";

-- Scania (marca_id = 30) - usando óleo 6 e filtro 14
INSERT INTO recomendacao (modelo_ano_id, oleo_id, filtro_id)
SELECT ma.id, 6, 14 FROM modelo_ano ma
JOIN modelo m ON ma.modelo_id = m.id
WHERE m.marca_id = 30 AND m.tipo = "carro";

-- Novas motos Honda (marca_id = 6) - usando óleo 3 e filtro 4
INSERT INTO recomendacao (modelo_ano_id, oleo_id, filtro_id)
SELECT ma.id, 3, 4 FROM modelo_ano ma
JOIN modelo m ON ma.modelo_id = m.id
WHERE m.marca_id = 6 AND m.tipo = "moto" AND m.id >= 100;

-- Novas motos Yamaha (marca_id = 12) - usando óleo 3 e filtro 4
INSERT INTO recomendacao (modelo_ano_id, oleo_id, filtro_id)
SELECT ma.id, 3, 4 FROM modelo_ano ma
JOIN modelo m ON ma.modelo_id = m.id
WHERE m.marca_id = 12 AND m.tipo = "moto" AND m.id >= 103;

-- Novas motos Suzuki (marca_id = 13) - usando óleo 3 e filtro 4
INSERT INTO recomendacao (modelo_ano_id, oleo_id, filtro_id)
SELECT ma.id, 3, 4 FROM modelo_ano ma
JOIN modelo m ON ma.modelo_id = m.id
WHERE m.marca_id = 13 AND m.tipo = "moto" AND m.id >= 106;

-- Novas motos Kawasaki (marca_id = 14) - usando óleo 3 e filtro 4
INSERT INTO recomendacao (modelo_ano_id, oleo_id, filtro_id)
SELECT ma.id, 3, 4 FROM modelo_ano ma
JOIN modelo m ON ma.modelo_id = m.id
WHERE m.marca_id = 14 AND m.tipo = "moto" AND m.id >= 109;

-- Novas motos Harley-Davidson (marca_id = 15) - usando óleo 6 e filtro 4
INSERT INTO recomendacao (modelo_ano_id, oleo_id, filtro_id)
SELECT ma.id, 6, 4 FROM modelo_ano ma
JOIN modelo m ON ma.modelo_id = m.id
WHERE m.marca_id = 15 AND m.tipo = "moto" AND m.id >= 112;

-- Novas motos BMW (marca_id = 16) - usando óleo 3 e filtro 4
INSERT INTO recomendacao (modelo_ano_id, oleo_id, filtro_id)
SELECT ma.id, 3, 4 FROM modelo_ano ma
JOIN modelo m ON ma.modelo_id = m.id
WHERE m.marca_id = 16 AND m.tipo = "moto" AND m.id >= 115;

-- Distribuir mais produtos para todas as oficinas existentes
-- Para cada oficina, adicionar 4 produtos adicionais (2 óleos e 2 filtros)
INSERT INTO estoque (oficina_id, produto_id, tipo_produto, quantidade)
SELECT id, 17, 'oleo', FLOOR(RAND() * 30) + 20 FROM oficina;

INSERT INTO estoque (oficina_id, produto_id, tipo_produto, quantidade)
SELECT id, 18, 'oleo', FLOOR(RAND() * 25) + 15 FROM oficina;

INSERT INTO estoque (oficina_id, produto_id, tipo_produto, quantidade)
SELECT id, 19, 'filtro', FLOOR(RAND() * 40) + 30 FROM oficina;

INSERT INTO estoque (oficina_id, produto_id, tipo_produto, quantidade)
SELECT id, 20, 'filtro', FLOOR(RAND() * 35) + 25 FROM oficina;

-- Adicionar produtos específicos para regiões periféricas (óleos mais acessíveis)
INSERT INTO estoque (oficina_id, produto_id, tipo_produto, quantidade)
SELECT id, 3, 'oleo', FLOOR(RAND() * 50) + 40 FROM oficina WHERE id BETWEEN 16 AND 35;

INSERT INTO estoque (oficina_id, produto_id, tipo_produto, quantidade)
SELECT id, 4, 'oleo', FLOOR(RAND() * 45) + 35 FROM oficina WHERE id BETWEEN 16 AND 35;

INSERT INTO estoque (oficina_id, produto_id, tipo_produto, quantidade)
SELECT id, 9, 'filtro', FLOOR(RAND() * 60) + 50 FROM oficina WHERE id BETWEEN 16 AND 35;

-- Adicionar produtos premium para regiões centrais
INSERT INTO estoque (oficina_id, produto_id, tipo_produto, quantidade)
SELECT id, 11, 'oleo', FLOOR(RAND() * 20) + 15 FROM oficina WHERE id BETWEEN 1 AND 15;

INSERT INTO estoque (oficina_id, produto_id, tipo_produto, quantidade)
SELECT id, 12, 'oleo', FLOOR(RAND() * 25) + 20 FROM oficina WHERE id BETWEEN 1 AND 15;

INSERT INTO estoque (oficina_id, produto_id, tipo_produto, quantidade)
SELECT id, 16, 'filtro', FLOOR(RAND() * 30) + 25 FROM oficina WHERE id BETWEEN 1 AND 15;

-- Adicionar produtos para motos em todas as oficinas
INSERT INTO estoque (oficina_id, produto_id, tipo_produto, quantidade)
SELECT id, 3, 'oleo', FLOOR(RAND() * 30) + 20 FROM oficina;

INSERT INTO estoque (oficina_id, produto_id, tipo_produto, quantidade)
SELECT id, 6, 'oleo', FLOOR(RAND() * 25) + 15 FROM oficina;

INSERT INTO estoque (oficina_id, produto_id, tipo_produto, quantidade)
SELECT id, 4, 'filtro', FLOOR(RAND() * 40) + 30 FROM oficina;

INSERT INTO estoque (oficina_id, produto_id, tipo_produto, quantidade)
SELECT id, 8, 'filtro', FLOOR(RAND() * 35) + 25 FROM oficina;
SELECT * FROM oficina;


SELECT id, nome, tipo, preco FROM produto_filtro;
SELECT id, nome, tipo, preco FROM produto_oleo;

-- Verificar filtros com preço zero ou nulo
SELECT id, nome, tipo, preco FROM produto_filtro WHERE preco IS NULL OR preco = 0;

-- Verificar qual filtro está sendo retornado para motos
SELECT r.id, r.filtro_id, f.nome, f.preco, f.compatibilidade_modelo
FROM recomendacao r
JOIN produto_filtro f ON r.filtro_id = f.id
JOIN modelo_ano ma ON r.modelo_ano_id = ma.id
JOIN modelo m ON ma.modelo_id = m.id
WHERE m.tipo = 'moto'
LIMIT 5;


-- Teste direto para ver se encontra a coluna
SELECT COUNT(*) 
FROM information_schema.columns 
WHERE table_name = 'produto_filtro' 
AND table_schema = DATABASE()
AND column_name = 'preco';


-- Tabela de contatos
CREATE TABLE contatos (
    id INT AUTO_INCREMENT PRIMARY KEY,
    nome VARCHAR(100) NOT NULL,
    email VARCHAR(100) NOT NULL,
    telefone VARCHAR(20),
    assunto VARCHAR(100) NOT NULL,
    mensagem TEXT NOT NULL,
    data_contato DATETIME DEFAULT CURRENT_TIMESTAMP
);

SHOW TABLES LIKE 'contatos';
