import {
  Column,
  Entity,
  JoinColumn,
  ManyToOne,
  OneToMany,
  PrimaryGeneratedColumn,
} from "typeorm";
import { LaunchersGroup } from "./LaunchersGroup.entity";
import { LauncherType } from "./LauncherType.entity";
import { LauncherAmmunition } from "./LauncherAmmunition.entity";

@Entity("launcher")
export class Launcher {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column({ name: "launchers_group_id", type: "int" })
  launchersGroupId!: number;

  @Column({ type: "float" })
  longitude!: number;

  @Column({ type: "float" })
  latitude!: number;

  @Column({ type: "float" })
  asl!: number;

  @Column({ type: "float" })
  agl!: number;

  @Column({ type: "int" })
  type!: number;

  @Column({ type: "int" })
  amount!: number;

  @Column({ type: "boolean" })
  active!: boolean;

  @ManyToOne(
    () => LaunchersGroup,
    (launchersGroup: LaunchersGroup) => launchersGroup.launchers,
  )
  @JoinColumn({ name: "launchers_group_id" })
  launchersGroup!: LaunchersGroup;

  @ManyToOne(
    () => LauncherType,
    (launcherType: LauncherType) => launcherType.launchers,
  )
  @JoinColumn({ name: "type" })
  launcherType!: LauncherType;

  @OneToMany(
    () => LauncherAmmunition,
    (launcherAmmunition: LauncherAmmunition) => launcherAmmunition.launcher,
  )
  ammunition!: LauncherAmmunition[];
}
