const {format} = require('util')
const express = require('express')
const multer = require('multer')
const cors = require('cors')
const path = require('path')
const fs = require('fs')

const router = express.Router();

// const serviceKey = path.join(__dirname, './config/keys2.json');
// const serviceKeyCut = require('./config/keys.json');
// const serviceKeyJoined = { ...serviceKeyCut, "private_key_id": process.env.private_key_id, "private_key": process.env.private_key};
// fs.writeFileSync(serviceKey, JSON.stringify(serviceKeyJoined));

// const {Storage} = require('@google-cloud/storage');
// const e = require('express');
// const gStorage = new Storage({
//   keyFilename: serviceKey,
//   projectId: process.env.GOOGLE_CLOUD_PROJECT
// });
// const bucket = gStorage.bucket(process.env.GCLOUD_STORAGE_BUCKET);

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

// const upload = multer({
//   storage: multer.memoryStorage(),
//   limits: {
//     fileSize: 10000000,
//   },

//   fileFilter(res, file, cb) {
//     if (
//       !file.originalname.endsWith('.jpg') &&
//       !file.originalname.endsWith('.jpeg') &&
//       !file.originalname.endsWith('.png')
//     ) {
//       return cb(new Error('Please upload a valid image!'));
//     }
//     cb(undefined, true);
//   },
// });

// router.post('/upload', cors(), upload.single('picture'), (req, res, next) => {
//   if (!req.file) {
//     res.status(400).send('No file uploaded');
//     return
//   }

//   const blob = bucket.file(req.file.originalname);
//   const blobStream = blob.createWriteStream();

//   blobStream.on('error', err => {
//     next(err)
//   });

//   blobStream.on('finish', () => {
//     const publicUrl = format(
//       `https://storage.googleapis.com/${bucket.name}/${blob.name}`
//     );
//     res.status(200).send(publicUrl);
//   });

//   blobStream.end(req.file.buffer)
// });

module.exports = router;