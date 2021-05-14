module.exports = {
  up: async (queryInterface, Sequelize) => {
    try {
      await queryInterface.addColumn('Classes', 'planId', {
        type: Sequelize.STRING,
        defaultValue: 'free',
      });
    } catch (e) {
      console.log(e);
    }
  },

  down: async (queryInterface, Sequelize) => {
    try {
      await queryInterface.removeColumn('Classes', 'planId');
    } catch (e) {
      console.log(e);
    }
  },
};
