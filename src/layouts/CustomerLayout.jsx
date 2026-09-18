import RoleLayout from './RoleLayout'
import { roleLinks } from '../constants/navigation'

export default function CustomerLayout() {
  return <RoleLayout role="CUSTOMER" links={roleLinks.CUSTOMER} />
}
