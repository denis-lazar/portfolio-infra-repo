import asyncio
from motor.motor_asyncio import AsyncIOMotorClient
import sys

# Logos
LOGO_PIZZA = "/images/logo_pizza.png"
LOGO_BURGER = "/images/logo_burger.png"
LOGO_SUSHI = "/images/logo_sushi.png"
LOGO_HEALTHY = "/images/logo_healthy.png"
LOGO_PASTA = "/images/logo_pasta.png"
LOGO_THAI = "/images/logo_thai.png"

# Meal PNGs
MEAL_MARGHERITA = "/images/meal_margherita.png"
MEAL_GARLIC_KNOTS = "/images/meal_garlic_knots.png"
MEAL_HUMMUS = "/images/meal_hummus.png"
MEAL_PAD_THAI = "/images/meal_pad_thai.png"
MEAL_SALMON = "/images/meal_salmon.png"
MEAL_TRUFFLE = "/images/meal_truffle.png"
MEAL_VEGAN_GARDEN = "/images/meal_vegan_garden.png"

# Unsplash Unique IDs for variety
IMG_PEPPERONI = "https://images.unsplash.com/photo-1628840042765-356cda07504e?q=80&w=2070&auto=format&fit=crop"
IMG_MUSHROOM_PIZZA = "https://images.unsplash.com/photo-1541745537411-b8046dc6d66c?q=80&w=1974&auto=format&fit=crop"
IMG_CLASSIC_BURGER = "https://images.unsplash.com/photo-1568901346375-23c9450c58cd?q=80&w=2070&auto=format&fit=crop"
IMG_VEGAN_BURGER = "https://images.unsplash.com/photo-1525059696034-4967a8e1dca2?q=80&w=2070&auto=format&fit=crop"
IMG_FRIES = "https://images.unsplash.com/photo-1541592106381-b31e9677c0e5?q=80&w=2070&auto=format&fit=crop"
IMG_BACON_BURGER = "https://images.unsplash.com/photo-1553979459-d2229ba7433b?q=80&w=2070&auto=format&fit=crop"
IMG_TUNA_SASHIMI = "https://images.unsplash.com/photo-1553621042-f6e147245754?q=80&w=1925&auto=format&fit=crop"
IMG_VEGAN_ROLL = "https://images.unsplash.com/photo-1558985250-27a406d64cb3?q=80&w=2070&auto=format&fit=crop"
IMG_EDAMAME = "https://images.unsplash.com/photo-1528750997573-59b89d56f4f7?q=80&w=2070&auto=format&fit=crop"
IMG_DRAGON_ROLL = "https://images.unsplash.com/photo-1617196034183-421b4917c92d?q=80&w=2070&auto=format&fit=crop"
IMG_POWER_BOWL = "https://images.unsplash.com/photo-1546069901-ba9599a7e63c?q=80&w=2080&auto=format&fit=crop"
IMG_PROTEIN_PUNCH = "https://images.unsplash.com/photo-1490645935967-10de6ba17061?q=80&w=2053&auto=format&fit=crop"
IMG_AVOCADO_TOAST = "https://images.unsplash.com/photo-1525351484163-7529414344d8?q=80&w=2080&auto=format&fit=crop"
IMG_LENTIL_SOUP = "https://images.unsplash.com/photo-1547592166-23ac45744acd?q=80&w=2071&auto=format&fit=crop"
IMG_LASAGNA = "https://images.unsplash.com/photo-1574894709920-11b28e7367e3?q=80&w=1935&auto=format&fit=crop"
IMG_PENNE = "https://images.unsplash.com/photo-1473093295043-cdd812d0e601?q=80&w=2070&auto=format&fit=crop"
IMG_CARBONARA = "https://images.unsplash.com/photo-1612874742237-6526221588e3?q=80&w=2071&auto=format&fit=crop"
IMG_FOCACCIA = "https://images.unsplash.com/photo-1598103442097-8b74394b95c6?q=80&w=1976&auto=format&fit=crop"
IMG_TIRAMISU = "https://images.unsplash.com/photo-1571877227200-a0d98ea607e9?q=80&w=2070&auto=format&fit=crop"
IMG_GREEN_CURRY = "https://images.unsplash.com/photo-1455619452474-d2be8b1e70cd?q=80&w=2070&auto=format&fit=crop"
IMG_BASIL_STIR = "https://images.unsplash.com/photo-1562565652-a0d8f0c59eb4?q=80&w=2189&auto=format&fit=crop"
IMG_TOM_YUM = "https://images.unsplash.com/photo-1548943487-a2e4e43b4853?q=80&w=2070&auto=format&fit=crop"
IMG_THAI_COFFEE = "https://images.unsplash.com/photo-1559925393-8be0ec4767c8?q=80&w=2071&auto=format&fit=crop"

INITIAL_RESTAURANTS = [
    {
        "id": "rest-1",
        "name": "The Pizza Forge",
        "cuisine": "Italian",
        "logo": LOGO_PIZZA, "image": "/images/pizza.jpg",
        "description": "Artisan wood-fired pizzas with a focus on seasonal toppings.",
        "address": "123 Oven Lane, Foodville", "lat": 40.7128, "lng": -74.0060,
        "rating": 4.9, "reviewCount": 2, "tags": ["Italian", "Vegan", "Meat"],
        "ingredients": [
            {"id": "ing-1", "name": "Mozzarella", "inStock": True},
            {"id": "ing-2", "name": "Wild Mushrooms", "inStock": True},
            {"id": "ing-3", "name": "Basil", "inStock": True},
            {"id": "ing-4", "name": "Pepperoni", "inStock": True},
            {"id": "ing-5", "name": "Vegan Cheese", "inStock": True},
        ],
        "hardware": [{"id": "hw-1", "name": "Wood Oven", "operational": True}],
        "menu": [
            { "id": "m-1", "name": "Margherita", "description": "Classic tomatoes & basil.", "price": 14.99, "category": "Pizza", "image": MEAL_MARGHERITA, "requiredIngredients": ["ing-1"], "optionalIngredients": ["ing-3"], "requiredHardware": ["hw-1"], "rating": 5.0, "reviews": [{"id": "r1", "userId": "u1", "userName": "Marco", "rating": 5, "comment": "Authentic!", "date": "2026-01-20"}] },
            { "id": "m-2", "name": "Vegan Garden", "description": "Vegan bliss.", "price": 16.99, "category": "Pizza", "image": MEAL_VEGAN_GARDEN, "requiredIngredients": ["ing-5"], "optionalIngredients": ["ing-3"], "requiredHardware": ["hw-1"], "rating": 4.5, "reviews": [{"id": "r2", "userId": "u2", "userName": "Sarah", "rating": 4.5, "comment": "Love the cheese!", "date": "2026-01-21"}] },
            { "id": "m-3", "name": "Garlic Knots", "description": "Buttery knots.", "price": 6.99, "category": "Sides", "image": MEAL_GARLIC_KNOTS, "requiredIngredients": [], "optionalIngredients": [], "requiredHardware": ["hw-1"], "rating": 4.0, "reviews": [{"id": "r3", "userId": "u3", "userName": "Joe", "rating": 4, "comment": "Great starter.", "date": "2026-01-22"}] },
            { "id": "m-4", "name": "Pepperoni", "description": "Spicy pepperoni.", "price": 17.99, "category": "Pizza", "image": IMG_PEPPERONI, "requiredIngredients": ["ing-1", "ing-4"], "optionalIngredients": ["ing-3"], "requiredHardware": ["hw-1"], "rating": 4.8, "reviews": [{"id": "r4", "userId": "u4", "userName": "Anna", "rating": 4.8, "comment": "Crispy pepperoni!", "date": "2026-01-23"}] },
            { "id": "m-5", "name": "Mushrooms", "description": "Earthy magic.", "price": 18.99, "category": "Pizza", "image": IMG_MUSHROOM_PIZZA, "requiredIngredients": ["ing-1", "ing-2"], "optionalIngredients": ["ing-3"], "requiredHardware": ["hw-1"], "rating": 4.7, "reviews": [{"id": "r5", "userId": "u5", "userName": "Leo", "rating": 4.7, "comment": "Proper wild mushrooms.", "date": "2026-01-24"}] }
        ],
        "reviews": [{"id": "rv1", "userId": "u1", "userName": "Marco", "rating": 5, "comment": "Best pizza!", "date": "2026-01-20"}]
    },
    {
        "id": "rest-2",
        "name": "Burger Haven",
        "cuisine": "American",
        "logo": LOGO_BURGER, "image": "/images/burger.jpg",
        "description": "Gourmet burgers and handcrafted shakes.",
        "address": "456 Patty Place, Grill Town", "lat": 40.7300, "lng": -73.9950,
        "rating": 4.5, "reviewCount": 1, "tags": ["Meat", "American", "Fast Food"],
        "ingredients": [
            {"id": "ing-b1", "name": "Wagyu", "inStock": True},
            {"id": "ing-b2", "name": "Brioche", "inStock": True},
            {"id": "ing-b4", "name": "Plant Patty", "inStock": True},
            {"id": "ing-b5", "name": "Avocado", "inStock": True},
        ],
        "hardware": [{"id": "hw-b1", "name": "Grill", "operational": True}],
        "menu": [
            { "id": "mb-1", "name": "Classic Wagyu", "description": "Juicy Wagyu.", "price": 18.99, "category": "Burger", "image": IMG_CLASSIC_BURGER, "requiredIngredients": ["ing-b1", "ing-b2"], "optionalIngredients": [], "requiredHardware": ["hw-b1"], "rating": 4.9, "reviews": [{"id": "br1", "userId": "u1", "userName": "Marco", "rating": 4.9, "comment": "Melts in mouth.", "date": "2026-01-20"}] },
            { "id": "mb-2", "name": "Truffle", "description": "Truffle luxury.", "price": 21.99, "category": "Burger", "image": MEAL_TRUFFLE, "requiredIngredients": ["ing-b1", "ing-b2"], "optionalIngredients": [], "requiredHardware": ["hw-b1"], "rating": 5.0, "reviews": [{"id": "br2", "userId": "u2", "userName": "Sarah", "rating": 5, "comment": "Exquisite!", "date": "2026-01-21"}] },
            { "id": "mb-3", "name": "Vegan Power", "description": "Plant bliss.", "price": 16.99, "category": "Burger", "image": IMG_VEGAN_BURGER, "requiredIngredients": ["ing-b4"], "optionalIngredients": ["ing-b5"], "requiredHardware": ["hw-b1"], "rating": 4.6, "reviews": [{"id": "br3", "userId": "u3", "userName": "Joe", "rating": 4.6, "comment": "Best vegan burger.", "date": "2026-01-22"}] },
            { "id": "mb-4", "name": "Sweet Potato", "description": "Crispy fries.", "price": 7.99, "category": "Sides", "image": IMG_FRIES, "requiredIngredients": [], "optionalIngredients": [], "requiredHardware": [], "rating": 4.4, "reviews": [{"id": "br4", "userId": "u4", "userName": "Anna", "rating": 4.4, "comment": "Perfectly seasoned.", "date": "2026-01-23"}] },
            { "id": "mb-5", "name": "Baconator", "description": "Double bacon.", "price": 19.99, "category": "Burger", "image": IMG_BACON_BURGER, "requiredIngredients": ["ing-b1", "ing-b2"], "optionalIngredients": [], "requiredHardware": ["hw-b1"], "rating": 4.7, "reviews": [{"id": "br5", "userId": "u5", "userName": "Leo", "rating": 4.7, "comment": "Meat lover dream.", "date": "2026-01-24"}] }
        ],
        "reviews": [{"id": "rv2", "userId": "u4", "userName": "Anna", "rating": 4.5, "comment": "Great burgers!", "date": "2026-01-23"}]
    },
    {
        "id": "rest-3",
        "name": "Sushi Zen",
        "cuisine": "Japanese",
        "logo": LOGO_SUSHI, "image": "/images/sushi.jpg",
        "description": "Traditional sushi and modern Japanese fusion.",
        "address": "789 Koi Street, Zen District", "lat": 40.7400, "lng": -73.9800,
        "rating": 4.9, "reviewCount": 1, "tags": ["Japanese", "Healthy", "Sushi", "Vegan", "Kosher"],
        "ingredients": [
            {"id": "ing-s1", "name": "Bluefin", "inStock": True},
            {"id": "ing-s2", "name": "Fresh Salmon", "inStock": True},
            {"id": "ing-s3", "name": "Avocado", "inStock": True},
        ],
        "hardware": [{"id": "hw-s1", "name": "Sushi Counter", "operational": True}],
        "menu": [
            { "id": "ms-1", "name": "Tuna Sashimi", "description": "Premium slices.", "price": 24.00, "category": "Sushi", "image": IMG_TUNA_SASHIMI, "requiredIngredients": ["ing-s1"], "optionalIngredients": [], "requiredHardware": ["hw-s1"], "rating": 5.0, "reviews": [{"id": "s1", "userId": "u1", "userName": "Marco", "rating": 5, "comment": "So fresh!", "date": "2026-01-20"}] },
            { "id": "ms-2", "name": "Salmon Nigiri", "description": "Fresh salmon.", "price": 14.00, "category": "Sushi", "image": MEAL_SALMON, "requiredIngredients": ["ing-s2"], "optionalIngredients": [], "requiredHardware": ["hw-s1"], "rating": 4.9, "reviews": [{"id": "s2", "userId": "u2", "userName": "Sarah", "rating": 4.9, "comment": "Perfect rice.", "date": "2026-01-21"}] },
            { "id": "ms-3", "name": "Vegan Roll", "description": "Cucumber bliss.", "price": 12.00, "category": "Sushi", "image": IMG_VEGAN_ROLL, "requiredIngredients": [], "optionalIngredients": ["ing-s3"], "requiredHardware": ["hw-s1"], "rating": 4.5, "reviews": [{"id": "s3", "userId": "u3", "userName": "Joe", "rating": 4.5, "comment": "Light and tasty.", "date": "2026-01-22"}] },
            { "id": "ms-4", "name": "Edamame", "description": "Sea salt soy.", "price": 6.00, "category": "Sides", "image": IMG_EDAMAME, "requiredIngredients": [], "optionalIngredients": [], "requiredHardware": [], "rating": 4.2, "reviews": [{"id": "s4", "userId": "u4", "userName": "Anna", "rating": 4.2, "comment": "Classic.", "date": "2026-01-23"}] },
            { "id": "ms-5", "name": "Dragon Roll", "description": "Eel & avocado.", "price": 18.00, "category": "Sushi", "image": IMG_DRAGON_ROLL, "requiredIngredients": ["ing-s1"], "optionalIngredients": ["ing-s3"], "requiredHardware": ["hw-s1"], "rating": 4.8, "reviews": [{"id": "s5", "userId": "u5", "userName": "Leo", "rating": 4.8, "comment": "Visual masterpiece.", "date": "2026-01-24"}] }
        ],
        "reviews": [{"id": "rv3", "userId": "u5", "userName": "Leo", "rating": 4.9, "comment": "Zen indeed.", "date": "2026-01-24"}]
    },
    {
        "id": "rest-4",
        "name": "Green Garden",
        "cuisine": "Healthy",
        "logo": LOGO_HEALTHY, "image": "/images/healthy.jpg",
        "description": "100% plant-based bowls and smoothies.",
        "address": "101 Leafy Road, Vitality", "lat": 40.7500, "lng": -73.9700,
        "rating": 4.7, "reviewCount": 1, "tags": ["Healthy", "Vegan", "Salads"],
        "ingredients": [{"id": "ing-g1", "name": "Kale", "inStock": True}, {"id": "ing-g3", "name": "Chickpeas", "inStock": True}],
        "hardware": [{"id": "hw-g1", "name": "Steam Oven", "operational": True}],
        "menu": [
            { "id": "mg-1", "name": "Power Bowl", "description": "Kale & Quinoa.", "price": 15.00, "category": "Bowls", "image": IMG_POWER_BOWL, "requiredIngredients": ["ing-g3"], "optionalIngredients": ["ing-g1"], "requiredHardware": ["hw-g1"], "rating": 4.8, "reviews": [{"id": "g1", "userId": "u1", "userName": "Marco", "rating": 4.8, "comment": "Feel so healthy!", "date": "2026-01-20"}] },
            { "id": "mg-2", "name": "Hummus Plate", "description": "House hummus.", "price": 8.00, "category": "Sides", "image": MEAL_HUMMUS, "requiredIngredients": ["ing-g3"], "optionalIngredients": [], "requiredHardware": [], "rating": 4.9, "reviews": [{"id": "g2", "userId": "u2", "userName": "Sarah", "rating": 4.9, "comment": "Creamy perfection.", "date": "2026-01-21"}] },
            { "id": "mg-3", "name": "Protein Punch", "description": "Double chickpeas.", "price": 14.00, "category": "Bowls", "image": IMG_PROTEIN_PUNCH, "requiredIngredients": ["ing-g3"], "optionalIngredients": [], "requiredHardware": [], "rating": 4.5, "reviews": [{"id": "g3", "userId": "u3", "userName": "Joe", "rating": 4.5, "comment": "Filling and clean.", "date": "2026-01-22"}] },
            { "id": "mg-4", "name": "Avocado Toast", "description": "Sourdough bliss.", "price": 11.00, "category": "Brunch", "image": IMG_AVOCADO_TOAST, "requiredIngredients": [], "optionalIngredients": [], "requiredHardware": [], "rating": 4.7, "reviews": [{"id": "g4", "userId": "u4", "userName": "Anna", "rating": 4.7, "comment": "Insta-worthy.", "date": "2026-01-23"}] },
            { "id": "mg-5", "name": "Lentil Soup", "description": "Hearty stew.", "price": 9.00, "category": "Soups", "image": IMG_LENTIL_SOUP, "requiredIngredients": ["ing-g3"], "optionalIngredients": [], "requiredHardware": ["hw-g1"], "rating": 4.3, "reviews": [{"id": "g5", "userId": "u5", "userName": "Leo", "rating": 4.3, "comment": "Warm hug in a bowl.", "date": "2026-01-24"}] }
        ],
        "reviews": [{"id": "rv4", "userId": "u6", "userName": "Grace", "rating": 4.7, "comment": "Finally, real vegan food.", "date": "2026-01-24"}]
    },
    {
        "id": "rest-5",
        "name": "Pasta Passion",
        "cuisine": "Italian",
        "logo": LOGO_PASTA, "image": "/images/pasta.jpg",
        "description": "Authentic Italian pasta made fresh.",
        "address": "202 Noodle St, Italian Quarter", "lat": 40.7100, "lng": -74.0150,
        "rating": 4.8, "reviewCount": 1, "tags": ["Italian", "Meat", "Pasta"],
        "ingredients": [{"id": "ing-p1", "name": "Semolina", "inStock": True}, {"id": "ing-p5", "name": "Parmesan", "inStock": True}],
        "hardware": [{"id": "hw-p2", "name": "Boiling Station", "operational": True}],
        "menu": [
            { "id": "mp-1", "name": "Classic Lasagna", "description": "Layered perfection.", "price": 22.00, "category": "Pasta", "image": IMG_LASAGNA, "requiredIngredients": ["ing-p1"], "optionalIngredients": ["ing-p5"], "requiredHardware": ["hw-p2"], "rating": 5.0, "reviews": [{"id": "p1", "userId": "u1", "userName": "Marco", "rating": 5, "comment": "Like my mom's!", "date": "2026-01-20"}] },
            { "id": "mp-2", "name": "Pesto Penne", "description": "Basil delight.", "price": 18.00, "category": "Pasta", "image": IMG_PENNE, "requiredIngredients": ["ing-p1"], "optionalIngredients": ["ing-p5"], "requiredHardware": ["hw-p2"], "rating": 4.6, "reviews": [{"id": "p2", "userId": "u2", "userName": "Sarah", "rating": 4.6, "comment": "Vibrant pesto.", "date": "2026-01-21"}] },
            { "id": "mp-3", "name": "Carbonara", "description": "Guanciale perfection.", "price": 19.00, "category": "Pasta", "image": IMG_CARBONARA, "requiredIngredients": ["ing-p1"], "optionalIngredients": ["ing-p5"], "requiredHardware": ["hw-p2"], "rating": 4.9, "reviews": [{"id": "p3", "userId": "u3", "userName": "Joe", "rating": 4.9, "comment": "Creamy without cream.", "date": "2026-01-22"}] },
            { "id": "mp-4", "name": "Focaccia", "description": "Sea salt & rosemary.", "price": 7.00, "category": "Sides", "image": IMG_FOCACCIA, "requiredIngredients": [], "optionalIngredients": [], "requiredHardware": [], "rating": 4.5, "reviews": [{"id": "p4", "userId": "u4", "userName": "Anna", "rating": 4.5, "comment": "Soft and airy.", "date": "2026-01-23"}] },
            { "id": "mp-5", "name": "Tiramisu", "description": "Espresso dessert.", "price": 10.00, "category": "Dessert", "image": IMG_TIRAMISU, "requiredIngredients": [], "optionalIngredients": [], "requiredHardware": [], "rating": 5.0, "reviews": [{"id": "p5", "userId": "u5", "userName": "Leo", "rating": 5, "comment": "Best tiramisu in town.", "date": "2026-01-24"}] }
        ],
        "reviews": [{"id": "rv5", "userId": "u7", "userName": "Luigi", "rating": 4.8, "comment": "Bravo!", "date": "2026-01-25"}]
    },
    {
        "id": "rest-6",
        "name": "Spicy Thai",
        "cuisine": "Asian",
        "logo": LOGO_THAI, "image": "/images/thai.jpg",
        "description": "Vibrant and aromatic Thai dishes.",
        "address": "303 Basil Blvd, Spice City", "lat": 40.7200, "lng": -73.9600,
        "rating": 4.6, "reviewCount": 1, "tags": ["Asian", "Meat", "Vegan", "Healthy"],
        "ingredients": [{"id": "ing-t2", "name": "Thai Basil", "inStock": True}, {"id": "ing-t3", "name": "Coconut Milk", "inStock": True}],
        "hardware": [{"id": "hw-t1", "name": "High-Pressure Wok", "operational": True}],
        "menu": [
            { "id": "mt-1", "name": "Pad Thai", "description": "Tamarind noodles.", "price": 17.00, "category": "Noodles", "image": MEAL_PAD_THAI, "requiredIngredients": ["ing-t3"], "optionalIngredients": [], "requiredHardware": ["hw-t1"], "rating": 4.7, "reviews": [{"id": "t1", "userId": "u1", "userName": "Marco", "rating": 4.7, "comment": "Perfect balance.", "date": "2026-01-20"}] },
            { "id": "mt-2", "name": "Green Curry", "description": "Spicy coconut.", "price": 18.00, "category": "Curry", "image": IMG_GREEN_CURRY, "requiredIngredients": ["ing-t3"], "optionalIngredients": ["ing-t2"], "requiredHardware": ["hw-t1"], "rating": 4.8, "reviews": [{"id": "t2", "userId": "u2", "userName": "Sarah", "rating": 4.8, "comment": "Proper spice kick.", "date": "2026-01-21"}] },
            { "id": "mt-3", "name": "Basil Stir Fry", "description": "Spicy basil.", "price": 19.00, "category": "Wok", "image": IMG_BASIL_STIR, "requiredIngredients": ["ing-t3"], "optionalIngredients": ["ing-t2"], "requiredHardware": ["hw-t1"], "rating": 4.4, "reviews": [{"id": "t3", "userId": "u3", "userName": "Joe", "rating": 4.4, "comment": "So aromatic.", "date": "2026-01-22"}] },
            { "id": "mt-4", "name": "Tom Yum", "description": "Sour & spicy.", "price": 15.00, "category": "Soups", "image": IMG_TOM_YUM, "requiredIngredients": ["ing-t3"], "optionalIngredients": ["ing-t2"], "requiredHardware": [], "rating": 4.9, "reviews": [{"id": "t4", "userId": "u4", "userName": "Anna", "rating": 4.9, "comment": "Authentic galangal flavor.", "date": "2026-01-23"}] },
            { "id": "mt-5", "name": "Thai Iced Coffee", "description": "Sweet milk coffee.", "price": 6.00, "category": "Coffee", "image": IMG_THAI_COFFEE, "requiredIngredients": [], "optionalIngredients": [], "requiredHardware": [], "rating": 4.2, "reviews": [{"id": "t5", "userId": "u5", "userName": "Leo", "rating": 4.2, "comment": "Sweet and strong.", "date": "2026-01-24"}] }
        ],
        "reviews": [{"id": "rv6", "userId": "u8", "userName": "Anong", "rating": 4.6, "comment": "Like Bangkok streets.", "date": "2026-01-26"}]
    }
]

async def seed():
    import os
    user = os.getenv("MONGODB_USER", "admin")
    password = os.getenv("MONGODB_PASSWORD", "menusync_secure_pass")
    host = os.getenv("MONGODB_HOST", "menusync-app-mongodb.menusync-app.svc.cluster.local")
    port = os.getenv("MONGODB_PORT", "27017")
    db_name = os.getenv("MONGODB_DB", "menusync_db")
    
    uri = f"mongodb://{user}:{password}@{host}:{port}/{db_name}?authSource=admin"
    print(f"Connecting to: mongodb://{user}:****@{host}:{port}/{db_name}?authSource=admin")
    client = AsyncIOMotorClient(uri)
    db = client.get_database()
    await db.restaurants.delete_many({})
    for rest in INITIAL_RESTAURANTS:
        rest["_id"] = rest["id"]
        await db.restaurants.insert_one(rest)
    print("Seeded all 6 restaurants with Critical vs Non-Critical ingredient logic and unique reviews.")
    client.close()

if __name__ == "__main__":
    asyncio.run(seed())