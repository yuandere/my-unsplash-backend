const Pool = require('pg').Pool;
const pool = new Pool({
  user: 'me',
  host: 'localhost',
  database: 'myunsplash',
  password: 'password',
  port: 5432,
})

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

module.exports = {
  getImages,
  getImageById,
  addImage,
  updateImage,
  deleteImage
}