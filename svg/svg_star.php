<?php

// 系统入口
date_default_timezone_set('PRC');
error_reporting(E_ALL^E_WARNING^E_NOTICE);
set_time_limit(10);


// 设置响应头，告诉浏览器这是SVG图像
header('Content-Type: image/svg+xml');

// 定义SVG的宽度和高度
$size = $_GET['size'] ?? 100;
$color = $_GET['color'] ?? '333';
$color = '#' . $color;

$count = $_GET['count'] ?? 6;
$count = max($count, 3);
$short = $_GET['short'] ?? 100;

// 开始SVG文档
echo '<?xml version="1.0" encoding="UTF-8"?>';
echo '<svg width="' . $size . '" height="' . $size . '" xmlns="http://www.w3.org/2000/svg">';

// 绘制星星
$angle = 360 / $count;
$list = [];
for ($i=0; $i<$count; $i++) {
    $rad = ($angle * $i - 90) * M_PI / 180;
    $len = $size / 2;
    if ($i%2 == 1 && $count%2 == 0) {
        $len *= $short / 100;
    }
    $x = $size / 2 + $len * cos($rad);
    $y = $size / 2 + $len * sin($rad);
    $list[] = round($x, 1) . ',' . round($y, 1);
}
echo '<polygon points="' . implode(' ', $list) . '" fill="' . $color . '" />';

// 关闭SVG标签
echo '</svg>';