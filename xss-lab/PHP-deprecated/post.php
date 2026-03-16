<?php
require 'config.php';
require 'templates/header.php';

$post_id = $_GET['id'];
$post = $db->query("SELECT * FROM posts WHERE id = $post_id")->fetch_assoc();
?>

<div class="post-detail">
    <h2><?= $post['title'] ?></h2>
    <img src="<?= $post['image_path'] ?>" alt="<?= $post['title'] ?>">
    <div class="post-content">
        <p><?= $post['content'] ?></p>
    </div>
</div>

<div class="comments">
    <h3>Komentar</h3>
    <?php
    $comments = $db->query("SELECT * FROM comments WHERE post_id = $post_id");
    if ($comments->num_rows > 0):
        while($comment = $comments->fetch_assoc()):
            $user = $db->query("SELECT username FROM users WHERE id = {$comment['user_id']}")->fetch_assoc();
    ?>
        <div class="comment">
            <strong><?= $user['username'] ?></strong>
            <p><?= $comment['content'] ?></p>
        </div>
    <?php 
        endwhile;
    else:
    ?>
        <p>Belum ada komentar.</p>
    <?php endif; ?>

    <?php if(isset($_SESSION['user_id'])): ?>
        <div class="comment-form">
            <h4>Tambahkan Komentar</h4>
            <form action="comment.php" method="POST">
                <input type="hidden" name="post_id" value="<?= $post_id ?>">
                <textarea name="content" required placeholder="Tulis komentar Anda di sini..."></textarea>
                <button type="submit">Kirim Komentar</button>
            </form>
        </div>
    <?php else: ?>
        <p><a href="login.php">Login</a> untuk menambahkan komentar.</p>
    <?php endif; ?>
</div>

<?php require 'templates/footer.php'; ?>