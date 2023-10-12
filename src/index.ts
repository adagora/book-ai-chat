import express, { Response } from "express";
const app = express();
import dotenv from "dotenv";
dotenv.config();
import pkg from "pg";
const { Client } = pkg;
import { Bard } from "googlebard";
import cors from "cors";
import { parseResponse } from "./helper.js";

const client = new Client({
  connectionString: process.env.POSTGRES_URL,
  user: process.env.POSTGRES_USER,
  host: process.env.POSTGRES_HOST,
  database: process.env.POSTGRES_DB,
  password: process.env.POSTGRES_PASS,
  port: Number(process.env.POSTGRES_PORT),
});

client.connect();

app.use(express.json(), cors());

// Visit https://bard.google.com/.
// Open the browser console by pressing F12.
// Go to the "Application" tab.
// Under "Cookies", find the cookie named __Secure-1PSID or __Secure-3PSID.
// Copy the value of the cookie, which will be your session value.
const COOKIES = process.env.BARD_COOKIES;

const cookies = `__Secure-1PSID=${COOKIES}`;
let bardai = new Bard(cookies);

let numberOfRequests = 0;
const PORT = 3000;

app.post(
  "/api/chat/completions",
  async (req: { body: { input: string } }, res: Response) => {
    numberOfRequests++;
    console.log("###numberOfRequests###", numberOfRequests);

    const { input } = req.body;
    try {
      const query = `
        WITH query AS (
      SELECT pgml.embed(
            transformer => 'hkunlp/instructor-xl',
            text => $1,
            kwargs => '{
                "instruction": "Represent the question for retrieving supporting documents:"
            }'
        )::vector AS embedding
    )
    SELECT content FROM chat_pdf
    ORDER BY chat_pdf.embedding <=> (SELECT embedding FROM query)
    LIMIT 3;
      `;

      const resPkg = await client.query(query, [input]);

      const rows = resPkg.rows;

      const completionRes = await bardai.ask(`
        Jesteś nauczycielem, który pomaga użytkownikom zrozumieć plik PDF. Odpowiadaj na pytania użytkownika wyłącznie na podstawie opini kontekstowej. Jeśli nie jesteś pewien odpowiedzi, jako asystent powiedz użytkownikowi, że definitywnie nie znasz odpowiedzi.

    opinia kontekstowa: """
    ${rows.map(({ content }: any) => content)}
    """

    użytkownik: ${input}

    asystent:
     `);

      const resp = {
        ask: input,
        answer: parseResponse(parseResponse(completionRes)),
      };

      res.send(resp);
    } catch (err) {
      console.log("err", err);
      res.send(err);
    }
  }
);

app.listen(PORT, () => {
  console.log(`listening on port http://localhost:${PORT}`);
});
