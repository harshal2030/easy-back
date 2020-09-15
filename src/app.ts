import express, { Application } from 'express';
import http from 'http';

// routers
import userRouter from './routers/user';

const app: Application = express();
const server = http.createServer(app);

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use(userRouter);

app.get('/', (req, res) => {
  res.send('Hello');
});

export default server;
