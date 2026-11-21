import type { Food } from '../types';

const f = (
  id: string,
  name: string,
  category: Food['category'],
  servingLabel: string,
  calories: number,
  protein: number,
  carbs: number,
  fat: number,
): Food => ({ id, name, category, servingLabel, calories, protein, carbs, fat });

/** Curated everyday foods. Values are sensible approximations per stated serving. */
export const FOODS: Food[] = [
  // Protein
  f('chicken-breast', 'Chicken breast', 'protein', '100 g', 165, 31, 0, 3.6),
  f('chicken-thigh', 'Chicken thigh', 'protein', '100 g', 209, 26, 0, 10.9),
  f('salmon', 'Salmon fillet', 'protein', '100 g', 208, 20, 0, 13),
  f('white-fish', 'White fish', 'protein', '100 g', 97, 21, 0, 1),
  f('lean-beef', 'Lean ground beef', 'protein', '100 g', 250, 26, 0, 15),
  f('steak', 'Sirloin steak', 'protein', '100 g', 271, 25, 0, 19),
  f('ground-turkey', 'Ground turkey', 'protein', '100 g', 170, 22, 0, 9),
  f('turkey-breast', 'Turkey breast', 'protein', '100 g', 135, 30, 0, 1),
  f('eggs', 'Whole egg', 'protein', '1 large', 72, 6.3, 0.4, 4.8),
  f('egg-whites', 'Egg whites', 'protein', '3 whites', 51, 10.8, 0.7, 0.2),
  f('tofu', 'Firm tofu', 'protein', '100 g', 144, 17, 3, 9),
  f('tempeh', 'Tempeh', 'protein', '100 g', 192, 20, 8, 11),
  f('lentils', 'Lentils, cooked', 'protein', '100 g', 116, 9, 20, 0.4),
  f('black-beans', 'Black beans, cooked', 'protein', '100 g', 132, 8.9, 23.7, 0.5),
  f('chickpeas', 'Chickpeas, cooked', 'protein', '100 g', 164, 8.9, 27.4, 2.6),
  f('whey', 'Whey protein', 'protein', '1 scoop (30 g)', 120, 24, 3, 1.5),
  f('greek-yogurt', 'Greek yogurt', 'protein', '170 g', 100, 17, 6, 0),
  f('skyr', 'Skyr', 'protein', '170 g', 100, 17, 6, 0),
  f('cottage-cheese', 'Cottage cheese', 'protein', '100 g', 98, 11, 3.4, 4.3),
  f('tuna', 'Tuna in water', 'protein', '1 can, drained', 150, 33, 0, 1),
  f('shrimp', 'Shrimp', 'protein', '100 g', 99, 24, 0.2, 0.3),
  f('protein-bar', 'Protein bar', 'snacks', '1 bar (60 g)', 200, 20, 22, 7),
  f('tuna-salad', 'Tuna & yogurt mix', 'meals', '1 bowl', 240, 30, 6, 10),

  // Carbs
  f('oats', 'Rolled oats', 'carbs', '40 g dry', 150, 5, 27, 3),
  f('white-rice', 'White rice, cooked', 'carbs', '150 g', 195, 4, 43, 0.4),
  f('brown-rice', 'Brown rice, cooked', 'carbs', '150 g', 167, 3.9, 34.5, 1.4),
  f('quinoa', 'Quinoa, cooked', 'carbs', '150 g', 180, 6.6, 31.5, 2.9),
  f('pasta', 'Pasta, cooked', 'carbs', '150 g', 237, 8.7, 46.5, 1.4),
  f('sweet-potato', 'Sweet potato, baked', 'carbs', '150 g', 135, 2.5, 31, 0.2),
  f('potato', 'Potato, boiled', 'carbs', '150 g', 130, 3.4, 30, 0.2),
  f('sourdough', 'Sourdough bread', 'carbs', '1 slice (50 g)', 130, 5, 25, 0.7),
  f('wholegrain-bread', 'Wholegrain bread', 'carbs', '1 slice (40 g)', 100, 5, 17, 1.5),
  f('tortilla', 'Flour tortilla', 'carbs', '1 medium (45 g)', 140, 4, 24, 4),
  f('bagel', 'Bagel, plain', 'carbs', '1 (100 g)', 250, 10, 49, 1.5),
  f('rice-cakes', 'Rice cakes', 'carbs', '2 cakes', 70, 1.4, 15, 0.6),
  f('couscous', 'Couscous, cooked', 'carbs', '150 g', 168, 6, 34, 0.3),
  f('cereal', 'Breakfast cereal', 'carbs', '40 g', 150, 5, 30, 2),

  // Fruit & veg
  f('banana', 'Banana', 'fruit-veg', '1 medium', 105, 1.3, 27, 0.4),
  f('apple', 'Apple', 'fruit-veg', '1 medium', 95, 0.5, 25, 0.3),
  f('blueberries', 'Blueberries', 'fruit-veg', '100 g', 57, 0.7, 14.5, 0.3),
  f('strawberries', 'Strawberries', 'fruit-veg', '100 g', 32, 0.7, 7.7, 0.3),
  f('orange', 'Orange', 'fruit-veg', '1 medium', 62, 1.2, 15.4, 0.2),
  f('avocado', 'Avocado', 'fruit-veg', '1/2 fruit (75 g)', 120, 1.5, 6.4, 11),
  f('broccoli', 'Broccoli, steamed', 'fruit-veg', '100 g', 34, 2.8, 6.6, 0.4),
  f('spinach', 'Spinach', 'fruit-veg', '100 g', 23, 2.9, 3.6, 0.4),
  f('mixed-salad', 'Mixed green salad', 'fruit-veg', '100 g', 20, 1.5, 3, 0.2),
  f('tomato', 'Tomato', 'fruit-veg', '1 medium', 22, 1.1, 4.8, 0.2),
  f('carrots', 'Carrots', 'fruit-veg', '100 g', 41, 0.9, 9.6, 0.2),
  f('bell-pepper', 'Bell pepper', 'fruit-veg', '100 g', 31, 1, 6, 0.3),
  f('mango', 'Mango', 'fruit-veg', '100 g', 60, 0.8, 15, 0.4),
  f('grapes', 'Grapes', 'fruit-veg', '100 g', 69, 0.7, 18, 0.2),
  f('dates', 'Medjool dates', 'fruit-veg', '2 dates', 133, 0.9, 36, 0.1),

  // Fats
  f('olive-oil', 'Olive oil', 'fats', '1 tbsp', 119, 0, 0, 13.5),
  f('butter', 'Butter', 'fats', '1 tbsp', 102, 0.1, 0, 11.5),
  f('peanut-butter', 'Peanut butter', 'fats', '2 tbsp', 190, 7, 6, 16),
  f('almonds', 'Almonds', 'fats', '30 g', 174, 6.4, 6.1, 15),
  f('walnuts', 'Walnuts', 'fats', '30 g', 196, 4.6, 4.1, 19.6),
  f('cashews', 'Cashews', 'fats', '30 g', 165, 5.5, 9.2, 13),
  f('chia', 'Chia seeds', 'fats', '1 tbsp', 60, 2, 5, 4),
  f('cheddar', 'Cheddar cheese', 'fats', '30 g', 120, 7, 0.4, 10),
  f('hummus', 'Hummus', 'fats', '2 tbsp', 70, 2, 6, 4),
  f('dark-chocolate', 'Dark chocolate 70%', 'snacks', '20 g', 120, 1.5, 9, 8),

  // Dairy & drinks
  f('milk', 'Semi-skimmed milk', 'dairy', '250 ml', 125, 8.5, 12, 4.5),
  f('almond-milk', 'Almond milk, unsweetened', 'dairy', '250 ml', 30, 1, 1, 2.5),
  f('kefir', 'Kefir', 'dairy', '250 ml', 100, 8, 11, 2.5),
  f('coffee', 'Black coffee', 'drinks', '1 cup', 2, 0.3, 0, 0),
  f('latte', 'Café latte', 'drinks', '250 ml', 120, 8, 10, 5),
  f('orange-juice', 'Orange juice', 'drinks', '250 ml', 112, 1.7, 26, 0.5),
  f('protein-shake', 'Ready-to-drink protein shake', 'drinks', '330 ml', 160, 25, 8, 3),
  f('beer', 'Beer', 'drinks', '330 ml', 140, 1.4, 11, 0),
  f('wine', 'Red wine', 'drinks', '150 ml', 125, 0.1, 4, 0),
  f('soda', 'Cola', 'drinks', '330 ml', 139, 0, 35, 0),

  // Meals & snacks
  f('chicken-rice-bowl', 'Chicken & rice bowl', 'meals', '1 bowl', 550, 42, 60, 14),
  f('salmon-potatoes', 'Salmon with potatoes', 'meals', '1 plate', 620, 35, 45, 30),
  f('beef-stirfry', 'Beef stir-fry', 'meals', '1 plate', 580, 38, 50, 24),
  f('pasta-bolognese', 'Pasta bolognese', 'meals', '1 bowl', 650, 32, 75, 22),
  f('omelette', 'Three-egg omelette', 'meals', '1 omelette', 350, 22, 4, 27),
  f('chicken-wrap', 'Grilled chicken wrap', 'meals', '1 wrap', 480, 32, 45, 18),
  f('sushi', 'Salmon sushi', 'meals', '8 pieces', 400, 22, 60, 8),
  f('burrito-bowl', 'Burrito bowl', 'meals', '1 bowl', 700, 40, 75, 25),
  f('burger', 'Beef burger', 'meals', '1 burger', 650, 32, 45, 35),
  f('pizza', 'Pizza slice', 'meals', '1 slice', 285, 12, 36, 10),
  f('popcorn', 'Popcorn', 'snacks', '30 g', 120, 2, 24, 2),
  f('pretzels', 'Pretzels', 'snacks', '30 g', 108, 2.6, 23, 0.8),
  f('ice-cream', 'Ice cream', 'snacks', '100 g', 207, 3.5, 24, 11),
  f('trail-mix', 'Trail mix', 'snacks', '30 g', 130, 4, 12, 9),
  f('chips', 'Potato chips', 'snacks', '30 g', 160, 2, 15, 10),
];

export const FOOD_MAP: Record<string, Food> = Object.fromEntries(FOODS.map((food) => [food.id, food]));

export const FOOD_CATEGORY_LABELS: Record<Food['category'], string> = {
  protein: 'Protein',
  carbs: 'Carbs',
  'fruit-veg': 'Fruit & veg',
  fats: 'Fats',
  dairy: 'Dairy',
  drinks: 'Drinks',
  meals: 'Meals',
  snacks: 'Snacks',
};

export const MEAL_LABELS = {
  breakfast: 'Breakfast',
  lunch: 'Lunch',
  dinner: 'Dinner',
  snack: 'Snacks',
} as const;
