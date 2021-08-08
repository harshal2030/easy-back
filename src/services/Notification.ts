import firebase from 'firebase-admin';
import { Student } from '../models/Student';
import { Device } from '../models/Device';

class Notification {
  static async sendMsgToAllClassMember(
    classId: string,
    classOwner: string,
    title: string,
    body?: string, data?: {[field: string]: string},
  ) {
    const userTokens = await Student.findAll({
      where: {
        classId,
      },
      attributes: [],
      include: [
        {
          model: Device,
          as: 'device',
          attributes: ['fcmToken'],
          required: true,
        },
      ],
    });

    const owner = await Device.findAll({
      where: {
        username: classOwner,
      },
    });

    const studentTokens = userTokens
      .map((user) => user.device!.fcmToken)
      .filter((token) => token.trim().length !== 0);

    const ownerTokens = owner
      .map((user) => user.fcmToken)
      .filter((token) => token.trim().length !== 0);

    const tokens = [...studentTokens, ...ownerTokens];

    if (tokens.length !== 0 && process.env.NODE_ENV !== 'test') {
      firebase.messaging().sendMulticast({
        tokens,
        notification: {
          title,
          body,
        },
        android: {
          ttl: 5000,
        },
        data,
      });
    }
  }
}

// eslint-disable-next-line import/prefer-default-export
export { Notification };
