module.exports = {
  up: async (queryInterface, Sequelize) => {
    try {
      await queryInterface.changeColumn('Devices', 'token', {
        type: Sequelize.STRING(500),
        allowNull: false,
      });
    } catch (e) {
      // move on
    }
    /**
     * Add altering commands here.
     *
     * Example:
     * await queryInterface.createTable('users', { id: Sequelize.INTEGER });
     */
  },

  down: async (queryInterface, Sequelize) => {
    try {
      await queryInterface.changeColumn('Devices', 'token', {
        type: Sequelize.STRING(500),
        allowNull: false,
      });
    } catch (e) {
      // move on
    }
    /**
     * Add reverting commands here.
     *
     * Example:
     * await queryInterface.dropTable('users');
     */
  },
};
