import { Sequelize } from 'sequelize';

const sequelize = new Sequelize(process.env.DBurl!);

export default sequelize;
