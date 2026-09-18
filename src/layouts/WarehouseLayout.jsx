import RoleLayout from './RoleLayout'
import { roleLinks } from '../constants/navigation'

export default function WarehouseLayout() {
  return <RoleLayout role="WAREHOUSE_MANAGER" links={roleLinks.WAREHOUSE_MANAGER} />
}
