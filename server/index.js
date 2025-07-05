const express = require('express');
const cors = require('cors');
const fs = require('fs');
const path = require('path');
const multer = require('multer');

const app = express();
const PORT = 3000;
const DATA_FILE = path.join(__dirname, 'data.json');

// Middleware
app.use(cors());
app.use(express.json()); // still needed for GET requests
app.use('/uploads', express.static(path.join(__dirname, 'uploads'))); // serve uploaded files

// Ensure data file exists
if (!fs.existsSync(DATA_FILE)) {
  fs.writeFileSync(DATA_FILE, '[]');
}

// Configure Multer to store files in /uploads
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, path.join(__dirname, 'uploads'));
  },
  filename: function (req, file, cb) {
    const timestamp = Date.now();
    const ext = path.extname(file.originalname);
    const safeName = file.originalname.replace(/\s+/g, '_');
    cb(null, `${timestamp}_${safeName}`);
  }
});

const upload = multer({ storage });

// GET all messages
app.get('/api/messages', (req, res) => {
  fs.readFile(DATA_FILE, 'utf8', (err, data) => {
    if (err) return res.status(500).json({ error: 'Failed to read data.json' });
    res.json(JSON.parse(data));
  });
});

// POST new message (with file)
app.post('/api/messages', upload.single('file'), (req, res) => {
  const { title, stage1, stage2, stage3 } = req.body;

  if (!req.file || !title || !stage1 || !stage2 || !stage3) {
    return res.status(400).json({ error: 'Missing required fields' });
  }

  // Read existing data
  fs.readFile(DATA_FILE, 'utf8', (err, data) => {
    if (err) return res.status(500).json({ error: 'Failed to read data.json' });

    let messages = [];
    try {
      messages = JSON.parse(data);
    } catch (parseErr) {
      return res.status(500).json({ error: 'Invalid JSON in data.json' });
    }

    const newEntry = {
      title,
      file: {
        name: req.file.originalname,
        storedAs: req.file.filename,
        path: `/uploads/${req.file.filename}`,
        mimetype: req.file.mimetype
      },
      stages: {
        stage1,
        stage2,
        stage3
      }
    };

    messages.push(newEntry);

    fs.writeFile(DATA_FILE, JSON.stringify(messages, null, 2), (err) => {
      if (err) return res.status(500).json({ error: 'Failed to write to data.json' });
      res.status(201).json({ message: 'Entry saved successfully', entry: newEntry });
    });
  });
});

app.listen(PORT, () => {
  console.log(`Server is running at http://localhost:${PORT}`);
});
