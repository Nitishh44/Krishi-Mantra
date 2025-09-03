const express = require('express');
const multer = require('multer');
const router = express.Router();

// Multer setup for image upload
const storage = multer.memoryStorage();
const upload = multer({ storage });

// Disease detection route
router.post('/detect-disease', upload.single('image'), async (req, res) => {
  try {
    // Here you would send the image buffer to your AI model or external API
    // For now, just simulate a response
    if (!req.file) {
      return res.status(400).json({ error: 'No image uploaded' });
    }
    // Simulated AI response
    const result = {
      disease: 'Leaf Blight',
      confidence: 0.92,
      advice: 'Remove affected leaves and apply eco-friendly fungicide.'
    };
    res.json(result);
  } catch (err) {
    res.status(500).json({ error: 'Detection failed' });
  }
});

module.exports = router;
