<?php
require 'config.php';
require 'templates/header.php';

$posts = $db->query("SELECT * FROM posts");
while($post = $posts->fetch_assoc()):
?>
    <article>
        <h2><a href="post.php?id=<?= $post['id'] ?>"><?= htmlspecialchars($post['title']) ?></a></h2>
        <img src="<?= $post['image_path'] ?>" alt="<?= htmlspecialchars($post['title']) ?>">
        <p><?= substr(htmlspecialchars($post['content']), 0, 100) ?>...</p>
        <a href="post.php?id=<?= $post['id'] ?>" class="read-more">Baca selengkapnya</a>
    </article>
<?php endwhile;

require 'templates/footer.php';