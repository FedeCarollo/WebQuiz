const express = require('express');
const path = require('path');
const app = express();
const apiRouter = require('./routes/api');
const bodyParser = require('body-parser');


app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());

app.use(express.static(path.join(__dirname,'static')));

app.get('/', (req, res) => {
  res.redirect('/index.html');
});

app.use("/api", apiRouter);

// Start the server
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
