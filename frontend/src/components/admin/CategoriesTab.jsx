import React, { useState } from 'react';
import { FolderTree, RefreshCw, Plus, Trash2 } from 'lucide-react';

export default function CategoriesTab({
  newCategory,
  setNewCategory,
  handleCreateCategory,
  handleUpdateCategory,
  handleDeleteCategory,
  categories,
  fetchData
}) {
  const [editingCategoryId, setEditingCategoryId] = useState(null);

  const handleStartEdit = (category) => {
    setEditingCategoryId(category.id);
    setNewCategory({
      name: category.name,
      description: category.description || ''
    });
  };

  const handleCancelEdit = () => {
    setEditingCategoryId(null);
    setNewCategory({ name: '', description: '' });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (editingCategoryId) {
      if (handleUpdateCategory) {
        await handleUpdateCategory(editingCategoryId);
      }
    } else {
      if (handleCreateCategory) {
        await handleCreateCategory(e);
      }
    }
    handleCancelEdit();
    if (fetchData) fetchData();
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
      {/* Create / Edit Form */}
      <div className="bg-white p-6 rounded-2xl border shadow-2xs h-fit space-y-4">
        <h2 className="text-lg font-bold text-gray-900 flex items-center gap-2">
          {editingCategoryId ? (
            <><RefreshCw className="w-5 h-5 text-amber-600" /> Edit Category #{editingCategoryId}</>
          ) : (
            <><FolderTree className="w-5 h-5 text-emerald-600" /> Add Category</>
          )}
        </h2>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-gray-700 mb-1">Category Name</label>
            <input
              type="text"
              required
              value={newCategory.name}
              onChange={(e) => setNewCategory({ ...newCategory, name: e.target.value })}
              className="w-full px-3 py-2 border rounded-xl text-sm outline-none focus:ring-2 focus:ring-emerald-500"
            />
          </div>
          <div>
            <label className="block text-xs font-semibold text-gray-700 mb-1">Description</label>
            <textarea
              rows="3"
              value={newCategory.description}
              onChange={(e) => setNewCategory({ ...newCategory, description: e.target.value })}
              className="w-full px-3 py-2 border rounded-xl text-sm outline-none focus:ring-2 focus:ring-emerald-500"
            />
          </div>

          <div className="flex gap-2">
            <button
              type="submit"
              className={`flex-1 py-2.5 rounded-xl text-sm font-semibold transition text-white ${
                editingCategoryId ? 'bg-amber-600 hover:bg-amber-700' : 'bg-[#1A382B] hover:bg-emerald-900'
              }`}
            >
              {editingCategoryId ? 'Update Category' : 'Create Category'}
            </button>
            {editingCategoryId && (
              <button
                type="button"
                onClick={handleCancelEdit}
                className="px-4 py-2.5 bg-gray-100 text-gray-600 rounded-xl text-sm font-semibold hover:bg-gray-200 transition"
              >
                Cancel
              </button>
            )}
          </div>
        </form>
      </div>

      {/* Categories List */}
      <div className="lg:col-span-2 space-y-4">
        <h2 className="text-lg font-bold text-gray-900">Categories ({categories.length})</h2>
        {categories.length === 0 ? (
          <div className="text-center py-8 text-sm text-gray-500 bg-white rounded-2xl border">No categories found.</div>
        ) : (
          categories.map((cat) => (
            <div key={cat.id} className="bg-white p-4 rounded-2xl border border-gray-100 flex items-center justify-between shadow-2xs">
              <div>
                <h3 className="font-bold text-gray-900 text-sm">{cat.name}</h3>
                <p className="text-xs text-gray-500 mt-1">{cat.description || 'No description provided.'}</p>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => handleStartEdit(cat)}
                  className="px-3 py-1.5 bg-amber-50 text-amber-700 rounded-xl text-xs font-semibold hover:bg-amber-100 transition"
                >
                  Edit
                </button>
                <button
                  onClick={async () => {
                    if (window.confirm(`Are you sure you want to delete category "${cat.name}"?`)) {
                      if (handleDeleteCategory) await handleDeleteCategory(cat.id);
                      if (fetchData) fetchData();
                    }
                  }}
                  className="p-2 text-gray-400 hover:text-red-600 transition"
                >
                  <Trash2 className="w-5 h-5" />
                </button>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}