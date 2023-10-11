const { PDFLoader } = require("langchain/document_loaders/fs/pdf");
require("dotenv").config();
const { Client } = require("pg");

const client = new Client({
  user: process.env.POSTGRES_USER,
  host: process.env.POSTGRES_HOST,
  database: process.env.POSTGRES_DB,
  password: process.env.POSTGRES_PASS,
  port: process.env.POSTGRES_PORT,
});

client.connect();

const pdfPath = "embeddings.pdf";

const load = async () => {
  const pdfLoader = new PDFLoader(pdfPath);
  const pdfs = await pdfLoader.load();

  let postRes;
  for (const doc of pdfs) {
    const query = `
    INSERT INTO chat_pdf (content, metadata)
    SELECT
      $1,
      $2
  `;

    postRes = await client.query(query, [doc.pageContent, doc.metadata]);
  }
  console.log(`succesfully inserted ${pdfs.length} page embeddings.`);
};

load()
  .then(() => {
    // close node process
    process.exit(0);
  })
  .catch((err) => {
    console.error(err);
    process.exit(1);
  });
