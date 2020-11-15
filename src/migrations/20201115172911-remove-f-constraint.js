module.exports = {
  up: async (queryInterface, Sequelize) => {
    try {
      await queryInterface.removeConstraint('Quizzes', 'Quizzes_classId_fkey');
    } catch (e) {
      console.log(e);
      // move on
    }
    /**
     * Add altering commands here.
     *
     * Example:
     * await queryInterface.createTable('users', { id: Sequelize.INTEGER });
     */
  },

  down: async (queryInterface, Sequelize) => {
    /**
     * Add reverting commands here.
     *
     * Example:
     * await queryInterface.dropTable('users');
     */
  },
};
