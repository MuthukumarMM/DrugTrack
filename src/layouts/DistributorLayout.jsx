import RoleLayout from './RoleLayout'
import { roleLinks } from '../constants/navigation'

export default function DistributorLayout() {
  return <RoleLayout role="DISTRIBUTOR" links={roleLinks.DISTRIBUTOR} />
}
