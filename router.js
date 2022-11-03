const { format } = require('util')
const express = require('express')
const multer = require('multer')
const path = require('path')
const fs = require('fs')
const {Storage} = require('@google-cloud/storage')
const db = require('./queries')

const GOOGLE_CLOUD_PROJECT = "my-unsplash-366500";
const GCLOUD_STORAGE_BUCKET = "my-unsplash-store";

const router = express.Router();

router.get('/images', db.getImages)
router.get('/images/:id', db.getImageById)
router.post('/images', db.addImage)
router.put('/images/:id', db.updateImage)
router.delete('/images/:id', db. deleteImage)

// router.get('/fetchgallery', cors(), (req, res, next) => {
//   const imgPath = path.join(__dirname, './testimages');
//   const images = fs.readdirSync(imgPath);
//   const images2 = [];
//   images.forEach((filename, i) => {
//     images2.push(path.join(__dirname, filename))
//   })
//   res.status(200).send(images2);
// })

const serviceKey = path.join(__dirname, './config/keys.json');
// const serviceKeyCut = require('./config/keys.json');
// const serviceKeyJoined = { ...serviceKeyCut, "private_key_id": process.env.private_key_id, "private_key": process.env.private_key};
// fs.writeFileSync(serviceKey, JSON.stringify(serviceKeyJoined));


const gStorage = new Storage({
  keyFilename: serviceKey,
  projectId: GOOGLE_CLOUD_PROJECT
});
const bucket = gStorage.bucket(GCLOUD_STORAGE_BUCKET);

// const storage = multer.diskStorage({
//   destination: function (req, file, cb) {
//     cb(null, __dirname + '/images')
//   },
//   filename: function (req, file, cb) {
//     const fileName = file.originalname.replaceAll(' ','');
//     const fileShort = fileName.slice(0, fileName.indexOf('.'));
//     const fileType = fileName.substring(fileName.indexOf('.'));
//     cb(null, fileShort + '-' + Date.now() + fileType)
//   }
// });

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

router.get('/fetchgallery', (req, res, next) => {
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
})

router.post('/upload', upload.single('picture'), (req, res, next) => {
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
});

module.exports = router;