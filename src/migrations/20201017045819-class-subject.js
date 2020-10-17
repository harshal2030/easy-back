module.exports = {
  up: async (queryInterface, Sequelize) => (queryInterface.addColumn('Classes', 'subject', Sequelize.STRING)), /**
     * Add altering commands here.
     *
     * Example:
     * await queryInterface.createTable('users', { id: Sequelize.INTEGER });
     */

  down: async (queryInterface, Sequelize) => (queryInterface.removeColumn('Classes', 'subject')),
  /**
     * Add reverting commands here.
     *
     * Example:
     * await queryInterface.dropTable('users');
     */

};
