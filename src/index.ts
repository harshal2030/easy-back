import express from 'express';

const app = express();

app.get('/', (req, res) => {
  res.send('Hello');
});

app.listen(3000, () => {
  console.log('Server listening on 3000');
});
