module.exports = {

  up: async (queryInterface, Sequelize) => {
    try {
      await queryInterface.changeColumn('Users', 'username', {
        type: Sequelize.STRING(),
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE',
        allowNull: false,
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
