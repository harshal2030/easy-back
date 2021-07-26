import { Model, DataTypes } from 'sequelize';
import { nanoid } from 'nanoid';
import sequelize from '../db';

interface UnreadAttr {
  id: number;
  classId: string;
  username: string;
  lastMessageRead: Date;
}

class Unread extends Model implements UnreadAttr {
  public id!: number;

  public classId!: string;

  public username!: string;

  public lastMessageRead!: Date;

  public readonly createdAt!: Date;

  public readonly updatedAt!: Date;

  static async updateUnread(username: string, classId: string, lastMessageDate: Date) {
    try {
      await sequelize.query(`UPDATE "Unreads" SET username=:username, "lastMessageRead"=:lastMessage
    WHERE username=:username AND "classId"=:classId AND "lastMessageRead" < :lastMessage;
    INSERT INTO "Unreads" (id, username, "classId", "lastMessageRead", "createdAt")
    SELECT :id, :username, :classId, :lastMessage, :createdAt
    WHERE NOT EXISTS(SELECT id FROM "Unreads" WHERE
    username=:username AND "classId"=:classId)`, {
        replacements: {
          id: nanoid(),
          username,
          lastMessage: lastMessageDate,
          classId,
          createdAt: new Date(),
        },
      });
    } catch (e) {
      // nothing to do
    }
  }
}

Unread.init({
  id: {
    type: DataTypes.STRING,
    primaryKey: true,
    defaultValue: () => nanoid(),
  },
  classId: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  username: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  lastMessageRead: {
    type: DataTypes.DATE,
    allowNull: false,
  },
}, {
  sequelize,
  timestamps: true,
  updatedAt: false,
});

export { Unread, UnreadAttr };
