<!DOCTYPE html>
<html>
<head>
    <title> Cyberlab : XSS Lab</title>
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <link rel="stylesheet" href="assets/css/style.css">
    <link rel="icon" type="image/png" href="/favicon.svg">
</head>
<body>
    <header>
        <div class="container">
            <h1>XSS Lab</h1>
            <nav>
                <?php if(isset($_SESSION['user_id'])): ?>
                    <a href="logout.php">Logout</a>
                <?php else: ?>
                    <a href="login.php">Login</a>
                    <a href="register.php">Register</a>
                <?php endif; ?>
                <a href="index.php">Home</a>
            </nav>
        </div>
    </header>
    <div class="container">