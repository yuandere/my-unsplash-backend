const { format } = require('util')
const multer = require('multer')
const path = require('path')
const fs = require('fs')
const { Storage } = require('@google-cloud/storage')

const serviceKey = path.join(__dirname, './config/keys.json');
const serviceKeyCut = require('./config/keyscut.json');
const serviceKeyJoined = { ...serviceKeyCut, "private_key_id": process.env.private_key_id, "private_key": process.env.private_key};
fs.writeFileSync(serviceKey, JSON.stringify(serviceKeyJoined)); 

const Pool = require('pg').Pool;
const pool = new Pool({
  user: 'unsplash_user',
  host: 'dpg-cdne1bla49984dubmrog-a',
  database: 'unsplash',
  password: process.env.dbpass,
  port: 5432,
})

console.log(serviceKeyJoined);
console.log(pool);

const GOOGLE_CLOUD_PROJECT = "my-unsplash-366500";
const GCLOUD_STORAGE_BUCKET = "my-unsplash-store";

const gStorage = new Storage({
  keyFilename: serviceKey,
  projectId: GOOGLE_CLOUD_PROJECT
});
const bucket = gStorage.bucket(GCLOUD_STORAGE_BUCKET);

const getImages = (req, res) => {
  pool.query('SELECT id, tag, url FROM images3 ORDER BY id ASC', (err, results) => {
    if (err) {
      throw err
    }
    res.status(200).json(results.rows)
  })
}

const getImageById = (req, res) => {
  const id = parseInt(req.params.id);

  pool.query('SELECT * FROM images3 WHERE id = $1', [id], (err, results) => {
    if (err) {
      throw err
    }
    res.status(200).json(results.rows)
  })
}

const addImage = (req, res) => {
  const { tag, url } = req.body.data;
  const password = Math.random().toString(36).substring(2, 7);
  pool.query(
    'INSERT INTO images3 (tag, url, password, gcp) VALUES ($1, $2, $3, false) RETURNING *',
    [tag, url, password], (err, results) => {
      if (err) {
        throw err
      }
      // res.status(201).send(`Image added with ID: ${results.rows[0].id}`)
      res.status(201).json(results.rows)
    })
}

const addImageFile = (req, res, next) => {
  const { tag } = req.body;
  const password = Math.random().toString(36).substring(2, 7);
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
    const url = publicUrl;

    pool.query(
      'INSERT INTO images3 (tag, url, password, gcp) VALUES ($1, $2, $3, true) RETURNING *',
      [tag, url, password], (err, results) => {
        if (err) {
          throw err
        }
        // res.status(201).send(`Image added with ID: ${results.rows[0].id} and url: ${url}`)
        res.status(201).json(results.rows)
      })
  });

  blobStream.end(req.file.buffer)
}

const updateImage = (req, res) => {
  const id = parseInt(req.params.id);
  const { tag, url } = req.body.data;

  pool.query(
    'UPDATE images3 SET tag = $1, url = $2 WHERE id = $3',
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
  const { password } = req.body;
  pool.query('SELECT * FROM images3 WHERE id = $1 AND password = $2',
    [id, password], (err, results) => {
      if (err) {
        throw err
      }
      if (!results.rows[0]) {
        res.status(403).send('Image id / password mismatch')
      } else {
        if (results.rows[0].gcp) {
          const file = bucket.file(results.rows[0].url.substr(49));
          file.delete((err, apiResponse) => {
            if (err) {
              throw err
            }
            console.log('204 means the google bucket delete was successful -->', apiResponse.statusCode);
          })
        };
        pool.query('DELETE FROM images3 WHERE id = $1',
          [id], (err, results) => {
            if (err) {
              throw err
            }
            res.status(200).send(`Image deleted with ID: ${id}`)
          }
        )
      }
    })
}

const deleteImageAdmin = (req, res) => {
  const id = parseInt(req.params.id);

  pool.query('DELETE FROM images3 WHERE id = $1',
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

module.exports = {
  getImages,
  getImageById,
  addImage,
  addImageFile,
  updateImage,
  deleteImage,
  deleteImageAdmin,
  upload,
}