import { Model, DataTypes, Op } from 'sequelize';
import jwt from 'jsonwebtoken';
import path from 'path';
import fs from 'fs';

import sequelize from '../db/index';
import { usernamePattern } from '../utils/regexPatterns';
import { generateHash } from '../utils/functions';

const privateKeyPath = path.join(__dirname, '../../../keys/private.pem');
const privateKey = fs.readFileSync(privateKeyPath, 'utf8');

interface UserAttr {
  id: number;
  name: string;
  username: string;
  avatar: string;
  email: string;
  password: string;
  tokens: string[];
}

class User extends Model implements UserAttr {
  public id!: number;

  public name!: string;

  public username!: string;

  public email!: string;

  public avatar!: string;

  public password!: string;

  public tokens!: string[];

  public readonly createdAt!: Date;

  public readonly updatedAt!: Date;

  public async generateJwt(): Promise<string> {
    const user = this;

    const token = jwt.sign({ username: user.username.toString() }, privateKey, { algorithm: 'RS256' });
    user.tokens.push(token);

    await User.update({
      tokens: user.tokens,
    }, {
      where: {
        username: user.username,
      },
    });

    return token;
  }

  public static generateJWTAndUpdateArray(
    username: string, oldToken: string, tokens: string[],
  ): {token: string; tokens: string[]} {
    const newToken = jwt.sign({ username }, privateKey, { algorithm: 'RS256' });
    const oldTokenIndex = tokens.indexOf(oldToken);
    const tokensArray = [...tokens];

    if (oldTokenIndex !== -1) {
      tokensArray[oldTokenIndex] = newToken;
    }

    return { token: newToken, tokens: tokensArray };
  }

  public static async checkUsernameAndPass(username: string, password: string): Promise<User> {
    const user = await User.findOne({
      where: {
        [Op.or]: [
          {
            email: username,
          },
          {
            username,
          },
        ],
      },
    });

    if (!user) {
      throw new Error('No such user found');
    }

    const encPass = generateHash(password);

    if (encPass !== user.password) {
      throw new Error('No such user found');
    }

    return user;
  }

  toJSON() {
    return {
      name: this.name,
      username: this.username,
      avatar: this.avatar,
    };
  }
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
    onDelete: 'CASCADE',
    onUpdate: 'CASCADE',
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
  avatar: {
    type: DataTypes.STRING,
    allowNull: false,
    defaultValue: 'default.png',
  },
  password: {
    type: DataTypes.STRING,
    allowNull: false,
    validate: {
      checkPassword(value: string): void {
        if (value.length < 6) {
          throw new Error('Password too short');
        }
      },
    },
    set(value: string) {
      this.setDataValue('password', generateHash(value));
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

const fn = async () => {
  await sequelize.sync();
};

fn();

export { User, UserAttr };
