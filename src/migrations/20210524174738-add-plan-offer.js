module.exports = {
  up: async (queryInterface, Sequelize) => {
    try {
      await queryInterface.addColumn('Offers', 'planId', {
        type: Sequelize.STRING,
        allowNull: false,
      });
    } catch (e) {
      console.log(e);
    }
  },

  down: async (queryInterface, Sequelize) => {
    try {
      await queryInterface.removeColumn('Offers', 'planId');
    } catch (e) {
      console.log(e);
    }
  },
};
