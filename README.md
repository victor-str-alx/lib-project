# Sistem de gestiune a bibliotecii

## Cuprins

1. [Descrierea proiectului](#descrierea-proiectului)
2. [Structura bazei de date](#structura-bazei-de-date)
   - [Branches — Sucursale](#1-branches--sucursale)
   - [Publishers — Edituri](#2-publishers--edituri)
   - [Books — Cărți](#3-books--cărți)
   - [Authors — Autori](#4-authors--autori)
   - [BookAuthors — Legătura dintre cărți și autori](#5-bookauthors--legătura-dintre-cărți-și-autori)
   - [BookCopies — Exemplare fizice](#6-bookcopies--exemplare-fizice)
   - [Users — Utilizatori](#7-users--utilizatori)
   - [Loans — Împrumuturi](#8-loans--împrumuturi)
3. [Script SQL pentru crearea tabelelor](#script-sql-pentru-crearea-tabelelor)
4. [Date inițiale](#date-inițiale)
5. [Relațiile dintre tabele](#relațiile-dintre-tabele)

---

## Descrierea proiectului

Baza de date este destinată unui sistem de gestiune a unei biblioteci cu mai multe sucursale. Aceasta permite gestionarea cărților, autorilor, editurilor, exemplarelor fizice, utilizatorilor și împrumuturilor.

Sistemul include și funcționalități pentru gestionarea rolurilor utilizatorilor și identificarea cititorilor care se află pe lista neagră.

## Structura bazei de date

Baza de date conține următoarele tabele:

| Tabel | Descriere |
|---|---|
| `Branches` | Sucursalele bibliotecii |
| `Publishers` | Editurile cărților |
| `Books` | Informațiile despre cărți |
| `Authors` | Autorii cărților |
| `BookAuthors` | Asocierea dintre cărți și autori |
| `BookCopies` | Exemplarele fizice disponibile în sucursale |
| `Users` | Cititorii, bibliotecarii și administratorii |
| `Loans` | Evidența împrumuturilor |

### 1. Branches — Sucursale

Stochează informațiile despre sucursalele bibliotecii.

- `id` — identificator unic;
- `name` — numele sucursalei;
- `unique_code` — cod unic al sucursalei;
- `address` — adresa sucursalei.

### 2. Publishers — Edituri

Stochează editurile asociate cărților.

- `id` — identificator unic;
- `name` — numele editurii, unic în baza de date.

### 3. Books — Cărți

Conține informațiile generale despre fiecare carte.

- `id` — identificator unic;
- `unique_number` — număr unic de identificare;
- `title` — titlul cărții;
- `publisher_id` — identificatorul editurii asociate.

### 4. Authors — Autori

Stochează informațiile despre autorii cărților.

- `id` — identificator unic;
- `name` — numele autorului.

### 5. BookAuthors — Legătura dintre cărți și autori

Asigură relația de tip *many-to-many* dintre cărți și autori. O carte poate avea mai mulți autori, iar un autor poate scrie mai multe cărți.

- `book_id` — identificatorul cărții;
- `author_id` — identificatorul autorului.

Cele două câmpuri formează cheia primară compusă.

### 6. BookCopies — Exemplare fizice

Gestionează exemplarele fizice ale cărților din fiecare sucursală.

- `id` — identificator unic al exemplarului;
- `book_id` — cartea căreia îi aparține exemplarul;
- `branch_id` — sucursala în care se află;
- `status` — starea exemplarului: `available`, `borrowed` sau `reserved`.

### 7. Users — Utilizatori

Stochează datele cititorilor, bibliotecarilor și administratorilor.

- `id` — identificator unic;
- `card_number` — numărul fișei de bibliotecă;
- `name` — numele utilizatorului;
- `address` — adresa;
- `phone` — numărul de telefon;
- `email` — adresa de e-mail, utilizată la autentificare;
- `password_hash` — parola stocată sub formă de hash;
- `role` — rolul utilizatorului: `patron`, `librarian` sau `admin`;
- `is_blacklisted` — indică dacă utilizatorul se află pe lista neagră;
- `created_at` — data creării contului.

### 8. Loans — Împrumuturi

Înregistrează împrumuturile efectuate de utilizatori.

- `id` — identificator unic al împrumutului;
- `copy_id` — exemplarul împrumutat;
- `user_id` — utilizatorul care a efectuat împrumutul;
- `borrow_date` — data împrumutului;
- `due_date` — data limită pentru returnare;
- `return_date` — data efectivă a returnării, dacă aceasta a avut loc.

---

## Script SQL pentru crearea tabelelor

```sql
-- Tabela pentru sucursale
CREATE TABLE IF NOT EXISTS Branches (
    id INT PRIMARY KEY AUTO_INCREMENT,
    name VARCHAR(255) NOT NULL,
    unique_code VARCHAR(50) UNIQUE NOT NULL,
    address TEXT NOT NULL
);

-- Tabela pentru edituri
CREATE TABLE IF NOT EXISTS Publishers (
    id INT PRIMARY KEY AUTO_INCREMENT,
    name VARCHAR(255) NOT NULL UNIQUE
);

-- Tabela pentru carti
CREATE TABLE IF NOT EXISTS Books (
    id INT PRIMARY KEY AUTO_INCREMENT,
    unique_number VARCHAR(100) UNIQUE NOT NULL,
    title VARCHAR(255) NOT NULL,
    publisher_id INT,
    FOREIGN KEY (publisher_id)
        REFERENCES Publishers(id)
        ON DELETE SET NULL
);

-- Tabela pentru autori
CREATE TABLE IF NOT EXISTS Authors (
    id INT PRIMARY KEY AUTO_INCREMENT,
    name VARCHAR(255) NOT NULL
);

-- Tabela de legatura dintre carti si autori
CREATE TABLE IF NOT EXISTS BookAuthors (
    book_id INT,
    author_id INT,
    PRIMARY KEY (book_id, author_id),
    FOREIGN KEY (book_id)
        REFERENCES Books(id)
        ON DELETE CASCADE,
    FOREIGN KEY (author_id)
        REFERENCES Authors(id)
        ON DELETE CASCADE
);

-- Tabela pentru exemplarele fizice ale cartilor
CREATE TABLE IF NOT EXISTS BookCopies (
    id INT PRIMARY KEY AUTO_INCREMENT,
    book_id INT,
    branch_id INT,
    status ENUM('available', 'borrowed', 'reserved')
        DEFAULT 'available',
    FOREIGN KEY (book_id)
        REFERENCES Books(id)
        ON DELETE CASCADE,
    FOREIGN KEY (branch_id)
        REFERENCES Branches(id)
        ON DELETE CASCADE
);

-- Tabela pentru utilizatori
CREATE TABLE IF NOT EXISTS Users (
    id INT PRIMARY KEY AUTO_INCREMENT,
    card_number VARCHAR(100) UNIQUE NOT NULL,
    name VARCHAR(255) NOT NULL,
    address TEXT,
    phone VARCHAR(50),
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    role ENUM('patron', 'librarian', 'admin')
        DEFAULT 'patron',
    is_blacklisted BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Tabela pentru imprumuturi
CREATE TABLE IF NOT EXISTS Loans (
    id INT PRIMARY KEY AUTO_INCREMENT,
    copy_id INT,
    user_id INT,
    borrow_date DATE NOT NULL,
    due_date DATE NOT NULL,
    return_date DATE NULL,
    FOREIGN KEY (copy_id)
        REFERENCES BookCopies(id),
    FOREIGN KEY (user_id)
        REFERENCES Users(id)
        ON DELETE CASCADE
);
```

## Date inițiale

### 1. Adăugarea editurilor

```sql
INSERT INTO Publishers (name) VALUES
('Humanitas'),
('Nemira'),
('RAO'),
('Litera'),
('Arthur');
```

### 2. Adăugarea autorilor

```sql
INSERT INTO Authors (name) VALUES
('Mircea Eliade'),
('George Orwell'),
('Frank Herbert'),
('Yuval Noah Harari'),
('J.R.R. Tolkien');
```

### 3. Adăugarea cărților

```sql
INSERT INTO Books (unique_number, title, publisher_id) VALUES
('ISBN-12345', 'Maitreyi', 1),
('ISBN-67890', '1984', 2),
('ISBN-11121', 'Dune', 3),
('ISBN-31415', 'Sapiens', 4),
('ISBN-16171', 'Stapanul Inelelor', 5);
```

### 4. Asocierea cărților cu autorii

```sql
INSERT INTO BookAuthors (book_id, author_id) VALUES
(1, 1), -- Maitreyi - Mircea Eliade
(2, 2), -- 1984 - George Orwell
(3, 3), -- Dune - Frank Herbert
(4, 4), -- Sapiens - Yuval Noah Harari
(5, 5); -- Stapanul Inelelor - J.R.R. Tolkien
```

### 5. Adăugarea sucursalelor

```sql
INSERT INTO Branches (name, unique_code, address) VALUES
(
    'Biblioteca Centrala',
    'BC-01',
    'Strada Principata, Nr. 1, Craiova'
),
(
    'Filiala Gara',
    'FG-02',
    'Bulevardul Bucuresti, Nr. 25, Craiova'
);
```

### 6. Adăugarea exemplarelor fizice

```sql
INSERT INTO BookCopies (book_id, branch_id, status) VALUES
(1, 1, 'available'), -- Maitreyi - Biblioteca Centrala
(1, 2, 'available'), -- Maitreyi - Filiala Gara
(2, 1, 'available'), -- 1984 - Biblioteca Centrala
(3, 2, 'borrowed'),  -- Dune - Filiala Gara
(4, 1, 'available'), -- Sapiens - Biblioteca Centrala
(5, 1, 'available'); -- Stapanul Inelelor - Biblioteca Centrala
```

---

## Relațiile dintre tabele

Relațiile principale ale bazei de date sunt:

- **Publishers → Books:** o editură poate publica mai multe cărți.
- **Books ↔ Authors:** relație many-to-many, implementată prin `BookAuthors`.
- **Books → BookCopies:** o carte poate avea mai multe exemplare fizice.
- **Branches → BookCopies:** o sucursală poate deține mai multe exemplare.
- **Users → Loans:** un utilizator poate avea mai multe împrumuturi.
- **BookCopies → Loans:** un exemplar poate apărea în mai multe înregistrări de împrumut de-a lungul timpului.

### Observații

- Cheile primare identifică în mod unic înregistrările.
- Cheile străine asigură legăturile dintre tabele.
- Constrângerile `UNIQUE` previn duplicatele pentru anumite câmpuri.
- `ON DELETE CASCADE` șterge automat înregistrările dependente pentru relațiile configurate astfel.
- `ON DELETE SET NULL` păstrează cartea dacă editura asociată este ștearsă.
- Câmpul `password_hash` este destinat stocării hash-ului parolei, nu parolei în format text.

**Notă:** scriptul folosește sintaxa MySQL. Datele inițiale presupun că tabelele sunt goale și că identificatorii auto-incrementați încep de la `1`.
