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
const PORT = process.env.PORT || 9001;

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

      const completionRes = await bardai
        .ask(
          `
        You are teacher who assists users with understanding a pdf. Answer the user's questions only using the context's opinion. If you are unsure of the answer, tell the user you don not know.

    context's opinion: """
    ${rows.map(({ content }: any) => content)}
    """

    user: ${input}

    assistant:
     `
        )
        .catch(() => {
          const resp = {
            ask: input,
            answer: "Something happened with Bard.",
          };
          res.send(resp);
        });

      const resp = {
        ask: input,
        answer: parseResponse(completionRes),
      };

      res.send(resp);
    } catch (err) {
      console.log("err", err);
      res.send(err);
    }
  }
);

app.listen(PORT, () => console.log(`listening to port ${PORT}`));
