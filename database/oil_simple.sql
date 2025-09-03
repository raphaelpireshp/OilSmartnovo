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


SELECT * FROM oficina;
