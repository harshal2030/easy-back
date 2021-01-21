import express, { Application } from 'express';
import http from 'http';
import path from 'path';
import compression from 'compression';
import helmet from 'helmet';

// routers
import userRouter from './routers/user';
import classRouter from './routers/class';
import mediaRouter from './routers/multimedia';
import quizRouter from './routers/quiz';
import queRouter from './routers/question';
import studentRouter from './routers/students';
import resultRouter from './routers/result';
import messageRouter from './routers/messages';

const app: Application = express();
const server = http.createServer(app);

app.use(compression());
app.use(helmet());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use('/users', userRouter);
app.use('/class', classRouter);
app.use('/media', mediaRouter);
app.use('/quiz', quizRouter);
app.use('/que', queRouter);
app.use('/student', studentRouter);
app.use('/result', resultRouter);
app.use('/msg', messageRouter);

app.get('/', (req, res) => {
  res.send('Hello');
});

app.get('/privacy', (req, res) => {
  res.sendFile(path.join(__dirname, '../privacy.html'));
});

export default server;
