import config from "../config/index.js";

export class ShopifyService {
  private shopifyUrl: string;
  private shopifyToken: string;

  constructor() {
    this.shopifyUrl = process.env.SHOPIFY_URL || 'https://apoorva-devstore.myshopify.com/admin/api/2025-10';
    this.shopifyToken = process.env.SHOPIFY_ACCESS_TOKEN || '';
  }

  /**
   * Fetch products from Shopify
   */
  async getProducts() {
    try {
      const response = await fetch(`${this.shopifyUrl}/products.json`, {
        headers: {
          'Content-Type': 'application/json',
          'X-Shopify-Access-Token': this.shopifyToken
        }
      });

      if (!response.ok) {
        throw new Error(`Shopify API error: ${response.status} ${response.statusText}`);
      }

      const data = await response.json();
      
      // Transform Shopify products to a simpler format
      const transformedProducts = (data.products || []).map((product: any) => ({
        id: product.id,
        title: product.title,
        price: product.variants && product.variants[0] ? parseFloat(product.variants[0].price) : 0,
        thumbnail: product.image ? product.image.src : (product.images && product.images[0] ? product.images[0].src : ''),
        rating: 4.5, // Default rating
        category: product.product_type || product.vendor || 'General',
        description: product.body_html || '',
        vendor: product.vendor || '',
        product_type: product.product_type || '',
        tags: product.tags || ''
      }));

      return {
        success: true,
        products: transformedProducts,
        total: transformedProducts.length
      };
    } catch (error: any) {
      console.error('Error fetching Shopify products:', error);
      return {
        success: false,
        products: [],
        total: 0,
        error: error.message
      };
    }
  }

  /**
   * Search products by query (client-side filtering)
   */
  async searchProducts(query: string = '', skip: number = 0, limit: number = 100) {
    try {
      const result = await this.getProducts();
      
      if (!result.success) {
        return result;
      }

      let filteredProducts = result.products;

      // Filter by query if provided
      if (query && query.trim() !== '') {
        const searchQuery = query.toLowerCase();
        filteredProducts = filteredProducts.filter((product: any) => 
          product.title.toLowerCase().includes(searchQuery) ||
          product.description.toLowerCase().includes(searchQuery) ||
          product.vendor.toLowerCase().includes(searchQuery) ||
          product.category.toLowerCase().includes(searchQuery) ||
          product.tags.toLowerCase().includes(searchQuery)
        );
      }

      // Apply pagination
      const total = filteredProducts.length;
      const paginatedProducts = filteredProducts.slice(skip, skip + limit);

      return {
        success: true,
        products: paginatedProducts,
        total: total,
        skip: skip,
        limit: limit
      };
    } catch (error: any) {
      console.error('Error searching Shopify products:', error);
      return {
        success: false,
        products: [],
        total: 0,
        error: error.message
      };
    }
  }
}

export default ShopifyService;

