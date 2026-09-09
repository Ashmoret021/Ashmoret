import { Column, Entity, OneToMany, PrimaryGeneratedColumn } from "typeorm";
import { Drone } from "./Drone.entity";

@Entity("drone_type")
export class DroneType {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column({ unique: true })
  name!: string;

  @OneToMany(() => Drone, (drone: Drone) => drone.droneType)
  drones!: Drone[];
}
