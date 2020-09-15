import { Sequelize } from 'sequelize';

const sequelize = new Sequelize(process.env.DBurl!, {
  logging: false,
});

export default sequelize;
