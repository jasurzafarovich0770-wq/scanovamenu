export const SUBSCRIPTION_LIMITS = {
  FREE: {
    maxTables: 5,
    maxMenuItems: 20,
    maxOrders: 100,
    features: ['basic_menu', 'qr_ordering']
  },
  STARTER: {
    maxTables: 20,
    maxMenuItems: 100,
    maxOrders: 1000,
    features: ['basic_menu', 'qr_ordering', 'analytics', 'email_support']
  },
  PROFESSIONAL: {
    maxTables: 50,
    maxMenuItems: 500,
    maxOrders: 10000,
    features: ['basic_menu', 'qr_ordering', 'analytics', 'priority_support', 'custom_branding', 'loyalty_program']
  },
  ENTERPRISE: {
    maxTables: -1, // unlimited
    maxMenuItems: -1,
    maxOrders: -1,
    features: ['all_features', 'dedicated_support', 'custom_integrations', 'white_label']
  }
};

export const GUEST_SESSION_DURATION = 24 * 60 * 60 * 1000; // 24 hours
export const ORDER_RATE_LIMIT = 5; // orders per session per hour
export const MAX_CART_ITEMS = 50;
