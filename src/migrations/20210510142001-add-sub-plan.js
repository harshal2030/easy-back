module.exports = {
  up: async (queryInterface, Sequelize) => {
    try {
      await queryInterface.addColumn('Classes', 'subscriptionId', {
        type: Sequelize.STRING,
      });
      await queryInterface.addColumn('Classes', 'planId', {
        type: Sequelize.STRING,
        allowNull: false,
        defaultValue: 'free',
      });
    } catch (e) {
      console.log(e);
    }
  },
  down: async (queryInterface, Sequelize) => {
    try {
      await queryInterface.removeColumn('Classes', 'subscriptionId');
      await queryInterface.removeColumn('Classes', 'planId');
    } catch (e) {
      console.log(e);
    }
  },

};
