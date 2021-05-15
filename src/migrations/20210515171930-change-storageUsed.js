module.exports = {
  up: async (queryInterface, Sequelize) => {
    try {
      queryInterface.changeColumn('Files', 'fileSize', {
        type: Sequelize.BIGINT,
        defaultValue: 0,
        allowNull: false,
      });
    } catch (e) {
      console.error(e);
    }
  },

  down: async (queryInterface, Sequelize) => {
    console.log('no down query');
  },
};
