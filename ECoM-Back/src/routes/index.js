import { Router } from 'express';

import authRoutes from './auth.js';
import consumoRoutes from './consumo.js';
import ambientesRoutes from './ambientes.js';
import alertasRoutes from './alertas.js';

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

export default router;
