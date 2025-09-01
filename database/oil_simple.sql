-- Criação do banco de dados OilSmart
CREATE DATABASE IF NOT EXISTS Oil;
USE Oil;

-- Tabela de usuários
CREATE TABLE usuario (
    id INT AUTO_INCREMENT PRIMARY KEY,
    nome VARCHAR(100) NOT NULL,
    email VARCHAR(100) NOT NULL UNIQUE,
    senha VARCHAR(255) NOT NULL,
    tipo ENUM("cliente", "oficina", "funcionario") NOT NULL,
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
    tipo ENUM("carro", "moto") NOT NULL,
    FOREIGN KEY (marca_id) REFERENCES marca(id) ON DELETE CASCADE
);

-- Tabela de anos dos modelos
CREATE TABLE modelo_ano (
    id INT AUTO_INCREMENT PRIMARY KEY,
    modelo_id INT NOT NULL,
    ano INT NOT NULL,
    FOREIGN KEY (modelo_id) REFERENCES modelo(id) ON DELETE CASCADE
);

-- Inserir marcas de veículos
INSERT INTO marca (nome) VALUES 
("Fiat"), ("Ford"), ("Chevrolet"), ("Volkswagen"), ("Toyota"), 
("Honda"), ("Hyundai"), ("Renault"), ("Peugeot"), ("Nissan"), ("Jeep"),
("Yamaha"), ("Suzuki"), ("Kawasaki"), ("Harley-Davidson");

-- Inserir modelos de carros
INSERT INTO modelo (nome, marca_id, tipo) VALUES 
("Palio", 1, "carro"), ("Uno", 1, "carro"), ("Strada", 1, "carro"), ("Toro", 1, "carro"),
("Ka", 2, "carro"), ("Fiesta", 2, "carro"), ("EcoSport", 2, "carro"), ("Focus", 2, "carro"),
("Onix", 3, "carro"), ("Celta", 3, "carro"), ("Prisma", 3, "carro"), ("S10", 3, "carro"),
("Gol", 4, "carro"), ("Voyage", 4, "carro"), ("Saveiro", 4, "carro"), ("Polo", 4, "carro"),
("Corolla", 5, "carro"), ("Hilux", 5, "carro"), ("Etios", 5, "carro"), ("Yaris", 5, "carro"),
("Civic", 6, "carro"), ("Fit", 6, "carro"), ("HR-V", 6, "carro"), ("CR-V", 6, "carro"),
("HB20", 7, "carro"), ("Creta", 7, "carro"), ("Tucson", 7, "carro"), ("Santa Fe", 7, "carro"),
("Kwid", 8, "carro"), ("Sandero", 8, "carro"), ("Logan", 8, "carro"), ("Duster", 8, "carro"),
("208", 9, "carro"), ("2008", 9, "carro"), ("3008", 9, "carro"), ("Partner", 9, "carro"),
("March", 10, "carro"), ("Versa", 10, "carro"), ("Kicks", 10, "carro"), ("Frontier", 10, "carro"),
("Renegade", 11, "carro"), ("Compass", 11, "carro"), ("Commander", 11, "carro"), ("Wrangler", 11, "carro");

-- Inserir modelos de motos
INSERT INTO modelo (nome, marca_id, tipo) VALUES 
("CG 160", 12, "moto"), ("Fazer 250", 12, "moto"), ("MT-03", 12, "moto"), ("XTZ 250", 12, "moto"),
("Bandit 125", 13, "moto"), ("Burgman 125", 13, "moto"), ("GSX-S750", 13, "moto"), ("V-Strom 650", 13, "moto"),
("Ninja 300", 14, "moto"), ("Z400", 14, "moto"), ("Versys 650", 14, "moto"), ("Z900", 14, "moto"),
("Iron 883", 15, "moto"), ("Street 750", 15, "moto"), ("Fat Boy", 15, "moto"), ("Road King", 15, "moto");

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


