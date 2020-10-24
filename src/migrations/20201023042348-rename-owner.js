module.exports = {
  up: async (queryInterface, Sequelize) => (queryInterface.renameColumn('Classes', 'owner', 'ownerRef')), /**
     * Add altering commands here.
     *
     * Example:
     * await queryInterface.createTable('users', { id: Sequelize.INTEGER });
     */

  down: async (queryInterface, Sequelize) => (queryInterface.renameColumn('Classes', 'ownerRef', 'owner')),
  /**
     * Add reverting commands here.
     *
     * Example:
     * await queryInterface.dropTable('users');
     */

};
