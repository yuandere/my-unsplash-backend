const { format } = require('util')
const express = require('express')
const multer = require('multer')
const path = require('path')
const fs = require('fs')
const {Storage} = require('@google-cloud/storage')
const serviceKey = path.join(__dirname, './config/keys.json');

const Pool = require('pg').Pool;
const pool = new Pool({
  user: 'me',
  host: 'localhost',
  database: 'myunsplash',
  password: 'password',
  port: 5432,
})

const GOOGLE_CLOUD_PROJECT = "my-unsplash-366500";
const GCLOUD_STORAGE_BUCKET = "my-unsplash-store";

const gStorage = new Storage({
  keyFilename: serviceKey,
  projectId: GOOGLE_CLOUD_PROJECT
});
const bucket = gStorage.bucket(GCLOUD_STORAGE_BUCKET);

const getImages = (req, res) => {
  pool.query('SELECT * FROM images ORDER BY id ASC', (err, results) => {
    if (err) {
      throw err
    }
    res.status(200).json(results.rows)
  })
}

const getImageById = (req, res) => {
  const id = parseInt(req.params.id);

  pool.query('SELECT * FROM images WHERE id = $1', [id], (err, results) => {
    if (err) {
      throw err
    }
    res.status(200).json(results.rows)
  })
}

const addImage = (req, res) => {
  const { tag, url } = req.body.data;
  pool.query(
    'INSERT INTO images (tag, url) VALUES ($1, $2) RETURNING *',
    [tag, url], (err, results) => {
    if (err) {
      throw err
    }
    res.status(201).send(`Image added with ID: ${results.rows[0].id}`)
  })
}

const updateImage = (req, res) => {
  const id = parseInt(req.params.id);
  const { tag, url } = req.body.data;

  pool.query(
    'UPDATE images SET tag = $1, url = $2 WHERE id = $3',
    [tag, url, id], (err, results) => {
      if (err) {
        throw err
      }
      res.status(200).send(`Image modified with ID: ${id}`)
    }
  )
}

const deleteImage = (req, res) => {
  const id = parseInt(req.params.id);

  pool.query('DELETE FROM images WHERE id = $1',
  [id], (err, results) => {
    if (err) {
      throw err
    }
    res.status(200).send(`Image deleted with ID: ${id}`)
  })
}

const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 10000000,
  },

  fileFilter(res, file, cb) {
    if (
      !file.originalname.endsWith('.jpg') &&
      !file.originalname.endsWith('.jpeg') &&
      !file.originalname.endsWith('.png')
    ) {
      return cb(new Error('Please upload a valid image!'));
    }
    cb(undefined, true);
  },
});

const fetchgallery = (req, res, next) => {
  const listFiles = async () => {
    const [files] = await gStorage.bucket(GCLOUD_STORAGE_BUCKET).getFiles();
    const filesLocations = [];
    console.log('Files:');
    files.forEach(file => {
      filesLocations.push(file.metadata.mediaLink);
    })
    res.status(200).send(filesLocations);
  }
  listFiles().catch(console.error);
};

const fileUpload = (req, res, next) => {
  if (!req.file) {
    res.status(400).send('No file uploaded');
    return
  }

  const blob = bucket.file(req.file.originalname);
  const blobStream = blob.createWriteStream();

  blobStream.on('error', err => {
    next(err)
  });

  blobStream.on('finish', () => {
    const publicUrl = format(
      `https://storage.googleapis.com/${bucket.name}/${blob.name}`
    );
    res.status(200).send(publicUrl);
  });

  blobStream.end(req.file.buffer)
};

module.exports = {
  getImages,
  getImageById,
  addImage,
  updateImage,
  deleteImage,
  upload,
  fetchgallery,
  fileUpload
}