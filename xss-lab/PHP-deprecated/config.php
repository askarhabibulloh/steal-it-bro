<?php
session_start();
$db = new mysqli('127.0.0.1', 'user', 'password', 'xss_lab',3307);

// Buat tabel jika belum ada
$db->query("CREATE TABLE IF NOT EXISTS users (
    id INT AUTO_INCREMENT PRIMARY KEY,
    username VARCHAR(50) UNIQUE,
    password VARCHAR(255)
)");

$db->query("CREATE TABLE IF NOT EXISTS posts (
    id INT AUTO_INCREMENT PRIMARY KEY,
    title VARCHAR(100),
    content TEXT,
    image_path VARCHAR(255)
)");

$db->query("CREATE TABLE IF NOT EXISTS comments (
    id INT AUTO_INCREMENT PRIMARY KEY,
    post_id INT,
    user_id INT,
    content TEXT,
    FOREIGN KEY (post_id) REFERENCES posts(id),
    FOREIGN KEY (user_id) REFERENCES users(id)
)");

// Sample posts jika kosong
if ($db->query("SELECT COUNT(*) FROM posts")->fetch_row()[0] == 0) {
    $posts = [
        ['title' => 'Post 1', 'content' => 'Ini adalah postingan pertama', 'image_path' => 'images/post1.jpg'],
        ['title' => 'Post 2', 'content' => 'Ini adalah postingan kedua', 'image_path' => 'images/post2.jpg'],
        ['title' => 'Post 3', 'content' => 'Ini adalah postingan ketiga', 'image_path' => 'images/post3.jpg']
    ];
    $stmt = $db->prepare("INSERT INTO posts (title, content, image_path) VALUES (?, ?, ?)");
    foreach ($posts as $post) {
        $stmt->bind_param('sss', $post['title'], $post['content'], $post['image_path']);
        $stmt->execute();
    }
}