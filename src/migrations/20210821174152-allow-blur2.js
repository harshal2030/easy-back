module.exports = {
  up: async (queryInterface, Sequelize) => {
    try {
      await queryInterface.changeColumn('Quizzes', 'allowBlur', {
        type: Sequelize.BOOLEAN,
        defaultValue: true,
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
    try {
      await queryInterface.removeColumn('Quizzes', 'allowBlur');
    } catch (e) {
      console.log(e);
    }
    /**
     * Add reverting commands here.
     *
     * Example:
     * await queryInterface.dropTable('users');
     */
  },
};
