import { Router } from 'express';
import scenarioRouter from './Scenario.routes';
import dronesGroupRouter from './DronesGroup.routes';
import launchersGroupRouter from './LaunchersGroup.routes';
import droneRouter from './Drone.routes';
import launcherRouter from './Launcher.routes';
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
