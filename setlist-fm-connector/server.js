const axios = require('axios');
var express = require('express');
var app = express();

const config = {
  "baseUrl": "https://api.setlist.fm/rest/1.0",
  "apiKey": "7_Q_PB-S4jb5GoJjH2a71IPw9CtiZLi1GM0-",
  "searchArtist": "/search/artists?artistName="
};
const headers = {
    'Content-Type': 'application/json',
    'x-api-key': config.apiKey
};

app.get('/', function (req, res) {
  res.send("setlist-fm-connector");
});

app.get('/artist', function (req, res) {
  axios({ 
    method: 'get', 
    url: config.baseUrl + config.searchArtist + req.query.name, 
    headers: headers
  }).then((qr)=>{
    res.send(JSON.stringify(qr.data));
  });
});

app.listen(3000);
