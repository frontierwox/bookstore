export const getImageUrl = (image) => {
  if (!image) return '/placeholder.png';

  // ✅ Cloudinary (NEW – correct)
  if (image.url) return image.url;

  // ❌ OLD GridFS images → fallback
  return '/placeholder.png';
};
