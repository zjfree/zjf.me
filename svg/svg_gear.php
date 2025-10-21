<?php

// 系统入口
date_default_timezone_set('PRC');
error_reporting(E_ALL^E_WARNING^E_NOTICE);
set_time_limit(10);


// 设置响应头，告诉浏览器这是SVG图像
header('Content-Type: image/svg+xml');

function getPoint($deg, $len) {
    global $size;

    $rad = $deg * M_PI / 180;
    $x = $size / 2 + $len * cos($rad);
    $y = $size / 2 + $len * sin($rad);
    return round($x, 1) . ',' . round($y, 1);
}

// 定义SVG的宽度和高度
$size = $_GET['size'] ?? 100;
$fill = $_GET['fill'] ?? '333';
if ($fill != 'none'){
    $fill = '#' . $fill;
}
$border_size = $_GET['border_size'] ?? 0;
$border_color = $_GET['border_color'] ?? '333';
if ($border_color != 'none'){
    $border_color = '#' . $border_color;
}

$count = $_GET['count'] ?? 6;
$count = max($count, 5);

// 开始SVG文档
echo '<?xml version="1.0" encoding="UTF-8"?>';
echo '<svg width="' . $size . '" height="' . $size . '" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ' . $size . ' ' . $size . '">';

echo '<circle cx="' . $size / 2 . '" cy="' . $size / 2 . '" r="' . ($size - 2.5) . '" fill="none" stroke="#eee" stroke-width="1" />';

$angle = 360 / $count;
$angle5 = $angle / 5;
$radius = $size / 2 - 5;
$radius_short = $radius - $size / $count / 1.2;
$list = [];
for ($i=0; $i<$count; $i++) {
    $deg = $angle * $i - 90;
    $list[] = getPoint($deg, $radius);
    $deg += $angle5;
    $list[] = getPoint($deg, $radius);
    $deg += $angle5;
    $list[] = getPoint($deg, $radius_short);
    $deg += $angle5;
    $list[] = getPoint($deg, $radius_short);
    $deg += $angle5;
    $list[] = getPoint($deg, $radius);
    $deg += $angle5;
    $list[] = getPoint($deg, $radius);
}
echo '<path d="';

echo 'M ' . $list[0];
for ($i=1; $i<count($list); $i++) {
    echo ' L ' . $list[$i];
}
echo ' Z';

$radius_short2 = round($radius_short / 2.5, 1);
$size2 = round($size / 2, 1);
$size3 = $size2 - 0.01;
$size4 = $size / 2 + $radius_short2;
echo " M{$size2},{$size4} A{$radius_short2},{$radius_short2} 0 1,0 {$size3},{$size4} Z";

echo '" fill-rule="evenodd" fill="' . $fill . '" stroke="' . $border_color . '" stroke-width="' . $border_size . '" />';

// 关闭SVG标签
echo '</svg>';