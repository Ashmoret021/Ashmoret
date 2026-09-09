import { Column, Entity, JoinColumn, ManyToOne, PrimaryColumn } from "typeorm";
import { DronesGroup } from "./DronesGroup.entity";
import { LaunchersGroup } from "./LaunchersGroup.entity";

@Entity("scenario")
export class Scenario {
  @PrimaryColumn()
  id!: string;

  @Column()
  name!: string;

  @Column({ name: "drones_group_id" })
  dronesGroupId!: number;

  @Column({ name: "launchers_group_id" })
  launchersGroupId!: number;

  @Column()
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
}
