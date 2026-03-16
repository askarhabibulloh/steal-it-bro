<?php
require 'config.php';
require 'templates/header.php';

if($_SERVER['REQUEST_METHOD'] === 'POST') {
    $username = $_POST['username'];
    $password = password_hash($_POST['password'], PASSWORD_DEFAULT);
    
    try {
        $db->query("INSERT INTO users (username, password) VALUES ('$username', '$password')");
        header("Location: login.php");
        exit;
    } catch(mysqli_sql_exception $e) {
        echo "Registration failed: Username already exists";
    }
}
?>

<div class="auth-form">
    <h2>Register</h2>
    <?php if(isset($error)): ?>
        <div class="error"><?= $error ?></div>
    <?php endif; ?>
    <form method="POST">
        <div class="form-group">
            <label for="username">Username</label>
            <input type="text" id="username" name="username" placeholder="Pilih username" required>
        </div>
        <div class="form-group">
            <label for="password">Password</label>
            <input type="password" id="password" name="password" placeholder="Buat password" required>
        </div>
        <button type="submit">Daftar</button>
    </form>
    <p class="auth-links">Sudah punya akun? <a href="login.php">Login di sini</a></p>
</div>

<?php require 'templates/footer.php'; ?>