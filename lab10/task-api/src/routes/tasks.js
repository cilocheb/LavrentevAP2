const express = require('express');
const router = express.Router();
const { v4: uuidv4 } = require('uuid');
const { validateCreateTask, validateUpdateTask, validateId } = require('../middleware/validation');
const { initializeDataFile, readData, writeData, getNextId } = require('../utils/fileOperations');

initializeDataFile();

router.get('/', async (req, res, next) => {
  try {
    const { category, completed, priority, sortBy, page = 1, limit = 10 } = req.query;
    const data = await readData();
    let tasks = [...data.tasks];
    if (category) tasks = tasks.filter(t => t.category === category);
    if (completed !== undefined) tasks = tasks.filter(t => t.completed === (completed === 'true'));
    if (priority) tasks = tasks.filter(t => t.priority === parseInt(priority));
    if (sortBy) {
      let field = sortBy, order = 1;
      if (sortBy.startsWith('-')) { field = sortBy.slice(1); order = -1; }
      tasks.sort((a, b) => (a[field] < b[field] ? -order : (a[field] > b[field] ? order : 0)));
    } else {
      tasks.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
    }
    const pageNum = parseInt(page), limitNum = parseInt(limit);
    const start = (pageNum - 1) * limitNum;
    const paginated = tasks.slice(start, start + limitNum);
    res.json({ success: true, count: tasks.length, page: pageNum, limit: limitNum, totalPages: Math.ceil(tasks.length / limitNum), data: paginated });
  } catch (error) { next(error); }
});

router.get('/:id', validateId, async (req, res, next) => {
  try {
    const data = await readData();
    const task = data.tasks.find(t => t.id === req.params.id);
    if (!task) return res.status(404).json({ success: false, error: 'Task not found' });
    res.json({ success: true, data: task });
  } catch (error) { next(error); }
});

router.post('/', validateCreateTask, async (req, res, next) => {
  try {
    const { title, description, category, priority, dueDate } = req.body;
    const data = await readData();
    const newTask = {
      id: await getNextId(),
      uuid: uuidv4(),
      title,
      description: description || '',
      category: category || 'personal',
      priority: priority || 3,
      dueDate: dueDate || null,
      completed: false,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    data.tasks.push(newTask);
    await writeData(data);
    res.status(201).json({ success: true, message: 'Task created', data: newTask });
  } catch (error) { next(error); }
});

router.put('/:id', validateId, validateUpdateTask, async (req, res, next) => {
  try {
    const data = await readData();
    const index = data.tasks.findIndex(t => t.id === req.params.id);
    if (index === -1) return res.status(404).json({ success: false, error: 'Task not found' });
    const updated = { ...data.tasks[index], ...req.body, updatedAt: new Date().toISOString() };
    data.tasks[index] = updated;
    await writeData(data);
    res.json({ success: true, message: 'Task updated', data: updated });
  } catch (error) { next(error); }
});

router.patch('/:id/complete', validateId, async (req, res, next) => {
  try {
    const data = await readData();
    const index = data.tasks.findIndex(t => t.id === req.params.id);
    if (index === -1) return res.status(404).json({ success: false, error: 'Task not found' });
    data.tasks[index].completed = true;
    data.tasks[index].updatedAt = new Date().toISOString();
    await writeData(data);
    res.json({ success: true, message: 'Task marked as completed', data: data.tasks[index] });
  } catch (error) { next(error); }
});

router.delete('/:id', validateId, async (req, res, next) => {
  try {
    const data = await readData();
    const index = data.tasks.findIndex(t => t.id === req.params.id);
    if (index === -1) return res.status(404).json({ success: false, error: 'Task not found' });
    data.tasks.splice(index, 1);
    await writeData(data);
    res.json({ success: true, message: 'Task deleted' });
  } catch (error) { next(error); }
});

router.get('/stats/summary', async (req, res, next) => {
  try {
    const data = await readData();
    const tasks = data.tasks;
    const now = new Date();
    const stats = {
      total: tasks.length,
      completed: tasks.filter(t => t.completed).length,
      pending: tasks.filter(t => !t.completed).length,
      overdue: tasks.filter(t => !t.completed && t.dueDate && new Date(t.dueDate) < now).length,
      byCategory: {},
      byPriority: { 1:0,2:0,3:0,4:0,5:0 }
    };
    for (const t of tasks) {
      stats.byCategory[t.category] = (stats.byCategory[t.category] || 0) + 1;
      stats.byPriority[t.priority] += 1;
    }
    res.json({ success: true, data: stats });
  } catch (error) { next(error); }
});

router.get('/search/text', async (req, res, next) => {
  try {
    const { q } = req.query;
    if (!q || q.trim().length < 2) return res.status(400).json({ success: false, error: 'Search query must be at least 2 characters' });
    const data = await readData();
    const term = q.toLowerCase().trim();
    const results = data.tasks.filter(t => t.title.toLowerCase().includes(term) || t.description.toLowerCase().includes(term));
    res.json({ success: true, count: results.length, data: results });
  } catch (error) { next(error); }
});

module.exports = router;
