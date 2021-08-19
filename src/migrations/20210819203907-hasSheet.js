module.exports = {
  up: async (queryInterface, Sequelize) => {
    try {
      await queryInterface.addColumn('Classes', 'hasSheet', {
        type: Sequelize.BOOLEAN,
        defaultValue: false,
        allowNull: true,
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
    try {
      await queryInterface.removeColumn('Classes', 'hasSheet');
    } catch (e) {
      console.log(e);
    }
    /**
     * Add reverting commands here.
     *
     * Example:
     * await queryInterface.dropTable('users');
     */
  },
};
