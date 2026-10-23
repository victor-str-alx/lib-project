# Library Management Database

## Overview

A relational database design for managing a library with multiple branches. The database covers books, authors, publishers, physical copies, users, and loans, with additional support for user roles and identifying readers on a blacklist.

## Database Structure

| Table | Purpose |
|---|---|
| `Branches` | Library branches and their identifying information |
| `Publishers` | Book publishers |
| `Books` | Book records and publisher relationships |
| `Authors` | Author records |
| `BookAuthors` | Many-to-many relationship between books and authors |
| `BookCopies` | Physical copies, their branches, and availability status |
| `Users` | Reader, librarian, and administrator records |
| `Loans` | Loan records |

## Data Modelling

The schema includes a many-to-many relationship between books and authors through `BookAuthors`. Physical copies are represented separately from general book records, allowing individual copies to be associated with a branch and a status such as available, borrowed, or reserved.

## SQL Analysis Examples

The [SQL analysis file](./sql/analytical_queries.sql) contains MySQL query examples for:

- Counting physical copies by branch and status
- Ranking book titles by recorded loan count
- Summarising borrowing activity by month
- Identifying loans that are overdue and have not been returned

These queries are analytical examples based on the documented schema. Their results depend on the records present in the local database; no findings are claimed without running them against populated data.

## Data Analysis Opportunities

The schema can support questions such as:

- Which book titles have the highest recorded loan counts?
- How does the availability of physical copies vary by branch?
- How does borrowing activity change over time?
- Which loans are currently overdue?

## Database Configuration and Security

The application reads database settings from environment variables in `database/connection.js`. Copy `.env.example` as a reference for the required variables and configure your local environment before connecting to MySQL. Do not commit real passwords or other secrets.

The repository includes a `.gitignore` to exclude local environment files and future dependency folders. Existing tracked files are not automatically removed by `.gitignore`.

## Relevance to Data Analysis

This project provides a practical example of structured data, entity relationships, SQL joins, aggregations, and time-based analysis. It connects database design with questions that a library operator could use to understand lending activity and inventory.
