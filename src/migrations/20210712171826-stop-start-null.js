module.exports = {
  up: async (queryInterface, Sequelize) => {
    try {
      await queryInterface.changeColumn('VideoTrackers', 'start', {
        type: Sequelize.DATE,
        allowNull: true,
        defaultValue: null,
      });
      await queryInterface.changeColumn('VideoTrackers', 'stop', {
        type: Sequelize.DATE,
        allowNull: true,
        defaultValue: null,
      });
    } catch (e) {
      console.log(e);
    }
    /**
     * Add altering commands here.
     *
     * Example:
     * await queryInterface.createTable('users', { id: Sequelize.INTEGER });
     */
  },

  down: async (queryInterface, Sequelize) => {
    console.log('no down query');
    /**
     * Add reverting commands here.
     *
     * Example:
     * await queryInterface.dropTable('users');
     */
  },
};
