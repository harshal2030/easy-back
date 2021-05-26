module.exports = {
  up: async (queryInterface, Sequelize) => {
    try {
      await queryInterface.addColumn('Classes', 'storageUsed', {
        type: Sequelize.BIGINT,
        allowNull: false,
        defaultValue: 0,
      });
    } catch (e) {
      console.log(e);
    }
  },

  down: async (queryInterface, Sequelize) => {
    try {
      await queryInterface.removeColumn('Classes', 'storageUsed');
    } catch (e) {
      console.log(e);
    }
  },
};
