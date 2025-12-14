import { useState, useEffect } from 'react'
import { supabase } from '../../lib/supabase'

interface NewsEvent {
  id: string
  title: string
  description: string
  date: string
  image_url: string | null
  image_path: string | null
  read_more_link: string | null
  is_active: boolean
}

const NewsEventsManagement = () => {
  const [items, setItems] = useState<NewsEvent[]>([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [editingItem, setEditingItem] = useState<NewsEvent | null>(null)
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    date: new Date().toISOString().split('T')[0],
    read_more_link: '',
    is_active: true,
  })
  const [imageFile, setImageFile] = useState<File | null>(null)
  const [uploading, setUploading] = useState(false)

  useEffect(() => {
    fetchItems()
  }, [])

  const fetchItems = async () => {
    try {
      const { data, error } = await supabase
        .from('news_events')
        .select('*')
        .order('date', { ascending: false })
        .order('created_at', { ascending: false })

      if (error) throw error
      setItems(data || [])
    } catch (error) {
      console.error('Error fetching news/events:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0]
      // Validate file size (5MB max)
      if (file.size > 5 * 1024 * 1024) {
        alert('Image size must be less than 5MB')
        return
      }
      // Validate file type
      if (!file.type.startsWith('image/')) {
        alert('Please select an image file')
        return
      }
      setImageFile(file)
    }
  }

  const uploadImage = async (file: File, itemId: string): Promise<string | null> => {
    try {
      const fileExt = file.name.split('.').pop()
      const fileName = `${itemId}-${Date.now()}.${fileExt}`
      const filePath = `news-events/${fileName}`

      const { error: uploadError } = await supabase.storage
        .from('news-events-images')
        .upload(filePath, file, { upsert: true })

      if (uploadError) throw uploadError

      const { data } = supabase.storage
        .from('news-events-images')
        .getPublicUrl(filePath)

      return data.publicUrl
    } catch (error) {
      console.error('Error uploading image:', error)
      return null
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setUploading(true)

    try {
      let imageUrl = formData.read_more_link || null
      let imagePath = null

      // Upload image if provided
      if (imageFile) {
        const itemId = editingItem?.id || crypto.randomUUID()
        imageUrl = await uploadImage(imageFile, itemId)
        if (!imageUrl) {
          alert('Failed to upload image')
          setUploading(false)
          return
        }
        imagePath = `news-events/${itemId}-${Date.now()}.${imageFile.name.split('.').pop()}`
      }

      if (editingItem) {
        // Update existing
        const { error } = await supabase
          .from('news_events')
          .update({
            ...formData,
            image_url: imageUrl || editingItem.image_url,
            image_path: imagePath || editingItem.image_path,
            updated_at: new Date().toISOString(),
          })
          .eq('id', editingItem.id)

        if (error) throw error
      } else {
        // Create new
        const { error } = await supabase
          .from('news_events')
          .insert([{
            ...formData,
            image_url: imageUrl,
            image_path: imagePath,
          }])

        if (error) throw error
      }

      resetForm()
      fetchItems()
    } catch (error: any) {
      console.error('Error saving news/event:', error)
      alert(error.message || 'Failed to save')
    } finally {
      setUploading(false)
    }
  }

  const handleEdit = (item: NewsEvent) => {
    setEditingItem(item)
    setFormData({
      title: item.title,
      description: item.description,
      date: item.date,
      read_more_link: item.read_more_link || '',
      is_active: item.is_active,
    })
    setShowForm(true)
  }

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this item?')) return

    try {
      const { error } = await supabase
        .from('news_events')
        .delete()
        .eq('id', id)

      if (error) throw error
      fetchItems()
    } catch (error) {
      console.error('Error deleting item:', error)
    }
  }

  const resetForm = () => {
    setFormData({
      title: '',
      description: '',
      date: new Date().toISOString().split('T')[0],
      read_more_link: '',
      is_active: true,
    })
    setImageFile(null)
    setEditingItem(null)
    setShowForm(false)
  }

  if (loading) {
    return <div className="text-center py-12">Loading...</div>
  }

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">News & Events Management</h2>
          <p className="text-gray-600 mt-1">Manage news articles and events (Recommended image: 1200x675px, max 5MB)</p>
        </div>
        <button
          onClick={() => setShowForm(true)}
          className="px-4 py-2 bg-[#15133D] text-white rounded-lg hover:bg-[#1a1650] transition-colors"
        >
          + Add New
        </button>
      </div>

      {showForm && (
        <div className="bg-white rounded-lg shadow border p-6 mb-6">
          <h3 className="text-xl font-bold mb-4">
            {editingItem ? 'Edit' : 'Add New'} News/Event
          </h3>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Title *</label>
              <input
                type="text"
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                required
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#15133D]"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Description *</label>
              <textarea
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                required
                rows={4}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#15133D]"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Date *</label>
              <input
                type="date"
                value={formData.date}
                onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                required
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#15133D]"
              />
              <p className="text-xs text-gray-500 mt-1">Latest news/events will appear first automatically</p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Read More Link</label>
              <input
                type="url"
                value={formData.read_more_link}
                onChange={(e) => setFormData({ ...formData, read_more_link: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#15133D]"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Image (Recommended: 1200x675px, max 5MB)
              </label>
              <input
                type="file"
                accept="image/*"
                onChange={handleImageChange}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#15133D]"
              />
              {editingItem?.image_url && !imageFile && (
                <img src={editingItem.image_url} alt="Current" className="mt-2 h-32 object-cover rounded" />
              )}
            </div>

            <div className="flex items-center">
              <input
                type="checkbox"
                id="is_active"
                checked={formData.is_active}
                onChange={(e) => setFormData({ ...formData, is_active: e.target.checked })}
                className="mr-2"
              />
              <label htmlFor="is_active" className="text-sm font-medium text-gray-700">
                Active (visible on website)
              </label>
            </div>

            <div className="flex gap-4">
              <button
                type="submit"
                disabled={uploading}
                className="px-6 py-2 bg-[#15133D] text-white rounded-lg hover:bg-[#1a1650] transition-colors disabled:opacity-50"
              >
                {uploading ? 'Saving...' : editingItem ? 'Update' : 'Create'}
              </button>
              <button
                type="button"
                onClick={resetForm}
                className="px-6 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors"
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {items.map((item) => (
          <div key={item.id} className="bg-white rounded-lg shadow border overflow-hidden">
            {item.image_url && (
              <img src={item.image_url} alt={item.title} className="w-full h-48 object-cover" />
            )}
            <div className="p-4">
              <div className="flex justify-between items-start mb-2">
                <h3 className="font-bold text-lg">{item.title}</h3>
                {!item.is_active && (
                  <span className="px-2 py-1 bg-gray-200 text-gray-600 text-xs rounded">Inactive</span>
                )}
              </div>
              <p className="text-sm text-gray-600 mb-2">{item.date}</p>
              <p className="text-sm text-gray-700 line-clamp-2 mb-4">{item.description}</p>
              <div className="flex gap-2">
                <button
                  onClick={() => handleEdit(item)}
                  className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm"
                >
                  Edit
                </button>
                <button
                  onClick={() => handleDelete(item.id)}
                  className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors text-sm"
                >
                  Delete
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {items.length === 0 && (
        <div className="text-center py-12 text-gray-500">No news/events yet. Add your first one!</div>
      )}
    </div>
  )
}

export default NewsEventsManagement

