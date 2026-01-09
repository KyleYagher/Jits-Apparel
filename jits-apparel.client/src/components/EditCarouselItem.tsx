import { useState } from 'react';
import { X, Upload, Link as LinkIcon } from 'lucide-react';
import { CarouselItem, UpdateCarouselItemDto, apiClient } from '../services/api';
import { toast } from 'sonner';

interface EditCarouselItemProps {
  item: CarouselItem;
  onClose: () => void;
  onSave: (id: number, updates: UpdateCarouselItemDto) => void;
}

export function EditCarouselItem({ item, onClose, onSave }: EditCarouselItemProps) {
  const [uploadMode, setUploadMode] = useState<'url' | 'upload'>('url');
  const [uploading, setUploading] = useState(false);
  const [imagePreview, setImagePreview] = useState<string>(item.imageUrl);

  const [formData, setFormData] = useState({
    title: item.title,
    description: item.description || '',
    imageUrl: item.imageUrl,
    buttonText: item.buttonText,
    linkUrl: item.linkUrl || '/shop',
    gradientStyle: item.gradientStyle,
    order: item.order,
    isActive: item.isActive,
  });

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file type
    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'];
    if (!allowedTypes.includes(file.type)) {
      toast.error('Invalid file type. Please upload a JPG, PNG, GIF, or WebP image.');
      return;
    }

    // Validate file size (5MB max)
    if (file.size > 5 * 1024 * 1024) {
      toast.error('File size must be less than 5MB');
      return;
    }

    try {
      setUploading(true);

      // Show preview
      const reader = new FileReader();
      reader.onload = (event) => {
        if (event.target?.result) {
          setImagePreview(event.target.result as string);
        }
      };
      reader.readAsDataURL(file);

      // Upload to server
      const result = await apiClient.uploadCarouselImage(file);
      setFormData({ ...formData, imageUrl: result.imageUrl });
      toast.success('Image uploaded successfully!');
    } catch (error) {
      toast.error(`Failed to upload image: ${error instanceof Error ? error.message : 'Unknown error'}`);
      setImagePreview(formData.imageUrl);
    } finally {
      setUploading(false);
    }
  };

  const handleUrlChange = (url: string) => {
    setFormData({ ...formData, imageUrl: url });
    setImagePreview(url);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    // Validation
    if (!formData.title.trim()) {
      toast.error('Title is required');
      return;
    }
    if (!formData.imageUrl.trim()) {
      toast.error('Image URL is required');
      return;
    }
    if (!formData.buttonText.trim()) {
      toast.error('Button text is required');
      return;
    }

    const updates: UpdateCarouselItemDto = {
      title: formData.title,
      description: formData.description || undefined,
      imageUrl: formData.imageUrl,
      buttonText: formData.buttonText,
      linkUrl: formData.linkUrl || undefined,
      gradientStyle: formData.gradientStyle,
      order: formData.order,
      isActive: formData.isActive,
    };

    onSave(item.id, updates);
  };

  const gradientOptions = [
    { value: 'pink-orange', label: 'Pink → Orange', preview: 'linear-gradient(90deg, #ec4899 0%, #f97316 100%)' },
    { value: 'orange-yellow', label: 'Orange → Yellow', preview: 'linear-gradient(90deg, #f97316 0%, #eab308 100%)' },
    { value: 'yellow-cyan', label: 'Yellow → Cyan', preview: 'linear-gradient(90deg, #eab308 0%, #06b6d4 100%)' },
    { value: 'cyan-pink', label: 'Cyan → Pink', preview: 'linear-gradient(90deg, #06b6d4 0%, #ec4899 100%)' },
  ];

  return (
    <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-card rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto shadow-2xl border border-border">
        <div className="sticky top-0 bg-card border-b border-border px-6 py-4 flex items-center justify-between">
          <h2 className="text-2xl font-semibold">Edit Carousel Item</h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-muted rounded-lg transition-colors"
            aria-label="Close"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {/* Title */}
          <div>
            <label className="block text-sm font-medium mb-2">
              Title <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              placeholder="e.g., Jas T-shirts. Jus the way we like it!"
              className="w-full px-3 py-2 border rounded-md bg-background"
              required
            />
          </div>

          {/* Description */}
          <div>
            <label className="block text-sm font-medium mb-2">Description</label>
            <textarea
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              placeholder="e.g., Premium jus South African t-shirts"
              className="w-full px-3 py-2 border rounded-md bg-background"
              rows={3}
            />
          </div>

          {/* Image Source Toggle */}
          <div>
            <label className="block text-sm font-medium mb-2">
              Image Source <span className="text-red-500">*</span>
            </label>
            <div className="flex gap-2 mb-3">
              <button
                type="button"
                onClick={() => setUploadMode('url')}
                className={`flex-1 px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                  uploadMode === 'url'
                    ? 'bg-primary text-primary-foreground'
                    : 'bg-muted text-muted-foreground hover:bg-muted/80'
                }`}
              >
                <LinkIcon className="h-4 w-4 inline mr-2" />
                URL
              </button>
              <button
                type="button"
                onClick={() => setUploadMode('upload')}
                className={`flex-1 px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                  uploadMode === 'upload'
                    ? 'bg-primary text-primary-foreground'
                    : 'bg-muted text-muted-foreground hover:bg-muted/80'
                }`}
              >
                <Upload className="h-4 w-4 inline mr-2" />
                Upload File
              </button>
            </div>

            {uploadMode === 'url' ? (
              <input
                type="url"
                value={formData.imageUrl}
                onChange={(e) => handleUrlChange(e.target.value)}
                placeholder="https://example.com/image.jpg"
                className="w-full px-3 py-2 border rounded-md bg-background"
                required
              />
            ) : (
              <div className="border-2 border-dashed rounded-lg p-6 text-center">
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleImageUpload}
                  className="hidden"
                  id="carousel-image-upload-edit"
                  disabled={uploading}
                />
                <label
                  htmlFor="carousel-image-upload-edit"
                  className={`cursor-pointer ${uploading ? 'opacity-50 cursor-not-allowed' : ''}`}
                >
                  <Upload className={`h-12 w-12 mx-auto text-muted-foreground mb-4 ${uploading ? 'animate-pulse' : ''}`} />
                  <p className="font-medium mb-1">
                    {uploading ? 'Uploading...' : 'Click to upload or drag and drop'}
                  </p>
                  <p className="text-sm text-muted-foreground">PNG, JPG, GIF up to 5MB</p>
                </label>
              </div>
            )}

            {/* Image Preview */}
            {imagePreview && (
              <div className="mt-4">
                <p className="text-sm font-medium mb-2">Preview:</p>
                <img
                  src={imagePreview}
                  alt="Preview"
                  className="w-full h-48 object-cover rounded-lg border"
                  onError={() => {
                    setImagePreview('');
                    toast.error('Failed to load image preview');
                  }}
                />
              </div>
            )}
          </div>

          {/* Button Text */}
          <div>
            <label className="block text-sm font-medium mb-2">
              Button Text <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={formData.buttonText}
              onChange={(e) => setFormData({ ...formData, buttonText: e.target.value })}
              placeholder="e.g., Shop Now"
              className="w-full px-3 py-2 border rounded-md bg-background"
              required
            />
          </div>

          {/* Link URL */}
          <div>
            <label className="block text-sm font-medium mb-2">Link URL</label>
            <input
              type="text"
              value={formData.linkUrl}
              onChange={(e) => setFormData({ ...formData, linkUrl: e.target.value })}
              placeholder="/shop"
              className="w-full px-3 py-2 border rounded-md bg-background"
            />
            <p className="text-xs text-muted-foreground mt-1">
              Leave empty or use "/shop" as default
            </p>
          </div>

          {/* Gradient Style */}
          <div>
            <label className="block text-sm font-medium mb-2">
              Gradient Style <span className="text-red-500">*</span>
            </label>
            <div className="grid grid-cols-2 gap-3">
              {gradientOptions.map((option) => (
                <button
                  key={option.value}
                  type="button"
                  onClick={() => setFormData({ ...formData, gradientStyle: option.value })}
                  className={`p-3 rounded-lg border-2 transition-all ${
                    formData.gradientStyle === option.value
                      ? 'border-primary ring-2 ring-primary/20'
                      : 'border-border hover:border-primary/50'
                  }`}
                >
                  <div
                    className="h-12 rounded-md mb-2"
                    style={{ background: option.preview }}
                  />
                  <p className="text-sm font-medium">{option.label}</p>
                </button>
              ))}
            </div>
          </div>

          {/* Order */}
          <div>
            <label className="block text-sm font-medium mb-2">Display Order</label>
            <input
              type="number"
              value={formData.order}
              onChange={(e) => setFormData({ ...formData, order: parseInt(e.target.value) || 0 })}
              min="0"
              className="w-full px-3 py-2 border rounded-md bg-background"
            />
            <p className="text-xs text-muted-foreground mt-1">
              Lower numbers appear first (0, 1, 2, ...)
            </p>
          </div>

          {/* Is Active */}
          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              id="isActive-edit"
              checked={formData.isActive}
              onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
              className="w-4 h-4"
            />
            <label htmlFor="isActive-edit" className="text-sm font-medium cursor-pointer">
              Active (visible on homepage)
            </label>
          </div>

          {/* Actions */}
          <div className="flex gap-3 pt-4 border-t">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2 border rounded-md hover:bg-muted transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={uploading}
              className="flex-1 px-4 py-2 rounded-md text-white transition-all hover:opacity-90 disabled:opacity-50"
              style={{ background: 'linear-gradient(90deg, var(--jits-pink) 0%, var(--jits-orange) 100%)' }}
            >
              {uploading ? 'Uploading...' : 'Save Changes'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
