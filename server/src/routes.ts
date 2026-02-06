import express, { Router } from 'express';
import withdrawalsRoutes from './routes/withdrawals';
import documentsRoutes from './routes/documents';
import usersRoutes from './routes/users';
import dashboardRoutes from './routes/dashboard';
import accountsRoutes from './routes/accounts';
import moneyMovementRoutes from './routes/moneyMovement';

const router = Router();

router.use('/withdrawals', withdrawalsRoutes);
router.use('/documents', documentsRoutes);
router.use('/users', usersRoutes);
router.use('/dashboard', dashboardRoutes);
router.use('/accounts', accountsRoutes);
router.use('/money-movement', moneyMovementRoutes);

export default router;
