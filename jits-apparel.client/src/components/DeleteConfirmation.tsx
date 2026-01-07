import { AlertTriangle, X } from 'lucide-react';
import { Product } from '../services/api';

interface DeleteConfirmationProps {
  product: Product;
  onClose: () => void;
  onDelete: () => void;
}

export function DeleteConfirmation({ product, onClose, onDelete }: DeleteConfirmationProps) {
  return (
    <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-card rounded-lg max-w-md w-full shadow-2xl border border-border">
        <div className="space-x-4 p-4 bg-red-100 dark:bg-red-900/20 px-6 py-4 border-b border-border flex items-center justify-between">
            <AlertTriangle className="h-12 w-12 text-red-600 dark:text-red-400" />
            <h2 className="text-xl font-semibold">Delete this product?</h2>
            <button
                title='Delete Product'
                onClick={onClose}
                className="p-2 hover:bg-muted rounded-lg transition-colors"
            >
                <X className="w-5 h-5" />
            </button>
        </div>

        <div className="p-6 space-y-4">
            {/* Product Info */}
            <div className="text-center space-y-2">
                
                <div className="mx-auto flex items-center w-fit gap-3 p-4 bg-muted rounded-lg border border-border">
                {product.imageUrl && (
                    <img
                    src={product.imageUrl}
                    alt={product.name}
                    className="w-16 h-16 object-cover rounded border border-border"
                    />
                )}
                <div className="text-left">
                    <p className="font-medium">{product.name}</p>
                    <p className="text-sm text-muted-foreground mt-1">R{product.price.toFixed(2)}</p>
                </div>
                </div>
            </div>

            {/* Warning Message */}
            <div className="p-4 bg-red-50 dark:bg-red-900/10 border border-red-200 dark:border-red-800 rounded-lg">
                <p className="text-sm text-red-800 dark:text-red-300">
                <strong>Warning:</strong> This action cannot be undone. The product will be permanently removed from your store.
                </p>
            </div>

            {/* Action Buttons */}
            <div className="flex gap-3 pt-2">
                <button
                onClick={onClose}
                className="flex-1 px-4 py-2 border rounded-md hover:bg-muted transition-colors"
                >
                Cancel
                </button>
                <button
                onClick={onDelete}
                className="flex-1 px-4 py-2 rounded-md text-white transition-all hover:opacity-90 bg-red-600 hover:bg-red-700"
                >
                Delete Product
                </button>
            </div>
        </div>
      </div>
    </div>
  );
}