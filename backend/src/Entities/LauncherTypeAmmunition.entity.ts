import { Column, Entity, JoinColumn, ManyToOne, PrimaryColumn } from "typeorm";
import { LauncherType } from "./LauncherType.entity";
import { InterceptorType } from "./InterceptorType.entity";

@Entity("launcher_type_ammunition")
export class LauncherTypeAmmunition {
  @PrimaryColumn({ name: "launcher_type_id", type: "int" })
  launcherTypeId!: number;

  @PrimaryColumn({ name: "interceptor_type_id", type: "int" })
  interceptorTypeId!: number;

  @Column({ name: "ammunition_per_system", type: "int" })
  ammunitionPerSystem!: number;

  @Column({ name: "source_total_ammunition", type: "int" })
  sourceTotalAmmunition!: number;

  @Column({ name: "operating_range_km", type: "float" })
  operatingRangeKm!: number;

  @ManyToOne(() => LauncherType, (launcherType: LauncherType) => launcherType.typeAmmunition)
  @JoinColumn({ name: "launcher_type_id" })
  launcherType!: LauncherType;

  @ManyToOne(
    () => InterceptorType,
    (interceptorType: InterceptorType) => interceptorType.typeAmmunition,
  )
  @JoinColumn({ name: "interceptor_type_id" })
  interceptorType!: InterceptorType;
}
