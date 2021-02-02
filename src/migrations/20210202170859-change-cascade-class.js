module.exports = {

  up: async (queryInterface, Sequelize) => {
    try {
      await queryInterface.removeConstraint('Classes', 'Classes_ownerRef_fkey');

      await queryInterface.addConstraint('Classes', {
        fields: ['ownerRef'],
        type: 'foreign key',
        name: 'classes_owner_fkey',
        references: {
          table: 'Users',
          field: 'username',
        },
        onDelete: 'CASCADE',
        onUpdate: 'CASCADE',
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
