const { PDFLoader } = require("langchain/document_loaders/fs/pdf");

const pdfPath = "embeddings.pdf";

const load = async () => {
  const pdfLoader = new PDFLoader(pdfPath);
  const pdf = await pdfLoader.load();

  console.log("pdf", pdf);
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
