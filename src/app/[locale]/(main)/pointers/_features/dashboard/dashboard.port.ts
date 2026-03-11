import type { DashboardSourceCategory } from './dashboard.domain'

export interface PointersRepository {
  loadAll(): Promise<readonly DashboardSourceCategory[]>
}
