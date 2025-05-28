<?php
require 'config.php';
require 'templates/header.php';

if($_SERVER['REQUEST_METHOD'] === 'POST') {
    $username = $_POST['username'];
    $password = $_POST['password'];
    
    $user = $db->query("SELECT * FROM users WHERE username = '$username'")->fetch_assoc();
    
    if($user && password_verify($password, $user['password'])) {
        $_SESSION['user_id'] = $user['id'];
        header("Location: index.php");
        exit;
    } else {
        echo "Login failed";
    }
}
?>

<div class="auth-form">
    <h2>Login</h2>
    <?php if(isset($error)): ?>
        <div class="error"><?= $error ?></div>
    <?php endif; ?>
    <form method="POST">
        <div class="form-group">
            <label for="username">Username</label>
            <input type="text" id="username" name="username" placeholder="Masukkan username" required>
        </div>
        <div class="form-group">
            <label for="password">Password</label>
            <input type="password" id="password" name="password" placeholder="Masukkan password" required>
        </div>
        <button type="submit">Login</button>
    </form>
    <p class="auth-links">Belum punya akun? <a href="register.php">Daftar di sini</a></p>
</div>

<?php require 'templates/footer.php'; ?>