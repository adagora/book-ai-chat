import express, { Response } from "express";
const app = express();
import dotenv from "dotenv";
dotenv.config();
import pkg from "pg";
const { Client } = pkg;
import cors from "cors";
import { parseResponse } from "./helper.js";
import OpenAI from "openai";

const client = new Client({
  connectionString: process.env.POSTGRES_URL,
  user: process.env.POSTGRES_USER,
  host: process.env.POSTGRES_HOST,
  database: process.env.POSTGRES_DB,
  password: process.env.POSTGRES_PASS,
  port: Number(process.env.POSTGRES_PORT)
});

client.connect();
app.use(express.json(), cors());

const configuration = {
  apiKey: process.env.OPENAI_API_KEY
};

const GPT_MODEL = "gpt-3.5-turbo";

const openai = new OpenAI(configuration);

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

      const completion = await openai.chat.completions
        .create({
          messages: [
            {
              role: "system",
              content: `You are teacher who assists users with understanding a pdf. Answer the user's questions only using the context's opinion. If you are unsure of the answer, tell the user you dont know.
  
              context's opinion: """
              ${rows.map(({ content }) => content)}
              """
              `
            },
            {
              role: "user",
              content: input
            }
          ],
          model: GPT_MODEL,
          temperature: 0
        })
        .catch((e) => {
          const resp = {
            ask: input,
            answer: "Something happened with the AI model. Please try again."
          };
          res.send(resp);
        });

      if (completion && completion.choices) {
        const answerToQuestion = {
          ask: input,
          answer: parseResponse(completion.choices[0].message.content)
        };
        res.send(answerToQuestion);
      }
    } catch (err) {
      res.send(err);
    }
  }
);

app.listen(PORT);
