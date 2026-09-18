import RoleLayout from './RoleLayout'
import { roleLinks } from '../constants/navigation'

export default function ManufacturerLayout() {
  return <RoleLayout role="MANUFACTURER" links={roleLinks.MANUFACTURER} />
}
