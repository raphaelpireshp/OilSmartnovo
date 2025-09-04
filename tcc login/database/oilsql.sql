-- Criação do banco de dados OilSmart
CREATE DATABASE IF NOT EXISTS OilSmart;
USE OilSmart;

-- Tabela de usuários
CREATE TABLE usuario (
    id INT AUTO_INCREMENT PRIMARY KEY,
    nome VARCHAR(100) NOT NULL,
    email VARCHAR(100) NOT NULL UNIQUE,
    senha VARCHAR(255) NOT NULL,
    tipo ENUM('cliente', 'oficina', 'funcionario') NOT NULL,
    telefone VARCHAR(20),
    cpf VARCHAR(14) UNIQUE,
    cnpj VARCHAR(18) UNIQUE,
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
    marca VARCHAR(100)
);

-- Tabela de produtos (filtros)
CREATE TABLE produto_filtro (
    id INT AUTO_INCREMENT PRIMARY KEY,
    nome VARCHAR(100) NOT NULL,
    tipo ENUM('carro', 'moto') NOT NULL,
    compatibilidade_modelo VARCHAR(255)
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

-- Inserção de dados iniciais

-- Inserir usuários administradores das oficinas
INSERT INTO usuario (nome, email, senha, tipo, telefone, cnpj) VALUES 
('Oficina Norte', 'adm_norte@motul.com', '$2a$10$xJwL5v5z5U6ZU5Z5Z5Z5Zu', 'oficina', '(11) 1234-5678', '12.345.678/0001-90'),
('Oficina Sul', 'adm_sul@motul.com', '$2a$10$xJwL5v5z5U6ZU5Z5Z5Z5Zu', 'oficina', '(11) 2345-6789', '23.456.789/0001-01'),
('Oficina Leste', 'adm_leste@motul.com', '$2a$10$xJwL5v5z5U6ZU5Z5Z5Z5Zu', 'oficina', '(11) 3456-7890', '34.567.890/0001-12');

-- Inserir oficinas
INSERT INTO oficina (usuario_id, nome, cep, endereco, cidade, estado, horario_abertura, horario_fechamento, dias_funcionamento) VALUES 
(1, 'Motul Oficina Norte', '02430-000', 'Rua Exemplo Norte, 123', 'São Paulo', 'SP', '08:00:00', '17:00:00', 'Seg-Sex'),
(2, 'Motul Oficina Sul', '04783-100', 'Rua Exemplo Sul, 456', 'São Paulo', 'SP', '09:00:00', '18:00:00', 'Seg-Sab'),
(3, 'Motul Oficina Leste', '03675-040', 'Rua Exemplo Leste, 789', 'São Paulo', 'SP', '10:00:00', '20:00:00', 'Seg-Sex');

-- Inserir marcas de veículos
INSERT INTO marca (nome) VALUES 
('Fiat'), ('Ford'), ('Chevrolet'), ('Volkswagen'), ('Toyota'), 
('Honda'), ('Hyundai'), ('Renault'), ('Peugeot'), ('Nissan'), ('Jeep'),
('Yamaha'), ('Suzuki'), ('Kawasaki'), ('Harley-Davidson');

-- Inserir modelos de carros
INSERT INTO modelo (nome, marca_id, tipo) VALUES 
('Palio', 1, 'carro'), ('Uno', 1, 'carro'), ('Strada', 1, 'carro'), ('Toro', 1, 'carro'),
('Ka', 2, 'carro'), ('Fiesta', 2, 'carro'), ('EcoSport', 2, 'carro'), ('Focus', 2, 'carro'),
('Onix', 3, 'carro'), ('Celta', 3, 'carro'), ('Prisma', 3, 'carro'), ('S10', 3, 'carro'),
('Gol', 4, 'carro'), ('Voyage', 4, 'carro'), ('Saveiro', 4, 'carro'), ('Polo', 4, 'carro'),
('Corolla', 5, 'carro'), ('Hilux', 5, 'carro'), ('Etios', 5, 'carro'), ('Yaris', 5, 'carro'),
('Civic', 6, 'carro'), ('Fit', 6, 'carro'), ('HR-V', 6, 'carro'), ('CR-V', 6, 'carro'),
('HB20', 7, 'carro'), ('Creta', 7, 'carro'), ('Tucson', 7, 'carro'), ('Santa Fe', 7, 'carro'),
('Kwid', 8, 'carro'), ('Sandero', 8, 'carro'), ('Logan', 8, 'carro'), ('Duster', 8, 'carro'),
('208', 9, 'carro'), ('2008', 9, 'carro'), ('3008', 9, 'carro'), ('Partner', 9, 'carro'),
('March', 10, 'carro'), ('Versa', 10, 'carro'), ('Kicks', 10, 'carro'), ('Frontier', 10, 'carro'),
('Renegade', 11, 'carro'), ('Compass', 11, 'carro'), ('Commander', 11, 'carro'), ('Wrangler', 11, 'carro');

-- Inserir modelos de motos
INSERT INTO modelo (nome, marca_id, tipo) VALUES 
('CG 160', 12, 'moto'), ('Fazer 250', 12, 'moto'), ('MT-03', 12, 'moto'), ('XTZ 250', 12, 'moto'),
('Bandit 125', 13, 'moto'), ('Burgman 125', 13, 'moto'), ('GSX-S750', 13, 'moto'), ('V-Strom 650', 13, 'moto'),
('Ninja 300', 14, 'moto'), ('Z400', 14, 'moto'), ('Versys 650', 14, 'moto'), ('Z900', 14, 'moto'),
('Iron 883', 15, 'moto'), ('Street 750', 15, 'moto'), ('Fat Boy', 15, 'moto'), ('Road King', 15, 'moto');

-- Inserir anos dos modelos
INSERT INTO modelo_ano (modelo_id, ano) VALUES 
(1, 2020), (1, 2021), (1, 2022),
(2, 2020), (2, 2021), (2, 2022),
(3, 2021), (3, 2022),
(4, 2020), (4, 2021), (4, 2022),
(5, 2021), (5, 2022),
(6, 2020), (6, 2021), (6, 2022),
(7, 2021), (7, 2022),
(8, 2020), (8, 2021), (8, 2022),
(9, 2021), (9, 2022),
(10, 2020), (10, 2021), (10, 2022),
(41, 2021), (41, 2022), (41, 2023),
(42, 2022), (42, 2023),
(43, 2021), (43, 2022), (43, 2023),
(44, 2022), (44, 2023);

-- Inserir produtos (óleos)
INSERT INTO produto_oleo (nome, tipo, viscosidade, especificacao, marca) VALUES 
('Motul 8100 X-clean 5W-30', 'carro', '5W-30', 'API SN, Full Sintético', 'Motul'),
('Motul 8100 Eco 10W-40', 'carro', '10W-40', 'API SN, Semissintético', 'Motul'),
('Motul 300V Factory Line 10W-40', 'moto', '10W-40', 'Ester Core, Racing', 'Motul'),
('Motul Scooter Expert 10W-30', 'moto', '10W-30', 'JASO MB, Scooters', 'Motul'),
('Motul 8100 Eco-nergy 5W-30', 'carro', '5W-30', 'API SP, Low SAPS', 'Motul'),
('Motul 7100 20W-50', 'moto', '20W-50', 'API SL, JASO MA2', 'Motul');

-- Inserir produtos (filtros)
INSERT INTO produto_filtro (nome, tipo, compatibilidade_modelo) VALUES 
('Filtro A123', 'carro', 'Fiat Palio, Uno; VW Gol, Voyage'),
('Filtro B456', 'carro', 'Ford Ka, Fiesta; Chevrolet Onix, Prisma'),
('Filtro C789', 'carro', 'Toyota Corolla, Etios; Honda Civic, Fit'),
('Filtro MOTO-X90', 'moto', 'Yamaha CG 160, Fazer 250; Honda CG 150, CB 300'),
('Filtro SCOOTER-40', 'moto', 'Yamaha NMax, XMax; Honda PCX, Forza');

-- Inserir estoque para as oficinas
-- Oficina Norte
INSERT INTO estoque (oficina_id, produto_id, tipo_produto, quantidade) VALUES 
(1, 1, 'oleo', 20), (1, 2, 'oleo', 15), (1, 3, 'oleo', 10), (1, 4, 'oleo', 8),
(1, 1, 'filtro', 30), (1, 2, 'filtro', 25), (1, 3, 'filtro', 20), (1, 4, 'filtro', 15);

-- Oficina Sul
INSERT INTO estoque (oficina_id, produto_id, tipo_produto, quantidade) VALUES 
(2, 1, 'oleo', 25), (2, 2, 'oleo', 20), (2, 5, 'oleo', 15), (2, 6, 'oleo', 10),
(2, 1, 'filtro', 35), (2, 2, 'filtro', 30), (2, 5, 'filtro', 20), (2, 4, 'filtro', 15);

-- Oficina Leste
INSERT INTO estoque (oficina_id, produto_id, tipo_produto, quantidade) VALUES 
(3, 1, 'oleo', 30), (3, 2, 'oleo', 25), (3, 3, 'oleo', 20), (3, 6, 'oleo', 15),
(3, 1, 'filtro', 40), (3, 2, 'filtro', 35), (3, 3, 'filtro', 30), (3, 5, 'filtro', 20);

-- Inserir recomendações
INSERT INTO recomendacao (modelo_ano_id, oleo_id, filtro_id) VALUES 
(1, 1, 1),  -- Palio 2020
(2, 1, 1),  -- Palio 2021
(3, 1, 1),  -- Palio 2022
(4, 2, 1),  -- Uno 2020
(5, 2, 1),  -- Uno 2021
(6, 2, 1),  -- Uno 2022
(7, 2, 1),  -- Strada 2021
(8, 2, 1),  -- Strada 2022
(9, 1, 2),  -- Toro 2020
(10, 1, 2), -- Toro 2021
(11, 1, 2); -- Toro 2022
(41, 3, 4), -- CG 160 2021
(42, 3, 4), -- CG 160 2022
(43, 3, 4), -- CG 160 2023
(44, 4, 5), -- Fazer 250 2022
(45, 4, 5); -- Fazer 250 2023

-- Inserir funcionários
INSERT INTO usuario (nome, email, senha, tipo, telefone, cpf) VALUES 
('João Silva', 'joao@oficinanorte.com', '$2a$10$xJwL5v5z5U6ZU5Z5Z5Z5Zu', 'funcionario', '(11) 98765-4321', '123.456.789-00'),
('Maria Santos', 'maria@oficinasul.com', '$2a$10$xJwL5v5z5U6ZU5Z5Z5Z5Zu', 'funcionario', '(11) 98765-4322', '234.567.890-11'),
('Carlos Oliveira', 'carlos@oficinaleste.com', '$2a$10$xJwL5v5z5U6ZU5Z5Z5Z5Zu', 'funcionario', '(11) 98765-4323', '345.678.901-22');

INSERT INTO funcionario (usuario_id, oficina_id, cargo) VALUES 
(4, 1, 'Mecânico Chefe'),
(5, 2, 'Gerente'),
(6, 3, 'Mecânico');

-- Inserir um cliente de exemplo
INSERT INTO usuario (nome, email, senha, tipo, telefone, cpf, endereco, cep, cidade, estado) VALUES 
('Cliente Exemplo', 'cliente@exemplo.com', '$2a$10$xJwL5v5z5U6ZU5Z5Z5Z5Zu', 'cliente', '(11) 98765-0001', '987.654.321-00', 'Rua Cliente, 123', '01234-567', 'São Paulo', 'SP');

-- Inserir um veículo para o cliente
INSERT INTO veiculo (usuario_id, modelo_ano_id, placa, quilometragem) VALUES 
(7, 1, 'ABC1D23', 25000);  -- Palio 2020

-- Inserir um agendamento de exemplo
INSERT INTO agendamento (cliente_id, oficina_id, veiculo_id, funcionario_id, data_agendamento, status, codigo_confirmacao) VALUES 
(7, 1, 1, 1, '2023-12-15 10:00:00', 'confirmado', 'ABCD1234');

-- Mais usuários de exemplo (clientes)
INSERT INTO usuario (nome, email, senha, tipo, telefone, cpf, endereco, cep, cidade, estado) VALUES 
("Ana Paula", "ana.paula@email.com", "$2a$10$xJwL5v5z5U6ZU5Z5Z5Z5Zu", "cliente", "(21) 99887-7665", "111.222.333-44", "Rua das Flores, 100", "20000-000", "Rio de Janeiro", "RJ"),
("Bruno Costa", "bruno.costa@email.com", "$2a$10$xJwL5v5z5U6ZU5Z5Z5Z5Zu", "cliente", "(31) 97766-5544", "555.666.777-88", "Av. Central, 500", "30000-000", "Belo Horizonte", "MG");

-- Mais usuários de exemplo (funcionários)
INSERT INTO usuario (nome, email, senha, tipo, telefone, cpf) VALUES 
("Fernanda Lima", "fernanda.lima@oficinanorte.com", "$2a$10$xJwL5v5z5U6ZU5Z5Z5Z5Zu", "funcionario", "(11) 91122-3344", "444.555.666-77"),
("Gustavo Pereira", "gustavo.pereira@oficinasul.com", "$2a$10$xJwL5v5z5U6ZU5Z5Z5Z5Zu", "funcionario", "(11) 95566-7788", "888.999.000-11");

-- Mais veículos de exemplo
INSERT INTO veiculo (usuario_id, modelo_ano_id, placa, quilometragem) VALUES 
(8, 12, "XYZ9E87", 50000), -- Ka 2020 para Ana Paula
(9, 17, "QWE1R23", 30000); -- Onix 2021 para Bruno Costa

-- Mais produtos (óleos)
INSERT INTO produto_oleo (nome, tipo, viscosidade, especificacao, marca) VALUES 
("Castrol Magnatec 10W-40", "carro", "10W-40", "API SN, Semissintético", "Castrol"),
("Shell Helix Ultra 5W-40", "carro", "5W-40", "API SN, Sintético", "Shell");

-- Mais produtos (filtros)
INSERT INTO produto_filtro (nome, tipo, compatibilidade_modelo) VALUES 
("Filtro D101", "carro", "Ford Ka, Fiesta"),
("Filtro E202", "carro", "Chevrolet Onix, Prisma");

-- Mais estoque para as oficinas
-- Oficina Norte
INSERT INTO estoque (oficina_id, produto_id, tipo_produto, quantidade) VALUES 
(1, 7, "oleo", 10), (1, 6, "filtro", 15);

-- Oficina Sul
INSERT INTO estoque (oficina_id, produto_id, tipo_produto, quantidade) VALUES 
(2, 8, "oleo", 12), (2, 7, "filtro", 18);

-- Mais recomendações
INSERT INTO recomendacao (modelo_ano_id, oleo_id, filtro_id) VALUES 
(12, 7, 6), -- Ka 2020
(17, 8, 7); -- Onix 2021

-- Mais agendamentos de exemplo
INSERT INTO agendamento (cliente_id, oficina_id, veiculo_id, funcionario_id, data_agendamento, status, codigo_confirmacao) VALUES 
(8, 2, 2, 5, "2023-12-20 14:00:00", "pendente", "EFGH5678"),
(9, 1, 3, 4, "2024-01-05 09:30:00", "confirmado", "IJKL9012");




-- Mais usuários de exemplo (clientes)
INSERT INTO usuario (nome, email, senha, tipo, telefone, cpf, endereco, cep, cidade, estado) VALUES 
("Pedro Rocha", "pedro.rocha@email.com", "$2a$10$xJwL5v5z5U6ZU5Z5Z5Z5Zu", "cliente", "(11) 98765-1234", "111.111.111-11", "Rua A, 1", "01000-001", "São Paulo", "SP"),
("Mariana Dias", "mariana.dias@email.com", "$2a$10$xJwL5v5z5U6ZU5Z5Z5Z5Zu", "cliente", "(21) 98765-5678", "222.222.222-22", "Rua B, 2", "20000-002", "Rio de Janeiro", "RJ"),
("Lucas Santos", "lucas.santos@email.com", "$2a$10$xJwL5v5z5U6ZU5Z5Z5Z5Zu", "cliente", "(31) 98765-9012", "333.333.333-33", "Rua C, 3", "30000-003", "Belo Horizonte", "MG"),
("Julia Costa", "julia.costa@email.com", "$2a$10$xJwL5v5z5U6ZU5Z5Z5Z5Zu", "cliente", "(41) 98765-3456", "444.444.444-44", "Rua D, 4", "80000-004", "Curitiba", "PR"),
("Gabriel Almeida", "gabriel.almeida@email.com", "$2a$10$xJwL5v5z5U6ZU5Z5Z5Z5Zu", "cliente", "(51) 98765-7890", "555.555.555-55", "Rua E, 5", "90000-005", "Porto Alegre", "RS");

-- Mais usuários de exemplo (oficinas)
INSERT INTO usuario (nome, email, senha, tipo, telefone, cnpj) VALUES 
("Oficina Centro", "adm_centro@motul.com", "$2a$10$xJwL5v5z5U6ZU5Z5Z5Z5Zu", "oficina", "(11) 4567-8901", "45.678.901/0001-23"),
("Oficina Oeste", "adm_oeste@motul.com", "$2a$10$xJwL5v5z5U6ZU5Z5Z5Z5Zu", "oficina", "(11) 5678-9012", "56.789.012/0001-34");

-- Mais oficinas
INSERT INTO oficina (usuario_id, nome, cep, endereco, cidade, estado, horario_abertura, horario_fechamento, dias_funcionamento) VALUES 
(10, "Motul Oficina Centro", "01000-000", "Rua do Centro, 100", "São Paulo", "SP", "08:30:00", "17:30:00", "Seg-Sex"),
(11, "Motul Oficina Oeste", "05000-000", "Av. Oeste, 200", "São Paulo", "SP", "09:00:00", "18:00:00", "Seg-Sab");

-- Mais usuários de exemplo (funcionários)
INSERT INTO usuario (nome, email, senha, tipo, telefone, cpf) VALUES 
("Roberto Carlos", "roberto.carlos@oficinacentro.com", "$2a$10$xJwL5v5z5U6ZU5Z5Z5Z5Zu", "funcionario", "(11) 99887-7766", "666.777.888-99"),
("Patricia Souza", "patricia.souza@oficinaoeste.com", "$2a$10$xJwL5v5z5U6ZU5Z5Z5Z5Zu", "funcionario", "(11) 99776-6655", "777.888.999-00");

-- Mais funcionários
INSERT INTO funcionario (usuario_id, oficina_id, cargo) VALUES 
(12, 4, "Mecânico"),
(13, 5, "Atendente");

-- Mais marcas de veículos
INSERT INTO marca (nome) VALUES 
("BMW"), ("Mercedes-Benz"), ("Audi"), ("Porsche");

-- Mais modelos de carros
INSERT INTO modelo (nome, marca_id, tipo) VALUES 
("Série 3", 16, "carro"), ("X5", 16, "carro"),
("Classe C", 17, "carro"), ("GLC", 17, "carro"),
("A4", 18, "carro"), ("Q5", 18, "carro"),
("911", 19, "carro"), ("Cayenne", 19, "carro");

-- Mais modelos de motos
INSERT INTO modelo (nome, marca_id, tipo) VALUES 
("CBR 600RR", 6, "moto"), ("CB 500F", 6, "moto");

-- Mais anos dos modelos
INSERT INTO modelo_ano (modelo_id, ano) VALUES 
(46, 2020), (46, 2021), (46, 2022),
(47, 2021), (47, 2022), (47, 2023),
(48, 2020), (48, 2021), (48, 2022),
(49, 2021), (49, 2022), (49, 2023),
(50, 2020), (50, 2021), (50, 2022),
(51, 2021), (51, 2022), (51, 2023),
(52, 2020), (52, 2021), (52, 2022),
(53, 2021), (53, 2022), (53, 2023),
(54, 2020), (54, 2021), (54, 2022),
(55, 2021), (55, 2022), (55, 2023);

-- Mais produtos (óleos)
INSERT INTO produto_oleo (nome, tipo, viscosidade, especificacao, marca) VALUES 
("Mobil Super Protection 5W-30", "carro", "5W-30", "API SP, Sintético", "Mobil"),
("Petronas Selenia K 15W-40", "carro", "15W-40", "API SN, Semissintético", "Petronas"),
("Yamalube 4T 20W-50", "moto", "20W-50", "JASO MA2, Mineral", "Yamaha");

-- Mais produtos (filtros)
INSERT INTO produto_filtro (nome, tipo, compatibilidade_modelo) VALUES 
("Filtro F303", "carro", "BMW Série 3, X5"),
("Filtro G404", "carro", "Mercedes-Benz Classe C, GLC"),
("Filtro H505", "moto", "Honda CBR 600RR, CB 500F");

-- Mais estoque para as oficinas
-- Oficina Centro
INSERT INTO estoque (oficina_id, produto_id, tipo_produto, quantidade) VALUES 
(4, 9, "oleo", 15), (4, 10, "oleo", 10), (4, 8, "filtro", 20), (4, 9, "filtro", 15);

-- Oficina Oeste
INSERT INTO estoque (oficina_id, produto_id, tipo_produto, quantidade) VALUES 
(5, 11, "oleo", 20), (5, 9, "filtro", 25), (5, 10, "filtro", 10);

-- Mais recomendações
INSERT INTO recomendacao (modelo_ano_id, oleo_id, filtro_id) VALUES 
(46, 9, 8), -- BMW Série 3 2020
(48, 10, 9), -- Mercedes-Benz Classe C 2020
(54, 11, 10); -- Honda CBR 600RR 2020

-- Mais agendamentos de exemplo
INSERT INTO agendamento (cliente_id, oficina_id, veiculo_id, funcionario_id, data_agendamento, status, codigo_confirmacao) VALUES 
(10, 4, 4, 12, "2024-01-10 11:00:00", "confirmado", "MNOP3456"),
(11, 5, 5, 13, "2024-01-12 15:00:00", "pendente", "QRST7890"),
(12, 1, 6, 4, "2024-01-15 09:00:00", "cancelado", "UVWX1234"),
(13, 2, 7, 5, "2024-01-18 13:00:00", "concluido", "YZAB5678"),
(14, 3, 8, 6, "2024-01-20 10:00:00", "confirmado", "CDEF9012");


