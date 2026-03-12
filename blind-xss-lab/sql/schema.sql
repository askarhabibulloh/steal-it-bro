-- ElectroStore Database Schema
-- Blind XSS Lab - E-commerce Platform

-- Users table
CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    username TEXT UNIQUE NOT NULL,
    password TEXT NOT NULL,
    is_admin BOOLEAN DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Products table
CREATE TABLE IF NOT EXISTS products (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    description TEXT,
    price DECIMAL(10, 2) NOT NULL,
    image_url TEXT,
    stock INTEGER DEFAULT 10,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Orders table
CREATE TABLE IF NOT EXISTS orders (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL,
    address TEXT NOT NULL,
    delivery_notes TEXT,
    status TEXT DEFAULT 'Created',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- Order items table
CREATE TABLE IF NOT EXISTS order_items (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    order_id INTEGER NOT NULL,
    product_id INTEGER NOT NULL,
    quantity INTEGER NOT NULL,
    price_at_time DECIMAL(10, 2) NOT NULL,
    FOREIGN KEY (order_id) REFERENCES orders(id) ON DELETE CASCADE,
    FOREIGN KEY (product_id) REFERENCES products(id)
);

-- Insert default admin user (password: 'admin' hashed with bcrypt)
INSERT OR IGNORE INTO users (username, password, is_admin) VALUES 
('admin', '$2a$10$WmZOEWK9Pszj3JZmBITVteB.mmfYB83VMXNH3eYLl./MfKyvI.KJe', 1);

-- Insert sample products
INSERT OR IGNORE INTO products (name, description, price, image_url, stock) VALUES
('MacBook Pro 16"', 'Apple MacBook Pro with M3 Pro chip, 16GB RAM, 512GB SSD', 2499.99, '/images/macbook.jpg', 15),
('iPhone 15 Pro', 'Apple iPhone 15 Pro with A17 Pro chip, 256GB storage', 999.99, '/images/iphone.jpg', 25),
('Sony WH-1000XM5', 'Wireless noise-cancelling headphones with 30-hour battery', 399.99, '/images/headphones.jpg', 30),
('Samsung Odyssey G9', '49" Dual QHD Curved Gaming Monitor, 240Hz', 1299.99, '/images/monitor.jpg', 8),
('Logitech MX Master 3S', 'Wireless mouse with MagSpeed scrolling', 99.99, '/images/mouse.jpg', 40),
('Keychron K8 Pro', 'Wireless mechanical keyboard with hot-swappable switches', 119.99, '/images/keyboard.jpg', 20);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_orders_user_id ON orders(user_id);
CREATE INDEX IF NOT EXISTS idx_orders_status ON orders(status);
CREATE INDEX IF NOT EXISTS idx_order_items_order_id ON order_items(order_id);