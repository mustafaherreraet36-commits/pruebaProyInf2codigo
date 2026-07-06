const { User } = require('./userModel');
const { Hobby } = require('./hobbyModel');
// importo sequelize y datatypes para poder crear la tabla intermedia, sino no puedo usar sequelize.define ni DataTypes.X
// const { sequelize } = require('../config/db.js');
// const { DataTypes } = require('sequelize');


User.belongsToMany(Hobby, { through: "user_hobby", foreignKey: "user_id", timestamps: false });
Hobby.belongsToMany(User, { through: "user_hobby", foreignKey: "hobby_id", timestamps: false });



module.exports = { User, Hobby };
