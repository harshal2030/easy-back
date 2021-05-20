module.exports = {

  up: async (queryInterface, Sequelize) => {
    try {
      await queryInterface.addColumn('Files', 'preview', Sequelize.STRING, {
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

  down: async (queryInterface, Sequelize) => queryInterface.removeColumn('Files', 'preview')
  /**

     * Add reverting commands here.

     *

     * Example:

     * await queryInterface.dropTable('users');

     */

  ,

};
