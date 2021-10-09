module.exports = {
  up: async (queryInterface, Sequelize) => {
    try {
      await queryInterface.addColumn('Classes', 'type', {
        type: Sequelize.ENUM('public', 'public-paid', 'private', 'private-paid'),
        defaultValue: 'public',
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
      await queryInterface.removeColumn('Classes', 'type');
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
