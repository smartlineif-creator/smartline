declare global {
  interface Window {
    gtag?: (...args: any[]) => void;
    fbq?: (...args: any[]) => void;
  }
}

export function trackViewItem(product: { id: string; name: string; price: number; category?: string }) {
  window.gtag?.('event', 'view_item', {
    currency: 'UAH',
    value: product.price,
    items: [{ item_id: product.id, item_name: product.name, item_category: product.category, price: product.price }],
  });
  window.fbq?.('track', 'ViewContent', {
    content_ids: [product.id],
    content_name: product.name,
    content_type: 'product',
    value: product.price,
    currency: 'UAH',
  });
}

export function trackAddToCart(product: { id: string; name: string; price: number }, quantity = 1) {
  window.gtag?.('event', 'add_to_cart', {
    currency: 'UAH',
    value: product.price * quantity,
    items: [{ item_id: product.id, item_name: product.name, price: product.price, quantity }],
  });
  window.fbq?.('track', 'AddToCart', {
    content_ids: [product.id],
    content_name: product.name,
    content_type: 'product',
    value: product.price * quantity,
    currency: 'UAH',
  });
}

export function trackBeginCheckout(total: number, items: Array<{ id: string; name: string; price: number; quantity: number }>) {
  window.gtag?.('event', 'begin_checkout', {
    currency: 'UAH',
    value: total,
    items: items.map((i) => ({ item_id: i.id, item_name: i.name, price: i.price, quantity: i.quantity })),
  });
  window.fbq?.('track', 'InitiateCheckout', {
    value: total,
    currency: 'UAH',
    num_items: items.reduce((s, i) => s + i.quantity, 0),
  });
}

export function trackPurchase(orderId: string, total: number, items: Array<{ id: string; name: string; price: number; quantity: number }>) {
  window.gtag?.('event', 'purchase', {
    transaction_id: orderId,
    currency: 'UAH',
    value: total,
    items: items.map((i) => ({ item_id: i.id, item_name: i.name, price: i.price, quantity: i.quantity })),
  });
  window.fbq?.('track', 'Purchase', {
    value: total,
    currency: 'UAH',
    content_ids: items.map((i) => i.id),
    content_type: 'product',
  });
}
