<?php
require 'config.php';

// Hanya untuk keperluan lab/testing - tidak ada proteksi keamanan
if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    $db->query("TRUNCATE TABLE comments");
    echo "All comments have been reset";
    exit;
}
?>

<!DOCTYPE html>
<html>
<head>
    <title>Reset Comments</title>
</head>
<body>
    <h1>Reset All Comments</h1>
    <form method="POST">
        <p>Warning: This will delete all comments permanently</p>
        <button type="submit">Reset Comments</button>
    </form>
</body>
</html>