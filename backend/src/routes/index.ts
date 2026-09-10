import { Router } from 'express';
import scenarioRouter from './scenario.routes';
import dronesGroupRouter from './drone.routes';
import launchersGroupRouter from './LaunchersGroup.routes';
import droneRouter from './drone.routes';
import launcherRouter from './launcher.routes';
import launcherAmmunitionRouter from './LauncherAmmunition.routes';
import droneTypeRouter from './DroneType.routes';
import interceptorTypeRouter from './InterceptorType.routes';
import launcherTypeRouter from './LauncherType.routes';

const apiRouter = Router();

apiRouter.use('/scenarios', scenarioRouter);
apiRouter.use('/drones-groups', dronesGroupRouter);
apiRouter.use('/launchers-groups', launchersGroupRouter);
apiRouter.use('/drones', droneRouter);
apiRouter.use('/launchers', launcherRouter);
apiRouter.use('/launcher-ammunitions', launcherAmmunitionRouter);
apiRouter.use('/drone-types', droneTypeRouter);
apiRouter.use('/interceptor-types', interceptorTypeRouter);
apiRouter.use('/launcher-types', launcherTypeRouter);

export default apiRouter;
