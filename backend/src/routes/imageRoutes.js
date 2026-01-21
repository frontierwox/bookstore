const express = require('express');
const mongoose = require('mongoose');
const getGFS = require('../config/gridfs');

const router = express.Router();

router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;

    // ✅ 1. Validate ObjectId BEFORE using it
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ message: 'Invalid image id' });
    }

    const gfs = getGFS();
    if (!gfs) {
      return res.status(500).json({ message: 'GridFS not initialized' });
    }

    const _id = new mongoose.Types.ObjectId(id);

    // ✅ 2. Check file existence
    const files = await gfs.find({ _id }).toArray();
    if (!files || files.length === 0) {
      return res.sendStatus(404);
    }

    // ✅ 3. Set correct content type
    res.set('Content-Type', files[0].contentType || 'application/octet-stream');

    // ✅ 4. Stream file safely
    const downloadStream = gfs.openDownloadStream(_id);

    downloadStream.on('error', () => {
      return res.sendStatus(404);
    });

    downloadStream.pipe(res);
  } catch (err) {
    console.error('Image stream error:', err);
    return res.sendStatus(500);
  }
});

module.exports = router;
