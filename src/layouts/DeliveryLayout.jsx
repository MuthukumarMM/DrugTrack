import RoleLayout from './RoleLayout'
import { roleLinks } from '../constants/navigation'

export default function DeliveryLayout() {
  return <RoleLayout role="DELIVERY_STAFF" links={roleLinks.DELIVERY_STAFF} />
}
