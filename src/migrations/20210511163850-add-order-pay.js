module.exports = {
  up: async (queryInterface, Sequelize) => {
    try {
      await queryInterface.addColumn('Classes', 'orderId', {
        type: Sequelize.STRING,
        defaultValue: null,
      });
      await queryInterface.addColumn('Classes', 'payId', {
        type: Sequelize.STRING,
        defaultValue: null,
      });
      await queryInterface.addColumn('Classes', 'payedOn', {
        type: Sequelize.DATE,
        defaultValue: null,
      });
    } catch (e) {
      console.log(e);
    }
  },

  down: async (queryInterface, Sequelize) => {
    try {
      await queryInterface.removeColumn('Classes', 'orderId');
      await queryInterface.removeColumn('Classes', 'payId');
    } catch (e) {
      console.log(e);
    }
  },
};
