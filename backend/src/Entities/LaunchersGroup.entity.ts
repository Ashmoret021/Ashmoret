import { Column, Entity, OneToMany, PrimaryGeneratedColumn } from "typeorm";
import { Launcher } from "./Launcher.entity";
import { Scenario } from "./Scenario.entity";

@Entity("launchers_group")
export class LaunchersGroup {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column({ type: "varchar" })
  name!: string;

  @Column({ type: "text", nullable: true })
  description?: string;

  @OneToMany(() => Launcher, (launcher: Launcher) => launcher.launchersGroup)
  launchers!: Launcher[];

  @OneToMany(() => Scenario, (scenario: Scenario) => scenario.launchersGroup)
  scenarios!: Scenario[];
}
