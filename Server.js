const dotenv = require("dotenv");
const connectDB = require("./db");
const app = require('./app')

dotenv.config();



//PORT Declaration:
const PORT = process.env.PORT || 8000;

connectDB().then(() => {
  app.on("error", (error) => {
    console.log("🔴 ERROR comes:", error);
    throw error;
  })
  app.listen(PORT, () => {
    console.log(` 🌐 Server is running on port number ${PORT}`);
  });
})
  .catch((error) => {
    console.error("Connection error", error);
  });