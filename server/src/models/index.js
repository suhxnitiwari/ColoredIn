import { DataTypes } from 'sequelize';
import { sequelize } from '../config/db.js';

export const User = sequelize.define('User', {
  google_id: { type: DataTypes.STRING, unique: true },
  email: DataTypes.STRING,
  name: DataTypes.STRING,
  avatar_url: DataTypes.STRING,
  role: { type: DataTypes.ENUM('child', 'admin'), defaultValue: 'child', allowNull: false },
}, { tableName: 'users', underscored: true });

export const Category = sequelize.define('Category', {
  name: { type: DataTypes.STRING, allowNull: false, unique: true },
  description: DataTypes.TEXT,
  color: { type: DataTypes.STRING, defaultValue: '#b867d3' },
  sort_order: { type: DataTypes.INTEGER, defaultValue: 0 },
}, { tableName: 'career_categories', underscored: true });

export const ColoringPage = sequelize.define('ColoringPage', {
  title: { type: DataTypes.STRING, allowNull: false },
  job_description: { type: DataTypes.TEXT, allowNull: false },
  fun_fact: DataTypes.TEXT,
  image_url: { type: DataTypes.STRING, allowNull: false },
  audio_url: DataTypes.STRING,
}, { tableName: 'coloring_pages', underscored: true });

export const SavedArtwork = sequelize.define('SavedArtwork', {
  colored_image_data: { type: DataTypes.TEXT, allowNull: false }, // PNG data URL
  saved_at: { type: DataTypes.DATE, defaultValue: DataTypes.NOW },
}, { tableName: 'saved_artworks', underscored: true, timestamps: false });

Category.hasMany(ColoringPage, { foreignKey: 'category_id', as: 'pages' });
ColoringPage.belongsTo(Category, { foreignKey: 'category_id', as: 'category' });

User.hasMany(ColoringPage, { foreignKey: 'created_by' });
ColoringPage.belongsTo(User, { foreignKey: 'created_by', as: 'creator' });

ColoringPage.hasMany(SavedArtwork, { foreignKey: 'page_id', onDelete: 'CASCADE' });
SavedArtwork.belongsTo(ColoringPage, { foreignKey: 'page_id', as: 'page' });

User.hasMany(SavedArtwork, { foreignKey: 'user_id', onDelete: 'CASCADE' });
SavedArtwork.belongsTo(User, { foreignKey: 'user_id' });

export { sequelize };
