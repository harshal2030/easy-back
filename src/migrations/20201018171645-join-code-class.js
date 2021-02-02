module.exports = {
  up: async (queryInterface, Sequelize) => {
    try {
      await queryInterface.addColumn('Classes', 'joinCode', Sequelize.STRING, {
        allowNull: false,
      });
    } catch (e) {
      console.log(e);
      // move
    }
  }, /**
     * Add altering commands here.
     *
     * Example:
     * await queryInterface.createTable('users', { id: Sequelize.INTEGER });
     */

  down: async (queryInterface, Sequelize) => (queryInterface.removeColumn('Classes', 'joinCode')),
  /**
     * Add reverting commands here.
     *
     * Example:
     * await queryInterface.dropTable('users');
     */

};
