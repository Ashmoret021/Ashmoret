import { Column, Entity, OneToMany, PrimaryGeneratedColumn } from "typeorm";
import { Launcher } from "./Launcher.entity";
import { LauncherTypeAmmunition } from "./LauncherTypeAmmunition.entity";

@Entity("launcher_type")
export class LauncherType {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column({ type: "varchar", unique: true })
  name!: string;

  @Column({ type: "float" })
  reload_time!: number;

  @OneToMany(() => Launcher, (launcher) => launcher.launcherType)
  launchers!: Launcher[];

  @OneToMany(
    () => LauncherTypeAmmunition,
    (typeAmmunition: LauncherTypeAmmunition) => typeAmmunition.launcherType,
  )
  typeAmmunition!: LauncherTypeAmmunition[];
}
