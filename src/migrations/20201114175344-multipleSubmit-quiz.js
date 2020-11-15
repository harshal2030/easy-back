module.exports = {
  up: async (queryInterface, Sequelize) => {
    try {
      await queryInterface.addColumn('Quizzes', 'multipleSubmit', Sequelize.STRING, {
        allowNull: false,
        defaultValue: false,
      });
    } catch (e) {
      // move on
    }
  }, /**
     * Add altering commands here.
     *
     * Example:
     * await queryInterface.createTable('users', { id: Sequelize.INTEGER });
     */

  down: async (queryInterface, Sequelize) => (queryInterface.removeColumn('Quizzes', 'multipleSubmit')),
  /**
     * Add reverting commands here.
     *
     * Example:
     * await queryInterface.dropTable('users');
     */

};
