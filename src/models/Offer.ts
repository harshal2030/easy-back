import { Model, DataTypes } from 'sequelize';
import { nanoid } from 'nanoid';

import sequelize from '../db';

interface OfferAttr {
  id: string;
  email: string | null;
  code: string;
  offerId: string;
  used: boolean;
}

class Offer extends Model implements OfferAttr {
  public id!: string;

  public email!: string | null;

  public code!: string;

  public offerId!: string;

  public used!: boolean;

  public readonly createdAt!: Date;

  public readonly updatedAt!: Date;
}

Offer.init({
  id: {
    type: DataTypes.STRING(30),
    primaryKey: true,
    defaultValue: () => nanoid(23),
  },
  email: {
    type: DataTypes.STRING,
  },
  code: {
    type: DataTypes.STRING(50),
    allowNull: false,
  },
  offerId: {
    type: DataTypes.STRING,
  },
  planId: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  used: {
    type: DataTypes.BOOLEAN,
    allowNull: false,
    defaultValue: false,
  },
}, {
  sequelize,
  timestamps: true,
});

export { Offer, OfferAttr };
