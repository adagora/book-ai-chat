# book-ai-chat

application allows you to ask questions about text that has been trained in the database using openai model.

## Features

- implemented opeai model,
- read pdf using langchain
- postgresml to create table and train model

### Installation

```bash
npm install
npm start
```

you need to create .env file and add value:

```bash

POSTGRES_URL
POSTGRES_USER
POSTGRES_HOST
POSTGRES_DB
POSTGRES_PASS
POSTGRES_PORT

OPENAI_API_KEY
PORT=3000

```

### How to run

- create account on https://postgresml.org/
- connect to your PostgreSQL Database: Use the psql command to connect to your PostgreSQL database. `psql -h your_host -U your_username -d your_database`
- create table `\i src/create.sql`
- show a list of tables in a PostgreSQL database `\dt`
- If you want to see more details about a specific table, you can use the `\d chat_pdf`
- you can read the rows by executing a SELECT query. `SELECT * FROM public.chat_pdf`
- select pdf you want and name it `embeddings.pdf`
- run `node embed.js` to insert loaded pdf content into table
- run `node index.js` or `npm start`
- you can send request `POST /api/chat/completions` with body `{"input": "your question"}` from Postman or custom front end
