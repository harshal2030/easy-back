import { Model, DataTypes } from 'sequelize';
import sequelize from '../db/index';
import { usernamePattern } from '../utils/regexPatterns';

interface UserAttr {
  id: number;
  name: string;
  username: string;
  email: string;
  password: string;
  tokens: string[];
}

class User extends Model implements UserAttr {
  public id!: number;

  public name!: string;

  public username!: string;

  public email!: string;

  public password!: string;

  public tokens!: string[];
}

User.init({
  name: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  username: {
    type: DataTypes.STRING,
    allowNull: false,
    unique: {
      name: 'username_unique',
      msg: 'Username already taken. Try different one',
    },
    validate: {
      is: {
        args: usernamePattern,
        msg: 'Invalid username pattern. Only underscores, periods are allowed',
      },
    },
  },
  email: {
    type: DataTypes.STRING,
    allowNull: false,
    unique: {
      name: 'email_unique',
      msg: 'E-mail already registered, try login instead',
    },
    validate: {
      isEmail: {
        msg: 'Invalid E-mail',
      },
    },
  },
  password: {
    type: DataTypes.STRING,
    allowNull: false,
    validate: {
      min: {
        args: [6],
        msg: 'Very short password',
      },
    },
  },
  tokens: {
    type: DataTypes.ARRAY(DataTypes.STRING(500)),
    defaultValue: [],
  },
}, {
  sequelize,
  timestamps: true,
});

sequelize.sync();

export { User, UserAttr };
