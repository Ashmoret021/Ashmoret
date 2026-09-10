import { Column, Entity, OneToMany, PrimaryGeneratedColumn } from "typeorm";
import { AttackSide } from "./AttackSide.entity";
import { Drone } from "./Drone.entity";
import { Scenario } from "./Scenario.entity";

@Entity("drones_group")
export class DronesGroup {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column({ type: "varchar" })
  name!: string;

  @Column({ type: "text", nullable: true })
  description?: string;

  @OneToMany(() => Drone, (drone: Drone) => drone.dronesGroup)
  drones!: Drone[];

  @OneToMany(() => AttackSide, (attackSide: AttackSide) => attackSide.dronesGroup)
  attackSides!: AttackSide[];

  @OneToMany(() => Scenario, (scenario: Scenario) => scenario.dronesGroup)
  scenarios!: Scenario[];
}
