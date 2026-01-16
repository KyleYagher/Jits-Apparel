import { useState, useEffect } from 'react';
import {
  Package,
  Truck,
  CheckCircle,
  Clock,
  MapPin,
  Loader2,
  ExternalLink,
  AlertCircle
} from 'lucide-react';
import { apiClient, type TrackingResponse, type TrackingEvent } from '../services/api';

interface OrderTrackingProps {
  orderId: number;
  trackingNumber?: string;
  onClose?: () => void;
}

// Map status to icon and color
const getStatusIcon = (status: string) => {
  const lowerStatus = status.toLowerCase();

  if (lowerStatus.includes('delivered')) {
    return { icon: CheckCircle, color: 'text-green-500' };
  }
  if (lowerStatus.includes('transit') || lowerStatus.includes('out-for-delivery')) {
    return { icon: Truck, color: 'text-blue-500' };
  }
  if (lowerStatus.includes('hub') || lowerStatus.includes('collected')) {
    return { icon: Package, color: 'text-orange-500' };
  }
  if (lowerStatus.includes('exception') || lowerStatus.includes('failed')) {
    return { icon: AlertCircle, color: 'text-red-500' };
  }
  return { icon: Clock, color: 'text-muted-foreground' };
};

// Format date for display
const formatDate = (dateString: string) => {
  const date = new Date(dateString);
  return new Intl.DateTimeFormat('en-ZA', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  }).format(date);
};

export default function OrderTracking({ orderId, trackingNumber, onClose }: OrderTrackingProps) {
  const [tracking, setTracking] = useState<TrackingResponse | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchTracking = async () => {
      if (!trackingNumber) {
        setError('No tracking information available yet');
        setIsLoading(false);
        return;
      }

      try {
        const data = await apiClient.getOrderTracking(orderId);
        setTracking(data);
        setError(null);
      } catch (err) {
        console.error('Failed to fetch tracking:', err);
        setError('Unable to load tracking information');
      } finally {
        setIsLoading(false);
      }
    };

    fetchTracking();
  }, [orderId, trackingNumber]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  if (error || !tracking) {
    return (
      <div className="text-center py-8">
        <Package className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
        <p className="text-muted-foreground">{error || 'No tracking information available'}</p>
        {trackingNumber && (
          <p className="text-sm mt-2">
            Tracking Number: <span className="font-mono">{trackingNumber}</span>
          </p>
        )}
      </div>
    );
  }

  const { icon: StatusIcon, color: statusColor } = getStatusIcon(tracking.status);

  return (
    <div className="space-y-6">
      {/* Header with current status */}
      <div className="text-center pb-4 border-b">
        <div className={`inline-flex items-center justify-center w-16 h-16 rounded-full bg-muted mb-3`}>
          <StatusIcon className={`w-8 h-8 ${statusColor}`} />
        </div>
        <h3 className="text-xl font-semibold">{tracking.statusDescription}</h3>
        <p className="text-sm text-muted-foreground mt-1">
          Tracking: <span className="font-mono">{tracking.trackingReference}</span>
        </p>
      </div>

      {/* Delivery Estimate */}
      {tracking.estimatedDeliveryFrom && !tracking.deliveredDate && (
        <div className="p-4 rounded-lg bg-muted">
          <div className="flex items-center gap-2 text-sm">
            <Clock className="w-4 h-4" />
            <span className="font-medium">Estimated Delivery</span>
          </div>
          <p className="mt-1">
            {tracking.estimatedDeliveryFrom && formatDate(tracking.estimatedDeliveryFrom)}
            {tracking.estimatedDeliveryTo && tracking.estimatedDeliveryTo !== tracking.estimatedDeliveryFrom && (
              <> - {formatDate(tracking.estimatedDeliveryTo)}</>
            )}
          </p>
        </div>
      )}

      {/* Delivered Info */}
      {tracking.deliveredDate && (
        <div className="p-4 rounded-lg bg-green-500/10 border border-green-500/20">
          <div className="flex items-center gap-2 text-green-600 dark:text-green-400">
            <CheckCircle className="w-5 h-5" />
            <span className="font-medium">Delivered</span>
          </div>
          <p className="mt-1 text-sm">{formatDate(tracking.deliveredDate)}</p>
        </div>
      )}

      {/* Hub Information */}
      {(tracking.collectionHub || tracking.deliveryHub) && (
        <div className="grid grid-cols-2 gap-4 text-sm">
          {tracking.collectionHub && (
            <div>
              <span className="text-muted-foreground">From</span>
              <p className="font-medium">{tracking.collectionHub}</p>
            </div>
          )}
          {tracking.deliveryHub && (
            <div>
              <span className="text-muted-foreground">To</span>
              <p className="font-medium">{tracking.deliveryHub}</p>
            </div>
          )}
        </div>
      )}

      {/* Timeline */}
      <div>
        <h4 className="font-medium mb-4">Tracking History</h4>
        <div className="space-y-4">
          {tracking.events.map((event, index) => (
            <TrackingEventItem
              key={event.id}
              event={event}
              isFirst={index === 0}
              isLast={index === tracking.events.length - 1}
            />
          ))}
        </div>
      </div>

      {/* Proof of Delivery */}
      {tracking.proofOfDelivery && (
        <div className="pt-4 border-t">
          <h4 className="font-medium mb-3">Proof of Delivery</h4>
          <p className="text-sm text-muted-foreground mb-2">{tracking.proofOfDelivery.method}</p>

          {tracking.proofOfDelivery.recipientName && (
            <p className="text-sm">Received by: {tracking.proofOfDelivery.recipientName}</p>
          )}

          {tracking.proofOfDelivery.imageUrls.length > 0 && (
            <div className="flex gap-2 mt-3">
              {tracking.proofOfDelivery.imageUrls.map((url, idx) => (
                <a
                  key={idx}
                  href={url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-1 text-sm text-primary hover:underline"
                >
                  <ExternalLink className="w-3 h-3" />
                  View Image {idx + 1}
                </a>
              ))}
            </div>
          )}

          {tracking.proofOfDelivery.digitalPodUrl && (
            <a
              href={tracking.proofOfDelivery.digitalPodUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1 mt-2 text-sm text-primary hover:underline"
            >
              <ExternalLink className="w-3 h-3" />
              Download Digital POD
            </a>
          )}
        </div>
      )}

      {/* Close Button */}
      {onClose && (
        <div className="pt-4 border-t">
          <button
            onClick={onClose}
            className="w-full py-2 rounded-lg border border-border hover:bg-muted transition-colors"
          >
            Close
          </button>
        </div>
      )}
    </div>
  );
}

// Individual tracking event component
function TrackingEventItem({
  event,
  isFirst,
  isLast
}: {
  event: TrackingEvent;
  isFirst: boolean;
  isLast: boolean;
}) {
  const { icon: Icon, color } = getStatusIcon(event.status);

  return (
    <div className="flex gap-3">
      {/* Timeline connector */}
      <div className="flex flex-col items-center">
        <div className={`w-8 h-8 rounded-full flex items-center justify-center ${isFirst ? 'bg-primary/10' : 'bg-muted'}`}>
          <Icon className={`w-4 h-4 ${isFirst ? 'text-primary' : color}`} />
        </div>
        {!isLast && <div className="w-0.5 flex-1 bg-border mt-1" />}
      </div>

      {/* Event content */}
      <div className="flex-1 pb-4">
        <p className={`font-medium ${isFirst ? '' : 'text-muted-foreground'}`}>
          {event.message || event.status.replace(/-/g, ' ')}
        </p>
        <div className="flex items-center gap-2 text-sm text-muted-foreground mt-1">
          <span>{formatDate(event.eventDate)}</span>
          {event.location && (
            <>
              <span>•</span>
              <span className="flex items-center gap-1">
                <MapPin className="w-3 h-3" />
                {event.location}
              </span>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
