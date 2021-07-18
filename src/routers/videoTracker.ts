import express from 'express';
import { nanoid } from 'nanoid';
import XLSX from 'xlsx';
import sequelize from '../db';

import { Module } from '../models/Module';
import { File } from '../models/File';

import { auth } from '../middlewares/auth';
import { mustBeClassOwner, mustBeStudentOrOwner } from '../middlewares/userLevels';
import { SendOnError } from '../utils/functions';

const router = express.Router();

router.post('/:classId/:moduleId/:videoId', auth, mustBeStudentOrOwner, async (req, res) => {
  try {
    const module = await Module.findOne({
      where: {
        classId: req.params.classId,
        id: req.params.moduleId,
      },
    });

    if (!module) {
      res.status(400).send({ error: 'No such resource' });
      return;
    }

    const file = await File.findOne({
      where: {
        id: req.params.videoId,
        moduleId: req.params.moduleId,
      },
    });

    if (!file) {
      res.status(400).send({ error: 'No such resource' });
      return;
    }

    const now = new Date();

    sequelize.query(`UPDATE "VideoTrackers" SET start=:start, stop=:stop
      WHERE username=:username AND stop-start < :stop::timestamp-:start::timestamp
      AND "createdAt"::TIMESTAMP::DATE=:createdAt::TIMESTAMP::DATE;
      INSERT INTO "VideoTrackers" (id, "videoId", username, start, stop, "createdAt")
      SELECT :id, :videoId, :username, :start, :stop, :createdAt
      WHERE NOT EXISTS(SELECT id FROM "VideoTrackers" WHERE
      username=:username AND "createdAt"::TIMESTAMP::DATE=:createdAt::TIMESTAMP::DATE AND "videoId"=:videoId)`, {
      replacements: {
        id: nanoid(),
        videoId: req.params.videoId,
        username: req.user!.username,
        start: new Date(req.body.start),
        stop: new Date(req.body.stop),
        createdAt: now,
      },
    });

    res.sendStatus(200);
  } catch (e) {
    SendOnError(e, res);
  }
});

router.get('/file/:classId/:moduleId/:videoId', async (req, res) => {
  try {
    const [module, file] = await Promise.all([
      Module.findOne({
        where: {
          classId: req.params.classId,
          id: req.params.moduleId,
        },
      }),
      File.findOne({
        where: {
          id: req.params.videoId,
          moduleId: req.params.moduleId,
        },
      }),
    ]);

    if (!(module || file)) {
      res.status(400).send({ error: 'No such resource found' });
      return;
    }

    const fileData = await sequelize.query(`SELECT u."name", ROUND(EXTRACT(epoch FROM (v.stop - v.start))/60) "Minutes Spent",
    TO_CHAR(v."createdAt", 'DD/MM/YYYY') "Date" FROM "VideoTrackers" v INNER JOIN "Users" u
    USING (username) WHERE v."videoId" = :videoId ORDER BY u.name;`, {
      replacements: { videoId: file!.id },
      nest: true,
    });

    const fileToSend = XLSX.utils.json_to_sheet(fileData);

    const stream: NodeJS.ReadWriteStream = XLSX.stream.to_csv(fileToSend);

    res.setHeader('Content-disposition', `attachment; filename="${req.params.videoId}.csv"`);
    res.set('Content-Type', 'text/csv');
    stream.pipe(res);
  } catch (e) {
    SendOnError(e, res);
  }
});

router.get('/:classId/:moduleId/:videoId', auth, mustBeClassOwner, async (req, res) => {
  try {
    const [module, file] = await Promise.all([
      Module.findOne({
        where: {
          classId: req.params.classId,
          id: req.params.moduleId,
        },
      }),
      File.findOne({
        where: {
          id: req.params.videoId,
          moduleId: req.params.moduleId,
        },
      }),
    ]);

    if (!(module || file)) {
      res.status(400).send({ error: 'No such resource found' });
      return;
    }

    const data = await sequelize.query(`WITH ordered AS (
      SELECT * FROM "VideoTrackers" WHERE "videoId"=:id ORDER BY "createdAt"
    )
    SELECT DISTINCT ON (ordered.username) ordered.start, ordered.stop, ordered."createdAt", ordered."videoId", "Users".name "user.name",
    "Users".username "user.username", "Users".avatar "user.avatar" FROM ordered INNER JOIN "Users" USING (username);`, {
      replacements: {
        id: req.params.videoId,
      },
      raw: true,
      nest: true,
    });

    res.send(data);
  } catch (e) {
    SendOnError(e, res);
  }
});

export default router;
