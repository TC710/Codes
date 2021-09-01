const path = require('path')
const express = require('express')
const app = express()

const dir = path.join(__dirname, 'public');
const port = 3000;

app.use(express.static(dir));
// app.use(express.static(__dirname));
app.use(express.json())             //require to parse the response
app.use(express.urlencoded({ extended: true }))       //require to parse the response

app.get('/', (req, res) => {
    res.sendFile(__dirname + '/public/index.html')
    console.log(req)
})

app.post('/Animes', (req, res) => {
    let userInput = req.body;
    let href = `https://anilist.co/search/anime?year=${req.body['year']}&season=${req.body['season']}`
    res.status(301).redirect(href)
})
//-----------------------------------------------------------------------------------------------------------------------------------------------------


app.get('*', function (req, res) {
    res.status(404).send('not exist', 404);
});


app.listen(port, () => { console.log(`Example app listening at http://localhost:${port}`) })