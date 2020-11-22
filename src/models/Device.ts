import { Model, DataTypes } from 'sequelize';
import sequelize from '../db';

interface DeviceAttr {
  username: string;
  token: string;
  os: string;
  fcmToken: string;
}

class Device extends Model implements DeviceAttr {
  public id!: number;

  public username!: string;

  public token!: string;

  public os!: string;

  public fcmToken!: string;

  public readonly createdAt!: Date;

  public readonly updatedAt!: Date;
}

Device.init({
  username: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  token: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  os: {
    type: DataTypes.STRING,
  },
  fcmToken: {
    type: DataTypes.STRING,
    allowNull: false,
  },
}, {
  sequelize,
  timestamps: true,
});

export { Device, DeviceAttr };
