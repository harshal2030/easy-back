import express, { Application } from 'express';
import http from 'http';
import path from 'path';
import compression from 'compression';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import cookie from 'cookie-parser';
import { Server } from 'socket.io';

import { WSAuth } from './middlewares/auth';
import { Class } from './models/Class';
import { Student } from './models/Student';

// routers
import userRouter from './routers/user';
import classRouter from './routers/class';
import mediaRouter from './routers/multimedia';
import quizRouter from './routers/quiz';
import queRouter from './routers/question';
import studentRouter from './routers/students';
import resultRouter from './routers/result';
import messageRouter from './routers/messages';
import moduleRouter from './routers/module';
import fileRouter from './routers/files';
import vidTracker from './routers/videoTracker';
import paymentRouter from './routers/payments';

const app: Application = express();
const server = http.createServer(app);

app.use(compression());

const whiteLists = process.env.NODE_ENV === 'production' ? ['https://easyteach.inddex.co', 'http://easyteach.inddex.co'] : ['http://localhost', 'http://localhost:8080', 'http://192.168.43.21:8080'];

app.use(cors({
  credentials: true,
  origin: whiteLists,
  maxAge: 86400,
}));
app.use(helmet());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookie(process.env.cookieSecret));

if (process.env.NODE_ENV !== 'production') {
  app.use(morgan('dev'));
}

const io = new Server(server, {
  cors: {
    origin: whiteLists,
    credentials: true,
  },
});

io.use(WSAuth);

io.on('connection', async (socket) => {
  const classes = await Class.getUserClasses(socket.user!.username);
  socket.join(classes.map((cls) => cls.id));

  socket.on('class:join_create', async (classId: string) => {
    const studentExists = await Student.findOne({
      where: {
        classId,
        username: socket.user!.username,
      },
    });

    if (studentExists) {
      socket.join(classId);
      return;
    }

    const classExists = await Class.findOne({
      where: {
        id: classId,
        ownerRef: socket.user!.username,
      },
    });

    if (classExists) {
      socket.join(classId);
    }
  });
});

app.use((req, _res, next) => {
  req.io = io;
  next();
});

app.use('/users', userRouter);
app.use('/class', classRouter);
app.use('/media', mediaRouter);
app.use('/quiz', quizRouter);
app.use('/que', queRouter);
app.use('/student', studentRouter);
app.use('/result', resultRouter);
app.use('/msg', messageRouter);
app.use('/module', moduleRouter);
app.use('/file', fileRouter);
app.use('/vidtracker', vidTracker);
app.use('/pay', paymentRouter);

app.get('/', (_req, res) => {
  res.send('Hello');
});

app.get('/privacy', (_req, res) => {
  res.sendFile(path.join(__dirname, '../privacy.html'));
});

export default server;
