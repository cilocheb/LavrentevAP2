const Joi = require('joi');

const createTaskSchema = Joi.object({
  title: Joi.string().min(3).max(100).required()
    .messages({
      'string.min': 'Title must be at least 3 characters',
      'string.max': 'Title cannot exceed 100 characters',
      'any.required': 'Title is required'
    }),
  description: Joi.string().max(500).allow('')
    .messages({ 'string.max': 'Description cannot exceed 500 characters' }),
  category: Joi.string().valid('work', 'personal', 'shopping', 'health').default('personal')
    .messages({ 'any.only': 'Category must be one of: work, personal, shopping, health' }),
  priority: Joi.number().integer().min(1).max(5).default(3)
    .messages({ 'number.min': 'Priority must be between 1 and 5', 'number.max': 'Priority must be between 1 and 5' }),
  dueDate: Joi.date().greater('now')
    .messages({ 'date.greater': 'Due date must be in the future' })
});

const updateTaskSchema = Joi.object({
  title: Joi.string().min(3).max(100),
  description: Joi.string().max(500).allow(''),
  category: Joi.string().valid('work', 'personal', 'shopping', 'health'),
  priority: Joi.number().integer().min(1).max(5),
  dueDate: Joi.date().greater('now'),
  completed: Joi.boolean()
});

const validateCreateTask = (req, res, next) => {
  const { error } = createTaskSchema.validate(req.body, { abortEarly: false });
  if (error) {
    return res.status(400).json({
      error: 'Validation Error',
      details: error.details.map(detail => ({ field: detail.path[0], message: detail.message }))
    });
  }
  next();
};

const validateUpdateTask = (req, res, next) => {
  const { error } = updateTaskSchema.validate(req.body, { abortEarly: false });
  if (error) {
    return res.status(400).json({
      error: 'Validation Error',
      details: error.details.map(detail => ({ field: detail.path[0], message: detail.message }))
    });
  }
  if (Object.keys(req.body).length === 0) {
    return res.status(400).json({ error: 'Validation Error', message: 'At least one field must be provided for update' });
  }
  next();
};

const validateId = (req, res, next) => {
  const id = parseInt(req.params.id);
  if (isNaN(id) || id <= 0) {
    return res.status(400).json({ error: 'Validation Error', message: 'ID must be a positive number' });
  }
  req.params.id = id;
  next();
};

module.exports = {
  validateCreateTask,
  validateUpdateTask,
  validateId
};
