const express = require('express');
const roleRouter = express.Router();
const { getrole, postrole } = require('../../Controller/Role/roleController');


roleRouter.get('/viewrole', getrole)
roleRouter.post('/addrole', postrole);
module.exports = roleRouter;




