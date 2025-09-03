const express = require ("express");
const router = express.Router();


// Dummy Route to call Python AI API
router.post("/predict", (req, res) => {
  const { cropImage} = req.body;
  res.json({ message: "AI prediction will come here", cropImage})

});

module.exports =  router;