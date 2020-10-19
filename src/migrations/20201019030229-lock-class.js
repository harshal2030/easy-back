module.exports = {
  up: async (queryInterface, Sequelize) => (queryInterface.addColumn('Classes', 'lockJoin', Sequelize.BOOLEAN, {
    defaultValue: false,
  })), /**
     * Add altering commands here.
     *
     * Example:
     * await queryInterface.createTable('users', { id: Sequelize.INTEGER });
     */

  down: async (queryInterface, Sequelize) => (queryInterface.removeColumn('Classes', 'lockJoin')),
  /**
     * Add reverting commands here.
     *
     * Example:
     * await queryInterface.dropTable('users');
     */

};
