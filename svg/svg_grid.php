<?php

// 系统入口
date_default_timezone_set('PRC');
error_reporting(E_ALL^E_WARNING^E_NOTICE);
set_time_limit(10);


// 设置响应头，告诉浏览器这是SVG图像
header('Content-Type: image/svg+xml');

// 定义SVG的宽度和高度
$size_w = $_GET['w'] ?? 200;
$size_h = $_GET['h'] ?? 100;
$size = $_GET['size'] ?? 10;
$fill = $_GET['fill'] ?? '333';
if ($fill != 'none'){
    $fill = '#' . $fill;
}
$border_size = $_GET['border_size'] ?? 0;
$border_color = $_GET['border_color'] ?? '333';
if ($border_color != 'none'){
    $border_color = '#' . $border_color;
}

$type = $_GET['type'] ?? 'rect';

// 开始SVG文档
echo '<?xml version="1.0" encoding="UTF-8"?>';
echo '<svg width="' . $size_w . '" height="' . $size_h . '" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ' . $size_w . ' ' . $size_h . '">';

echo '<defs>';
if ($fill != 'none'){
    echo '<linearGradient id="line" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stop-color="' . $fill . '" stop-opacity="0" />
            <stop offset="50%" stop-color="' . $fill . '"  stop-opacity="1" />
            <stop offset="100%" stop-color="' . $fill . '"  stop-opacity="1" />
    </linearGradient>';
}
$h_rate = 1;
$g2 = 'g1';
switch ($type) {
    case 'rect':
        echo '<rect id="g1" x="0" y="0" width="' . $size . '" height="' . $size . '" />';
        break;
    case 'circle':
        $r = round($size/2,1);
        $h_rate = 1;
        echo '<circle id="g1" cx="' . $r . '" cy="' . $r . '" r="' . $r . '" />';
        break;
    case 'diamond':
        $r = round($size/2,1);
        $h_rate = 0.5;
        echo "<polygon id=\"g1\" points=\"0,$r $r,0 $size,$r $r,$size\" />";
        break;
    case 'hexagon':
        $r = round($size/2*0.816,1);
        $r2 = round($r/2, 1);
        $s2 = round($size/2,1);
        $h_rate = 0.81;
        $list = [
            "0,$s2",
            ($s2/2) . "," . round($s2 - $r, 1),
            (($s2/2) + $s2) . "," . round($s2 - $r, 1),
            "$size,$s2",
            ($size - $s2/2) . "," . round($s2 + $r, 1),
            ($s2/2) . "," . round($s2 + $r, 1),
        ];
        echo "<polygon id=\"g1\" points=\"" . implode(' ', $list) . "\" />";
        break;
    case 'triangle':
        $g2 = 'g2';
        $r = round($size*0.816,1);
        $r1 = $size - $r;
        $s2 = round($size/2,1);
        $h_rate = 0.7;
        echo "<polygon id=\"g1\" points=\"$s2,0 $size,$r 0,$r\" />";
        echo "<polygon id=\"g2\" points=\"$s2,$size $size,$r1 0,$r1\" />";
        break;
}
echo '</defs>';

$ss = $size * 1.2;
$even = true;
for ($y = 0; $y < $size_h - $ss * $h_rate; $y += $ss * $h_rate) {
    $even = !$even;
    for ($x = 0; $x < $size_w - $ss; $x += $ss) {
        $y1 = $y + $ss*$h_rate*0.2;
        $g = 'g1';
        if ($even){
            $x1 = $x + $ss/2 + $ss*0.2;
            $g = $g2;
        }else{
            $x1 = $x + $ss*0.2;
        }
        
        echo '<use href="#' . $g . '" x="' . round($x1,2) . '" y="' . round($y1,1) . '" fill="url(#line)" stroke="' . $border_color . '" stroke-width="' . $border_size . '" />';
    }
}

// 关闭SVG标签
echo '</svg>';