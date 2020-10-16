module.exports = {

  up: async (queryInterface, Sequelize) => (queryInterface.addColumn('Questions', 'score', Sequelize.INTEGER, {
    allowNull: false,
    defaultValue: 1,
  })),
  /**

     * Add altering commands here.

     *

     * Example:

     * await queryInterface.createTable('users', { id: Sequelize.INTEGER });

     */

  down: async (queryInterface, Sequelize) => (queryInterface.removeColumn('Questions', 'score'))

  /**

     * Add reverting commands here.

     *

     * Example:

     * await queryInterface.dropTable('users');

     */

  ,

};
