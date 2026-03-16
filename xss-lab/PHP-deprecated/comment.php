<?php
require 'config.php';

if(isset($_SESSION['user_id']) && isset($_POST['post_id']) && isset($_POST['content'])) {
    $db->query("INSERT INTO comments (post_id, user_id, content) VALUES (
        {$_POST['post_id']}, 
        {$_SESSION['user_id']}, 
        '{$_POST['content']}'
    )");
}

header("Location: post.php?id={$_POST['post_id']}");