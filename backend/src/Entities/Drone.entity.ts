import {
  Column,
  Entity,
  JoinColumn,
  ManyToOne,
  OneToMany,
  PrimaryGeneratedColumn,
} from "typeorm";
import { AttackSide } from "./AttackSide.entity";
import { DronesGroup } from "./DronesGroup.entity";
import { DroneType } from "./DroneType.entity";

@Entity("drone")
export class Drone {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column({ type: "int", name: "drones_group_id" })
  dronesGroupId!: number;

  @Column({ type: "float" })
  longitude!: number;

  @Column({ type: "float" })
  latitude!: number;

  @Column({ type: "float" })
  asl!: number;

  @Column({ type: "float" })
  agl!: number;

  @Column({ type: "float" })
  heading!: number;

  @Column({ type: "float" })
  velocity!: number;

  @Column({ type: "int" })
  type!: number;

  @ManyToOne(
    () => DronesGroup,
    (dronesGroup: DronesGroup) => dronesGroup.drones,
  )
  @JoinColumn({ name: "drones_group_id" })
  dronesGroup!: DronesGroup;

  @ManyToOne(() => DroneType, (droneType: DroneType) => droneType.drones)
  @JoinColumn({ name: "type" })
  droneType!: DroneType;

  @OneToMany(() => AttackSide, (attackSide: AttackSide) => attackSide.drone)
  attackSides!: AttackSide[];
}
