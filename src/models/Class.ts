import { Model, DataTypes, Op } from 'sequelize';
import { nanoid } from 'nanoid';

import sequelize from '../db';
import { User } from './User';
import { Student } from './Student';

import { oneMonthDiff } from '../utils/plans';

interface ClassAttr {
  id: string;
  name: string;
  about: string;
  subject: string;
  ownerRef: string;
  photo: string;
  collaborators: string[];
  joinCode: string;
  lockJoin: boolean;
  payId: string | null;
  payedOn: Date | null;
  planId: 'free' | 'standard';
  storageUsed: string;
}

class Class extends Model implements ClassAttr {
  public id!: string;

  public name!: string;

  public about!: string;

  public subject!: string;

  public ownerRef!: string;

  public photo!: string;

  public collaborators!: string[];

  public joinCode!: string;

  public lockJoin!: boolean;

  public payId!: string | null;

  public payedOn!: Date | null;

  public planId!: 'free' | 'standard';

  public storageUsed!: string;

  public readonly createdAt!: Date;

  public readonly updatedAt!: Date;

  public readonly students!: Student[];

  public readonly owner!: User;

  public static async updateExpiredClasses(ids :string[]) {
    try {
      await Class.update({
        planId: 'free',
        payId: null,
      }, {
        where: {
          id: {
            [Op.in]: ids,
          },
        },
      });
    } catch (e) {
      // move on
    }
  }

  toJSON() {
    const expiredPlanClassesId: string[] = [];

    if (this.payId) {
      const timePassed = new Date().getTime() - this.payedOn!.getTime();

      if (timePassed > oneMonthDiff) {
        expiredPlanClassesId.push(this.id);
        this.planId = 'free';
      }
    }

    const {
      id,
      name,
      about,
      subject,
      joinCode,
      collaborators,
      lockJoin,
      payId,
      payedOn,
      photo,
      planId,
      owner,
      students,
      storageUsed,
      createdAt,
      updatedAt,
    } = this;

    return {
      id,
      name,
      about,
      subject,
      joinCode,
      collaborators,
      lockJoin,
      payId,
      payedOn,
      photo,
      planId,
      owner,
      students,
      storageUsed: parseInt(storageUsed, 10),
      updatedAt,
      createdAt,
    };
  }
}

Class.init({
  id: {
    type: DataTypes.STRING,
    primaryKey: true,
    unique: true,
    allowNull: false,
    defaultValue: () => nanoid(),
  },
  name: {
    type: DataTypes.STRING,
    allowNull: false,
    validate: {
      checkEmptyString(value: string) {
        if (value.trim().length < 1) {
          throw new Error('Name is required for the class');
        }
      },
    },
  },
  about: {
    type: DataTypes.TEXT,
  },
  subject: {
    type: DataTypes.STRING,
    validate: {
      checkEmptySub(value: string) {
        if (value === null) {
          throw new Error('Please enter the subject for your class');
        }

        if (value.trim().length < 1) {
          throw new Error('Please enter the subject for your class');
        }
      },
    },
  },
  ownerRef: {
    type: DataTypes.STRING,
    allowNull: false,
    references: {
      model: User,
      key: 'username',
    },
    onUpdate: 'CASCADE',
    onDelete: 'CASCADE',
  },
  photo: {
    type: DataTypes.STRING,
    defaultValue: null,
  },
  collaborators: {
    type: DataTypes.ARRAY(DataTypes.STRING(255)),
    defaultValue: [],
  },
  joinCode: {
    type: DataTypes.STRING,
    defaultValue: () => nanoid(12),
  },
  lockJoin: {
    type: DataTypes.BOOLEAN,
    defaultValue: false,
  },
  payId: {
    type: DataTypes.STRING,
    defaultValue: null,
  },
  payedOn: {
    type: DataTypes.DATE,
    defaultValue: null,
  },
  planId: {
    type: DataTypes.STRING,
    defaultValue: 'free',
    allowNull: false,
    validate: {
      checkIds(value: string | undefined) {
        if (!value) {
          throw new Error('Plan Id is required');
        }

        if (!['standard', 'free'].includes(value)) {
          throw new Error('Invalid plan chosen');
        }
      },
    },
  },
  storageUsed: {
    type: DataTypes.BIGINT,
    defaultValue: 0,
    allowNull: false,
  },
}, {
  sequelize,
  timestamps: true,
});

Class.hasMany(Student, {
  sourceKey: 'id',
  foreignKey: 'classId',
  as: 'students',
});

Class.belongsTo(User, {
  as: 'owner',
  foreignKey: 'ownerRef',
  targetKey: 'username',
});

export { Class, ClassAttr };
