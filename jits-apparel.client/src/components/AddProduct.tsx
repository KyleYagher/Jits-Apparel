import { useState } from 'react';
import { X } from 'lucide-react';

interface AddProductProps {
  onClose: () => void;
  onSave: (newProduct: NewProductData) => void;
}

export interface NewProductData {
  name: string;
  description: string;
  price: number;
  categoryId: number;
  imageUrl: string;
  stockQuantity: number;
  isActive: boolean;
  isFeatured: boolean;
}

export function AddProduct({ onClose, onSave }: AddProductProps) {
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    price: '',
    categoryId: '1',
    imageUrl: '',
    stockQuantity: '',
    isActive: true,
    isFeatured: false,
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    const newProduct: NewProductData = {
      name: formData.name,
      description: formData.description,
      price: parseFloat(formData.price),
      categoryId: parseInt(formData.categoryId),
      imageUrl: formData.imageUrl,
      stockQuantity: parseInt(formData.stockQuantity),
      isActive: formData.isActive,
      isFeatured: formData.isFeatured,
    };

    onSave(newProduct);
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    setFormData({
      ...formData,
      [name]: type === 'checkbox' ? (e.target as HTMLInputElement).checked : value,
    });
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-card rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto shadow-2xl border border-border">
        <div className="sticky top-0 bg-card/95 backdrop-blur-sm border-b border-border px-6 py-4 flex items-center justify-between">
          <h2 className="text-xl font-semibold">Add New Product</h2>
          <button
            type='button'
            title='Close Add Product'
            onClick={onClose}
            className="p-2 hover:bg-muted rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-6">
            {/* Product Image Preview */}
            <div className="flex items-center gap-4">
                <img
                src={formData.imageUrl || 'https://via.placeholder.com/150'}
                alt="Product preview"
                className="w-24 h-24 object-cover rounded-lg border border-border"
                />
                <div className="flex-1">
                    <label className="block text-sm font-medium mb-1">Image URL</label>
                    <input
                        title='Image URL input'
                        type="text"
                        name="imageUrl"
                        value={formData.imageUrl}
                        onChange={handleChange}
                        className="w-full px-3 py-2 border rounded-md bg-background"
                    />
                </div>
            </div>

            {/* Product Name */}
            <div>
                <label className="block text-sm font-medium mb-1">Product Name</label>
                <input
                    title='Product Name Input'
                    type="text"
                    name="name"
                    value={formData.name}
                    onChange={handleChange}
                    className="w-full px-3 py-2 border rounded-md bg-background"
                    required
                />
            </div>

            {/* Description */}
            <div>
                <label className="block text-sm font-medium mb-1">Description</label>
                <textarea
                    title='Description Input'
                    name="description"
                    value={formData.description}
                    onChange={handleChange}
                    rows={3}
                    className="w-full px-3 py-2 border rounded-md bg-background"
                    required
                />
            </div>

            {/* Price, Stock, and Category */}
            <div className="grid grid-cols-2 gap-4">
                <div>
                    <label className="block text-sm font-medium mb-1">Price (R)</label>
                    <input
                        title='Price Input'
                        type="number"
                        name="price"
                        value={formData.price}
                        onChange={handleChange}
                        step="0.01"
                        min="0"
                        className="w-full px-3 py-2 border rounded-md bg-background"
                        required
                    />
                </div>
                <div>
                    <label className="block text-sm font-medium mb-1">Stock Quantity</label>
                    <input
                        title='Stock Quantity Input'
                        type="number"
                        name="stockQuantity"
                        value={formData.stockQuantity}
                        onChange={handleChange}
                        min="0"
                        className="w-full px-3 py-2 border rounded-md bg-background"
                        required
                    />
                </div>
            </div>

            <div>
                <label className="block text-sm font-medium mb-1">Category</label>
                <select
                    title='Select Category'
                    name="categoryId"
                    value={formData.categoryId}
                    onChange={handleChange}
                    className="w-full px-3 py-2 border rounded-md bg-background"
                    required
                >
                    <option value="1">Graphic Tees</option>
                    <option value="2">Plain Tees</option>
                    <option value="3">Limited Edition</option>
                    <option value="4">Accessories</option>
                </select>
            </div>

            {/* Active Status */}
            <div className="flex items-center gap-3">
                <input
                    type="checkbox"
                    name="isActive"
                    id="isActive"
                    checked={formData.isActive}
                    onChange={handleChange}
                    className="w-4 h-4 rounded border-gray-300"
                />
                <label htmlFor="isActive" className="text-sm font-medium">
                    Product is Active
                </label>
            </div>

            {/* Action Buttons */}
            <div className="flex gap-3 pt-4">
                <button
                    type="button"
                    onClick={onClose}
                    className="flex-1 px-4 py-2 border rounded-md hover:bg-muted transition-colors"
                >
                Cancel
                </button>
                <button
                    type="submit"
                    className="flex-1 px-4 py-2 rounded-md text-white transition-all hover:opacity-90"
                    style={{
                        background: 'linear-gradient(90deg, var(--jits-pink) 0%, var(--jits-orange) 100%)'
                    }}
                >
                Add Product
                </button>
            </div>
        </form>
      </div>
    </div>
  );
}
