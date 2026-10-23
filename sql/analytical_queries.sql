-- Library Management Database: analytical query examples
-- SQL dialect: MySQL
-- These queries use the documented schema. Results depend on the records
-- present in your local database.

-- 1. Count physical copies by branch and availability status.
SELECT
    br.name AS branch_name,
    bc.status AS copy_status,
    COUNT(*) AS copy_count
FROM Branches AS br
JOIN BookCopies AS bc
    ON bc.branch_id = br.id
GROUP BY br.name, bc.status
ORDER BY br.name, copy_count DESC;

-- 2. Most frequently borrowed book titles.
-- COUNT(loan.id) measures recorded loan transactions, not unique readers.
SELECT
    b.title,
    COUNT(l.id) AS loan_count
FROM Loans AS l
JOIN BookCopies AS bc
    ON bc.id = l.copy_id
JOIN Books AS b
    ON b.id = bc.book_id
GROUP BY b.id, b.title
ORDER BY loan_count DESC, b.title
LIMIT 10;

-- 3. Monthly borrowing activity.
SELECT
    DATE_FORMAT(l.borrow_date, '%Y-%m') AS borrow_month,
    COUNT(*) AS loans_started
FROM Loans AS l
GROUP BY DATE_FORMAT(l.borrow_date, '%Y-%m')
ORDER BY borrow_month;

-- 4. Loans that are past due and have not been returned.
-- This uses today's date at query execution time.
SELECT
    l.id AS loan_id,
    u.name AS reader_name,
    b.title AS book_title,
    br.name AS branch_name,
    l.borrow_date,
    l.due_date,
    DATEDIFF(CURRENT_DATE, l.due_date) AS days_overdue
FROM Loans AS l
JOIN Users AS u
    ON u.id = l.user_id
JOIN BookCopies AS bc
    ON bc.id = l.copy_id
JOIN Books AS b
    ON b.id = bc.book_id
JOIN Branches AS br
    ON br.id = bc.branch_id
WHERE l.return_date IS NULL
  AND l.due_date < CURRENT_DATE
ORDER BY days_overdue DESC, l.due_date;
