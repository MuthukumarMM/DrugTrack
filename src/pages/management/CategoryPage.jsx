import { createCategory, deleteCategory, subscribeCategories, updateCategory } from '../../services/categoryService'
import RecordsPage from './RecordsPage'

const fields = [
  { name: 'name', label: 'Category name', required: true },
  { name: 'description', label: 'Description' },
  { name: 'imageUrl', label: 'Image URL' },
]

export default function CategoryPage() {
  return (
    <RecordsPage
      title="Categories"
      description="Controlled medicine categories used by drug records."
      fields={fields}
      subscribe={subscribeCategories}
      create={createCategory}
      update={updateCategory}
      remove={deleteCategory}
      defaults={{ name: '', description: '', imageUrl: '', status: 'ACTIVE' }}
    />
  )
}
