const SAVITRI_JEWELLERY_IMAGE = "/brand/savitri-jewellers-earrings.png";

function isHeartEarring(product) {
  return product?.category?.toLowerCase() === "earrings" && /\bheart\b/i.test(product?.name || "");
}

export function getProductImage(product) {
  if (isHeartEarring(product)) return SAVITRI_JEWELLERY_IMAGE;
  return product?.images?.[0] || SAVITRI_JEWELLERY_IMAGE;
}

export function getProductImages(product) {
  if (isHeartEarring(product)) return [SAVITRI_JEWELLERY_IMAGE];
  return product?.images?.length
    ? product.images
    : ["https://images.unsplash.com/photo-1560343776-97e7d202ff0e?w=800&q=80"];
}