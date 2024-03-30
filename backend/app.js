require('dotenv').config()

const nano = require('nano')(`http://${process.env.DB_LOGIN}:${process.env.DB_PASSWORD}@localhost:5984`)
const colors = require('colors')
const express = require('express')
const cors = require('cors')

const DB_NAME = 'cars'
const PORT = 5555

const app = express()
app.use(cors())
app.use(express.json()) // Zmiana na wbudowany parser JSON w Express

const DB = nano.use(DB_NAME)

function wypisz_blad(metoda, url, status, blad) {
  console.log(`${metoda}`.bold.green + ` ${url}`.underline + ` ${status}`.bold.red + ` ${blad}`.red)
}
function wypisz_trase(metoda, url, status) {
  console.log(`${metoda}`.bold.green + ` ${url}`.underline + ` ${status}`.bold.green)
}

app.get('/api/v1/cars', (req, res, next) => {
  DB.list({include_docs: true}, (error, dane) => {
    if(error) {
      return next(error); 
    }

    wypisz_trase(req.method, req.url, res.statusCode)
    const wszystkieDokumenty = dane.rows.map(wiersz => wiersz.doc)
    res.status(200).json(wszystkieDokumenty)
  })
})

app.post('/api/v1/cars', (req, res, next) => {
  const dokument = {
    marka: req.body.marka,
    model: req.body.model,
    rok_produkcji: req.body.rok_produkcji
  }
  DB.insert(dokument, (err, body) => {
    if(err) {
      return next(err); // Przekierowanie błędu do funkcji obsługi błędów
    }
    wypisz_trase(req.method, req.url, res.statusCode)
    console.log(`Dodano samochód ${dokument.marka}`.green)
    res.status(200).json({message: 'Dokument dodany'})
  })
})

app.delete(`/api/v1/cars/:id/:rev`, (req, res, next) => {
  const id = req.params.id
  const rev = req.params.rev

  DB.destroy(id, rev, (err, body) => {
    if(err) {
      return next(err); // Przekierowanie błędu do funkcji obsługi błędów
    }
    wypisz_trase(req.method, req.url, res.statusCode)
    res.status(200).json({message: 'Dokument usunięty'})
  })
})

// Jeśli chcesz użyć operacji PATCH, upewnij się, że działasz zgodnie z konwencją REST
app.put(`/api/v1/cars/:id`, (req, res, next) => {
  const id = req.params.id
  const dokument = {
    _id: id,
    _rev: req.body._rev,
    marka: req.body.marka,
    model: req.body.model,
    rok_produkcji: req.body.rok_produkcji
  }
  DB.insert(dokument, (err, body) => {
    if(err) {
      return next(err); // Przekierowanie błędu do funkcji obsługi błędów
    }
    wypisz_trase(req.method, req.url, res.statusCode)
    console.log(`Edytowano samochod ${dokument.marka}`.green)
    res.status(200).json({message: 'Dokument zaktualizowany'})
  })
})

// Funkcja obsługi błędów Express
app.use((err, req, res, next) => {
  res.status(500).json({error: `Internal Server Error: ${err.message}`})
  wypisz_blad(req.method, req.url, res.statusCode, err.message)
})

app.listen(PORT, () => {
  console.log(`Serwer działa na adresie http://localhost:${PORT}`.green)
})
