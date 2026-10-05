import os

with open('js/menu-data.js', 'r', encoding='utf-8') as f:
    content = f.read()

content = content.replace('"assets/', '"/assets/').replace("'assets/", "'/assets/")
idx = content.find('[')
arr = content[idx:].strip()
if arr.endswith(';'):
    arr = arr[:-1]

ts_content = f'''export interface MenuItem {{
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
}}

export const MENU_DATA: MenuItem[] = {arr};

export const MENU_CATEGORIES = [
  {{ id: 'all', name: 'All Dishes', icon: '🍱' }},
  {{ id: 'starters', name: 'Starters & Appetizers', icon: '🍢' }},
  {{ id: 'biryani', name: 'Royal Biryani', icon: '🍛' }},
  {{ id: 'tandoori', name: 'Tandoori Specials', icon: '🍗' }},
  {{ id: 'veg-curry', name: 'Indian Veg Curry', icon: '🥦' }},
  {{ id: 'non-veg-curry', name: 'Indian Non Veg Curry', icon: '🥘' }},
  {{ id: 'chinese', name: 'Chinese & Noodles', icon: '🥢' }},
  {{ id: 'momos', name: 'Steamed & Fried Momos', icon: '🥟' }},
  {{ id: 'rolls', name: 'Kathi & Egg Rolls', icon: '🌯' }},
  {{ id: 'breads', name: 'Tandoori Roti & Naan', icon: '🫓' }},
  {{ id: 'thali', name: 'Special Grand Thali', icon: '🍽️' }},
  {{ id: 'desserts', name: 'Desserts & Drinks', icon: '🍮' }},
];
'''

os.makedirs('next-app/src/data', exist_ok=True)
with open('next-app/src/data/menuData.ts', 'w', encoding='utf-8') as f:
    f.write(ts_content)

print('Wrote next-app/src/data/menuData.ts successfully!')
