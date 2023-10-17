# book-ai-chat
application allows you to ask questions about text that has been trained in the database using google bard model.

## Features
- bard instead of open ai, bard is free
- in commit history there is implemented opeai model, if you have paid version, you can use their API 
- read pdf using langchain
- postgresml to create table and train model

### Installation
```bash
npm install
npm start

you need to create .env file and add value:
POSTGRES_URL
POSTGRES_USER
POSTGRES_HOST
POSTGRES_DB
POSTGRES_PASS
POSTGRES_PORT

BARD_COOKIES
PORT=3000

```

### How to run
- Visit https://bard.google.com/. Open the browser console by pressing F12. Go to the "Application" tab. Under "Cookies", find the cookie named __Secure-1PSID or __Secure-3PSID. Copy the value of the cookie, which will be your session value.
- create account on https://postgresml.org/
- connect to your PostgreSQL Database: Use the psql command to connect to your PostgreSQL database. `psql -h your_host -U your_username -d your_database`
- create table `\i src/create.sql`
- select pdf you want and name it `embeddings.pdf`
- run `node embed.js` to insert loaded pdf content into table
- craft your prompt inside `bardai.ask`
- run `node index.js` or `npm start`
- you can send request `POST /api/chat/completions` with body `{"input": "your question"}`  from Postman or custom front end 
  
