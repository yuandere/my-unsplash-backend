const express = require('express')
const logger = require('morgan')
const cors = require('cors')
const app = express()
const db = require('./queries')

const PORT = process.env.PORT || 5000;
const NODE_ENV = process.env.NODE_ENV || 'development';

app.set('port', PORT);
app.set('env', NODE_ENV);

app.use(logger('tiny'));
app.use(express.json());
app.use(cors());

app.get('/images', db.getImages)
app.get('/images/:id', db.getImageById)
app.post('/images', db.addImage)
app.put('/images/:id', db.updateImage)
app.delete('/images/:id', db. deleteImage)

app.get('/fetchgallery', db.fetchgallery)
app.post('/upload', db.upload.single('picture'), db.fileUpload)

app.use((err, req, res, next) => {
  console.error(err);
  res.status(err.status || 500);
  res.json({
    error: {
      message: err.message,
    },
  });
});

app.listen(PORT, ()=> {
  console.log(
    `Express Server started on Port ${app.get('port')} | 
    Environment : ${app.get('env')}`
  );
});