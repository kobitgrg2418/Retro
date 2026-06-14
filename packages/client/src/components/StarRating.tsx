interface StarRatingProps {
  rating: number;
  onRate?: (rating: number) => void;
  readonly?: boolean;
  size?: 'sm' | 'md' | 'lg';
}

export default function StarRating({ rating, onRate, readonly = false, size = 'md' }: StarRatingProps) {
  const stars = [1, 2, 3, 4, 5];

  return (
    <div className={`star-rating star-rating-${size} ${readonly ? 'readonly' : ''}`}>
      {stars.map(star => (
        <span
          key={star}
          className={`star ${star <= rating ? 'star-filled' : 'star-empty'}`}
          onClick={() => !readonly && onRate?.(star)}
          role={readonly ? undefined : 'button'}
          tabIndex={readonly ? undefined : 0}
          onKeyDown={(e) => {
            if (!readonly && (e.key === 'Enter' || e.key === ' ')) {
              onRate?.(star);
            }
          }}
        >
          &#9733;
        </span>
      ))}
    </div>
  );
}
