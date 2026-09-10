import { Column, Entity, JoinColumn, ManyToOne, PrimaryColumn } from "typeorm";
import { Launcher } from "./Launcher.entity";
import { InterceptorType } from "./InterceptorType.entity";

@Entity("launcher_ammunition")
export class LauncherAmmunition {
  @PrimaryColumn({ type: "int", name: "launcher_id" })
  launcherId!: number;

  @PrimaryColumn({ type: "int", name: "interceptor_type_id" })
  interceptorTypeId!: number;

  @Column({ type: "int" })
  amount!: number;

  @ManyToOne(() => Launcher, (launcher: Launcher) => launcher.ammunition)
  @JoinColumn({ name: "launcher_id" })
  launcher!: Launcher;

  @ManyToOne(
    () => InterceptorType,
    (interceptorType: InterceptorType) => interceptorType.launcherAmmunition,
  )
  @JoinColumn({ name: "interceptor_type_id" })
  interceptorType!: InterceptorType;
}
