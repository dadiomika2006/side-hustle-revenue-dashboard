const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const { getClients, getClient, createClient, updateClient, deleteClient, getClientMargins } = require('../controllers/clientController');
const { validateClient } = require('../validators/clientValidator');

// All routes are protected by auth middleware
router.use(auth);

// @route GET /api/clients/margins
// @desc Get client profit margins
router.get('/margins', getClientMargins);

// @route GET /api/clients
// @desc Get all clients
router.get('/', getClients);

// @route GET /api/clients/:id
// @desc Get single client
router.get('/:id', getClient);

// @route POST /api/clients
// @desc Create new client
router.post('/', validateClient, createClient);

// @route PUT /api/clients/:id
// @desc Update client
router.put('/:id', validateClient, updateClient);

// @route DELETE /api/clients/:id
// @desc Delete client
router.delete('/:id', deleteClient);

module.exports = router;