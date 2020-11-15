module.exports = {
  up: async (queryInterface, Sequelize) => {
    try {
      await queryInterface.renameColumn('Classes', 'owner', 'ownerRef');
    } catch (e) {
      // move on
    }
  }, /**
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
