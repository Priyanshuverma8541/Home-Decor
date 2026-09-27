export const buildProductUrl = (productId, origin = window.location.origin) => {
  if (!productId) return origin || "";
  return `${origin}/product/${productId}`;
};

export const buildProductShareData = (product, origin = window.location.origin) => {
  const productUrl = buildProductUrl(product?._id, origin);
  const productName = product?.name || "Savitri Livings product";
  const productPrice = Number(product?.price || 0);
  const description = product?.description || "Explore this product on Savitri Livings.";
  const shareText = `${productName}\n${productPrice ? `Rs.${productPrice.toLocaleString("en-IN")}` : ""}\n${description}\n${productUrl}`.trim();

  return {
    url: productUrl,
    title: productName,
    text: shareText,
    description,
    price: productPrice,
  };
};

export const shareProduct = async (product) => {
  const payload = buildProductShareData(product);

  if (navigator?.share) {
    try {
      await navigator.share({
        title: payload.title,
        text: payload.text,
        url: payload.url,
      });
      return true;
    } catch (err) {
      if (err?.name === "AbortError") return false;
    }
  }

  if (navigator?.clipboard) {
    try {
      await navigator.clipboard.writeText(payload.text);
      return true;
    } catch (err) {
      // fallback below
    }
  }

  const textarea = document.createElement("textarea");
  textarea.value = payload.text;
  textarea.style.position = "fixed";
  textarea.style.opacity = "0";
  document.body.appendChild(textarea);
  textarea.focus();
  textarea.select();
  try {
    document.execCommand("copy");
  } catch (err) {
    // no-op
  }
  document.body.removeChild(textarea);
  return true;
};
