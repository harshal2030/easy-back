import { Model, DataTypes } from 'sequelize';
import { nanoid } from 'nanoid';
import sequelize from '../db';

interface PaymentAttr {
  classId: string;
  orderId: string;
  paymentId: string;
  signature: string;
}

class Payment extends Model implements PaymentAttr {
  public classId!: string;

  public orderId!: string;

  public paymentId!: string;

  public signature!: string;
}

Payment.init({
  id: {
    type: DataTypes.STRING(30),
    primaryKey: true,
    defaultValue: () => nanoid(30),
  },
  classId: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  orderId: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  paymentId: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  signature: {
    type: DataTypes.STRING,
    allowNull: false,
  },
}, {
  sequelize,
  timestamps: true,
  updatedAt: false,
});

export { Payment, PaymentAttr };
