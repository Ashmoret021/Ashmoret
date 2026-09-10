import { Column, Entity, OneToMany, PrimaryGeneratedColumn } from 'typeorm';
import { LauncherAmmunition } from './LauncherAmmunition.entity';
@Entity('interceptor_type')
export class InterceptorType {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column({ type: "varchar", unique: true })
  name!: string;

  @OneToMany(() => LauncherAmmunition, (launcherAmmunition: LauncherAmmunition) => launcherAmmunition.interceptorType)
  launcherAmmunition!: LauncherAmmunition[];
}
