import { Router } from 'express';

import authRoutes from './auth.js';
import consumoRoutes from './consumo.js';
import ambientesRoutes from './ambientes.js';
import alertasRoutes from './alertas.js';
import dashboardRoutes from './dashboard.js';
import tarifasRoutes from './tarifas.js';
import sensoresRoutes from './sensores.js';

const router = Router();

router.get('/health', (req, res) => {
  res.status(200).json({
    status: 'ok',
    service: 'ECoM API',
    timestamp: new Date().toISOString(),
  });
});

router.use('/auth', authRoutes);
router.use('/consumo', consumoRoutes);
router.use('/ambientes', ambientesRoutes);
router.use('/alertas', alertasRoutes);
router.use('/dashboard', dashboardRoutes);
router.use('/tarifas', tarifasRoutes);
router.use('/sensores', sensoresRoutes);

export default router;
