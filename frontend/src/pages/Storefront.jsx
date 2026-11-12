import React, { useState, useEffect } from 'react';
import api from '../services/api';
import { ShoppingBag, Star, Eye, ChevronLeft, ChevronRight } from 'lucide-react';

export default function Storefront({ addToCart }) {
  const [products, setProducts] = useState([]);
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [activeImageIndex, setActiveImageIndex] = useState(0);
  const [selectedSize, setSelectedSize] = useState('');
  const [selectedColor, setSelectedColor] = useState('');
  const [quantity, setQuantity] = useState(1);
  const [error, setError] = useState('');

  // Pagination States
  const [page, setPage] = useState(1);
  const limit = 10; // Number of products per page

  useEffect(() => {
    fetchProducts();
  }, [page]);

  const fetchProducts = async () => {
    try {
      const skip = (page - 1) * limit;
      const res = await api.get(`/products/?skip=${skip}&limit=${limit}`);
      setProducts(res.data);
    } catch (err) {
      setError('Failed to load products.');
    }
  };

  // Helper to normalize images array from backend
  const getProductImages = (product) => {
    if (!product) return [];
    if (product.image_urls && product.image_urls.length > 0) {
      return product.image_urls;
    }
    if (product.image_url) {
      return [product.image_url];
    }
    return ['https://images.unsplash.com/photo-1523275335684-37898b6baf30'];
  };

  const handleOpenQuickView = (product) => {
    setSelectedProduct(product);
    setActiveImageIndex(0);
    setSelectedSize(product.sizes?.[0] || 'M');
    setSelectedColor(product.colors?.[0] || 'Black');
    setQuantity(1);
  };

  const handleNextImage = () => {
    const images = getProductImages(selectedProduct);
    if (images.length === 0) return;
    setActiveImageIndex((prevIndex) => (prevIndex + 1) % images.length);
  };

  const handlePrevImage = () => {
    const images = getProductImages(selectedProduct);
    if (images.length === 0) return;
    setActiveImageIndex((prevIndex) => (prevIndex - 1 + images.length) % images.length);
  };

  const handleAddToCartModal = () => {
    if (!selectedProduct) return;
    addToCart({
      ...selectedProduct,
      selectedSize,
      selectedColor,
      quantity,
    });
    setSelectedProduct(null);
  };

  const currentGalleryImages = selectedProduct ? getProductImages(selectedProduct) : [];

  return (
    <div className="max-w-7xl mx-auto px-4 py-8 font-sans">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-black text-gray-900">Explore Store</h1>
          <p className="text-sm text-gray-500">Discover our latest collection with custom options and multi-image galleries</p>
        </div>
      </div>

      {error && <div className="bg-red-50 text-red-700 p-4 rounded-xl mb-6 text-sm">{error}</div>}

      {/* Product Catalog Grid (More compact cards using 5 columns on large screens) */}
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
        {products.map((product) => {
          const mainImg = getProductImages(product)[0];
          return (
            <div key={product.id} className="bg-white rounded-xl border border-gray-100 shadow-2xs overflow-hidden flex flex-col group">
              <div className="relative aspect-square bg-gray-50 overflow-hidden">
                <img
                  src={mainImg}
                  alt={product.title}
                  className="w-full h-full object-cover group-hover:scale-105 transition duration-300"
                />
                <button
                  onClick={() => handleOpenQuickView(product)}
                  className="absolute bottom-2 right-2 bg-white/90 backdrop-blur-md px-2.5 py-1 rounded-lg text-[10px] font-bold text-gray-900 shadow-md opacity-0 group-hover:opacity-100 transition flex items-center gap-1"
                >
                  <Eye className="w-3 h-3" /> Quick View
                </button>
              </div>

              <div className="p-3 flex flex-col justify-between flex-1">
                <div>
                  <div className="flex items-center gap-0.5 text-amber-500 mb-0.5">
                    {[...Array(5)].map((_, i) => (
                      <Star key={i} className="w-3 h-3 fill-current" />
                    ))}
                    <span className="text-[9px] text-gray-400 ml-1">(4.8)</span>
                  </div>
                  <h3 className="font-bold text-gray-900 text-xs truncate">{product.title}</h3>
                  <p className="text-[10px] text-gray-400 mt-0.5 line-clamp-1">{product.description || 'No description'}</p>
                </div>

                <div className="flex justify-between items-center mt-3 pt-2 border-t border-gray-50">
                  <span className="text-sm font-black text-emerald-700">${product.price.toFixed(2)}</span>
                  <button
                    onClick={() => handleOpenQuickView(product)}
                    className="bg-[#1A382B] text-white px-2.5 py-1 rounded-lg text-[10px] font-semibold hover:bg-emerald-900 transition"
                  >
                    Select
                  </button>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Pagination Controls */}
      <div className="flex justify-between items-center bg-white p-4 rounded-2xl border border-gray-100 shadow-2xs mt-8">
        <button
          onClick={() => setPage((prev) => Math.max(prev - 1, 1))}
          disabled={page === 1}
          className="flex items-center gap-1 px-4 py-2 bg-gray-50 text-gray-700 rounded-xl text-xs font-semibold disabled:opacity-50 hover:bg-gray-100 transition"
        >
          <ChevronLeft className="w-4 h-4" /> Previous
        </button>
        <span className="text-xs text-gray-600 font-bold">Page {page}</span>
        <button
          onClick={() => setPage((prev) => prev + 1)}
          disabled={products.length < limit}
          className="flex items-center gap-1 px-4 py-2 bg-gray-50 text-gray-700 rounded-xl text-xs font-semibold disabled:opacity-50 hover:bg-gray-100 transition"
        >
          Next <ChevronRight className="w-4 h-4" />
        </button>
      </div>

      {/* Quick View Modal with Next/Prev Image Navigation Arrows */}
      {selectedProduct && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-3xl max-w-3xl w-full p-6 md:p-8 relative shadow-2xl overflow-y-auto max-h-[90vh]">
            <button
              onClick={() => setSelectedProduct(null)}
              className="absolute top-4 right-4 text-gray-400 hover:text-gray-700 font-bold text-lg p-2 z-10"
            >
              ✕
            </button>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              {/* Multi-Image Gallery with Navigation Arrows */}
              <div className="space-y-4">
                <div className="relative aspect-square bg-gray-50 rounded-2xl overflow-hidden border group">
                  <img
                    src={currentGalleryImages[activeImageIndex]}
                    alt={selectedProduct.title}
                    className="w-full h-full object-cover transition duration-300"
                  />

                  {/* Left & Right Next/Prev Image Arrows */}
                  {currentGalleryImages.length > 1 && (
                    <>
                      <button
                        onClick={handlePrevImage}
                        className="absolute left-2 top-1/2 -translate-y-1/2 p-2 bg-white/80 hover:bg-white text-gray-800 rounded-full shadow-md backdrop-blur-xs transition"
                        title="Previous Image"
                      >
                        <ChevronLeft className="w-5 h-5" />
                      </button>

                      <button
                        onClick={handleNextImage}
                        className="absolute right-2 top-1/2 -translate-y-1/2 p-2 bg-white/80 hover:bg-white text-gray-800 rounded-full shadow-md backdrop-blur-xs transition"
                        title="Next Image"
                      >
                        <ChevronRight className="w-5 h-5" />
                      </button>
                    </>
                  )}
                </div>

                {/* Thumbnails Row */}
                {currentGalleryImages.length > 1 && (
                  <div className="flex gap-2 overflow-x-auto pb-2">
                    {currentGalleryImages.map((img, idx) => (
                      <button
                        key={idx}
                        onClick={() => setActiveImageIndex(idx)}
                        className={`w-16 h-16 rounded-xl overflow-hidden border-2 shrink-0 transition ${
                          activeImageIndex === idx ? 'border-emerald-600 ring-2 ring-emerald-600/20' : 'border-transparent opacity-70 hover:opacity-100'
                        }`}
                      >
                        <img src={img} alt="" className="w-full h-full object-cover" />
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {/* Product Info & Options */}
              <div className="space-y-6">
                <div>
                  <h2 className="text-2xl font-black text-gray-900">{selectedProduct.title}</h2>
                  <p className="text-xl font-extrabold text-emerald-700 mt-1">${selectedProduct.price.toFixed(2)}</p>
                  <p className="text-xs text-gray-500 mt-2">{selectedProduct.description || 'No description provided.'}</p>
                </div>

                {/* Color Selector */}
                <div>
                  <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-2">
                    Color: <span className="text-emerald-700">{selectedColor}</span>
                  </label>
                  <div className="flex gap-2">
                    {(selectedProduct.colors || ['Black', 'White', 'Navy']).map((color) => (
                      <button
                        key={color}
                        onClick={() => setSelectedColor(color)}
                        className={`px-4 py-2 rounded-xl text-xs font-semibold border transition ${
                          selectedColor === color ? 'bg-[#1A382B] text-white border-[#1A382B]' : 'bg-white text-gray-700 border-gray-200 hover:bg-gray-50'
                        }`}
                      >
                        {color}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Size Selector */}
                <div>
                  <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-2">
                    Size: <span className="text-emerald-700">{selectedSize}</span>
                  </label>
                  <div className="flex gap-2">
                    {(selectedProduct.sizes || ['S', 'M', 'L', 'XL']).map((size) => (
                      <button
                        key={size}
                        onClick={() => setSelectedSize(size)}
                        className={`w-10 h-10 rounded-xl text-xs font-bold border transition flex items-center justify-center ${
                          selectedSize === size ? 'bg-[#1A382B] text-white border-[#1A382B]' : 'bg-white text-gray-700 border-gray-200 hover:bg-gray-50'
                        }`}
                      >
                        {size}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Add to Cart */}
                <button
                  onClick={handleAddToCartModal}
                  className="w-full bg-[#1A382B] text-white py-3.5 rounded-xl font-bold text-sm hover:bg-emerald-900 transition shadow-md flex items-center justify-center gap-2"
                >
                  <ShoppingBag className="w-4 h-4" /> Add to Cart - ${(selectedProduct.price * quantity).toFixed(2)}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}