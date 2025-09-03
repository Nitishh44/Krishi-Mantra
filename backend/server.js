const express = require ("express");
const cors = require ("cors");
// const connectDB = require ("../config/db.js");
const aiRoutes = require ("../routes/aiRoutes.js");
const diseaseDetectionRoutes = require("../routes/diseaseDetection.js");

const app = express();
// connectDB();

app.use(cors());
app.use(express.json());

app.get("/", (req, res) => {
  res.send("Backend is running...");
});

app.use("/api", aiRoutes);
app.use("/api", diseaseDetectionRoutes);

const PORT = 4000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));