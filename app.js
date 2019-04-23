const express = require('express');
const bodyParser = require('body-parser');

const app = express();
app.use(bodyParser.json());

app.get('/hello', (req, res) => {
  res
    .status(200)
    .send('Hello, world!')
    .end();
});

if (module === require.main) {
const PORT = process.env.PORT || 8080;
app.listen(PORT, () => {
    console.log(`App listening on port ${PORT}`);
    console.log('Press Ctrl+C to quit.');
});
}

module.exports = app;