import express from 'express';
import { 
    getUsers,
    createUsers,
    getUsersById,
    updateUsers,
    deleteUsers
 } from '../controllers/userControllers.js';

const router = express.Router();

router.get('/', getUsers);
router.post('/', createUsers);
router.get('/:id', getUsersById);
router.put('/:id', updateUsers);
router.delete('/:id', deleteUsers);

export default router;