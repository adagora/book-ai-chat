const express = require("express");
const app = express();
require("dotenv").config();
const { Client } = require("pg");
import { OpenAI } from "openai";

const client = new Client({
  user: process.env.POSTGRES_USER,
  host: process.env.POSTGRES_HOST,
  database: process.env.POSTGRES_DB,
  password: process.env.POSTGRES_PASS,
  port: process.env.POSTGRES_PORT,
});

client.connect();
app.use(express.json());

// you need paid version to use OPENAI API
const configuration = {
  organization: process.env.OPENAI_ORG_ID,
  apiKey: process.env.OPENAI_API_KEY,
};

const openai = new OpenAI(configuration);

let numberOfRequests = 0;
const PORT = 3000;

app.post(
  "/api/chat/completions",
  async (req: { body: { input: string } }, res: any) => {
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

      const res = await client.query(query, [input]);

      const rows = res.rows;

      console.log("rows", rows);

      // const rows = [
      //   {
      //     content: "The quick brown fox jumps over the lazy dog.",
      //   },
      // ];

      const prompt = `
    You are teacher who assists users with understanding a pdf. Answer the user's questions only using the context's opinion. If you are unsure of the answer, tell the user you dont know.

    context's opinion: """
    ${rows.map(({ content }: any) => content)}
    """

    user: ${input}

    assistant:
  `;

      const completionRes = await openai.completions.create({
        prompt: prompt,
        // gpt-3.5-turbo-instruct
        model: "text-davinci-003",
        temperature: 0,
      });

      const resp = completionRes.choices[0].text;

      console.log("resp", resp);

      res.send(resp);
    } catch (err) {
      console.log("err", err);
      res.send((err as any).error.message);
    }
  }
);

app.listen(PORT, () => {
  console.log(`listening on port http://localhost:${PORT}`);
});
