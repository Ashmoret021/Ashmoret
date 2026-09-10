import { Column, Entity, JoinColumn, ManyToOne, PrimaryColumn } from "typeorm";
import { DronesGroup } from "./DronesGroup.entity";
import { LaunchersGroup } from "./LaunchersGroup.entity";

@Entity("scenario")
export class Scenario {
  @PrimaryColumn({ type: "varchar" })
  id!: string;

  @Column({ type: "varchar" })
  name!: string;

  @Column({ type: "int", name: "drones_group_id" })
  dronesGroupId!: number;

  @Column({ type: "int", name: "launchers_group_id" })
  launchersGroupId!: number;

  @Column({ type: "varchar" })
  type!: string;

  @ManyToOne(
    () => DronesGroup,
    (dronesGroup: DronesGroup) => dronesGroup.scenarios,
  )
  @JoinColumn({ name: "drones_group_id" })
  dronesGroup!: DronesGroup;

  @ManyToOne(
    () => LaunchersGroup,
    (launchersGroup: LaunchersGroup) => launchersGroup.scenarios,
  )
  @JoinColumn({ name: "launchers_group_id" })
  launchersGroup!: LaunchersGroup;

  // Transient property - not persisted to DB. Populated at runtime by services.
  locations?: string[];
}
