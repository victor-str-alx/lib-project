-- Script pentru crearea tabelelor sistemului de gestiune biblioteca

-- Tabela pentru sucursale (Cerinta 1)
CREATE TABLE IF NOT EXISTS Branches (
    id INT PRIMARY KEY AUTO_INCREMENT,
    name VARCHAR(255) NOT NULL,
    unique_code VARCHAR(50) UNIQUE NOT NULL,
    address TEXT NOT NULL
);

-- Tabela pentru edituri (necesara pentru carti)
CREATE TABLE IF NOT EXISTS Publishers (
    id INT PRIMARY KEY AUTO_INCREMENT,
    name VARCHAR(255) NOT NULL UNIQUE
);

-- Tabela pentru carti (Cerinta 2)
CREATE TABLE IF NOT EXISTS Books (
    id INT PRIMARY KEY AUTO_INCREMENT,
    unique_number VARCHAR(100) UNIQUE NOT NULL, -- numar unic
    title VARCHAR(255) NOT NULL,
    publisher_id INT,
    FOREIGN KEY (publisher_id) REFERENCES Publishers(id) ON DELETE SET NULL
);

-- Tabela pentru autori (Cerinta 2 - o carte poate avea mai multi autori)
CREATE TABLE IF NOT EXISTS Authors (
    id INT PRIMARY KEY AUTO_INCREMENT,
    name VARCHAR(255) NOT NULL
);

-- Tabela de legatura intre Books si Authors (relatie many-to-many)
CREATE TABLE IF NOT EXISTS BookAuthors (
    book_id INT,
    author_id INT,
    PRIMARY KEY (book_id, author_id),
    FOREIGN KEY (book_id) REFERENCES Books(id) ON DELETE CASCADE,
    FOREIGN KEY (author_id) REFERENCES Authors(id) ON DELETE CASCADE
);

-- Tabela pentru copii fizice ale cartilor in sucursale (Cerinta 3)
CREATE TABLE IF NOT EXISTS BookCopies (
    id INT PRIMARY KEY AUTO_INCREMENT,
    book_id INT,
    branch_id INT,
    status ENUM('available', 'borrowed', 'reserved') DEFAULT 'available',
    FOREIGN KEY (book_id) REFERENCES Books(id) ON DELETE CASCADE,
    FOREIGN KEY (branch_id) REFERENCES Branches(id) ON DELETE CASCADE
);

-- Tabela pentru utilizatori (cititori, bibliotecari, admini) (Cerinta 5)
CREATE TABLE IF NOT EXISTS Users (
    id INT PRIMARY KEY AUTO_INCREMENT,
    card_number VARCHAR(100) UNIQUE NOT NULL, -- numar de fisa
    name VARCHAR(255) NOT NULL,
    address TEXT,
    phone VARCHAR(50),
    email VARCHAR(255) UNIQUE NOT NULL, -- folosit la login
    password_hash VARCHAR(255) NOT NULL, -- parola hashuita
    role ENUM('patron', 'librarian', 'admin') DEFAULT 'patron',
    is_blacklisted BOOLEAN DEFAULT FALSE, -- (Cerinta 6)
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Tabela pentru imprumuturi (Cerinta 4 si 5)
CREATE TABLE IF NOT EXISTS Loans (
    id INT PRIMARY KEY AUTO_INCREMENT,
    copy_id INT,
    user_id INT,
    borrow_date DATE NOT NULL, -- data imprumutului
    due_date DATE NOT NULL, -- data limita returnare
    return_date DATE NULL, -- data efectiva a returnarii (null daca nu a fost returnata)
    FOREIGN KEY (copy_id) REFERENCES BookCopies(id),
    FOREIGN KEY (user_id) REFERENCES Users(id) ON DELETE CASCADE
);

-- 1. Adauga edituri
INSERT INTO Publishers (name) VALUES 
('Humanitas'),
('Nemira'),
('RAO'),
('Litera'),
('Arthur');

-- 2. Adauga autori
INSERT INTO Authors (name) VALUES 
('Mircea Eliade'),
('George Orwell'),
('Frank Herbert'),
('Yuval Noah Harari'),
('J.R.R. Tolkien');

-- 3. Adauga carti si asociaza cu edituri si autori
INSERT INTO Books (unique_number, title, publisher_id) VALUES 
('ISBN-12345', 'Maitreyi', 1),
('ISBN-67890', '1984', 2),
('ISBN-11121', 'Dune', 3),
('ISBN-31415', 'Sapiens', 4),
('ISBN-16171', 'Stapanul Inelelor', 5);

-- Asociaza cartile cu autorii lor (in tabela BookAuthors)
INSERT INTO BookAuthors (book_id, author_id) VALUES 
(1, 1), -- Maitreyi - Mircea Eliade
(2, 2), -- 1984 - George Orwell
(3, 3), -- Dune - Frank Herbert
(4, 4), -- Sapiens - Yuval Noah Harari
(5, 5); -- Stapanul Inelelor - J.R.R. Tolkien

-- 4. Adauga sucursale
INSERT INTO Branches (name, unique_code, address) VALUES 
('Biblioteca Centrala', 'BC-01', 'Strada Principata, Nr. 1, Craiova'),
('Filiala Gara', 'FG-02', 'Bulevardul Bucuresti, Nr. 25, Craiova');

-- 5. Adauga copii de carti in sucursale
INSERT INTO BookCopies (book_id, branch_id, status) VALUES 
(1, 1, 'available'), -- Maitreyi in Biblioteca Centrala
(1, 2, 'available'), -- Maitreyi in Filiala Gara
(2, 1, 'available'), -- 1984 in Biblioteca Centrala
(3, 2, 'borrowed'),  -- Dune in Filiala Gara (imprumutata)
(4, 1, 'available'), -- Sapiens in Biblioteca Centrala
(5, 1, 'available'); -- Stapanul Inelelor in Biblioteca Centrala