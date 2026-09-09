import { Column, Entity, OneToMany, PrimaryGeneratedColumn } from "typeorm";
import { Launcher } from "./Launcher.entity";

@Entity("launcher_type")
export class LauncherType {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column({ unique: true })
  name!: string;

  @Column({ type: "float" })
  reload_time!: number;

  @OneToMany(() => Launcher, (launcher) => launcher.launcherType)
  launchers!: Launcher[];
}
