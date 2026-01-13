import { useState, useEffect } from "react";

// Get initial values from tool output (available at load time)
const getInitialToolOutput = () => {
  const toolOutput = window.openai?.toolOutput || {};
  return {
    query: toolOutput.query || "",
    skip: toolOutput.skip || 0,
  };
};

/**
 * useStore - Hook to fetch and manage store products
 */
export function useStore(baseUrl, storeId) {
  const initialValues = getInitialToolOutput();

  const [products, setProducts] = useState([]);
  const [storeName, setStoreName] = useState("");
  const [total, setTotal] = useState(0);
  const [query, setQuery] = useState(initialValues.query);
  const [searchInput, setSearchInput] = useState(initialValues.query);
  const [skip, setSkip] = useState(initialValues.skip);
  const [isSearching, setIsSearching] = useState(false);
  const [isInitialLoad, setIsInitialLoad] = useState(true);

  const limit = 100;

  // Fetch products when query or skip changes
  useEffect(() => {
    const apiUrl = `${baseUrl}/api/razorpay/parse-store?url=https://pages.razorpay.com/stores/${storeId}`;

    setIsSearching(true);

    fetch(apiUrl)
      .then((res) => res.json())
      .then((data) => {
        if (data.success) {
          if (data.store?.title) {
            setStoreName(data.store.title);
          }

          const mappedProducts = (data.products || []).map((product) => ({
            id: product.id,
            title: product.name,
            price: product.discounted_price / 100,
            thumbnail: product.images?.[0] || "https://via.placeholder.com/100",
            category: product.categories?.[0]?.name || "Uncategorized",
            stockAvailable: product.stock_available || 0,
          }));

          const inStockProducts = mappedProducts.filter(
            (p) => p.stockAvailable > 0,
          );

          const filteredProducts = query
            ? inStockProducts.filter(
                (p) =>
                  p.title.toLowerCase().includes(query.toLowerCase()) ||
                  p.category.toLowerCase().includes(query.toLowerCase()),
              )
            : inStockProducts;

          const paginatedProducts = filteredProducts.slice(skip, skip + limit);

          setProducts(paginatedProducts);
          setTotal(filteredProducts.length);
        } else {
          console.error("Error fetching products:", data.error);
          setProducts([]);
          setTotal(0);
        }
      })
      .catch((err) => {
        console.error("Error fetching products:", err);
        setProducts([]);
        setTotal(0);
      })
      .finally(() => {
        setIsSearching(false);
        setIsInitialLoad(false);
      });
  }, [baseUrl, storeId, query, skip]);

  const handleSearch = () => {
    setQuery(searchInput);
    setSkip(0);
  };

  const handlePrevious = () => {
    setSkip(Math.max(0, skip - limit));
  };

  const handleNext = () => {
    setSkip(skip + limit);
  };

  return {
    products,
    storeName,
    total,
    query,
    searchInput,
    skip,
    limit,
    isSearching,
    isInitialLoad,
    setSearchInput,
    handleSearch,
    handlePrevious,
    handleNext,
  };
}

export default useStore;
