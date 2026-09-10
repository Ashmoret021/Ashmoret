import {
  Column,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { DronesGroup } from './DronesGroup.entity';
import { Drone } from './Drone.entity';
import { Launcher } from './Launcher.entity';
import { Scenario } from './Scenario.entity';

@Entity('attack_side')
export class AttackSide {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column({ type: 'varchar' })
  name!: string;

  @Column({ type: 'text', nullable: true })
  description?: string | null;

  @Column({ type: 'varchar', name: 'scenario_id', nullable: true })
  scenarioId?: string | null;

  @Column({ type: 'int', name: 'drones_group_id', nullable: true })
  dronesGroupId?: number | null;

  @Column({ type: 'int', name: 'drone_id', nullable: true })
  droneId?: number | null;

  @Column({ type: 'int', name: 'launcher_id', nullable: true })
  launcherId?: number | null;

  @Column({ type: 'boolean', default: true })
  active!: boolean;

  @Column({ type: 'jsonb', nullable: true, default: {} })
  config!: Record<string, unknown>;

  @ManyToOne(() => Scenario, (scenario: Scenario) => scenario.attackSides, {
    nullable: true,
    onDelete: 'SET NULL',
  })
  @JoinColumn({ name: 'scenario_id' })
  scenario?: Scenario | null;

  @ManyToOne(() => DronesGroup, (dronesGroup: DronesGroup) => dronesGroup.attackSides, {
    nullable: true,
    onDelete: 'SET NULL',
  })
  @JoinColumn({ name: 'drones_group_id' })
  dronesGroup?: DronesGroup | null;

  @ManyToOne(() => Drone, (drone: Drone) => drone.attackSides, {
    nullable: true,
    onDelete: 'SET NULL',
  })
  @JoinColumn({ name: 'drone_id' })
  drone?: Drone | null;

  @ManyToOne(() => Launcher, (launcher: Launcher) => launcher.attackSides, {
    nullable: true,
    onDelete: 'SET NULL',
  })
  @JoinColumn({ name: 'launcher_id' })
  launcher?: Launcher | null;
}
