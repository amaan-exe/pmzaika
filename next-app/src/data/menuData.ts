export interface MenuItem {
  id: string;
  name: string;
  category: string;
  categoryName: string;
  price: number;
  originalPrice: number;
  isVeg: boolean;
  rating: number;
  reviewsCount: number;
  badge?: string;
  description: string;
  image: string;
}

export const MENU_DATA: MenuItem[] = [
  {
    id: "biryani-1",
    name: "PM Special Hyderabadi Chicken Biryani",
    category: "biryani",
    categoryName: "Royal Biryani",
    price: 240,
    originalPrice: 280,
    isVeg: false,
    rating: 4.9,
    reviewsCount: 142,
    badge: "Bestseller",
    description: "Long-grain aromatic basmati rice dum-cooked with succulent chicken, saffron, and authentic Mughlai spices.",
    image: "/assets/images/food_royal_biryani.webp"
  },
  {
    id: "biryani-2",
    name: "Dum Handi Mutton Biryani",
    category: "biryani",
    categoryName: "Royal Biryani",
    price: 360,
    originalPrice: 400,
    isVeg: false,
    rating: 4.8,
    reviewsCount: 98,
    badge: "Chef's Special",
    description: "Tender pieces of mutton slow-cooked in sealed clay handi with aged Basmati rice and whole aromatic spices.",
    image: "/assets/images/food_royal_biryani.webp"
  },
  {
    id: "starter-1",
    name: "Tandoori Chicken (Full)",
    category: "tandoori",
    categoryName: "Tandoori",
    price: 340,
    originalPrice: 380,
    isVeg: false,
    rating: 4.9,
    reviewsCount: 184,
    badge: "Popular",
    description: "Whole chicken marinated in hung curd, Kashmiri red chili, and mustard oil, charred to perfection in clay oven.",
    image: "/assets/images/food_tandoori_kebab.webp"
  },
  {
    id: "starter-2",
    name: "Crispy Chicken Seekh Kebab",
    category: "starters",
    categoryName: "Starters",
    price: 260,
    originalPrice: 290,
    isVeg: false,
    rating: 4.7,
    reviewsCount: 76,
    badge: "Hot",
    description: "Finely minced chicken spiced with green herbs, mint, and toasted spices, skewered and roasted over embers.",
    image: "/assets/images/food_tandoori_kebab.webp"
  },
  {
    id: "starter-3",
    name: "Chef's Royal Starters Platter",
    category: "starters",
    categoryName: "Starters",
    price: 420,
    originalPrice: 480,
    isVeg: false,
    rating: 4.9,
    reviewsCount: 110,
    badge: "Recommended",
    description: "Assorted tandoori appetizers including paneer tikka, chicken tikka, fish fingers, and tandoori wings.",
    image: "/assets/images/image1.webp"
  },
  {
    id: "veg-1",
    name: "Paneer Butter Masala",
    category: "veg-curry",
    categoryName: "Veg Curries",
    price: 220,
    originalPrice: 250,
    isVeg: true,
    rating: 4.8,
    reviewsCount: 165,
    badge: "Bestseller",
    description: "Soft cottage cheese cubes simmered in rich creamy tomato, cashew butter gravy with hint of kasuri methi.",
    image: "/assets/images/food_butter_curry.webp"
  },
  {
    id: "veg-2",
    name: "Dal Makhani Amritsari",
    category: "veg-curry",
    categoryName: "Veg Curries",
    price: 190,
    originalPrice: 220,
    isVeg: true,
    rating: 4.9,
    reviewsCount: 130,
    badge: "Popular",
    description: "Black lentils slow-cooked overnight with white butter, cream, and ginger-garlic paste for unmatched silkiness.",
    image: "/assets/images/image2.webp"
  },
  {
    id: "non-veg-1",
    name: "Butter Chicken (Murgh Makhani)",
    category: "non-veg-curry",
    categoryName: "Non-Veg Curries",
    price: 320,
    originalPrice: 360,
    isVeg: false,
    rating: 5.0,
    reviewsCount: 220,
    badge: "Must Try",
    description: "Clay-oven grilled tandoori chicken cooked in velvety, mildly sweetened butter and fresh tomato cream sauce.",
    image: "/assets/images/food_butter_curry.webp"
  },
  {
    id: "non-veg-2",
    name: "Zaika Handi Chicken Masala",
    category: "non-veg-curry",
    categoryName: "Non-Veg Curries",
    price: 300,
    originalPrice: 340,
    isVeg: false,
    rating: 4.8,
    reviewsCount: 140,
    badge: "Chef's Special",
    description: "Homestyle spicy chicken curry simmered slowly in an earthen pot with hand-ground spices and fried onions.",
    image: "/assets/images/uliana-kopanytsia-ooL2YwOwWC0-unsplash-1.webp"
  },
  {
    id: "chinese-1",
    name: "Chicken Hakka Noodles & Manchurian",
    category: "chinese",
    categoryName: "Chinese",
    price: 210,
    originalPrice: 240,
    isVeg: false,
    rating: 4.7,
    reviewsCount: 88,
    badge: "Hot",
    description: "Wok-tossed noodles with shredded vegetables, tender chicken strips, and dark soy garlic glaze.",
    image: "/assets/images/food_momos_noodles.webp"
  },
  {
    id: "chinese-2",
    name: "Chilli Chicken Dry / Gravy",
    category: "chinese",
    categoryName: "Chinese",
    price: 240,
    originalPrice: 270,
    isVeg: false,
    rating: 4.8,
    reviewsCount: 115,
    badge: "Popular",
    description: "Crispy batter-fried chicken bites tossed with crunchy bell peppers, onions, green chilies, and tangy soy sauce.",
    image: "/assets/images/WhatsApp-Image-2026-02-03-at-8.01.46-PM-1-300x300.webp"
  },
  {
    id: "momos-1",
    name: "Steamed Chicken Momos (8 Pcs)",
    category: "momos",
    categoryName: "Momos",
    price: 130,
    originalPrice: 150,
    isVeg: false,
    rating: 4.9,
    reviewsCount: 175,
    badge: "Bestseller",
    description: "Juicy minced chicken and herb dumplings served piping hot with authentic spicy red chili garlic dip.",
    image: "/assets/images/food_momos_noodles.webp"
  },
  {
    id: "momos-2",
    name: "Crispy Kurkure Paneer Momos (8 Pcs)",
    category: "momos",
    categoryName: "Momos",
    price: 150,
    originalPrice: 170,
    isVeg: true,
    rating: 4.7,
    reviewsCount: 92,
    badge: "Trending",
    description: "Crunchy crumb-coated fried paneer momos seasoned with peri-peri masala, served with mint mayo dip.",
    image: "/assets/images/IMAGE23.webp"
  },
  {
    id: "rolls-1",
    name: "Double Chicken Double Egg Roll",
    category: "rolls",
    categoryName: "Rolls",
    price: 140,
    originalPrice: 160,
    isVeg: false,
    rating: 4.9,
    reviewsCount: 210,
    badge: "Student Favorite",
    description: "Flaky layered paratha lined with two eggs, loaded with tender spiced chicken tikka, onions, and tangy mint sauces.",
    image: "/assets/images/WhatsApp-Image-2026-02-03-at-8.01.46-PM-300x300.webp"
  },
  {
    id: "thali-1",
    name: "PM Zaika Special Grand Maharaja Thali",
    category: "thali",
    categoryName: "Special Thali",
    price: 380,
    originalPrice: 450,
    isVeg: false,
    rating: 5.0,
    reviewsCount: 195,
    badge: "Grand Feast",
    description: "Lavish platter with Butter Chicken, Dal Makhani, Paneer Tikka, Jeera Rice, 2 Butter Naans, Raita, Salad & Gulab Jamun.",
    image: "/assets/images/food_royal_thali.webp"
  },
  {
    id: "tandoori-2",
    name: "Charcoal Grilled Chicken Tikka",
    category: "tandoori",
    categoryName: "Tandoori",
    price: 250,
    originalPrice: 280,
    isVeg: false,
    rating: 4.8,
    reviewsCount: 88,
    badge: "Popular",
    description: "Boneless chicken chunks marinated in mustard oil, roasted gram flour, and spicy curd, charred in bhatti.",
    image: "/assets/images/food_tandoori_kebab.webp"
  }
];

export const MENU_CATEGORIES = [
  { id: "all", label: "All Dishes", icon: "🍱" },
  { id: "biryani", label: "Royal Biryani", icon: "🍛" },
  { id: "starters", label: "Starters", icon: "🍢" },
  { id: "tandoori", label: "Tandoori Specials", icon: "🍗" },
  { id: "veg-curry", label: "Veg Curries", icon: "🥦" },
  { id: "non-veg-curry", label: "Non-Veg Curries", icon: "🥘" },
  { id: "chinese", label: "Chinese & Noodles", icon: "🥢" },
  { id: "momos", label: "Momos", icon: "🥟" },
  { id: "rolls", label: "Kathi Rolls", icon: "🌯" },
  { id: "thali", label: "Special Grand Thali", icon: "🍽️" },
];
