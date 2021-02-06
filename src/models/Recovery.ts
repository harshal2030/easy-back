import { DataTypes, Model } from 'sequelize';
import sequelize from '../db';

interface RecoveryAttr {
  id: number;
  email: string;
  code: string;
  used: boolean;
}

class Recovery extends Model implements RecoveryAttr {
  public id!: number;

  public email!: string;

  public code!: string;

  public used!: boolean;

  public readonly createAt!: Date;
}

Recovery.init({
  id: {
    type: DataTypes.INTEGER,
    autoIncrement: true,
    primaryKey: true,
    allowNull: false,
  },
  email: {
    type: DataTypes.STRING,
    allowNull: false,
    validate: {
      isEmail: {
        msg: 'Invalid E-mail',
      },
    },
  },
  code: {
    type: DataTypes.STRING,
    allowNull: false,
    validate: {
      checkCode(value: string) {
        if (value.trim().length < 6) {
          throw new Error('Code too short');
        }
      },
    },
  },
  used: {
    type: DataTypes.BOOLEAN,
    allowNull: false,
    defaultValue: false,
  },
}, {
  sequelize,
  timestamps: true,
  updatedAt: false,
});

export { Recovery, RecoveryAttr };
